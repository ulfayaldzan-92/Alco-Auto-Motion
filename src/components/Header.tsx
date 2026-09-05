import React, { useEffect, useState } from 'react';
import { Sparkles, Moon, Sun, Monitor, Download, Menu } from 'lucide-react';
import { ApiKeyControl } from './ApiKeyControl';

interface HeaderProps {
  onOpenApiKeyModal: () => void;
  onOpenExportModal?: () => void;
  hasPlan?: boolean;
  isProcessing?: boolean;
  onToggleSidebar?: () => void;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export const Header: React.FC<HeaderProps> = ({
  onOpenApiKeyModal,
  onOpenExportModal,
  hasPlan,
  isProcessing,
  onToggleSidebar,
}) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('alco_theme') as ThemeMode;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          return saved;
        }
      } catch {}
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const applyTheme = (mode: ThemeMode) => {
      let isDark = false;
      if (mode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = mode === 'dark';
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('alco_theme', mode);
      } catch {}
    };

    applyTheme(theme);

    // If system mode, listen for system preference changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent | MediaQueryList) => {
        const isSystemDark = 'matches' in e ? e.matches : (e as any).matches;
        if (isSystemDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener as EventListener);
        return () => mediaQuery.removeEventListener('change', listener as EventListener);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(listener);
        return () => (mediaQuery as any).removeListener(listener);
      }
    }
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header
      id="alco-header"
      className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card px-4 sm:px-6 select-none"
    >
      {/* Left: Mobile/Drawer toggle + Title + Badge */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden transition-colors cursor-pointer"
            title="Toggle Navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-black text-foreground">
                Auto Motion Studio
              </h1>
              <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                AUTO MOTION
              </span>
            </div>
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
              AI Video Editing Director & Scene Motion Engine
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions (Theme Toggle, API Key, Export CTA, Processing status) */}
      <div className="flex items-center gap-2 text-xs shrink-0">
        {/* Export Quick Button if plan is ready */}
        {hasPlan && onOpenExportModal && (
          <button
            id="header-btn-export"
            type="button"
            onClick={onOpenExportModal}
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/95 transition-all cursor-pointer"
            title="Export Video Project"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        )}

        {/* Theme Toggle (Light -> Dark -> System) */}
        <button
          id="theme-toggle-btn"
          type="button"
          onClick={cycleTheme}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 text-muted-foreground hover:bg-card hover:text-foreground transition-all cursor-pointer"
          title={`Tema: ${theme.toUpperCase()} (Klik untuk ganti)`}
        >
          {theme === 'light' ? (
            <Sun className="h-3.5 w-3.5 text-amber-500" />
          ) : theme === 'dark' ? (
            <Moon className="h-3.5 w-3.5 text-indigo-400" />
          ) : (
            <Monitor className="h-3.5 w-3.5 text-blue-500" />
          )}
          <span className="hidden text-[10px] font-bold uppercase tracking-wider md:inline">
            {theme}
          </span>
        </button>

        {/* Gemini API Key Control */}
        <ApiKeyControl onOpenModal={onOpenApiKeyModal} />

        {/* Busy status indicator */}
        {isProcessing && (
          <div
            className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary animate-pulse"
            title="Engine processing"
          >
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span className="hidden sm:inline">Processing</span>
          </div>
        )}
      </div>
    </header>
  );
};
