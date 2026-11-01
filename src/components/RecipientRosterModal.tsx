/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RecipientConfig } from '../types';
import { X, Plus, Trash2, Users, ShieldAlert, Check, Clock } from 'lucide-react';

interface RecipientRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RecipientConfig;
  onSave: (updated: Partial<RecipientConfig>) => void;
}

const INTERVAL_PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '1h', minutes: 60 },
  { label: '6h', minutes: 360 },
  { label: '12h', minutes: 720 },
  { label: '24h (Daily)', minutes: 1440 },
];

export const RecipientRosterModal: React.FC<RecipientRosterModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  if (!isOpen) return null;

  const [selfEmail, setSelfEmail] = useState(config.selfEmail);
  const [friends, setFriends] = useState<string[]>([...config.friendEmails]);
  const [mode, setMode] = useState<'test_self' | 'pack_automation'>(config.mode);
  const [autoSendEnabled, setAutoSendEnabled] = useState<boolean>(config.autoSendEnabled);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(config.intervalMinutes || 1440);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddFriend = () => {
    setError(null);
    const rawEntries = newEmail
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (rawEntries.length === 0) return;

    const updatedFriends = [...friends];
    for (const email of rawEntries) {
      if (!email.includes('@') || !email.includes('.')) {
        setError(`Invalid email address: ${email}`);
        return;
      }
      if (!updatedFriends.includes(email) && email !== selfEmail.toLowerCase()) {
        updatedFriends.push(email);
      }
    }

    setFriends(updatedFriends);
    setNewEmail('');
  };

  const handleRemoveFriend = (index: number) => {
    setFriends(friends.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    const safeInterval = Math.max(1, Number(intervalMinutes) || 1440);
    const payload: Partial<RecipientConfig> = {
      selfEmail: selfEmail.trim(),
      friendEmails: friends,
      mode,
      autoSendEnabled,
      intervalMinutes: safeInterval,
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.config) {
          onSave(data.config);
          onClose();
          return;
        }
      }
    } catch (err) {
      console.error('Failed to save config to server:', err);
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#141a24] border border-neutral-700 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#0f141c]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" />
            <h3 className="font-pack-headline text-lg text-white tracking-wide">
              THE PACK // RECIPIENTS ROSTER
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Dispatch Mode Selector */}
          <div className="bg-[#0e131c] border border-neutral-800 rounded-xl p-4">
            <label className="block text-xs font-mono uppercase text-orange-400 font-bold mb-2">
              Active Dispatch Target Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('test_self')}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  mode === 'test_self'
                    ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                    : 'bg-[#161b22] border-neutral-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Self-Test Only
              </button>
              <button
                type="button"
                onClick={() => setMode('pack_automation')}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  mode === 'pack_automation'
                    ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                    : 'bg-[#161b22] border-neutral-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Pack Crew (BCC All)
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {mode === 'pack_automation'
                ? `Sends a single email To: ${selfEmail || 'you'} with all ${friends.length} friend(s) in BCC.`
                : `Sends only To: ${selfEmail || 'you'} for isolated testing.`}
            </p>
          </div>

          {/* Your Email & Permanent CC */}
          <div className="bg-[#0e131c] border border-neutral-800 rounded-xl p-4">
            <label className="block text-xs font-mono uppercase text-orange-400 font-bold mb-1">
              Your Gmail Address (Primary To & Copy)
            </label>
            <input
              type="email"
              value={selfEmail}
              onChange={(e) => setSelfEmail(e.target.value)}
              className="w-full bg-[#161b22] border border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
              placeholder="yourname@gmail.com"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Every Pack dispatch is addressed To this email so you always get a copy in your inbox while friends receive it via BCC.
            </p>
          </div>

          {/* Friends BCC Roster */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase text-slate-300 font-bold">
                Friend BCC Recipients ({friends.length})
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Single Email BCC List
              </span>
            </div>

            {/* List */}
            <div className="bg-[#0e131c] border border-neutral-800 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1.5 mb-3">
              {friends.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  No friends added yet. Add your crew&apos;s email addresses below!
                </div>
              ) : (
                friends.map((email, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-[#161b22] px-3 py-2 rounded-lg text-xs font-mono text-slate-200 border border-neutral-800"
                  >
                    <span className="truncate">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(idx)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                      title="Remove from roster"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Friend Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFriend();
                  }
                }}
                className="flex-1 bg-[#161b22] border border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                placeholder="friend@example.com (comma-separated supported)"
              />
              <button
                type="button"
                onClick={handleAddFriend}
                className="bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          {/* Customizable Routine Schedule Settings */}
          <div className="bg-[#0e131c] border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <label className="text-xs font-mono uppercase text-orange-400 font-bold">
                  Routine Automated Emailing
                </label>
              </div>
              <button
                type="button"
                onClick={() => setAutoSendEnabled(!autoSendEnabled)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  autoSendEnabled
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-[#161b22] border-neutral-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {autoSendEnabled ? 'ACTIVE (AUTO-BLAST ON)' : 'OFF (MANUAL ONLY)'}
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
                Schedule Interval (Quick Presets or Custom Minutes):
              </label>
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                {INTERVAL_PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => setIntervalMinutes(preset.minutes)}
                    className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors cursor-pointer ${
                      intervalMinutes === preset.minutes
                        ? 'bg-orange-600 text-white border-orange-500 font-bold'
                        : 'bg-[#161b22] text-slate-300 border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10080}
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-28 bg-[#161b22] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-orange-500 tabular-nums"
                />
                <span className="text-xs font-mono text-slate-400">
                  minutes between automatic meme blasts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-[#0f141c] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Roster & Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};
