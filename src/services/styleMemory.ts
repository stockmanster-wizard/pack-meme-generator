/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CritiqueRecord,
  loadPersistentStyleFeedback,
  recordPersistentStyleFeedback,
} from './firestoreService.js';

export type { CritiqueRecord };

class StyleMemoryBankClass {
  private static instance: StyleMemoryBankClass;
  private readonly MAX_RECORDS = 10;
  private readonly MAX_ACTIVE_DIRECTIVES = 8;
  private records: CritiqueRecord[] = [];
  private isHydrated = false;

  private constructor() {}

  public static getInstance(): StyleMemoryBankClass {
    if (!StyleMemoryBankClass.instance) {
      StyleMemoryBankClass.instance = new StyleMemoryBankClass();
    }
    return StyleMemoryBankClass.instance;
  }

  public async hydrateFromFirestore(): Promise<void> {
    if (this.isHydrated) return;
    try {
      const stored = await loadPersistentStyleFeedback();
      if (stored && stored.length > 0) {
        this.records = stored.slice(-this.MAX_RECORDS);
      }
      this.isHydrated = true;
    } catch (e) {
      console.warn('StyleMemoryBank hydration notice:', e);
    }
  }

  public recordFeedback(defects: string[], fixes: string[], passed: boolean): void {
    const cleanDefects = (defects || [])
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    const cleanFixes = (fixes || [])
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const record: CritiqueRecord = {
      timestamp: Date.now(),
      passed,
      defects: cleanDefects,
      fixes: cleanFixes,
    };

    this.records.push(record);

    // Strict FIFO bounded queue: evict oldest entries to prevent memory expansion
    while (this.records.length > this.MAX_RECORDS) {
      this.records.shift();
    }

    // Persist asynchronously to Firestore collection `pack_style_memory`
    recordPersistentStyleFeedback(record).catch((err) => {
      console.warn('Async style feedback persistence notice:', err);
    });
  }

  public getActiveCorrectionDirectives(): string[] {
    const uniqueFixes = new Set<string>();

    // Traverse recent records from newest to oldest
    for (let i = this.records.length - 1; i >= 0; i--) {
      const rec = this.records[i];
      for (const fix of rec.fixes) {
        if (!uniqueFixes.has(fix) && uniqueFixes.size < this.MAX_ACTIVE_DIRECTIVES) {
          uniqueFixes.add(fix);
        }
      }
    }

    return Array.from(uniqueFixes);
  }

  public getLessonCount(): number {
    return this.getActiveCorrectionDirectives().length;
  }

  public clear(): void {
    this.records = [];
  }
}

export const StyleMemoryBank = StyleMemoryBankClass.getInstance();
