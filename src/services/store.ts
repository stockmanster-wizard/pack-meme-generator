/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RecipientConfig, DispatchLog } from '../types';

const STORAGE_KEY_CONFIG = 'the_pack_recipient_config_v1';
const STORAGE_KEY_LOGS = 'the_pack_dispatch_logs_v1';

export const DEFAULT_CONFIG: RecipientConfig = {
  selfEmail: 'stockmanster@gmail.com',
  friendEmails: [
    'pack_brother_alex@example.com',
    'pack_brother_dave@example.com',
  ],
  mode: 'test_self', // Starts in test-self mode per user instructions!
  autoSendEnabled: false,
  scheduledHour: 8,
  scheduledMinute: 0,
  intervalMinutes: 1440, // 24 hours
  lastSentAt: null,
  lastSentSubject: null,
  lastSentMode: null,
};

export function loadRecipientConfig(): RecipientConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (e) {
    console.error('Failed to parse recipient config, using defaults', e);
    return DEFAULT_CONFIG;
  }
}

export function saveRecipientConfig(config: RecipientConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save recipient config', e);
  }
}

export function loadDispatchLogs(): DispatchLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveDispatchLog(log: DispatchLog) {
  try {
    const existing = loadDispatchLogs();
    const updated = [log, ...existing].slice(0, 50); // Keep last 50
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save dispatch log', e);
  }
}

export function clearDispatchLogs() {
  localStorage.removeItem(STORAGE_KEY_LOGS);
}
