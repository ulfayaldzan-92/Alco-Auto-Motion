import React, { useState } from 'react';
import { AlcoEditingProject, SceneEditPlan } from '../types';
import { PreviewPlayer } from './PreviewPlayer';
import { TimelineView } from './TimelineView';
import { SceneInspector } from './SceneInspector';
import { Download, Sparkles, SlidersHorizontal, RefreshCw, Layers, Zap, Type, Move, Film, ShieldCheck, Target, UserCheck, Sun, AlertTriangle } from 'lucide-react';
import { getApiHeaders } from '../services/apiKeyService';
import { getStyleProfile } from '../engine/styleProfiles';
import { validateCreativePerformance } from '../engine/creativeValidator';

interface EditPlanTabProps {
  project: AlcoEditingProject;
  videoUrl: string;
  onUpdateProject: (updated: AlcoEditingProject) => void;
  onOpenExportModal: () => void;
  onRegenerateAll: () => Promise<void>;
  isProcessing: boolean;
}

export const EditPlanTab: React.FC<EditPlanTabProps> = ({
  project,
  videoUrl,
  onUpdateProject,
  onOpenExportModal,
  onRegenerateAll,
  isProcessing,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [enableSfx, setEnableSfx] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'edited' | 'raw' | 'split'>('edited');
  const [isRegeneratingScene, setIsRegeneratingScene] = useState<boolean>(false);

  const activeStyleProfile = getStyleProfile(project.video_type);

  // Compute active scene from current time
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    const sceneIdx = project.scenes.findIndex((s) => time >= s.start && time < s.end);
    if (sceneIdx !== -1 && sceneIdx !== activeSceneIndex) {
      setActiveSceneIndex(sceneIdx);
    }
  };

  const handleUpdateScene = (updatedScene: SceneEditPlan) => {
    const newScenes = [...project.scenes];
    newScenes[activeSceneIndex] = updatedScene;
    onUpdateProject({
      ...project,
      scenes: newScenes,
    });
  };

  const handleRegenerateScene = async (sceneIdx: number, customInstruction: string) => {
    setIsRegeneratingScene(true);
    try {
      const sceneToRegen = project.scenes[sceneIdx];
      const res = await fetch('/api/regenerate-scene', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          scene: sceneToRegen,
          instruction: customInstruction,
          contentType: project.video_type,
        }),
      });

      if (!res.ok) {
        let text = '';
        try { text = await res.text(); } catch {}
        if (text && text.length < 200 && !text.includes('<!doctype') && !text.includes('<html')) {
          throw new Error(text);
        }
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }
      const updatedScene: SceneEditPlan = await res.json().catch(() => {
        throw new Error('Gagal membaca response JSON yang valid dari server');
      });

      const newScenes = [...project.scenes];
      newScenes[sceneIdx] = updatedScene;
      onUpdateProject({
        ...project,
        scenes: newScenes,
      });
    } catch (err: any) {
      console.error('Error regenerating scene:', err);
      alert('Gagal meregenerasi scene: ' + err.message);
    } finally {
      setIsRegeneratingScene(false);
    }
  };

  const currentScene = project.scenes[activeSceneIndex] || project.scenes[0];
  const liveAudit = validateCreativePerformance(project);
  const activeAlerts = liveAudit.recommendations.filter(r => r.severity === 'high' || r.severity === 'medium');

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Live Creative Performance Alert Bar */}
      {activeAlerts.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-2xl shadow-xs flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold shadow-xs">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black text-rose-950 uppercase tracking-wider">
                  Live Marketing Quality Warnings ({activeAlerts.length})
                </h3>
                <p className="text-[10px] text-rose-700 font-medium">
                  Sistem mendeteksi {activeAlerts.length} elemen video yang kurang optimal secara marketing. Perbaiki agar retensi penonton maksimal!
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black bg-rose-100 text-rose-700 px-3 py-1 rounded-full border border-rose-200">
                Performance Score: {liveAudit.overallScore}/100 ({liveAudit.grade})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {activeAlerts.slice(0, 4).map((rec) => (
              <div key={rec.id} className="bg-white/80 p-2.5 rounded-xl border border-rose-100/80 flex items-start gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase shrink-0 mt-0.5 ${
                  rec.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {rec.severity}
                </span>
                <div>
                  <p className="font-bold text-slate-800">{rec.title}</p>
                  <p className="text-[10px] text-slate-500">{rec.description}</p>
                  <p className="text-[10px] font-semibold text-rose-600 mt-1">💡 Fix: {rec.actionableFix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Editing Plan
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${activeStyleProfile.badgeColor}`}>
              Style: {activeStyleProfile.name}
            </span>
            {project.talking_head_summary?.dominant && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-600" /> Talking Head Eyeline Locked
              </span>
            )}
            {project.visual_quality_summary && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-700 border border-cyan-500/30 flex items-center gap-1">
                <Sun className="w-3 h-3 text-cyan-600" /> Lighting & Face Clarity Enhanced
              </span>
            )}
            <span className="text-xs text-slate-500 font-mono">
              {project.scenes.length} Scenes Identified • {project.total_duration}s Total
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mt-1">
            {project.title}
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onRegenerateAll}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Re-analyze</span>
          </button>

          <button
            id="btn-open-export"
            type="button"
            onClick={onOpenExportModal}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Project</span>
          </button>
        </div>
      </div>

      {/* Editing Grammar & Style Profile Breakdown Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg text-white space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">{activeStyleProfile.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {activeStyleProfile.pacing.speedTag}
                </span>
              </div>
              <p className="text-xs text-slate-400">{activeStyleProfile.tagline}</p>
            </div>
          </div>
        </div>

        {/* 6 Key Pillars Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <Zap className="w-3.5 h-3.5" /> Pacing
            </div>
            <p className="font-semibold text-slate-200">{activeStyleProfile.pacing.cadenceRangeMs}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{activeStyleProfile.pacing.description}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px]">
              <Type className="w-3.5 h-3.5" /> Caption
            </div>
            <p className="font-semibold text-slate-200">{activeStyleProfile.captionStyle.fontFamily.replace(/["',]/g, '')}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{activeStyleProfile.captionStyle.badgeFormat}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
              <Move className="w-3.5 h-3.5" /> Motion
            </div>
            <p className="font-semibold text-slate-200">{activeStyleProfile.motionIntensity.preset}</p>
            <p className="text-[10px] text-slate-400 leading-tight">Hook Scale: {activeStyleProfile.motionIntensity.hookScale}x</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <Film className="w-3.5 h-3.5" /> B-Roll
            </div>
            <p className="font-semibold text-slate-200">{activeStyleProfile.brollBehavior.density}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{activeStyleProfile.brollBehavior.description}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" /> Proof
            </div>
            <p className="font-semibold text-slate-200 truncate">{activeStyleProfile.proofVisual.primaryType}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{activeStyleProfile.proofVisual.badgeStyle}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px]">
              <Target className="w-3.5 h-3.5" /> CTA
            </div>
            <p className="font-semibold text-slate-200 truncate">{activeStyleProfile.ctaTreatment.actionType}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{activeStyleProfile.ctaTreatment.pulseStyle}</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Editing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 9:16 Preview Player (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <PreviewPlayer
            videoUrl={videoUrl}
            scenes={project.scenes}
            currentTime={currentTime}
            setCurrentTime={handleTimeUpdate}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            activeSceneIndex={activeSceneIndex}
            duration={project.total_duration}
            enableSfx={enableSfx}
            setEnableSfx={setEnableSfx}
            viewMode={viewMode}
            setViewMode={setViewMode}
            contentType={project.video_type}
          />
        </div>

        {/* Right Column: Scene Timeline & Scene Inspector (7 Cols) */}

        {/* Right Column: Scene Timeline & Scene Inspector (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Timeline Bar */}
          <TimelineView
            scenes={project.scenes}
            currentTime={currentTime}
            duration={project.total_duration}
            activeSceneIndex={activeSceneIndex}
            onSelectScene={(idx) => {
              setActiveSceneIndex(idx);
              const targetScene = project.scenes[idx];
              if (targetScene) {
                setCurrentTime(targetScene.start);
              }
            }}
            onSeek={(t) => {
              setCurrentTime(t);
              const sIdx = project.scenes.findIndex((s) => t >= s.start && t < s.end);
              if (sIdx !== -1) setActiveSceneIndex(sIdx);
            }}
          />

          {/* Scene Inspector for Selected Scene */}
          <SceneInspector
            scene={currentScene}
            sceneIndex={activeSceneIndex}
            onUpdateScene={handleUpdateScene}
            onRegenerateScene={handleRegenerateScene}
            isRegenerating={isRegeneratingScene}
          />
        </div>
      </div>
    </div>
  );
};
