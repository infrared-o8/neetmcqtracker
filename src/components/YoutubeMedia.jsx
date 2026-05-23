import { useMemo } from "react";
import { useTrackerStore } from "../store/useTrackerStore";
import { parseYoutubeId, youtubeEmbedSrc } from "../utils/youtube";

/** Hidden iframe for room audio; fullscreen-style iframe for optional bg video. */
export function YoutubeMedia() {
  const preferences = useTrackerStore((s) => s.preferences);
  const { ambientTrack, youtubeAudioUrl, youtubeVideoUrl, bgVideoEnabled } = preferences;

  const audioId = useMemo(
    () => (ambientTrack === "youtube" ? parseYoutubeId(youtubeAudioUrl) : null),
    [ambientTrack, youtubeAudioUrl],
  );
  const videoId = useMemo(
    () => (bgVideoEnabled ? parseYoutubeId(youtubeVideoUrl) : null),
    [bgVideoEnabled, youtubeVideoUrl],
  );

  return (
    <>
      {videoId && (
        <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 z-10 bg-zinc-950/70" />
          <iframe
            key={`bg-${videoId}`}
            title="Background video"
            className="absolute left-1/2 top-1/2 h-[130%] w-[130%] max-w-none -translate-x-1/2 -translate-y-1/2 border-0"
            src={youtubeEmbedSrc(videoId, { autoplay: true, loop: true, mute: true, controls: false })}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}

      {audioId && (
        <iframe
          key={`audio-${audioId}`}
          title="Room audio"
          className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px opacity-0"
          src={youtubeEmbedSrc(audioId, { autoplay: true, loop: true, mute: false, controls: false })}
          allow="autoplay"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </>
  );
}
