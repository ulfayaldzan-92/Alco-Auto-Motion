import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputTab } from './components/InputTab';
import { AiAnalysisTab } from './components/AiAnalysisTab';
import { EditPlanTab } from './components/EditPlanTab';
import { ExportModal } from './components/ExportModal';
import { AiProcessingModal } from './components/AiProcessingModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ContentType, AlcoEditingProject, SampleVideoOption } from './types';
import { SAMPLE_VIDEOS } from './data/sampleVideos';
import { useAiWorkflow } from './hooks/useAiWorkflow';

export default function App() {
  const [activeTab, setActiveTab] = useState<'input' | 'analysis' | 'edit_preview'>('input');
  const [contentType, setContentType] = useState<ContentType>('education');
  const [rawScript, setRawScript] = useState<string>(SAMPLE_VIDEOS[0].rawTranscript);
  const [videoGoal, setVideoGoal] = useState<string>(SAMPLE_VIDEOS[0].goal);
  const [ctaText, setCtaText] = useState<string>(SAMPLE_VIDEOS[0].cta);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_VIDEOS[0].id);
  const [videoUrl, setVideoUrl] = useState<string>(SAMPLE_VIDEOS[0].videoUrl);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(SAMPLE_VIDEOS[0].duration);
  const [videoMeta, setVideoMeta] = useState<{ width: number; height: number; aspect: string } | null>({
    width: 720,
    height: 1280,
    aspect: '9:16 Vertical (Optimized)',
  });

  const [project, setProject] = useState<AlcoEditingProject | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // Helper to handle custom file upload with safe object URL lifecycle & session storage
  const handleUploadCustomFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Format file tidak didukung. Mohon upload video format MP4/MOV/WebM.');
      return;
    }

    // Revoke previous object URL if one was created to prevent memory leaks
    if (uploadedUrl && uploadedUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(uploadedUrl);
      } catch (_) {}
    }

    const newObjUrl = URL.createObjectURL(file);
    setUploadedFile(file);
    setUploadedUrl(newObjUrl);
    setVideoFile(file);
    setVideoUrl(newObjUrl);
    setSelectedSampleId('custom');

    try {
      sessionStorage.setItem('alco_custom_video_name', file.name);
      sessionStorage.setItem('alco_custom_video_size', String(file.size));
    } catch (_) {}

    // Extract metadata from file
    const tempVideo = document.createElement('video');
    tempVideo.src = newObjUrl;
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      const dur = Math.round(tempVideo.duration * 10) / 10 || 25;
      setVideoDuration(dur);
      const w = tempVideo.videoWidth || 720;
      const h = tempVideo.videoHeight || 1280;
      const aspect = w < h ? '9:16 Vertical (Optimized)' : w === h ? '1:1 Square' : '16:9 Landscape';
      setVideoMeta({ width: w, height: h, aspect });
    };
  };

  // Helper to restore previously uploaded custom video
  const handleRestoreUploadedFile = () => {
    if (uploadedFile && uploadedUrl) {
      setVideoFile(uploadedFile);
      setVideoUrl(uploadedUrl);
      setSelectedSampleId('custom');
    }
  };

  // Helper to clear uploaded file and return to default sample
  const handleClearCustomUpload = () => {
    if (uploadedUrl && uploadedUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(uploadedUrl);
      } catch (_) {}
    }
    setUploadedFile(null);
    setUploadedUrl(null);
    handleSelectSample(SAMPLE_VIDEOS[0]);
  };

  // Helper to select sample preset
  const handleSelectSample = (sample: SampleVideoOption) => {
    setSelectedSampleId(sample.id);
    setVideoUrl(sample.videoUrl);
    setVideoFile(null);
    setVideoDuration(sample.duration);
    setContentType(sample.contentType);
    setRawScript(sample.rawTranscript);
    setVideoGoal(sample.goal);
    setCtaText(sample.cta);
    setVideoMeta({ width: 720, height: 1280, aspect: '9:16 Vertical (Optimized)' });
  };

  // Hook for AI Workflow & Real-Time Loading Management
  const {
    processingState,
    runAnalysis,
    retryLast,
    dismissError,
  } = useAiWorkflow({
    rawScript,
    videoDuration,
    contentType,
    videoGoal,
    ctaText,
    videoUrl,
    videoFile,
    onScriptExtracted: setRawScript,
    onSuccess: (newProject) => {
      setProject(newProject);
      setActiveTab('edit_preview');
    },
  });

  // Auto-build initial editing plan for the default sample so users can immediately test preview in 1 click!
  useEffect(() => {
    runAnalysis(SAMPLE_VIDEOS[0]);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasPlan={!!project}
        isProcessing={processingState.isProcessing}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Real-time Multi-Step AI Processing Modal */}
      {processingState.isProcessing && (
        <AiProcessingModal
          state={processingState}
          onRetry={retryLast}
          onClose={dismissError}
        />
      )}

      {/* Gemini BYO API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'input' && (
          <InputTab
            contentType={contentType}
            setContentType={setContentType}
            rawScript={rawScript}
            setRawScript={setRawScript}
            videoGoal={videoGoal}
            setVideoGoal={setVideoGoal}
            ctaText={ctaText}
            setCtaText={setCtaText}
            videoUrl={videoUrl}
            videoFile={videoFile}
            uploadedFile={uploadedFile}
            uploadedUrl={uploadedUrl}
            selectedSampleId={selectedSampleId}
            onSelectSample={handleSelectSample}
            onUploadCustomFile={handleUploadCustomFile}
            onRestoreUploadedFile={handleRestoreUploadedFile}
            videoDuration={videoDuration}
            setVideoDuration={setVideoDuration}
            videoMeta={videoMeta}
            setVideoMeta={setVideoMeta}
            onStartAnalysis={(sample) => runAnalysis(sample)}
            processingState={processingState}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          />
        )}

        {activeTab === 'analysis' && (
          <AiAnalysisTab
            project={project}
            onProceedToPreview={() => setActiveTab('edit_preview')}
          />
        )}

        {activeTab === 'edit_preview' && project && (
          <EditPlanTab
            project={project}
            videoUrl={project.raw_video_url || videoUrl}
            onUpdateProject={setProject}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onRegenerateAll={() => runAnalysis()}
            isProcessing={processingState.isProcessing}
          />
        )}
      </main>

      {/* Export Modal */}
      {project && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          project={project}
          videoUrl={project.raw_video_url || videoUrl}
        />
      )}
    </div>
  );
}

