/**
 * Source URL Validator & Normalizer
 * Fix 3: Full YouTube URL Shape Normalization
 * Fix 4: Reject DRM-Protected Platforms & Validate Domain Allow-List
 */

// List of known DRM-protected streaming platforms that cannot and should not be extracted
export const DRM_DOMAINS = [
  "hotstar.com",
  "jiohotstar.com",
  "jiocinema.com",
  "netflix.com",
  "primevideo.com",
  "amazon.com/gp/video",
  "amazon.com/video",
  "disneyplus.com",
  "spotify.com",
  "music.apple.com",
  "tv.apple.com",
  "hulu.com",
  "hbomax.com",
  "max.com",
  "peacocktv.com",
  "zee5.com",
  "sonyliv.com",
  "paramountplus.com",
  "crunchyroll.com",
  "voot.com",
];

// Openly accessible / supported domains for media extraction
export const SUPPORTED_ALLOWLIST_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "m.youtube.com",
  "music.youtube.com",
  "soundcloud.com",
  "bandcamp.com",
  "vimeo.com",
  "dailymotion.com",
  "twitch.tv",
  "mixcloud.com",
  "archive.org",
];

export interface ValidatedSourceUrl {
  isValid: boolean;
  isDrmProtected: boolean;
  normalizedUrl: string;
  youtubeVideoId: string | null;
  platform: string;
  error?: string;
}

/**
 * Normalizes all common YouTube URL formats to a canonical 11-char video ID and standard URL.
 * Handles:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID?t=45s
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://music.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - Raw 11-character video ID
 */
export function extractCanonicalYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validates any incoming media URL against DRM restrictions and supported platform rules.
 */
export function validateAndNormalizeSourceUrl(rawUrl: string): ValidatedSourceUrl {
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return {
      isValid: false,
      isDrmProtected: false,
      normalizedUrl: "",
      youtubeVideoId: null,
      platform: "unknown",
      error: "Please enter a valid media URL",
    };
  }

  const trimmed = rawUrl.trim();

  // Check for direct 11-char YouTube ID
  const ytId = extractCanonicalYouTubeId(trimmed);
  if (ytId && !trimmed.includes("http") && !trimmed.includes(".")) {
    return {
      isValid: true,
      isDrmProtected: false,
      normalizedUrl: `https://www.youtube.com/watch?v=${ytId}`,
      youtubeVideoId: ytId,
      platform: "youtube",
    };
  }

  // Parse URL safely
  let parsedUrl: URL;
  try {
    const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
    parsedUrl = new URL(withProtocol);
  } catch {
    return {
      isValid: false,
      isDrmProtected: false,
      normalizedUrl: trimmed,
      youtubeVideoId: null,
      platform: "unknown",
      error: "Invalid URL structure",
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
  const fullPath = parsedUrl.pathname.toLowerCase();

  // FIX 4: Check if the domain is a known DRM-protected platform
  for (const drmDomain of DRM_DOMAINS) {
    if (hostname === drmDomain || hostname.endsWith(`.${drmDomain}`) || (hostname + fullPath).includes(drmDomain)) {
      return {
        isValid: false,
        isDrmProtected: true,
        normalizedUrl: trimmed,
        youtubeVideoId: null,
        platform: drmDomain,
        error: "This source isn't supported — it may be DRM-protected.",
      };
    }
  }

  // Check if it's a YouTube URL in any supported shape
  if (ytId) {
    return {
      isValid: true,
      isDrmProtected: false,
      normalizedUrl: `https://www.youtube.com/watch?v=${ytId}`,
      youtubeVideoId: ytId,
      platform: "youtube",
    };
  }

  // Check against supported allow-list domains
  const isSupportedAllowlisted = SUPPORTED_ALLOWLIST_DOMAINS.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );

  // Check if direct audio or video file URL
  const isDirectMediaFile = /\.(mp3|wav|flac|m4a|aac|ogg|mp4|webm|mkv|mov|avi)(\?.*)?$/i.test(
    parsedUrl.pathname
  );

  if (isSupportedAllowlisted || isDirectMediaFile) {
    return {
      isValid: true,
      isDrmProtected: false,
      normalizedUrl: parsedUrl.toString(),
      youtubeVideoId: null,
      platform: isDirectMediaFile ? "direct_file" : hostname,
    };
  }

  // Generic web URL (not explicitly DRM, but allow if standard HTTP/HTTPS)
  return {
    isValid: true,
    isDrmProtected: false,
    normalizedUrl: parsedUrl.toString(),
    youtubeVideoId: null,
    platform: hostname,
  };
}
