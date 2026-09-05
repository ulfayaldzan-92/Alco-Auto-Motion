import React, { useRef } from 'react';
import { SceneEditPlan, ContentRole } from '../types';
import { Flame, ShieldAlert, Film, Move, Layers, Clock } from 'lucide-react';

interface TimelineViewProps {
  scenes: SceneEditPlan[];
  currentTime: number;
  duration: number;
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
  onSeek: (time: number) => void;
}

const ROLE_STYLES: Record<
  ContentRole,
  { bg: string; border: string; text: string; label: string }
> = {
  hook: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400',
    label: 'HOOK',
  },
  problem: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'PROBLEM',
  },
  curiosity: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400',
    label: 'CURIOSITY',
  },
  explanation: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    label: 'INFO',
  },
  solution: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'SOLUTION',
  },
  proof: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    label: 'PROOF',
  },
  cta: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    label: 'CTA',
  },
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  scenes,
  currentTime,
  duration,
  activeSceneIndex,
  onSelectScene,
  onSeek,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const totalDur = Math.max(1, duration);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = fraction * totalDur;
    onSeek(targetTime);
  };

  const playheadPercent = Math.min(100, Math.max(0, (currentTime / totalDur) * 100));

  return (
    <div className="alco-card p-4 space-y-3">
      {/* Timeline Controls & Info Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Pacing & Sequence Timeline
          </h3>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 font-bold text-rose-500">
            <Flame className="w-3 h-3" /> Hook Zone: 0-3s
          </span>
          <span className="flex items-center gap-1 text-foreground font-semibold">
            <Clock className="w-3 h-3 text-primary" /> {currentTime.toFixed(1)}s / {totalDur.toFixed(1)}s
          </span>
          <span className="hidden sm:inline">
            {scenes.length} Scenes
          </span>
        </div>
      </div>

      {/* Time Markers Ruler */}
      <div className="flex justify-between font-mono text-[10px] text-muted-foreground px-1 select-none">
        <span>0.0s</span>
        <span>{(totalDur * 0.25).toFixed(1)}s</span>
        <span>{(totalDur * 0.5).toFixed(1)}s</span>
        <span>{(totalDur * 0.75).toFixed(1)}s</span>
        <span>{totalDur.toFixed(1)}s</span>
      </div>

      {/* Interactive Timeline Bar */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="relative h-28 w-full rounded-lg border border-border bg-secondary/70 p-1.5 flex gap-1.5 cursor-pointer select-none overflow-x-auto custom-scrollbar"
      >
        {/* Playhead Vertical Line */}
        <div
          className="absolute top-0 bottom-0 z-30 pointer-events-none transition-all duration-75"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="w-0.5 h-full bg-primary shadow-sm" />
          <div className="w-2.5 h-2.5 -ml-[4px] -mt-0.5 bg-primary rounded-full border border-primary-foreground shadow" />
        </div>

        {/* Scene Blocks */}
        {scenes.map((scene, idx) => {
          const sceneDur = Math.max(0.1, scene.end - scene.start);
          const widthPercent = (sceneDur / totalDur) * 100;
          const roleStyle = ROLE_STYLES[scene.role] || ROLE_STYLES.explanation;
          const isSelected = activeSceneIndex === idx;

          return (
            <div
              key={scene.id || idx}
              onClick={(e) => {
                e.stopPropagation();
                onSelectScene(idx);
                onSeek(scene.start);
              }}
              style={{ minWidth: '70px', width: `${widthPercent}%` }}
              className={`h-full rounded border p-2 flex flex-col justify-between transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/40 bg-card shadow-xs'
                  : 'border-border bg-card/80 hover:border-primary/50 hover:bg-card'
              }`}
            >
              {/* Top Tag & Motion Icon */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                >
                  {roleStyle.label}
                </span>

                <span className="text-[9px] font-mono text-muted-foreground">
                  {sceneDur.toFixed(1)}s
                </span>
              </div>

              {/* Caption & Motion info */}
              <div className="space-y-0.5 my-auto">
                <p className="text-[10px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {scene.caption || 'Caption text'}
                </p>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground flex-wrap">
                  <span className="text-primary font-bold uppercase text-[8px]">
                    {scene.motion.replace(/_/g, ' ')}
                  </span>
                  {scene.broll && (
                    <span className="rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 px-1 text-[8px] font-bold border border-purple-500/30">
                      B-ROLL
                    </span>
                  )}
                </div>
              </div>

              {/* Scene Number Index bottom */}
              <div className="flex items-center justify-between text-[8px] text-muted-foreground pt-0.5 border-t border-border">
                <span className="font-bold">Scene #{idx + 1}</span>
                <span>{scene.start.toFixed(1)}s</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
