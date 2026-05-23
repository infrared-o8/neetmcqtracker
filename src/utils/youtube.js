/** Extract 11-char YouTube video id from URL or raw id. */
export function parseYoutubeId(input) {
  const raw = input?.trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const url = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    const host = url.hostname.replace("www.", "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id?.length === 11 ? id : null;
    }

    if (host.includes("youtube.com") || host.includes("music.youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && v.length === 11) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]?.length === 11) {
        return parts[embedIdx + 1];
      }
      const shortIdx = parts.indexOf("shorts");
      if (shortIdx >= 0 && parts[shortIdx + 1]?.length === 11) {
        return parts[shortIdx + 1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedSrc(videoId, { autoplay = true, loop = true, mute = false, controls = false } = {}) {
  if (!videoId) return "";
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: mute ? "1" : "0",
    loop: loop ? "1" : "0",
    playlist: videoId,
    controls: controls ? "1" : "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
}
