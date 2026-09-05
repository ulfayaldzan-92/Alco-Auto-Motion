import React from 'react';
import { Sparkles, Video, Layers, PlayCircle } from 'lucide-react';
import { ApiKeyControl } from './ApiKeyControl';
import autoMotionIcon from '../assets/images/alco-auto-motion-icon.png';

interface HeaderProps {
  activeTab: 'input' | 'analysis' | 'edit_preview';
  onSelectTab: (tab: 'input' | 'analysis' | 'edit_preview') => void;
  hasPlan: boolean;
  isProcessing: boolean;
  onOpenApiKeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  hasPlan,
  isProcessing,
  onOpenApiKeyModal,
}) => {
  return (
    <header id="alco-header" className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-14 items-center justify-between gap-3 py-2">
          {/* Logo & Brand */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-950 shadow-sm">
              <img src={autoMotionIcon} alt="ALCO Auto Motion" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-black text-foreground md:text-base">
                  ALCO <span className="font-semibold text-primary">Auto Motion</span>
                </span>
                <span className="hidden shrink-0 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary sm:inline-block">
                  MVP Testing Tool
                </span>
              </div>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">AI Video Editing Director & Scene Motion Engine</p>
            </div>
          </div>

          {/* Tab Navigation (3 Main Tabs from Blueprint) */}
          <nav className="hidden items-center gap-1 rounded-lg border border-border bg-secondary p-1 md:flex">
            <button
              id="tab-btn-input"
              onClick={() => onSelectTab('input')}
              className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs font-bold transition-all ${
                activeTab === 'input'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Input</span>
            </button>

            <button
              id="tab-btn-analysis"
              onClick={() => onSelectTab('analysis')}
              disabled={!hasPlan && !isProcessing}
              className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs font-bold transition-all ${
                activeTab === 'analysis'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : hasPlan
                  ? 'text-muted-foreground hover:bg-card hover:text-foreground'
                  : 'cursor-not-allowed text-slate-400 opacity-60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>AI Analysis</span>
              {hasPlan && (
                <span className="h-2 w-2 rounded-full bg-success"></span>
              )}
            </button>

            <button
              id="tab-btn-preview"
              onClick={() => onSelectTab('edit_preview')}
              disabled={!hasPlan && !isProcessing}
              className={`flex h-8 items-center gap-2 rounded-md px-3 text-xs font-bold transition-all ${
                activeTab === 'edit_preview'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : hasPlan
                  ? 'text-muted-foreground hover:bg-card hover:text-foreground'
                  : 'cursor-not-allowed text-slate-400 opacity-60'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Edit Plan & Preview</span>
              {hasPlan && (
                <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  LIVE
                </span>
              )}
            </button>
          </nav>

          {/* Right Area: BYO Gemini API Key Button & Status */}
          <div className="flex items-center gap-2 text-xs">
            <ApiKeyControl onOpenModal={onOpenApiKeyModal} />

            {isProcessing ? (
              <div className="hidden items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-primary lg:flex">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-bold">AI Active...</span>
              </div>
            ) : (
              <div className="hidden items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-muted-foreground xl:flex">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Gemini 3.7</span>
              </div>
            )}
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border py-2 md:hidden">
          {[
            { id: 'input', label: 'Input', icon: Video, disabled: false },
            { id: 'analysis', label: 'AI Analysis', icon: Layers, disabled: !hasPlan && !isProcessing },
            { id: 'edit_preview', label: 'Edit & Preview', icon: PlayCircle, disabled: !hasPlan && !isProcessing },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as 'input' | 'analysis' | 'edit_preview')}
                disabled={item.disabled}
                className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : item.disabled
                    ? 'cursor-not-allowed text-slate-400 opacity-60'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
