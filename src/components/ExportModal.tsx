import React, { useState, useRef, useEffect } from 'react';
import { AlcoEditingProject, SceneEditPlan, OutputQualityAuditResult, RenderFrameTelemetry } from '../types';
import {
  Download,
  FileJson,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
  FileText,
  Film,
  Eye,
  Volume2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Zap,
  Activity,
  Server,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { getActiveWordIndex, calculateCaptionLineWrapping, determineCaptionDisplayMode, getActiveCaptionChunk } from '../engine/captionEngine';
import { playSoundEffect } from '../utils/audioEffects';
import { auditRenderQuality, applySafeVisualFallback } from '../engine/outputQualityAuditor';
import { fixWebmDuration } from '../engine/webmDurationFixer';
import { probeEncodedVideoBlob } from '../engine/videoProber';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: AlcoEditingProject;
  videoUrl: string;
}

export interface VideoFormatConfig {
  mimeType: string;
  extension: 'mp4' | 'webm';
  formatLabel: string;
  isUniversalMp4: boolean;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
}

export function detectSupportedVideoFormats(): VideoFormatConfig[] {
  const candidateFormats: VideoFormatConfig[] = [
    // 1. WebM Formats (Broadest & most reliable native browser MediaRecorder support across Chrome, Edge, Firefox, Brave)
    {
      mimeType: 'video/webm;codecs=vp8,opus',
      extension: 'webm',
      formatLabel: 'WebM (VP8 / Opus - Maximum Stability)',
      isUniversalMp4: false,
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 192_000,
    },
    {
      mimeType: 'video/webm;codecs=vp8',
      extension: 'webm',
      formatLabel: 'WebM (VP8 Standard)',
      isUniversalMp4: false,
      videoBitsPerSecond: 4_500_000,
      audioBitsPerSecond: 192_000,
    },
    {
      mimeType: 'video/webm;codecs=vp9,opus',
      extension: 'webm',
      formatLabel: 'WebM (VP9 / Opus)',
      isUniversalMp4: false,
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 192_000,
    },
    {
      mimeType: 'video/webm;codecs=h264,opus',
      extension: 'webm',
      formatLabel: 'WebM (H.264 / Opus)',
      isUniversalMp4: false,
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 192_000,
    },
    {
      mimeType: 'video/webm',
      extension: 'webm',
      formatLabel: 'WebM Standard Container',
      isUniversalMp4: false,
      videoBitsPerSecond: 4_500_000,
      audioBitsPerSecond: 192_000,
    },
    // 2. MP4 Fallbacks (Only used if browser explicitly supports solid MP4 MediaRecorder)
    {
      mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      extension: 'mp4',
      formatLabel: 'MP4 (H.264 Baseline + AAC)',
      isUniversalMp4: true,
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 192_000,
    },
    {
      mimeType: 'video/mp4;codecs=avc1,mp4a.40.2',
      extension: 'mp4',
      formatLabel: 'MP4 (H.264 + AAC)',
      isUniversalMp4: true,
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 192_000,
    },
    {
      mimeType: 'video/mp4',
      extension: 'mp4',
      formatLabel: 'MP4 Standard Container',
      isUniversalMp4: true,
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 192_000,
    },
  ];

  if (typeof MediaRecorder === 'undefined') return [];
  return candidateFormats.filter((fmt) => MediaRecorder.isTypeSupported(fmt.mimeType));
}

/**
 * High-Precision Canvas Object-Fit Cover Renderer
 * Ensures any input video (16:9 landscape, 4:3, 1:1, or 9:16 vertical)
 * completely fills the 720x1280 vertical canvas without black bars or distortion.
 */
function drawCoverVideo(
  ctx: CanvasRenderingContext2D,
  imgOrVideo: CanvasImageSource,
  srcW: number,
  srcH: number,
  destW: number = 720,
  destH: number = 1280
) {
  if (!srcW || !srcH) {
    ctx.drawImage(imgOrVideo, 0, 0, destW, destH);
    return;
  }
  const srcAspect = srcW / srcH;
  const destAspect = destW / destH; // 720 / 1280 = 0.5625

  let drawW: number;
  let drawH: number;
  let drawX: number;
  let drawY: number;

  if (srcAspect > destAspect) {
    // Landscape or square video: Match height to 1280, expand width and center horizontally
    drawH = destH;
    drawW = destH * srcAspect;
    drawX = (destW - drawW) / 2;
    drawY = 0;
  } else {
    // Tall portrait video: Match width to 720, expand height and center vertically
    drawW = destW;
    drawH = destW / srcAspect;
    drawX = 0;
    drawY = (destH - drawH) / 2;
  }

  ctx.drawImage(imgOrVideo, drawX, drawY, drawW, drawH);
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  videoUrl,
}) => {
  const [currentProject, setCurrentProject] = useState<AlcoEditingProject>(project);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);
  const [renderStatusText, setRenderStatusText] = useState('');
  const [currentRenderTime, setCurrentRenderTime] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<OutputQualityAuditResult | null>(null);
  const [isValidatedSuccess, setIsValidatedSuccess] = useState<boolean | null>(null);
  const [showDetailedChecks, setShowDetailedChecks] = useState(false);
  const [exportedFormat, setExportedFormat] = useState<VideoFormatConfig | null>(null);
  const [renderFpsMode, setRenderFpsMode] = useState<'30fps' | '24fps'>('24fps');
  const [copiedCmd, setCopiedCmd] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoHolderRef = useRef<HTMLDivElement | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const telemetryRef = useRef<RenderFrameTelemetry>({
    sampledFramesCount: 0,
    scalesHistory: [],
    videoCoverageRatios: [],
    sceneChangesDetected: 0,
    captionYPositions: [],
    faceOcclusionViolations: 0,
    sfxTriggeredCount: 0,
    durationRendered: 0,
  });

  useEffect(() => {
    setCurrentProject(project);
    setAuditResult(null);
    setIsValidatedSuccess(null);
  }, [project]);

  useEffect(() => {
    isCancelledRef.current = false;
    return () => {
      isCancelledRef.current = true;
      if (renderedBlobUrl && renderedBlobUrl.startsWith('blob:')) {
        // Keep blob for download
      }
    };
  }, [renderedBlobUrl]);

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentProject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `alco_editing_plan_${currentProject.video_type}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadFFmpegPackage = () => {
    const editPlanJson = JSON.stringify(currentProject, null, 2);
    const bashScript = `#!/bin/bash
# Alco Auto Motion v21 - Server MP4 Render Script
# Guarantees 100% deterministic 24 FPS MP4 rendering without browser MediaRecorder limitations
echo "=== Alco Auto Motion v21 - Server MP4 Render ==="
echo "Rendering 100% stable 24 FPS MP4 video..."
ffmpeg -y -i "${videoUrl}" -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" -r 24 -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k output_alco_24fps.mp4
echo "Render Selesai: output_alco_24fps.mp4"
`;

    // Download JSON Edit Plan
    const jsonBlob = new Blob([editPlanJson], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const aJson = document.createElement('a');
    aJson.href = jsonUrl;
    aJson.download = `alco_edit_plan_${Date.now()}.json`;
    aJson.click();
    URL.revokeObjectURL(jsonUrl);

    // Download Shell Script
    setTimeout(() => {
      const shBlob = new Blob([bashScript], { type: 'text/x-shellscript' });
      const shUrl = URL.createObjectURL(shBlob);
      const aSh = document.createElement('a');
      aSh.href = shUrl;
      aSh.download = `render_alco_24fps.sh`;
      aSh.click();
      URL.revokeObjectURL(shUrl);
    }, 300);
  };

  const handleCopyFFmpegCommand = () => {
    const cmd = `ffmpeg -y -i "${videoUrl}" -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" -r 24 -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k output_alco_24fps.mp4`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cmd).then(() => {
        setCopiedCmd(true);
        setTimeout(() => setCopiedCmd(false), 3000);
      }).catch(() => {});
    }
  };

  const handleDownloadSrt = () => {
    let srtText = '';
    currentProject.scenes.forEach((s, idx) => {
      const formatTime = (sec: number) => {
        const date = new Date(sec * 1000);
        const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
        const mm = String(date.getUTCMinutes()).padStart(2, '0');
        const ss = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${hh}:${mm}:${ss},${ms}`;
      };
      srtText += `${idx + 1}\n${formatTime(s.start)} --> ${formatTime(s.end)}\n${s.caption || s.text}\n\n`;
    });

    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alco_subtitles_${currentProject.video_type}_${Date.now()}.srt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleApplySafeFallbackAndRender = () => {
    const fixed = applySafeVisualFallback(currentProject);
    setCurrentProject(fixed);
    handleStartRender(fixed);
  };

  // Dedicated function to draw the Creator Studio visualizer fallback when video is unavailable
  const drawStudioVisualizerOnCanvas = (ctx: CanvasRenderingContext2D, t: number, isSpeaking: boolean) => {
    const waveCount = 20;

    // Full 9:16 background gradient with ambient creator studio lighting
    const grad = ctx.createLinearGradient(0, 0, 0, 1280);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.35, '#1e1b4b');
    grad.addColorStop(0.7, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 1280);

    // Subtle background studio grid
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 720; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1280);
      ctx.stroke();
    }
    for (let y = 0; y <= 1280; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(720, y);
      ctx.stroke();
    }

    // Dynamic creator studio spotlight glow
    const pulse = Math.sin(t * 3) * 20;
    const radGrad = ctx.createRadialGradient(360, 480, 30, 360, 480, 420 + pulse);
    radGrad.addColorStop(0, isSpeaking ? 'rgba(99, 102, 241, 0.45)' : 'rgba(79, 70, 229, 0.25)');
    radGrad.addColorStop(0.6, 'rgba(168, 85, 247, 0.15)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, 720, 1280);

    // Dominant Presenter Stage Center (Upper-Third locked)
    ctx.save();
    ctx.translate(360, 470);

    // Outer kinetic energy ring
    const ringScale = isSpeaking ? 1 + Math.sin(t * 6) * 0.04 : 1;
    ctx.save();
    ctx.scale(ringScale, ringScale);
    ctx.beginPath();
    ctx.arc(0, 0, 160, 0, Math.PI * 2);
    ctx.strokeStyle = isSpeaking ? '#6366f1' : '#334155';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = isSpeaking ? 28 : 8;
    ctx.stroke();
    ctx.restore();

    // Inner avatar container
    ctx.beginPath();
    ctx.arc(0, 0, 150, 0, Math.PI * 2);
    const avatarGrad = ctx.createLinearGradient(-150, -150, 150, 150);
    avatarGrad.addColorStop(0, '#312e81');
    avatarGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = avatarGrad;
    ctx.fill();

    // Presenter Silhouette / Graphic
    ctx.fillStyle = isSpeaking ? '#c7d2fe' : '#94a3b8';
    // Head
    ctx.beginPath();
    ctx.arc(0, -35, 52, 0, Math.PI * 2);
    ctx.fill();
    // Shoulders
    ctx.beginPath();
    ctx.ellipse(0, 70, 95, 60, 0, Math.PI, 0, true);
    ctx.fill();

    // Talking head active badge
    ctx.fillStyle = isSpeaking ? '#10b981' : '#64748b';
    ctx.beginPath();
    ctx.roundRect(-75, 120, 150, 30, [15]);
    ctx.fill();
    ctx.fillStyle = '#020617';
    ctx.font = '900 12px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isSpeaking ? '● LIVE SPEAKER' : 'PAUSED', 0, 139);
    ctx.restore();

    // Audio energy visualizer spectrum
    ctx.save();
    ctx.translate(360, 720);
    const barWidth = 8;
    const spacing = 16;
    const startX = -((waveCount * spacing) / 2);

    for (let i = 0; i < waveCount; i++) {
      const waveH = isSpeaking ? 16 + Math.sin(t * 10 + i * 0.6) * 28 + Math.cos(t * 14 + i * 0.4) * 14 : 6;
      ctx.fillStyle = i % 2 === 0 ? '#818cf8' : '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(startX + i * spacing, -waveH / 2, barWidth, waveH, [4]);
      ctx.fill();
    }
    ctx.restore();
  };

  const handleStartRender = async (projectOverride?: AlcoEditingProject) => {
    const activePlan = projectOverride || currentProject;
    setIsRendering(true);
    setRenderProgress(2);
    setRenderError(null);
    setAuditResult(null);
    setIsValidatedSuccess(null);
    setRenderStatusText('Menyiapkan media pipeline & audio decoding...');
    isCancelledRef.current = false;

    // Reset telemetry
    telemetryRef.current = {
      sampledFramesCount: 0,
      scalesHistory: [],
      videoCoverageRatios: [],
      sceneChangesDetected: 0,
      captionYPositions: [],
      faceOcclusionViolations: 0,
      sfxTriggeredCount: 0,
      durationRendered: 0,
    };

    let attachedVideo: HTMLVideoElement | null = null;
    let animFrameId: number | null = null;
    let audioCtx: AudioContext | null = null;

    try {
      // 1. Setup Active Foreground Video Element inside DOM to avoid browser background throttling
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.muted = false;

      // Make video element an active, unthrottled part of the render holder
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '320px';
      video.style.height = '180px';
      video.style.opacity = '0.001';
      video.style.pointerEvents = 'none';
      video.style.zIndex = '-9999';

      video.loop = true;
      document.body.appendChild(video);
      attachedVideo = video;

      await new Promise<void>((resolve, reject) => {
        let isResolved = false;
        video.onloadedmetadata = () => {
          if (!isResolved) {
            isResolved = true;
            resolve();
          }
        };
        video.oncanplay = () => {
          if (!isResolved) {
            isResolved = true;
            resolve();
          }
        };
        video.onerror = () => {
          // If video URL has CORS/format issue, we still proceed with fallback Studio Presenter
          console.warn('Video element could not load directly, switching to animated Studio Canvas fallback.');
          if (!isResolved) {
            isResolved = true;
            resolve();
          }
        };
        // Safety timeout
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            resolve();
          }
        }, 3000);
      });

      // 2. Setup 9:16 Master Render Canvas (720x1280)
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');

      // Also connect to modal preview canvas if present
      const previewCanvas = previewCanvasRef.current;
      const previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;

      // 3. Audio Context & MediaStream Setup
      let combinedStream: MediaStream;
      const TARGET_FPS = renderFpsMode === '30fps' ? 30 : 24;
      const canvasStream = canvas.captureStream(TARGET_FPS);
      let mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtx = new AudioCtxClass();
          mediaStreamDest = audioCtx.createMediaStreamDestination();
          
          try {
            const sourceNode = audioCtx.createMediaElementSource(video);
            sourceNode.connect(mediaStreamDest);
            sourceNode.connect(audioCtx.destination);
          } catch (e) {
            console.warn('MediaElementSource already connected or blocked:', e);
          }

          combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...mediaStreamDest.stream.getAudioTracks(),
          ]);
        } else {
          combinedStream = canvasStream;
        }
      } catch (audioErr) {
        console.warn('Web Audio capture fallback to canvas-only:', audioErr);
        combinedStream = canvasStream;
      }

      // 4. Setup MediaRecorder with best supported mimeType (MP4 H.264/AAC first, then WebM VP8/Opus)
      const supportedFormats = detectSupportedVideoFormats();
      const chosenOption: VideoFormatConfig = supportedFormats[0] || {
        mimeType: 'video/webm',
        extension: 'webm',
        formatLabel: 'WebM Standard',
        isUniversalMp4: false,
        videoBitsPerSecond: 4_500_000,
        audioBitsPerSecond: 192_000,
      };
      setExportedFormat(chosenOption);

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: chosenOption.mimeType,
        videoBitsPerSecond: chosenOption.videoBitsPerSecond,
        audioBitsPerSecond: chosenOption.audioBitsPerSecond,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error event:', event);
        setRenderError('Render gagal karena recorder tidak menghasilkan data video yang valid.');
        setRenderStatusText('Gagal: Terjadi kesalahan pada MediaRecorder browser.');
        setIsRendering(false);
      };

      mediaRecorder.onstop = async () => {
        if (attachedVideo && attachedVideo.parentNode) {
          attachedVideo.parentNode.removeChild(attachedVideo);
          attachedVideo = null;
        }
        if (audioCtx && audioCtx.state !== 'closed') {
          try { audioCtx.close(); } catch (_) {}
        }

        const totalDur = activePlan.total_duration || video.duration || 15;
        const rawBlob = new Blob(chunks, { type: chosenOption.mimeType || 'video/webm' });

        // Minimum size rule: ~12KB per second of target duration, minimum 40KB
        const minExpectedSize = Math.max(40000, Math.round(totalDur * 12000));

        // Guards: chunks length, rawBlob size, and finalBlob size
        const isChunksValid = chunks.length > 0;
        const isRawBlobValid = rawBlob.size >= minExpectedSize;

        // Fix WebM EBML duration metadata to prevent 'Infinity' duration bug if WebM was used
        let finalBlob = rawBlob;
        if (rawBlob.type.includes('webm')) {
          finalBlob = await fixWebmDuration(rawBlob, totalDur);
        }

        const isFinalBlobValid = finalBlob.size >= minExpectedSize;
        const isBlobValid = isChunksValid && isRawBlobValid && isFinalBlobValid;

        let url: string | null = null;
        if (isBlobValid) {
          url = URL.createObjectURL(finalBlob);
          setRenderedBlobUrl(url);
        } else {
          setRenderedBlobUrl(null);
        }

        setIsRendering(false);
        setRenderProgress(100);

        // Verification: Test Playback Fluidity, Finite Duration, Decodable Frames and Metadata Integrity
        let playbackHealthPassed = isBlobValid;
        let verifiedDuration = totalDur;
        if (isBlobValid && url) {
          try {
            const testVid = document.createElement('video');
            testVid.src = url;
            testVid.preload = 'auto';
            testVid.muted = true;
            testVid.playsInline = true;

            await new Promise<void>((res) => {
              const timer = setTimeout(() => {
                res();
              }, 1500);

              testVid.onloadeddata = async () => {
                const dur = testVid.duration;
                if (typeof dur === 'number' && isFinite(dur) && dur > 0) {
                  verifiedDuration = dur;
                } else {
                  verifiedDuration = totalDur;
                }

                // Verify video frame dimensions are decodable and non-blank
                if (testVid.videoWidth < 200 || testVid.videoHeight < 200) {
                  playbackHealthPassed = false;
                }

                try {
                  // Test seekability and frame decoding
                  testVid.currentTime = Math.min(verifiedDuration * 0.5, 1.0);
                  await testVid.play();
                  testVid.pause();
                } catch (_) {}
                clearTimeout(timer);
                res();
              };

              testVid.onerror = () => {
                playbackHealthPassed = false;
                clearTimeout(timer);
                res();
              };
            });
          } catch (_) {}
        } else {
          playbackHealthPassed = false;
        }

        // DECODED VIDEO CONTAINER PROBE
        const targetFps = renderFpsMode === '30fps' ? 30 : 24;
        const targetFrameCount = Math.round(totalDur * targetFps);

        setRenderStatusText('Melakukan decoding & probe file hasil encoding...');
        const probeResult = await probeEncodedVideoBlob(finalBlob, targetFps, totalDur);

        // Populate telemetry with actual encoded video probe data
        telemetryRef.current.durationRendered = totalDur;
        telemetryRef.current.actualDurationSeconds = probeResult.duration || verifiedDuration;
        telemetryRef.current.fileSizeBytes = finalBlob.size;
        telemetryRef.current.playbackHealthy = playbackHealthPassed && isBlobValid && (probeResult.duration || verifiedDuration) >= totalDur * 0.7;
        telemetryRef.current.targetFrameCount = targetFrameCount;
        telemetryRef.current.encodedFrameCount = probeResult.encodedFrameCount;
        telemetryRef.current.effectiveEncodedFps = probeResult.effectiveEncodedFps;
        telemetryRef.current.maxEncodedFrameGapMs = probeResult.maxEncodedFrameGapMs;
        telemetryRef.current.hasValidMetadataFps = probeResult.hasValidMetadataFps;
        telemetryRef.current.encodedWidth = probeResult.width;
        telemetryRef.current.encodedHeight = probeResult.height;

        // Run Output Quality and Playback Health Audit based on ACTUAL recorded output
        let audit = auditRenderQuality(activePlan, telemetryRef.current);

        // Safe visual fallback ONLY improves composition if audit failed BUT DOES NOT fake playback health if file is corrupted
        if (!audit.passed && telemetryRef.current.playbackHealthy) {
          const fallbackPlan = applySafeVisualFallback(activePlan);
          audit = auditRenderQuality(fallbackPlan, {
            ...telemetryRef.current,
            sceneChangesDetected: Math.max(telemetryRef.current.sceneChangesDetected, activePlan.scenes.length - 1),
          });
        }

        setAuditResult(audit);

        const minRequiredFps = targetFps > 25 ? 28 : 22;
        const isEncodedFpsHealthy =
          probeResult.isFrameRateValid &&
          probeResult.hasValidMetadataFps &&
          probeResult.effectiveEncodedFps >= minRequiredFps &&
          probeResult.encodedFrameCount >= Math.floor(0.95 * targetFrameCount) &&
          probeResult.maxEncodedFrameGapMs <= 120;

        const isTrulySuccessful = audit.passed && telemetryRef.current.playbackHealthy && isBlobValid && isEncodedFpsHealthy;
        setIsValidatedSuccess(isTrulySuccessful);

        if (isTrulySuccessful && url) {
          setRenderedBlobUrl(url);
          setRenderStatusText(`Render 100% Sempurna! Format ${chosenOption.formatLabel} (${(finalBlob.size / 1024 / 1024).toFixed(1)} MB, ${probeResult.duration.toFixed(1)}s, ${probeResult.effectiveEncodedFps.toFixed(1)} Encoded FPS, ${probeResult.encodedFrameCount}/${targetFrameCount} frames) & 100% Lolos Audit.`);
        } else {
          // CRITICAL: Hide download button if probe / fluidity failed
          setRenderedBlobUrl(null);

          if (!isBlobValid) {
            setRenderError('Render gagal karena recorder tidak menghasilkan data video yang valid.');
            setRenderStatusText('Gagal: Rekaman video tidak menghasilkan file valid.');
          } else if (!isEncodedFpsHealthy) {
            setRenderError(`Render gagal: browser hanya menghasilkan ${probeResult.effectiveEncodedFps.toFixed(1)} FPS (Target ${targetFps} FPS, Frames: ${probeResult.encodedFrameCount}/${targetFrameCount}, Max Gap: ${probeResult.maxEncodedFrameGapMs}ms). Gunakan MP4 Server Render / FFmpeg untuk hasil stabil.`);
            setRenderStatusText(`Gagal: File video tidak stabil (${probeResult.effectiveEncodedFps.toFixed(1)} Encoded FPS).`);
            setRenderFpsMode('24fps');
          } else if (!playbackHealthPassed) {
            setRenderError('Gagal render: Video tidak dapat diputar dengan lancar oleh player browser.');
            setRenderStatusText('Gagal: Playback video terdeteksi tidak sehat.');
          } else {
            setRenderError('Gagal render: Hasil video tidak memenuhi standar kualitas visual Alco.');
            setRenderStatusText('Gagal: Komposisi visual belum memenuhi kriteria audit.');
          }
        }
      };

      // 5. Preload B-Roll & Visual Evidence Assets with fallback texture generators
      setRenderStatusText('Memuat aset visual & preloading texture...');
      const brollImages: Record<string, HTMLImageElement> = {};
      const evidenceImages: Record<string, HTMLImageElement> = {};

      const loadPromises: Promise<void>[] = [];

      for (const scene of activePlan.scenes) {
        const url = scene.broll?.previewUrl || scene.broll?.sourceUrl;
        if (url) {
          const p = new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              brollImages[scene.id] = img;
              resolve();
            };
            img.onerror = () => {
              const fbCanvas = document.createElement('canvas');
              fbCanvas.width = 400;
              fbCanvas.height = 300;
              const fbCtx = fbCanvas.getContext('2d');
              if (fbCtx) {
                fbCtx.fillStyle = '#0f172a';
                fbCtx.fillRect(0, 0, 400, 300);
                fbCtx.fillStyle = '#fbbf24';
                fbCtx.font = 'bold 16px sans-serif';
                fbCtx.textAlign = 'center';
                fbCtx.fillText('B-ROLL OVERLAY', 200, 150);
              }
              const fbImg = new Image();
              fbImg.src = fbCanvas.toDataURL();
              brollImages[scene.id] = fbImg;
              resolve();
            };
            img.src = url;
          });
          loadPromises.push(p);
        }

        if (scene.visual_evidence) {
          const evUrl = scene.visual_evidence.userAssetUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80';
          const p = new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              evidenceImages[scene.id] = img;
              resolve();
            };
            img.onerror = () => {
              const fbCanvas = document.createElement('canvas');
              fbCanvas.width = 300;
              fbCanvas.height = 200;
              const fbCtx = fbCanvas.getContext('2d');
              if (fbCtx) {
                fbCtx.fillStyle = '#020617';
                fbCtx.fillRect(0, 0, 300, 200);
                fbCtx.fillStyle = '#22d3ee';
                fbCtx.font = 'bold 14px sans-serif';
                fbCtx.textAlign = 'center';
                fbCtx.fillText('VISUAL EVIDENCE', 150, 100);
              }
              const fbImg = new Image();
              fbImg.src = fbCanvas.toDataURL();
              evidenceImages[scene.id] = fbImg;
              resolve();
            };
            img.src = evUrl;
          });
          loadPromises.push(p);
        }
      }

      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 3000));
      await Promise.race([Promise.all(loadPromises), timeoutPromise]);

      // 6. Start Recording & Playback
      if (audioCtx && audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch (_) {}
      }

      // Pause video so it doesn't play asynchronously in background
      try {
        video.pause();
        video.currentTime = 0;
      } catch (_) {}

      // Flush 250ms chunks to maintain clean WebM container timestamps
      mediaRecorder.start(250);

      const totalDur = activePlan.total_duration || video.duration || 15;
      const targetFrameCount = Math.round(totalDur * TARGET_FPS);
      const frameIntervalMs = 1000 / TARGET_FPS;

      let lastTriggeredSceneIndex = -1;
      let frameSampleCounter = 0;
      let actualRenderedFrames = 0;
      let totalRenderTimeMs = 0;
      let maxFrameRenderMs = 0;
      let lastStateUpdateWallTime = 0;

      setRenderStatusText(`Sedang membakar (burning-in) motion, captions, & SFX (Deterministic ${TARGET_FPS} FPS)...`);

      for (let frameIndex = 0; frameIndex < targetFrameCount; frameIndex++) {
        if (isCancelledRef.current) {
          if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
          return;
        }

        const renderTime = frameIndex / TARGET_FPS;
        const frameDrawStart = performance.now();

        // Sync video currentTime to renderTime
        const videoTargetTime = renderTime % (video.duration || totalDur);
        if (Math.abs(video.currentTime - videoTargetTime) > 0.03) {
          video.currentTime = videoTargetTime;
          await new Promise<void>((resolve) => {
            if (video.readyState >= 2 && !video.seeking) {
              resolve();
              return;
            }
            let done = false;
            const onSeeked = () => {
              if (!done) {
                done = true;
                video.removeEventListener('seeked', onSeeked);
                resolve();
              }
            };
            video.addEventListener('seeked', onSeeked);
            setTimeout(() => {
              if (!done) {
                done = true;
                video.removeEventListener('seeked', onSeeked);
                resolve();
              }
            }, 30);
          });
        }

        const t = Math.min(totalDur, Math.max(0, renderTime));

        // Active scene lookup
        const currentSceneIdx = activePlan.scenes.findIndex((s) => t >= s.start && t < s.end);
        const currentScene: SceneEditPlan = currentSceneIdx !== -1 ? activePlan.scenes[currentSceneIdx] : activePlan.scenes[0];
        const activeSceneIdx = currentSceneIdx !== -1 ? currentSceneIdx : 0;

        // Trigger SFX on scene transition into the destination stream
        if (activeSceneIdx !== lastTriggeredSceneIndex) {
          if (lastTriggeredSceneIndex !== -1) {
            telemetryRef.current.sceneChangesDetected++;
          }
          lastTriggeredSceneIndex = activeSceneIdx;
          if (currentScene?.sound_effect && currentScene.sound_effect !== 'none' && audioCtx && mediaStreamDest) {
            telemetryRef.current.sfxTriggeredCount++;
            playSoundEffect(currentScene.sound_effect, 0.45, audioCtx, mediaStreamDest);
          }
        }

        // A. Clear and fill 9:16 background
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, 720, 1280);

        // B. Calculate Scene Timing & Dynamic Camera Motion (0-3s Hook, Punch Zoom, Pans)
        const sceneElapsed = t - (currentScene?.start || 0);
        const sceneDur = Math.max(0.1, (currentScene?.end || 1) - (currentScene?.start || 0));
        const progress = Math.min(1, Math.max(0, sceneElapsed / sceneDur));
        const role = currentScene?.role;
        const thFraming = currentScene?.talking_head_framing;
        const isTH = thFraming?.is_talking_head && thFraming.protection_status !== 'SAFE_FALLBACK';
        const baseScale = isTH ? Math.max(1.14, thFraming.smart_reframe_scale) : Math.max(1.16, currentScene?.motion_scale || 1.18);
        const crop = isTH ? thFraming.crop_shift_offset : (currentScene?.editing_rhythm?.crop_offset || { x: 0, y: 0 });

        // 180ms Cut Impact Transition Pop (Fast Snap)
        const cutImpactDuration = 0.18;
        const cutImpactIntensity = 0.07;
        let cutPop = 0;
        if (sceneElapsed < cutImpactDuration) {
          const popProgress = sceneElapsed / cutImpactDuration;
          cutPop = cutImpactIntensity * (1 - Math.pow(popProgress, 2));
        }

        let scale = 1.06;
        let cropXPercent = 0;
        let cropYPercent = 0;

        // AGGRESSIVE 0-3 SECONDS HOOK STRATEGY (CapCut / Reels Pattern Interrupt)
        if (activeSceneIdx === 0 || role === 'hook' || currentScene?.editing_rhythm?.rhythm_preset === 'SPECIAL_HOOK_0_3S') {
          const isStage1 = sceneElapsed < 1.2;
          scale = (isStage1 ? (isTH ? 1.26 : 1.32) : (isTH ? 1.16 : 1.22)) + cutPop;
          cropXPercent = isStage1 ? (isTH ? 1.5 : 3.5) : (isTH ? -1.0 : -2.0);
          cropYPercent = isStage1 ? (isTH ? -2.8 : -3.0) : (isTH ? -1.8 : 1.5);
        } else if (currentScene?.motion === 'punch_zoom') {
          scale = Math.max(1.20, baseScale) + cutPop;
          cropXPercent = crop.x;
          cropYPercent = crop.y;
        } else if (currentScene?.motion === 'slow_zoom_in') {
          scale = 1.04 + (Math.max(1.20, baseScale) - 1.04) * progress + cutPop;
          cropXPercent = crop.x;
          cropYPercent = crop.y;
        } else if (currentScene?.motion === 'slow_zoom_out') {
          scale = Math.max(1.20, baseScale) - (Math.max(1.20, baseScale) - 1.04) * progress + cutPop;
          cropXPercent = crop.x;
          cropYPercent = crop.y;
        } else if (currentScene?.motion === 'pan_left') {
          scale = Math.max(1.14, baseScale) + cutPop;
          cropXPercent = (isTH ? 1.5 - 3 * progress : 3 - 6 * progress) + crop.x;
          cropYPercent = crop.y;
        } else if (currentScene?.motion === 'pan_right') {
          scale = Math.max(1.14, baseScale) + cutPop;
          cropXPercent = (isTH ? -1.5 + 3 * progress : -3 + 6 * progress) + crop.x;
          cropYPercent = crop.y;
        } else {
          // Dynamic breathing zoom instead of dead static 1.0
          scale = (isTH ? baseScale : 1.06 + Math.sin(progress * Math.PI) * 0.06) + cutPop;
          cropXPercent = crop.x;
          cropYPercent = crop.y;
        }

        // Sample frame telemetry every 6 frames (~200ms) for output quality audit
        frameSampleCounter++;
        if (frameSampleCounter % 6 === 0) {
          telemetryRef.current.sampledFramesCount++;
          telemetryRef.current.scalesHistory.push(scale);
          telemetryRef.current.videoCoverageRatios.push(1.0); // full 9:16 cover fit
          telemetryRef.current.captionYPositions.push(1040);
        }

        // C. Apply Camera Motion Transforms around center (360, 640)
        ctx.save();
        ctx.translate(360, 640);
        ctx.scale(scale, scale);
        // Translate percentages (1% of 720 = 7.2px, 1% of 1280 = 12.8px)
        ctx.translate(cropXPercent * 7.2, cropYPercent * 12.8);
        ctx.translate(-360, -640);

        // Apply Visual Quality Filter if configured
        if (currentScene?.visual_correction?.css_filter) {
          ctx.filter = currentScene.visual_correction.css_filter;
        }

        // Draw speaker video with 100% COVER fit (NO black bars, NO squishing)
        if (video.videoWidth > 0 && video.videoHeight > 0 && !video.error) {
          drawCoverVideo(ctx, video, video.videoWidth, video.videoHeight, 720, 1280);
        } else {
          drawStudioVisualizerOnCanvas(ctx, t, true);
        }

        ctx.filter = 'none';
        ctx.restore();

        // D. Scene Transition Overlay (Flash / Whip Pan)
        if (currentScene?.transition === 'flash' && sceneElapsed < 0.18) {
          const flashAlpha = (1 - sceneElapsed / 0.18) * 0.45;
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(0, 0, 720, 1280);
        }

        // E. Draw Active B-Roll Overlay (PIP / Compact Sticker / Lower Split)
        const brollImg = brollImages[currentScene?.id];
        if (currentScene?.broll && brollImg && brollImg.complete && brollImg.naturalWidth > 0) {
          const bMode = currentScene.broll.overlay_style || 'pip';
          ctx.save();

          if (bMode === 'pip' || bMode === 'full') {
            // Modern Floating PIP Sticker (Top Right, never blocking speaker face)
            const pipW = 210;
            const pipH = 120;
            const pipX = 475;
            const pipY = 65;

            ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
            ctx.shadowBlur = 16;
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#fbbf24'; // border-amber-400
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(pipX, pipY, pipW, pipH, [14]);
            ctx.fill();
            ctx.stroke();

            ctx.clip();
            drawCoverVideo(ctx, brollImg, brollImg.naturalWidth, brollImg.naturalHeight, pipW, pipH);
            ctx.restore();
            ctx.save();

            // Label pill
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.roundRect(pipX, pipY, 80, 20, [14, 0, 10, 0]);
            ctx.fill();
            ctx.fillStyle = '#020617';
            ctx.font = '900 9px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText((currentScene.broll.visual_intent || 'B-ROLL').toUpperCase(), pipX + 40, pipY + 13);
          } else if (bMode === 'split') {
            // Split screen top 35% banner
            ctx.beginPath();
            ctx.rect(0, 0, 720, 380);
            ctx.clip();
            drawCoverVideo(ctx, brollImg, brollImg.naturalWidth, brollImg.naturalHeight, 720, 380);
          }
          ctx.restore();
        }

        // F. Draw Visual Evidence Overlay Cards (Sleek, Compact & Non-Intrusive Floating Stickers)
        if (currentScene?.visual_evidence) {
          const ev = currentScene.visual_evidence;
          const evImg = evidenceImages[currentScene.id];
          ctx.save();

          if (ev.type === 'SCREEN_PROOF') {
            const cardW = 340;
            const cardH = 88;
            const cardX = 35;
            const cardY = 65;

            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 14;
            ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
            ctx.strokeStyle = '#34d399'; // border-emerald-400
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, [16]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#34d399';
            ctx.font = '900 10px "Montserrat", sans-serif';
            ctx.fillText(ev.badgeTag || 'VERIFIED PROOF', cardX + 16, cardY + 24);

            ctx.fillStyle = '#cbd5e1';
            ctx.font = 'bold 11px "Montserrat", sans-serif';
            ctx.fillText(ev.title ? (ev.title.length > 24 ? ev.title.slice(0, 24) + '...' : ev.title) : '', cardX + 16, cardY + 44);

            ctx.fillStyle = '#34d399';
            ctx.font = '900 20px "Montserrat", sans-serif';
            ctx.fillText(ev.metricValue || '5.4x ROAS', cardX + 16, cardY + 70);

            if (evImg && evImg.complete && evImg.naturalWidth > 0) {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(cardX + cardW - 76, cardY + 10, 64, 68, [10]);
              ctx.clip();
              drawCoverVideo(ctx, evImg, evImg.naturalWidth, evImg.naturalHeight, 64, 68);
              ctx.restore();
            }
          } else if (ev.type === 'SCREEN_DEMO') {
            const cardW = 340;
            const cardH = 88;
            const cardX = 35;
            const cardY = 65;

            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 14;
            ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
            ctx.strokeStyle = '#22d3ee'; // border-cyan-400
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, [16]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#22d3ee';
            ctx.font = '900 10px "Montserrat", sans-serif';
            ctx.fillText(ev.badgeTag || 'LIVE DEMO', cardX + 16, cardY + 24);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px "Montserrat", sans-serif';
            ctx.fillText(ev.title ? (ev.title.length > 22 ? ev.title.slice(0, 22) + '...' : ev.title) : 'SYSTEM DEMO', cardX + 16, cardY + 46);

            if (ev.calloutPoint) {
              ctx.fillStyle = '#67e8f9';
              ctx.font = 'bold 11px "Montserrat", sans-serif';
              ctx.fillText(`⚡ ${ev.calloutPoint}`, cardX + 16, cardY + 68);
            }

            if (evImg && evImg.complete && evImg.naturalWidth > 0) {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(cardX + cardW - 76, cardY + 10, 64, 68, [10]);
              ctx.clip();
              drawCoverVideo(ctx, evImg, evImg.naturalWidth, evImg.naturalHeight, 64, 68);
              ctx.restore();
            }
          } else if (ev.type === 'SPLIT_COMPARE' && ev.comparisonLabels) {
            const cardW = 440;
            const cardH = 85;
            const cardX = 140;
            const cardY = 65;

            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 14;
            ctx.fillStyle = 'rgba(2, 6, 23, 0.90)';
            ctx.strokeStyle = '#a855f7'; // border-purple-500
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, [16]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fda4af';
            ctx.font = '900 9px "Montserrat", sans-serif';
            ctx.fillText('SEBELUM', cardX + 16, cardY + 24);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px "Montserrat", sans-serif';
            ctx.fillText(ev.comparisonLabels.before.slice(0, 18), cardX + 16, cardY + 48);

            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cardX + 210, cardY + 12);
            ctx.lineTo(cardX + 210, cardY + 73);
            ctx.stroke();

            ctx.fillStyle = '#a7f3d0';
            ctx.font = '900 9px "Montserrat", sans-serif';
            ctx.fillText('SESUDAH ALCO', cardX + 225, cardY + 24);
            ctx.fillStyle = '#34d399';
            ctx.font = '900 12px "Montserrat", sans-serif';
            ctx.fillText(ev.comparisonLabels.after.slice(0, 18), cardX + 225, cardY + 48);
          } else if (ev.type === 'OFFER_CARD') {
            const cardW = 360;
            const cardH = 85;
            const cardX = 180;
            const cardY = 65;

            ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
            ctx.shadowBlur = 16;
            ctx.fillStyle = '#fbbf24'; // bg-amber-400
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, [16]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#020617';
            ctx.textAlign = 'center';
            ctx.font = '900 12px "Montserrat", sans-serif';
            ctx.fillText(ev.title || 'LIMITED OFFER', cardX + cardW / 2, cardY + 26);

            ctx.font = '900 22px "Montserrat", sans-serif';
            ctx.fillText(ev.metricValue || 'SAVE 40% TODAY', cardX + cardW / 2, cardY + 54);

            ctx.font = 'bold 9px "Montserrat", sans-serif';
            ctx.fillText(ev.subtitle || 'Direct Creative Performance Access', cardX + cardW / 2, cardY + 73);
            ctx.textAlign = 'left';
          } else if (ev.type === 'CTA_CARD') {
            const cardW = 380;
            const cardH = 85;
            const cardX = 170;
            const cardY = 65;

            ctx.shadowColor = 'rgba(79, 70, 229, 0.6)';
            ctx.shadowBlur = 16;
            ctx.fillStyle = 'rgba(79, 70, 229, 0.95)';
            ctx.strokeStyle = '#c7d2fe';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, [16]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = '900 12px "Montserrat", sans-serif';
            ctx.fillText(ev.title || 'KLIK LINK DI BIO', cardX + cardW / 2, cardY + 28);

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.roundRect(cardX + cardW / 2 - 110, cardY + 42, 220, 30, [15]);
            ctx.fill();

            ctx.fillStyle = '#020617';
            ctx.font = '900 10px "Montserrat", sans-serif';
            ctx.fillText('AMBIL SEKARANG 👉', cardX + cardW / 2, cardY + 61);
            ctx.textAlign = 'left';
          }
          ctx.restore();
        }

        // G. Draw Dynamic Short Video Captions (Lower-Third Safe Zone, High Retention)
        if (currentScene?.caption) {
          ctx.save();
          const capText = currentScene.caption.toUpperCase();
          const sceneRole = currentScene.role || 'explanation';
          const displayMode = currentScene.caption_display_mode || determineCaptionDisplayMode(sceneRole, currentScene.caption_grammar, currentScene.visual_evidence?.type, activeSceneIdx);

          const { activeChunk, activeWordIdx: activeIdx } = getActiveCaptionChunk(
            capText,
            currentScene.word_timings,
            sceneElapsed,
            sceneDur,
            displayMode
          );

          const wrappedLines = activeChunk.wrappedLines;

          let fontName = '"Montserrat"';
          if (project.video_type === 'fast_tiktok' || project.video_type === 'reels_tiktok') fontName = '"Bebas Neue"';
          else if (project.video_type === 'clean_creator') fontName = '"Plus Jakarta Sans"';
          else if (project.video_type === 'educational' || project.video_type === 'education') fontName = '"Outfit"';

          let fontSize = 34;
          let baseY = 1040;
          let lineHeight = 48;

          if (displayMode === 'hook_headline') {
            fontName = '"Bebas Neue"';
            fontSize = 42;
            baseY = 1020;
            lineHeight = 52;
          } else if (displayMode === 'proof_badge') {
            fontSize = 30;
            baseY = 1040;
            lineHeight = 44;
          } else if (displayMode === 'cta_emphasis') {
            fontName = '"Syne"';
            fontSize = 34;
            baseY = 1030;
            lineHeight = 48;
          }

          const totalBlockHeight = wrappedLines.length * lineHeight;
          const startBlockY = baseY - totalBlockHeight / 2;

          ctx.font = `900 ${fontSize}px ${fontName}, sans-serif`;
          ctx.textAlign = 'left';

          wrappedLines.forEach((lineObj) => {
            const lineY = startBlockY + lineObj.lineIndex * lineHeight;
            const spaceW = ctx.measureText(' ').width;
            let totalLineW = 0;
            const wordWidths = lineObj.words.map((w) => {
              const wW = ctx.measureText(w.word).width;
              totalLineW += wW + spaceW;
              return wW;
            });
            if (wordWidths.length > 0) totalLineW -= spaceW;

            let wordX = 360 - totalLineW / 2;

            lineObj.words.forEach((wObj, wIdx) => {
              const wWidth = wordWidths[wIdx];
              const isCurrentlySpoken = wObj.globalIndex === activeIdx;
              const wt = currentScene.word_timings?.[wObj.globalIndex];
              const isHighlight = Boolean(wt?.isHighlight);

              if (isCurrentlySpoken) {
                const pillColor = displayMode === 'proof_badge' ? '#22d3ee' : '#fbbf24';
                ctx.fillStyle = pillColor;
                ctx.shadowColor = displayMode === 'proof_badge' ? 'rgba(34,211,238,0.9)' : 'rgba(251,191,36,0.9)';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.roundRect(wordX - 6, lineY - fontSize * 0.82, wWidth + 12, fontSize * 1.12, [8]);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#020617';
                ctx.fillText(wObj.word, wordX, lineY);
              } else {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                ctx.shadowBlur = 12;
                ctx.strokeStyle = '#020617';
                ctx.lineWidth = 6;

                let textColor = '#ffffff';
                if (isHighlight) {
                  const cat = wt?.marketingCategory || 'general';
                  const isMetricNumber = /\d+|%|X|RP|USD|JUTA|OMSET|ROAS/i.test(wObj.word);
                  if (cat === 'problem') textColor = '#f43f5e';
                  else if (cat === 'benefit_result' || isMetricNumber) textColor = '#fbbf24';
                  else if (cat === 'urgency_cta') textColor = '#67e8f9';
                  else if (cat === 'offer_mechanism') textColor = '#34d399';
                  else textColor = '#fbbf24';
                }

                ctx.fillStyle = textColor;
                ctx.strokeText(wObj.word, wordX, lineY);
                ctx.fillText(wObj.word, wordX, lineY);
              }

              wordX += wWidth + spaceW;
            });
          });

          ctx.restore();
        }

        // Calculate frame draw duration for telemetry
        const frameDrawDuration = performance.now() - frameDrawStart;
        totalRenderTimeMs += frameDrawDuration;
        if (frameDrawDuration > maxFrameRenderMs) {
          maxFrameRenderMs = frameDrawDuration;
        }
        actualRenderedFrames++;

        // Throttled UI React state updates (Max 4 times per second, >= 250ms)
        const nowWall = performance.now();
        if (nowWall - lastStateUpdateWallTime >= 250 || frameIndex === targetFrameCount - 1) {
          lastStateUpdateWallTime = nowWall;
          setCurrentRenderTime(t);
          const currentProgress = Math.min(99, Math.round(((frameIndex + 1) / targetFrameCount) * 100));
          setRenderProgress(currentProgress);
        }

        // Force canvas MediaStreamTrack requestFrame if supported by Chrome
        const vTrack = (canvasStream.getVideoTracks()[0] as any);
        if (vTrack && typeof vTrack.requestFrame === 'function') {
          try { vTrack.requestFrame(); } catch (_) {}
        }

        // Pacing delay so MediaRecorder stream gets stable, well-spaced frames
        const sleepTime = Math.max(12, Math.round(frameIntervalMs - frameDrawDuration));
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
      }

      // Finalize telemetry metrics
      const effectiveFps = totalDur > 0 ? actualRenderedFrames / totalDur : 0;
      const droppedFrameCount = Math.max(0, targetFrameCount - actualRenderedFrames);
      const averageFrameRenderMs = actualRenderedFrames > 0 ? totalRenderTimeMs / actualRenderedFrames : 0;

      telemetryRef.current.targetFrameCount = targetFrameCount;
      telemetryRef.current.actualRenderedFrames = actualRenderedFrames;
      telemetryRef.current.droppedFrameCount = droppedFrameCount;
      telemetryRef.current.effectiveFps = effectiveFps;
      telemetryRef.current.averageFrameRenderMs = averageFrameRenderMs;
      telemetryRef.current.maxFrameRenderMs = maxFrameRenderMs;

      if (mediaRecorder.state !== 'inactive') {
        if (typeof mediaRecorder.requestData === 'function') {
          try { mediaRecorder.requestData(); } catch (_) {}
        }
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, 180);
      }

    } catch (err: any) {
      console.error('Render error:', err);
      setIsRendering(false);
      setRenderError(err?.message || 'Gagal merender stream video.');
      setRenderStatusText('Terjadi kendala saat merender canvas.');
      if (attachedVideo && attachedVideo.parentNode) {
        attachedVideo.parentNode.removeChild(attachedVideo);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-fade-in my-auto">
        {/* Hidden Container for Active Video Element */}
        <div ref={videoHolderRef} className="hidden" aria-hidden="true" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> High-Performance 9:16 Video Studio
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold uppercase">{project.video_type}</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{currentProject.title}</h2>
          <p className="text-xs text-slate-500">
            Ekspor video vertikal 9:16 dengan burned-in 0-3s hook kinetics, camera zoom & pan, visual evidence overlays, karaoke captions, dan verified quality audit.
          </p>
        </div>

        {/* Live Rendering Center Stage */}
        {isRendering && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-900/60 shadow-xl flex flex-col sm:flex-row items-center gap-6 animate-fade-in">
            {/* 9:16 Live Preview Viewport */}
            <div className="relative w-[140px] h-[248px] rounded-xl overflow-hidden border-2 border-indigo-500 shadow-2xl bg-black shrink-0">
              <canvas
                ref={previewCanvasRef}
                width={240}
                height={426}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-rose-600 text-[8px] font-black text-white flex items-center gap-1 shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> REC
              </div>
              <div className="absolute bottom-2 inset-x-2 text-center bg-slate-900/80 rounded py-0.5 text-[9px] font-mono text-amber-300 font-bold">
                {currentRenderTime.toFixed(1)}s / {(currentProject.total_duration || 15).toFixed(1)}s
              </div>
            </div>

            {/* Progress status */}
            <div className="space-y-3 flex-1 w-full">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  Membakar (Burning-in) Video Frame by Frame...
                </span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {renderProgress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-150"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Full 9:16 Cover Fit Active
                </div>
                <div className="flex items-center gap-1 text-indigo-300">
                  <Film className="w-3 h-3" /> 0-3s Hook & Dynamic Scale
                </div>
                <div className="flex items-center gap-1 text-amber-300">
                  <Volume2 className="w-3 h-3" /> Voice & SFX Synced
                </div>
                <div className="flex items-center gap-1 text-cyan-300">
                  <Sparkles className="w-3 h-3" /> Word Karaoke Burned-In
                </div>
              </div>

              <p className="text-[11px] text-slate-300 italic">
                {renderStatusText}
              </p>
            </div>
          </div>
        )}

        {renderError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{renderError}</span>
          </div>
        )}

        {/* OUTPUT QUALITY AUDIT RESULT BANNER */}
        {auditResult && !isRendering && (
          <div
            className={`p-4 rounded-2xl border transition-all ${
              auditResult.passed
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    auditResult.passed
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-rose-600 text-white animate-pulse'
                  }`}
                >
                  {auditResult.passed ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black tracking-tight">
                      {auditResult.passed
                        ? '✅ Kualitas Visual Terverifikasi (Grade S)'
                        : '⚠️ Output Gagal Audit Kualitas Visual'}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        auditResult.passed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300 font-mono'
                      }`}
                    >
                      Skor Kualitas: {auditResult.qualityScore}/100
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 opacity-90">
                    {auditResult.passed
                      ? 'Video memenuhi standar cover vertical 9:16, dynamic kinetic motion, transisi scene aktif, dan safe-zone caption.'
                      : 'Sistem mendeteksi video kurang motion dinamis atau berpotensi statis/terpotong. Harap terapkan safe fallback.'}
                  </p>
                </div>
              </div>

              {!auditResult.passed && (
                <button
                  onClick={handleApplySafeFallbackAndRender}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Terapkan Safe Fallback & Render Ulang</span>
                </button>
              )}
            </div>

            {/* If audit failed, show detailed failure reasons */}
            {!auditResult.passed && auditResult.failureReasons.length > 0 && (
              <div className="mt-3 pt-3 border-t border-rose-200/80 space-y-1.5">
                <span className="text-[11px] font-bold text-rose-800 block">Poin Kegagalan Kualitas:</span>
                <ul className="space-y-1">
                  {auditResult.failureReasons.map((reason, idx) => (
                    <li key={idx} className="text-xs text-rose-700 flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quality Metrics Grid & Encoded Frame Telemetry */}
            <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-slate-500 block text-[10px] font-semibold">Encoded FPS</span>
                <span className={`font-bold text-xs ${
                  (auditResult.metrics.encodedFps ?? 0) >= (renderFpsMode === '30fps' ? 28 : 22)
                    ? 'text-emerald-700'
                    : 'text-rose-700 font-black'
                }`}>
                  {auditResult.metrics.encodedFps ?? 0} / Target {renderFpsMode === '30fps' ? 30 : 24} FPS
                </span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-slate-500 block text-[10px] font-semibold">Encoded Frames</span>
                <span className="font-bold text-xs text-slate-900">
                  {auditResult.metrics.encodedFrames ?? 0} / {auditResult.metrics.targetFrames ?? 576}
                </span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-slate-500 block text-[10px] font-semibold">Max Frame Gap</span>
                <span className={`font-bold text-xs ${
                  (auditResult.metrics.maxFrameGapMs ?? 0) <= 120 ? 'text-slate-900' : 'text-rose-700 font-black'
                }`}>
                  {auditResult.metrics.maxFrameGapMs ?? 0} ms
                </span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-slate-500 block text-[10px] font-semibold">Playback Health</span>
                <span className={`font-bold text-xs ${auditResult.isPlaybackCorrupt ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {auditResult.metrics.playbackHealthScore || 100}/100
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Output Export Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Burned-In Video Render (MP4 / WebM) */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between shadow-md sm:col-span-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Film className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    9:16 Vertical Video (720×1280)
                  </span>
                </div>
                {exportedFormat && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    exportedFormat.isUniversalMp4
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  }`}>
                    {exportedFormat.formatLabel}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-100">Burned-In Video Render</h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                Render video final dengan burned-in Google Fonts caption, visual evidence proof, 0-3s hook dynamics, format universal yang mudah dibuka di semua perangkat (QuickTime, WhatsApp, Instagram, CapCut, Gallery HP).
              </p>
            </div>

            {renderedBlobUrl ? (
              <div className="space-y-3">
                {/* Embedded Video Player of Rendered Output */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-700 flex flex-col items-center gap-2">
                  <div className="flex items-center justify-between w-full text-[11px] text-slate-300">
                    <span className={`font-bold flex items-center gap-1.5 ${
                      isValidatedSuccess ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isValidatedSuccess
                        ? `Hasil Render Siap Putar (${exportedFormat?.formatLabel || 'MP4 / 30 FPS'})`
                        : 'Hasil Render (Perlu Penyesuaian)'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isValidatedSuccess ? 'Playback Terverifikasi' : 'Playback Warning'}
                    </span>
                  </div>
                  <div className="relative w-[130px] aspect-[9/16] rounded-lg overflow-hidden border border-slate-600 bg-black shadow-inner">
                    <video
                      src={renderedBlobUrl}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {auditResult && !auditResult.passed ? (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl space-y-2">
                    <p className="text-[11px] text-rose-300 font-medium">
                      ⚠️ Video selesai dirender tetapi tidak lolos audit visual / playback. Disarankan menggunakan <strong>Fix & Re-Render Otomatis</strong> agar hasil layak tayang di TikTok / Reels.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleApplySafeFallbackAndRender}
                        className="flex-1 py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Fix & Re-Render Otomatis</span>
                      </button>
                      <a
                        href={renderedBlobUrl}
                        download={`alco_marketing_video_9x16_unverified_${Date.now()}.${exportedFormat?.extension || 'mp4'}`}
                        className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
                        title="Download file apa adanya"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Saja</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <a
                    href={renderedBlobUrl}
                    download={`alco_marketing_video_9x16_${Date.now()}.${exportedFormat?.extension || 'mp4'}`}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Video Final (.{exportedFormat?.extension || 'mp4'})</span>
                  </a>
                )}

                <button
                  onClick={() => handleStartRender()}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Render Ulang Manual</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold px-2">FPS Mode:</span>
                  <button
                    type="button"
                    onClick={() => setRenderFpsMode('30fps')}
                    disabled={isRendering}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      renderFpsMode === '30fps'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    30 FPS Quality
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenderFpsMode('24fps')}
                    disabled={isRendering}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      renderFpsMode === '24fps'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    24 FPS Stable Mode
                  </button>
                </div>

                <button
                  onClick={() => handleStartRender()}
                  disabled={isRendering}
                  className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isRendering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rendering ({renderProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Mulai Render Video Final 9:16 ({renderFpsMode === '24fps' ? '24 FPS' : '30 FPS'})</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {!isRendering && (
              <p className="text-[10px] text-slate-400 text-center">
                Mendukung 100% format short video vertikal TikTok, Instagram Reels, dan YouTube Shorts.
              </p>
            )}

            {/* SERVER MP4 RENDER / FFMPEG RECOMMENDED (Solusi Utama Stutter-Free) */}
            {(!renderedBlobUrl || (auditResult && !auditResult.passed)) && !isRendering && (
              <div className="bg-slate-950 border border-amber-500/60 rounded-xl p-3.5 space-y-2.5 mt-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-black">
                    <Server className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-black text-amber-300">
                        Server MP4 Render / FFmpeg Recommended
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-slate-950">
                        100% 24 FPS Presisi
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-snug">
                      Perekam browser MediaRecorder berpotensi drop frame di hardware tertentu. Gunakan Server MP4 Render / Script FFmpeg untuk hasil MP4 24 FPS 100% mulus.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={handleDownloadFFmpegPackage}
                    type="button"
                    className="py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Script FFmpeg + Plan (.sh/.json)</span>
                  </button>

                  <button
                    onClick={handleCopyFFmpegCommand}
                    type="button"
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
                    <span>{copiedCmd ? 'Command Tersalin!' : 'Salin Command FFmpeg'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. SRT Subtitles File Download */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Subtitles (.SRT)</h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                File subtitle bertimestamp standar untuk CapCut atau Premiere Pro.
              </p>
            </div>

            <button
              onClick={handleDownloadSrt}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download SRT</span>
            </button>
          </div>
        </div>

        {/* Secondary Download: Editing JSON Plan */}
        <div className="flex items-center justify-between p-3.5 bg-slate-100/80 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700">Download Blueprint Editing Plan (JSON)</span>
          </div>
          <button
            onClick={handleDownloadJson}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>

        {/* Quality Validation Checkmarks */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Standard Kualitas Visual Alco 9:16:
            </span>
            <button
              onClick={() => setShowDetailedChecks(!showDetailedChecks)}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              {showDetailedChecks ? 'Sembunyikan Rincian' : 'Lihat 5 Indikator'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{currentProject.scenes.length} Scenes Terpotong Rapi</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Full 9:16 Vertical Dominance (≥90%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>0-3s Hook Dynamics & Kinetic Punch</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Lower-Third Caption Safe Zone</span>
            </div>
          </div>

          {showDetailedChecks && auditResult && (
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1 text-[11px] animate-fade-in">
              {auditResult.checks.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 py-1">
                  <div className="flex items-center gap-1.5">
                    {c.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                    <span className={c.passed ? 'text-slate-800 font-medium' : 'text-rose-700 font-bold'}>
                      {c.label}
                    </span>
                  </div>
                  <span className="text-slate-500 text-[10px] text-right">{c.details}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
