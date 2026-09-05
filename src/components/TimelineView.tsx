import React, { useRef } from 'react';
import { SceneEditPlan, ContentRole } from '../types';
import { Flame, ShieldAlert, Zap } from 'lucide-react';

interface TimelineViewProps {
  scenes: SceneEditPlan[];
  currentTime: number;
  duration: number;
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
  onSeek: (time: number) => void;
}

const ROLE_COLORS: Record<ContentRole, { bg: string; border: string; text: string; lightBg: string }> = {
  hook: { bg: 'bg-rose-50 text-rose-700', border: 'border-rose-300', text: 'text-rose-700', lightBg: 'bg-rose-50/50' },
  problem: { bg: 'bg-amber-50 text-amber-700', border: 'border-amber-300', text: 'text-amber-700', lightBg: 'bg-amber-50/50' },
  curiosity: { bg: 'bg-purple-50 text-purple-700', border: 'border-purple-300', text: 'text-purple-700', lightBg: 'bg-purple-50/50' },
  solution: { bg: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-300', text: 'text-emerald-700', lightBg: 'bg-emerald-50/50' },
  proof: { bg: 'bg-blue-50 text-blue-700', border: 'border-blue-300', text: 'text-blue-700', lightBg: 'bg-blue-50/50' },
  cta: { bg: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-300', text: 'text-indigo-700', lightBg: 'bg-indigo-50/50' },
  explanation: { bg: 'bg-slate-50 text-slate-700', border: 'border-slate-300', text: 'text-slate-700', lightBg: 'bg-slate-50' },
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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header with rhythm score indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Intelligent Pacing & Energy Timeline
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1 text-rose-600 font-bold">
            <Flame className="w-3 h-3" /> Hook Zone: 0-3s
          </span>
          <span>{scenes.length} Scenes Orchestrated</span>
        </div>
      </div>

      {/* Time Markers */}
      <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
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
        className="relative h-32 bg-slate-50 rounded-xl border border-slate-200 p-1.5 flex gap-1.5 cursor-pointer select-none overflow-hidden"
      >
        {/* Playhead Vertical Line */}
        <div
          className="absolute top-0 bottom-0 z-30 pointer-events-none transition-all duration-75"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="w-0.5 h-full bg-indigo-600 shadow-md" />
          <div className="w-3 h-3 -ml-[5px] -mt-1 bg-indigo-600 rounded-full border-2 border-white shadow" />
        </div>

        {/* Scene Blocks */}
        {scenes.map((scene, idx) => {
          const sceneDur = Math.max(0.1, scene.end - scene.start);
          const widthPercent = (sceneDur / totalDur) * 100;
          const roleColor = ROLE_COLORS[scene.role] || ROLE_COLORS.explanation;
          const isSelected = activeSceneIndex === idx;
          const scores = scene.scores;

          return (
            <div
              key={scene.id || idx}
              onClick={(e) => {
                e.stopPropagation();
                onSelectScene(idx);
                onSeek(scene.start);
              }}
              style={{ width: `${widthPercent}%` }}
              className={`h-full rounded-lg p-2 flex flex-col justify-between border transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? `bg-white ${roleColor.border} border-2 shadow-sm ring-2 ring-indigo-500`
                  : 'bg-white/90 border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Tag & Motion Icon */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-current/20 ${roleColor.bg}`}
                >
                  {scene.role}
                </span>

                {/* Score Pill / Fatigue Risk Indicator */}
                {scores && scores.visual_fatigue_risk > 50 ? (
                  <span title="High visual fatigue risk" className="text-amber-500">
                    <ShieldAlert className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-400">{sceneDur.toFixed(1)}s</span>
                )}
              </div>

              {/* Caption & Motion info */}
              <div className="space-y-0.5 my-auto">
                <p className="text-[10px] font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                  {scene.caption || 'Caption text'}
                </p>
                <div className="flex items-center gap-1 text-[9px] text-slate-500 flex-wrap">
                  <span className="text-indigo-600 font-bold uppercase text-[8px]">
                    {scene.motion.replace('_', ' ')}
                  </span>
                  {scene.broll && (
                    <span className="bg-purple-50 text-purple-700 px-1 rounded text-[8px] font-bold border border-purple-100">
                      {scene.visual_intent || 'B-ROLL'}
                    </span>
                  )}
                </div>
              </div>

              {/* Energy Meter Micro Bar on bottom */}
              <div className="space-y-1">
                {scores && (
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        scene.role === 'hook'
                          ? 'bg-rose-500'
                          : scores.emotional_intensity >= 7
                          ? 'bg-indigo-500'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${Math.min(100, scores.emotional_intensity * 10)}%` }}
                    />
                  </div>
                )}
                <div className="text-[8px] font-mono text-slate-400 truncate">
                  {scene.start.toFixed(1)}s - {scene.end.toFixed(1)}s
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
