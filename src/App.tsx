/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { AuthUserState, RecipientConfig } from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebase';
import { sendPackMemeEmail } from './services/gmailSender';
import { loadRecipientConfig, saveRecipientConfig } from './services/store';

import { Header } from './components/Header';
import { RecipientRosterModal } from './components/RecipientRosterModal';
import {
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Users,
} from 'lucide-react';

interface GeminiMemeResult {
  imageUrl: string;
  rawBase64: string;
  subject: string;
  phase1Hook?: string;
  phase2Resolution?: string;
  subjectChoice?: string;
  atmosphere1?: string;
  atmosphere2?: string;
  styleNotes?: string;
  wasRefined?: boolean;
}

export default function App() {
  // Auth state
  const [auth, setAuth] = useState<AuthUserState>({
    email: null,
    displayName: null,
    photoURL: null,
    isAuthenticated: false,
    accessToken: null,
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Recipient config
  const [config, setConfig] = useState<RecipientConfig>(() => loadRecipientConfig());

  // Gemini Meme State
  const [meme, setMeme] = useState<GeminiMemeResult | null>(null);
  const [isGeneratingMeme, setIsGeneratingMeme] = useState(false);

  // Sending state & Feedback
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  // Roster Modal
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setAuth({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAuthenticated: true,
          accessToken: token,
        });
      },
      () => {
        setAuth({
          email: null,
          displayName: null,
          photoURL: null,
          isAuthenticated: false,
          accessToken: null,
        });
      }
    );
    return () => unsubscribe();
  }, []);

  // 1b. Hydrate and poll RecipientConfig from Server (Firestore)
  const isDispatchingCronRef = useRef(false);

  const fetchServerConfig = useCallback(async (): Promise<RecipientConfig | null> => {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.success && data.config) {
        setConfig((prev) => {
          const merged: RecipientConfig = { ...prev, ...data.config };
          saveRecipientConfig(merged);
          return merged;
        });
        return data.config as RecipientConfig;
      }
    } catch (err) {
      console.warn('Could not fetch server config:', err);
    }
    return null;
  }, []);

  const triggerCronDispatch = useCallback(async () => {
    if (isDispatchingCronRef.current) return;
    isDispatchingCronRef.current = true;
    try {
      const token = auth.accessToken || (await getAccessToken());
      const res = await fetch('/api/cron/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      const refreshed = await fetchServerConfig();

      if (data?.skipped) {
        return;
      }

      if (res.ok && data?.success) {
        if (data.meme) {
          setMeme(data.meme);
        }
        const activeCfg = refreshed || data.config;
        const isCrew = activeCfg?.mode === 'pack_automation';
        const bccCount = isCrew ? (activeCfg?.friendEmails?.length || 0) : 0;
        setToast({
          type: 'success',
          message: 'Routine Auto-Blast Complete!',
          details: isCrew
            ? `Forged & emailed To: ${activeCfg?.selfEmail} + ${bccCount} BCC friend(s) (Msg ID: ${data.messageId}).`
            : `Forged & emailed To: ${activeCfg?.selfEmail} (Msg ID: ${data.messageId}).`,
        });
      } else {
        setToast({
          type: 'error',
          message: 'Routine Auto-Blast Failed',
          details: data?.error || refreshed?.lastError || 'Scheduled dispatch failed on server.',
        });
      }
    } catch (err: any) {
      await fetchServerConfig();
      setToast({
        type: 'error',
        message: 'Routine Auto-Blast Failed',
        details: err?.message || 'Network error while triggering scheduled dispatch.',
      });
    } finally {
      isDispatchingCronRef.current = false;
    }
  }, [auth.accessToken, fetchServerConfig]);

  const triggerCronDispatchRef = useRef(triggerCronDispatch);
  useEffect(() => {
    triggerCronDispatchRef.current = triggerCronDispatch;
  }, [triggerCronDispatch]);

  useEffect(() => {
    let mounted = true;
    fetchServerConfig().then((serverCfg) => {
      if (!mounted || !serverCfg) return;
      if (
        serverCfg.autoSendEnabled &&
        serverCfg.nextScheduledRunAt &&
        serverCfg.nextScheduledRunAt > 0 &&
        Date.now() >= serverCfg.nextScheduledRunAt
      ) {
        triggerCronDispatchRef.current();
      }
    });
    const pollId = setInterval(() => {
      fetchServerConfig();
    }, 15000);
    return () => {
      mounted = false;
      clearInterval(pollId);
    };
  }, [fetchServerConfig]);

  // Sync active browser OAuth access token to server for headless fallback
  useEffect(() => {
    if (!auth.accessToken) return;
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: auth.accessToken }),
    }).catch(() => {});
  }, [auth.accessToken]);

  // 2. Generate Meme via Gemini API endpoint
  const handleGenerateMeme = useCallback(async () => {
    setIsGeneratingMeme(true);
    setToast(null);
    try {
      const response = await fetch('/api/meme/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate meme from Gemini.');
      }

      setMeme({
        imageUrl: data.imageUrl,
        rawBase64: data.rawBase64,
        subject: data.subject,
        phase1Hook: data.phase1Hook,
        phase2Resolution: data.phase2Resolution,
        subjectChoice: data.subjectChoice,
        atmosphere1: data.atmosphere1,
        atmosphere2: data.atmosphere2,
        styleNotes: data.styleNotes,
        wasRefined: data.wasRefined,
      });
    } catch (err: any) {
      console.error('Error generating meme:', err);
      setToast({
        type: 'error',
        message: 'Gemini Image Generation Error',
        details: err.message || 'Check server logs.',
      });
    } finally {
      setIsGeneratingMeme(false);
    }
  }, []);

  // Generate initial meme on first load
  useEffect(() => {
    handleGenerateMeme();
  }, [handleGenerateMeme]);

  // 3. Handle Sign In
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setAuth({
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          isAuthenticated: true,
          accessToken: result.accessToken,
        });
        fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: result.accessToken }),
        }).catch(() => {});
        setToast({
          type: 'success',
          message: 'Connected to Gmail successfully!',
          details: `Authorized as ${result.user.email}. Ready to send test meme.`,
        });
      }
    } catch (error: any) {
      setToast({
        type: 'error',
        message: 'Google Sign-In failed',
        details: error.message || 'Please check popup permissions.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAuth({
      email: null,
      displayName: null,
      photoURL: null,
      isAuthenticated: false,
      accessToken: null,
    });
  };

  const handleUpdateConfig = useCallback(
    (updated: Partial<RecipientConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...updated };
        saveRecipientConfig(next);
        fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...next,
            accessToken: auth.accessToken || undefined,
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.config) {
              setConfig((curr) => {
                const synced = { ...curr, ...data.config };
                saveRecipientConfig(synced);
                return synced;
              });
            }
          })
          .catch((err) => console.error('Failed to sync config to server:', err));
        return next;
      });
    },
    [auth.accessToken]
  );

  // 4. Send Email (Self-Test or Crew BCC Blast) with Embedded Inline CID Image
  const handleSendTestEmail = async () => {
    const token = auth.accessToken || (await getAccessToken());
    if (!token) {
      setToast({
        type: 'error',
        message: 'Gmail Not Connected',
        details: 'Please click "Sign in with Google" above to allow sending emails.',
      });
      return;
    }

    if (!meme?.rawBase64) {
      setToast({
        type: 'error',
        message: 'No Meme Ready',
        details: 'Please wait for Gemini to finish generating the meme.',
      });
      return;
    }

    const isCrewMode = config.mode === 'pack_automation';
    const bccList = isCrewMode ? config.friendEmails : [];

    setIsSending(true);
    try {
      const result = await sendPackMemeEmail({
        accessToken: token,
        toRecipients: [config.selfEmail],
        ccRecipient: isCrewMode ? undefined : config.selfEmail,
        bccRecipients: bccList,
        subject: meme.subject,
        rawBase64Png: meme.rawBase64,
      });

      handleUpdateConfig({
        lastSentAt: Date.now(),
        lastSentSubject: meme.subject,
        lastSentMode: config.mode,
        lastError: null,
      });

      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ea580c', '#f59e0b', '#dc2626', '#f8fafc'],
        });
      } catch (e) {
        // ignore
      }

      setToast({
        type: 'success',
        message: isCrewMode
          ? `Pack Meme Blasted to Crew (${bccList.length} BCC)!`
          : 'Test Meme Blasted to Your Gmail!',
        details: isCrewMode
          ? `Delivered To: ${config.selfEmail} with ${bccList.length} friend(s) in BCC (Gmail Msg ID: ${result.messageId}).`
          : `Delivered to ${config.selfEmail} (Gmail Msg ID: ${result.messageId}). Check your inbox to verify inline image display!`,
      });
    } catch (err: any) {
      console.error('Send error:', err);
      setToast({
        type: 'error',
        message: 'Gmail API Send Failed',
        details: err.message || 'Could not dispatch message.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // 5. Server-Backed Routine Automated Emailing Countdown Display
  const [secondsUntilAutoSend, setSecondsUntilAutoSend] = useState<number | null>(null);

  useEffect(() => {
    if (!config.autoSendEnabled) {
      setSecondsUntilAutoSend(null);
      return;
    }

    const computeRemainingSeconds = () => {
      if (config.nextScheduledRunAt && config.nextScheduledRunAt > 0) {
        return Math.max(0, Math.ceil((config.nextScheduledRunAt - Date.now()) / 1000));
      }
      return Math.max(60, (config.intervalMinutes || 1440) * 60);
    };

    setSecondsUntilAutoSend(computeRemainingSeconds());

    const intervalId = setInterval(() => {
      const remaining = computeRemainingSeconds();
      setSecondsUntilAutoSend(remaining);
      if (remaining === 0) {
        triggerCronDispatchRef.current();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [config.autoSendEnabled, config.nextScheduledRunAt, config.intervalMinutes]);

  const formatCountdown = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    }
    return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-pack-body">
      {/* Top Header */}
      <Header
        auth={auth}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col items-center">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`w-full mb-6 p-4 rounded-xl border flex items-start justify-between gap-3 shadow-2xl transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200'
                : 'bg-red-950/40 border-red-600/60 text-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-semibold text-sm">{toast.message}</h4>
                {toast.details && (
                  <p className="text-xs text-slate-300 mt-0.5 font-mono break-all">{toast.details}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Central Test Station Card */}
        <div className="w-full bg-[#141a24] border border-neutral-800 rounded-2xl p-6 shadow-2xl">
          {/* Card Header info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-neutral-800">
            <div>
              <span className="text-xs font-mono uppercase text-amber-400 font-bold block mb-1">
                {config.mode === 'pack_automation'
                  ? `Pack Crew Dispatch Mode (${config.friendEmails.length} BCC)`
                  : 'Isolated Testing Mode'}
                {config.autoSendEnabled && secondsUntilAutoSend !== null && (
                  <span className="ml-2 text-emerald-400 tabular-nums">
                    · Auto-Send in {formatCountdown(secondsUntilAutoSend)}
                  </span>
                )}
              </span>
              <div className="text-xs text-slate-300 font-mono flex items-center gap-2">
                <span>Destination:</span>
                <span className="bg-neutral-800 px-2 py-0.5 rounded text-white font-semibold">
                  {config.selfEmail}
                </span>
                <span className="text-slate-500">
                  {config.mode === 'pack_automation'
                    ? `(+ ${config.friendEmails.length} Friends in BCC)`
                    : '(CC yourself)'}
                </span>
              </div>
              {config.lastError && (
                <div className="text-xs text-red-400 font-mono mt-1.5 flex items-center gap-1.5 break-all">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Last Dispatch Error: {config.lastError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRosterOpen(true)}
                title="View recipient & schedule settings"
                className="text-xs bg-neutral-800 hover:bg-neutral-700 text-slate-300 px-3 py-1.5 rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-orange-400" />
                <span>Friends Roster ({config.friendEmails.length})</span>
              </button>
            </div>
          </div>

          {/* Email Subject Preview */}
          <div className="mb-3 bg-[#0e131c] border border-neutral-800 rounded-lg p-3 text-xs font-mono">
            <span className="text-slate-500 mr-2">Email Subject:</span>
            <span className="text-orange-400 font-bold">
              {meme ? meme.subject : 'Generating Pack subject...'}
            </span>
          </div>

          {/* Gemini AI Meme Frame */}
          <div className="relative aspect-square w-full max-w-[500px] mx-auto rounded-xl overflow-hidden border-2 border-neutral-700 shadow-2xl bg-black mb-6">
            {meme?.imageUrl ? (
              <img
                src={meme.imageUrl}
                alt="Gemini AI Pack Meme"
                className="w-full h-full object-contain select-none"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3 p-6 text-center">
                <RefreshCw className="w-10 h-10 animate-spin text-orange-500" />
                <span className="font-pack-headline text-lg text-white tracking-wide">
                  GEMINI AI CRANKIN MEME ARTWORK...
                </span>
                <span className="text-xs text-slate-500 font-mono max-w-xs">
                  Generating full heavy metal illustration with integrated text overlay via Gemini model.
                </span>
              </div>
            )}

            {isGeneratingMeme && meme && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <div className="bg-[#161b22] px-5 py-3 rounded-xl border border-orange-500/50 flex items-center gap-3 text-sm font-bold text-orange-400 shadow-2xl">
                  <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
                  <span>FORGING FRESH GEMINI MEME...</span>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleGenerateMeme}
              disabled={isGeneratingMeme}
              className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-slate-200 rounded-xl font-pack-headline text-sm font-bold tracking-wider flex items-center justify-center gap-2 border border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-orange-400 ${isGeneratingMeme ? 'animate-spin' : ''}`} />
              <span>GENERATE NEW MEME</span>
            </button>

            <button
              onClick={handleSendTestEmail}
              disabled={isSending || isGeneratingMeme || !auth.isAuthenticated}
              className="py-3 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl font-pack-headline text-sm font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
              <span>
                {isSending
                  ? 'SENDING TO GMAIL...'
                  : !auth.isAuthenticated
                  ? 'SIGN IN ABOVE TO SEND'
                  : config.mode === 'pack_automation'
                  ? `BLAST TO CREW (${config.friendEmails.length} BCC)`
                  : 'SEND TEST TO MY GMAIL'}
              </span>
            </button>
          </div>

          {/* Test verification tip */}
          <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Embedded RFC 2822 Multipart/Related CID Image</span>
            </div>
            <span>No External Links</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-[#0c1017] py-4 px-4 text-center text-xs text-slate-500 font-mono">
        <p>THE PACK MEME BLASTER · GEMINI IMAGE GENERATION · AROOOOO</p>
      </footer>

      {/* Recipient Roster Modal */}
      <RecipientRosterModal
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        config={config}
        onSave={handleUpdateConfig}
      />
    </div>
  );
}
