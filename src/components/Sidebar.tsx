import React from 'react';
import {
  Video,
  Layers,
  PlayCircle,
  Download,
  Key,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import autoMotionIcon from '../assets/images/alco-auto-motion-icon.png';

interface SidebarProps {
  activeTab: 'input' | 'analysis' | 'edit_preview';
  onSelectTab: (tab: 'input' | 'analysis' | 'edit_preview') => void;
  hasPlan: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenExportModal?: () => void;
  onOpenApiKeyModal: () => void;
  isProcessing: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  hasPlan,
  isCollapsed,
  onToggleCollapse,
  onOpenExportModal,
  onOpenApiKeyModal,
  isProcessing,
}) => {
  const navItems = [
    {
      id: 'input' as const,
      label: 'Input',
      description: 'Video & Script Setup',
      icon: Video,
      disabled: false,
    },
    {
      id: 'analysis' as const,
      label: 'AI Analysis',
      description: 'Funnel & Scene Breakdown',
      icon: Layers,
      disabled: !hasPlan,
    },
    {
      id: 'edit_preview' as const,
      label: 'Edit & Preview',
      description: 'Interactive Workspace',
      icon: PlayCircle,
      disabled: !hasPlan,
    },
  ];

  return (
    <aside
      id="alco-workspace-sidebar"
      className={`relative flex flex-col shrink-0 border-r border-border bg-sidebar transition-all duration-200 select-none z-30 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-3.5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={autoMotionIcon}
            alt="ALCO Auto Motion"
            className="h-8 w-8 shrink-0 rounded-lg object-contain shadow-xs"
          />
          {!isCollapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-black tracking-tight text-foreground">
                  ALCO <span className="text-primary font-extrabold">Auto Motion</span>
                </span>
              </div>
              <p className="truncate text-[10px] font-medium text-muted-foreground">
                AI Video Editor
              </p>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          id="btn-toggle-sidebar"
          type="button"
          onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer shrink-0"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Workflow Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 custom-scrollbar">
        {/* Workflow Section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Workflow
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isDisabled = item.disabled;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? `${item.label} (${item.description})` : undefined}
                className={`group flex w-full items-center rounded-lg px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : isDisabled
                    ? 'cursor-not-allowed text-muted-foreground/40'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                } ${isCollapsed ? 'justify-center' : 'gap-3'}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-primary-foreground' : isDisabled ? 'opacity-40' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
                {!isCollapsed && (
                  <div className="min-w-0 flex-1 text-left leading-tight">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.id === 'edit_preview' && hasPlan && !isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span
                      className={`block truncate text-[10px] ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/80'
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Tools Section */}
        <div className="space-y-1 pt-2 border-t border-border">
          {!isCollapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Quick Tools
            </div>
          )}

          {/* Export Video Action */}
          {onOpenExportModal && (
            <button
              id="sidebar-btn-export"
              type="button"
              disabled={!hasPlan}
              onClick={onOpenExportModal}
              title={isCollapsed ? 'Export Video Project' : undefined}
              className={`group flex w-full items-center rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                !hasPlan
                  ? 'cursor-not-allowed text-muted-foreground/40'
                  : 'text-foreground hover:bg-secondary cursor-pointer'
              } ${isCollapsed ? 'justify-center' : 'gap-3'}`}
            >
              <Download className="h-4 w-4 shrink-0 text-primary" />
              {!isCollapsed && (
                <div className="min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate block">Export Video</span>
                  <span className="text-[10px] text-muted-foreground block truncate">
                    Burn-in MP4/WebM
                  </span>
                </div>
              )}
            </button>
          )}

          {/* Gemini API Key Action */}
          <button
            id="sidebar-btn-apikey"
            type="button"
            onClick={onOpenApiKeyModal}
            title={isCollapsed ? 'Gemini API Key Settings' : undefined}
            className={`group flex w-full items-center rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-all cursor-pointer ${
              isCollapsed ? 'justify-center' : 'gap-3'
            }`}
          >
            <Key className="h-4 w-4 shrink-0 text-amber-500" />
            {!isCollapsed && (
              <div className="min-w-0 flex-1 text-left leading-tight">
                <span className="truncate block">Gemini API Key</span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  BYO Studio Key
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-border p-2">
        {isProcessing ? (
          <div
            className={`flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-2 py-1.5 text-xs text-primary ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="AI Engine actively processing"
          >
            <Sparkles className="h-4 w-4 shrink-0 animate-spin" />
            {!isCollapsed && (
              <span className="truncate text-[11px] font-semibold">Processing...</span>
            )}
          </div>
        ) : (
          <div
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Aladzan Corpora Desktop Ready"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            {!isCollapsed && (
              <span className="truncate text-[10px] font-medium">Desktop Ready</span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
