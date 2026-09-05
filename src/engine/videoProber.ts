/**
 * Video Prober Engine
 * Performs post-render decoding and probing on the resulting video Blob
 * using HTMLVideoElement and requestVideoFrameCallback / frame timestamp analysis.
 * Verifies actual encoded frame count, effective FPS, max frame gap, and resolution.
 */

export interface EncodedVideoProbeResult {
  encodedFrameCount: number;
  effectiveEncodedFps: number;
  maxEncodedFrameGapMs: number;
  duration: number;
  width: number;
  height: number;
  hasValidMetadataFps: boolean;
  isFrameRateValid: boolean;
  failureReason?: string;
}

export async function probeEncodedVideoBlob(
  blob: Blob,
  targetFps: number = 24,
  expectedDuration: number = 15
): Promise<EncodedVideoProbeResult> {
  return new Promise((resolve) => {
    if (!blob || blob.size < 1024) {
      resolve({
        encodedFrameCount: 0,
        effectiveEncodedFps: 0,
        maxEncodedFrameGapMs: 9999,
        duration: 0,
        width: 0,
        height: 0,
        hasValidMetadataFps: false,
        isFrameRateValid: false,
        failureReason: 'File video kosong atau terlalu kecil (< 1 KB).',
      });
      return;
    }

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const objectUrl = URL.createObjectURL(blob);
    video.src = objectUrl;

    const timestamps: number[] = [];
    let rfcId = 0;
    let isFinished = false;

    const cleanup = () => {
      if (isFinished) return;
      isFinished = true;
      video.pause();
      if ('cancelVideoFrameCallback' in video && rfcId) {
        try {
          (video as any).cancelVideoFrameCallback(rfcId);
        } catch (_) {}
      }
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    // Timeout safety net (12 seconds)
    const timeout = setTimeout(() => {
      if (isFinished) return;
      finishProbing();
    }, 12000);

    const finishProbing = () => {
      clearTimeout(timeout);

      const dur = video.duration && !isNaN(video.duration) && isFinite(video.duration)
        ? video.duration
        : expectedDuration;

      const finalCount = timestamps.length;
      const fps = dur > 0 && finalCount > 0 ? finalCount / dur : 0;

      let maxGap = 0;
      for (let i = 1; i < timestamps.length; i++) {
        const gap = (timestamps[i] - timestamps[i - 1]) * 1000;
        if (gap > maxGap) {
          maxGap = gap;
        }
      }

      // If only 1 frame or 0 timestamps were detected via rVFC, compute fallback gap
      if (finalCount <= 1 && dur > 0) {
        maxGap = dur * 1000;
      }

      const minRequiredFps = targetFps > 25 ? 28 : 22;
      const targetFrameCount = Math.round(dur * targetFps);
      const isFrameCountOk = finalCount >= Math.floor(0.95 * targetFrameCount);
      const isFpsOk = fps >= minRequiredFps;
      const isGapOk = maxGap <= 120;
      const hasValidMetadataFps = fps >= 1;

      const isFrameRateValid = isFrameCountOk && isFpsOk && isGapOk && hasValidMetadataFps;

      let failureReason: string | undefined;
      if (!hasValidMetadataFps) {
        failureReason = 'Metadata FPS bernilai 0 / invalid.';
      } else if (!isFpsOk) {
        failureReason = `Effective encoded FPS rendah (${fps.toFixed(1)} FPS dari target ${targetFps} FPS).`;
      } else if (!isFrameCountOk) {
        failureReason = `Encoded frames kurang (${finalCount} frame dari target ${targetFrameCount}).`;
      } else if (!isGapOk) {
        failureReason = `Terdeteksi gap timestamp frame besar (${maxGap} ms > limit 120 ms).`;
      }

      cleanup();

      resolve({
        encodedFrameCount: finalCount,
        effectiveEncodedFps: Math.round(fps * 10) / 10,
        maxEncodedFrameGapMs: Math.round(maxGap),
        duration: Math.round(dur * 10) / 10,
        width: video.videoWidth || 720,
        height: video.videoHeight || 1280,
        hasValidMetadataFps,
        isFrameRateValid,
        failureReason,
      });
    };

    video.onloadedmetadata = () => {
      const dur = video.duration;
      if (!dur || isNaN(dur) || !isFinite(dur) || dur <= 0) {
        finishProbing();
        return;
      }

      if ('requestVideoFrameCallback' in video) {
        const onFrame = (_now: number, metadata: any) => {
          if (isFinished) return;
          if (metadata && typeof metadata.mediaTime === 'number') {
            timestamps.push(metadata.mediaTime);
          }
          if (!video.ended && video.currentTime < dur - 0.05) {
            rfcId = (video as any).requestVideoFrameCallback(onFrame);
          } else {
            finishProbing();
          }
        };

        video.onended = () => {
          finishProbing();
        };

        video.playbackRate = 2.0; // Fast 2x probe
        try {
          rfcId = (video as any).requestVideoFrameCallback(onFrame);
          video.play().catch(() => {
            // Fallback to 1x muted play
            video.playbackRate = 1.0;
            video.play().catch(() => {
              finishProbing();
            });
          });
        } catch (_) {
          finishProbing();
        }
      } else {
        // Fallback if rVFC not available in browser
        finishProbing();
      }
    };

    video.onerror = () => {
      finishProbing();
    };
  });
}
