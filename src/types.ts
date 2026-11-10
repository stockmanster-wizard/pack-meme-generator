/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MemeCategory = 'motorcycle' | 'wizard' | 'werewolf' | 'dragon' | 'viking' | 'debra';

export interface MemeTemplate {
  id: string;
  name: string;
  category: MemeCategory;
  accentColor: string;
  defaultTop: string;
  defaultBottom: string;
  defaultSubject: string;
  isDebraLore?: boolean;
}

export interface MemeState {
  templateId: string;
  topText: string;
  bottomText: string;
  subject: string;
  isDebraCare: boolean;
  imageDataUrl: string;
  rawBase64Png: string;
  generatedAt: number;
}

export interface RecipientConfig {
  selfEmail: string;
  friendEmails: string[];
  mode: 'test_self' | 'pack_automation';
  autoSendEnabled: boolean;
  scheduledHour: number; // 0 - 23 (e.g. 8 for 8am)
  scheduledMinute: number;
  intervalMinutes: number;
  nextScheduledRunAt?: number | null;
  lastSentAt: number | null;
  lastSentSubject: string | null;
  lastSentMode: 'test_self' | 'pack_automation' | null;
  lastError?: string | null;
  recentTopicIds?: string[];
  recentResolutions?: string[];
}

export interface DispatchLog {
  id: string;
  timestamp: number;
  subject: string;
  recipients: string[];
  cc: string;
  mode: 'test_self' | 'pack_automation';
  status: 'success' | 'failed';
  messageId?: string;
  error?: string;
  templateName?: string;
  previewUrl?: string;
}

export interface AuthUserState {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAuthenticated: boolean;
  accessToken: string | null;
}
