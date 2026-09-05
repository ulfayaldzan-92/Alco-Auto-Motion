import React, { useState } from 'react';
import { AlcoEditingProject, SceneEditPlan } from '../types';
import { PreviewPlayer } from './PreviewPlayer';
import { TimelineView } from './TimelineView';
import { SceneInspector } from './SceneInspector';
import {
  Download,
  Sparkles,
  RefreshCw,
  Layers,
  Zap,
  Type,
  Move,
  Film,
  ShieldCheck,
  Target,
  UserCheck,
  Sun,
  AlertTriangle,
} from 'lucide-react';
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
        try {
          text = await res.text();
        } catch {}
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
  const activeAlerts = liveAudit.recommendations.filter(
    (r) => r.severity === 'high' || r.severity === 'medium'
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      {/* Top Action Bar */}
      <div className="alco-card p-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
              EDITING WORKSPACE
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${activeStyleProfile.badgeColor}`}>
              Style: {activeStyleProfile.name}
            </span>
            {project.talking_head_summary?.dominant && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Eyeline Locked
              </span>
            )}
            <span className="font-mono text-xs text-muted-foreground">
              {project.scenes.length} Scenes ({project.total_duration}s)
            </span>
          </div>
          <h2 className="mt-1 text-sm font-bold text-foreground truncate max-w-xl">
            {project.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onRegenerateAll}
            className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Re-analyze</span>
          </button>

          <button
            id="btn-open-export"
            type="button"
            onClick={onOpenExportModal}
            className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Project</span>
          </button>
        </div>
      </div>

      {/* Optional Marketing Quality Warning */}
      {activeAlerts.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Marketing Performance Note ({activeAlerts.length} Warnings)</span>
            </div>
            <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
              Score: {liveAudit.overallScore}/100 ({liveAudit.grade})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            {activeAlerts.slice(0, 2).map((a) => (
              <div key={a.id} className="rounded bg-card/60 p-2 border border-border">
                <span className="font-semibold text-foreground">{a.title}:</span> {a.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Editing Layout: Left: Preview Player, Right: Scene Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Video Preview Monitor (5 Cols) */}
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

        {/* Right Column: Property Inspector (7 Cols) */}
        <div className="lg:col-span-7">
          <SceneInspector
            scene={currentScene}
            sceneIndex={activeSceneIndex}
            onUpdateScene={handleUpdateScene}
            onRegenerateScene={handleRegenerateScene}
            isRegenerating={isRegeneratingScene}
          />
        </div>
      </div>

      {/* Full-Width Sequence Timeline across bottom */}
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
    </div>
  );
};
