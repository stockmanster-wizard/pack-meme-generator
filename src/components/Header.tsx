/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthUserState } from '../types';
import { Flame, LogOut, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  auth: AuthUserState;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  auth,
  onLogin,
  onLogout,
  isLoggingIn,
}) => {
  return (
    <header className="w-full bg-[#111620] border-b border-neutral-800 px-4 md:px-8 py-3.5 sticky top-0 z-50 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-950/50 shrink-0">
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-pack-headline text-xl md:text-2xl font-bold tracking-wider text-white">
                THE PACK <span className="text-orange-500">//</span> TEST STATION
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/30">
                Self-Test Phase
              </span>
            </div>
            <p className="text-xs text-slate-400 font-pack-body">
              Gemini AI Meme Generation &amp; Direct Inline Gmail Dispatch
            </p>
          </div>
        </div>

        {/* Auth Zone */}
        <div className="flex items-center gap-3 shrink-0">
          {auth.isAuthenticated ? (
            <div className="flex items-center gap-3 bg-[#18202c] border border-neutral-700/80 rounded-lg px-3 py-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                {auth.photoURL ? (
                  <img
                    src={auth.photoURL}
                    alt={auth.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-orange-500/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs">
                    {auth.email ? auth.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200">
                      {auth.displayName || 'Pack Brother'}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block truncate max-w-[170px]">
                    {auth.email}
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-neutral-700 mx-1" />

              <button
                onClick={onLogout}
                title="Sign out of Google"
                className="text-xs text-slate-400 hover:text-red-400 p-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="gsi-material-button flex items-center gap-2.5 bg-white text-slate-800 hover:bg-slate-100 font-semibold text-xs px-4 py-2 rounded-lg border border-slate-300 shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 block">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span>{isLoggingIn ? 'Connecting to Gmail...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
