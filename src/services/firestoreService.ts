/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { RecipientConfig, DispatchLog } from '../types.js';

export interface CritiqueRecord {
  timestamp: number;
  passed: boolean;
  defects: string[];
  fixes: string[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, docPath: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path: docPath,
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

const LOCAL_STORE_PATH = path.resolve(process.cwd(), '.pack-server-store.json');

export const DEFAULT_SERVER_CONFIG: RecipientConfig = {
  selfEmail: 'stockmanster@gmail.com',
  friendEmails: [
    'pack_brother_alex@example.com',
    'pack_brother_dave@example.com',
  ],
  mode: 'test_self',
  autoSendEnabled: false,
  scheduledHour: 8,
  scheduledMinute: 0,
  intervalMinutes: 1440,
  nextScheduledRunAt: null,
  lastSentAt: null,
  lastSentSubject: null,
  lastSentMode: null,
  lastError: null,
};

interface LocalStoreData {
  config: RecipientConfig;
  logs: DispatchLog[];
  styleFeedback: CritiqueRecord[];
}

function readLocalFallback(): LocalStoreData {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        config: { ...DEFAULT_SERVER_CONFIG, ...(parsed.config || {}) },
        logs: Array.isArray(parsed.logs) ? parsed.logs : [],
        styleFeedback: Array.isArray(parsed.styleFeedback) ? parsed.styleFeedback : [],
      };
    }
  } catch (e) {
    console.warn('Local fallback store read notice:', e);
  }
  return {
    config: { ...DEFAULT_SERVER_CONFIG },
    logs: [],
    styleFeedback: [],
  };
}

function writeLocalFallback(data: LocalStoreData): void {
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Local fallback store write notice:', e);
  }
}

// Initialize Cloud Firestore using firebase-applet-config.json
let dbInstance: ReturnType<typeof getFirestore> | null = null;

function getDb() {
  if (dbInstance) return dbInstance;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (!firebaseConfig.projectId) return null;

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
    return dbInstance;
  } catch (e) {
    console.warn('Firestore initialization notice (using local fallback):', e);
    return null;
  }
}

export async function getStoredConfig(): Promise<RecipientConfig> {
  const local = readLocalFallback();
  const db = getDb();
  if (!db) return local.config;

  const docPath = 'pack_config/default';
  try {
    const snap = await getDoc(doc(db, 'pack_config', 'default'));
    if (snap.exists()) {
      const data = snap.data() as Partial<RecipientConfig>;
      const merged: RecipientConfig = {
        ...DEFAULT_SERVER_CONFIG,
        ...local.config,
        ...data,
        lastError: data.lastError ? String(data.lastError) : null,
      };
      writeLocalFallback({ ...local, config: merged });
      return merged;
    } else {
      // Seed initial config to Firestore
      await setDoc(doc(db, 'pack_config', 'default'), local.config);
      return local.config;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return local.config;
  }
}

export async function saveStoredConfig(partial: Partial<RecipientConfig>): Promise<RecipientConfig> {
  const current = await getStoredConfig();
  const updated: RecipientConfig = {
    ...current,
    ...partial,
  };

  // Compute or clear nextScheduledRunAt when schedule settings change
  if (partial.autoSendEnabled !== undefined || partial.intervalMinutes !== undefined) {
    if (updated.autoSendEnabled) {
      const intervalMs = Math.max(1, Number(updated.intervalMinutes) || 1440) * 60 * 1000;
      if (partial.nextScheduledRunAt === undefined) {
        updated.nextScheduledRunAt = Date.now() + intervalMs;
      }
    } else {
      updated.nextScheduledRunAt = null;
    }
  }

  // Sanitize bounds per firebase-blueprint.json
  updated.selfEmail = String(updated.selfEmail || DEFAULT_SERVER_CONFIG.selfEmail).slice(0, 254);
  updated.friendEmails = (updated.friendEmails || [])
    .map((e) => String(e).trim().slice(0, 254))
    .filter(Boolean)
    .slice(0, 200);
  updated.intervalMinutes = Math.min(10080, Math.max(1, Number(updated.intervalMinutes) || 1440));
  if (updated.lastSentSubject) {
    updated.lastSentSubject = String(updated.lastSentSubject).slice(0, 500);
  }
  updated.lastError = updated.lastError ? String(updated.lastError).slice(0, 1000) : null;

  const local = readLocalFallback();
  writeLocalFallback({ ...local, config: updated });

  const db = getDb();
  if (db) {
    const docPath = 'pack_config/default';
    try {
      await setDoc(doc(db, 'pack_config', 'default'), {
        selfEmail: updated.selfEmail,
        friendEmails: updated.friendEmails,
        mode: updated.mode,
        autoSendEnabled: Boolean(updated.autoSendEnabled),
        scheduledHour: Number(updated.scheduledHour || 8),
        scheduledMinute: Number(updated.scheduledMinute || 0),
        intervalMinutes: updated.intervalMinutes,
        nextScheduledRunAt: updated.nextScheduledRunAt ?? 0,
        lastSentAt: updated.lastSentAt ?? 0,
        lastSentSubject: updated.lastSentSubject ?? '',
        lastSentMode: updated.lastSentMode ?? 'test_self',
        lastError: updated.lastError ?? '',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  return updated;
}

export async function saveDispatchLog(log: DispatchLog): Promise<void> {
  const sanitizedLog: DispatchLog = {
    ...log,
    id: String(log.id || `dispatch_${Date.now()}`).slice(0, 128),
    timestamp: Number(log.timestamp || Date.now()),
    subject: String(log.subject || '').slice(0, 500),
    recipients: (log.recipients || []).map((r) => String(r).slice(0, 254)).slice(0, 205),
    cc: String(log.cc || '').slice(0, 254),
    mode: log.mode === 'pack_automation' ? 'pack_automation' : 'test_self',
    status: log.status === 'failed' ? 'failed' : 'success',
    messageId: log.messageId ? String(log.messageId).slice(0, 256) : '',
    error: log.error ? String(log.error).slice(0, 1000) : '',
  };

  const local = readLocalFallback();
  const updatedLogs = [sanitizedLog, ...local.logs].slice(0, 50);
  writeLocalFallback({ ...local, logs: updatedLogs });

  const db = getDb();
  if (db) {
    const docPath = `pack_dispatch_logs/${sanitizedLog.id}`;
    try {
      await setDoc(doc(db, 'pack_dispatch_logs', sanitizedLog.id), sanitizedLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }
}

export async function loadPersistentStyleFeedback(): Promise<CritiqueRecord[]> {
  const local = readLocalFallback();
  const db = getDb();
  if (!db) return local.styleFeedback.slice(-10);

  const colPath = 'pack_style_memory';
  try {
    const q = query(collection(db, 'pack_style_memory'), orderBy('timestamp', 'asc'), limit(10));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const records: CritiqueRecord[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        records.push({
          timestamp: Number(d.timestamp || Date.now()),
          passed: Boolean(d.passed),
          defects: Array.isArray(d.defects) ? d.defects : [],
          fixes: Array.isArray(d.fixes) ? d.fixes : [],
        });
      });
      writeLocalFallback({ ...local, styleFeedback: records });
      return records;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
  return local.styleFeedback.slice(-10);
}

export async function recordPersistentStyleFeedback(feedback: CritiqueRecord): Promise<void> {
  const sanitized: CritiqueRecord = {
    timestamp: Number(feedback.timestamp || Date.now()),
    passed: Boolean(feedback.passed),
    defects: (feedback.defects || []).map((d) => String(d).slice(0, 500)).slice(0, 25),
    fixes: (feedback.fixes || []).map((f) => String(f).slice(0, 500)).slice(0, 25),
  };

  const local = readLocalFallback();
  const updatedFeedback = [...local.styleFeedback, sanitized].slice(-10);
  writeLocalFallback({ ...local, styleFeedback: updatedFeedback });

  const db = getDb();
  if (db) {
    const docId = `critique_${sanitized.timestamp}_${Math.random().toString(36).substring(2, 7)}`;
    const docPath = `pack_style_memory/${docId}`;
    try {
      await setDoc(doc(db, 'pack_style_memory', docId), sanitized);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }
}
