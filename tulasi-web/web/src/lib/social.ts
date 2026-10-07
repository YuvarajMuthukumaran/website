// Social links and the Instagram videos shown on the home page ("Learn with Tulasi").
export const INSTAGRAM_URL = "https://www.instagram.com/tulasihealthcare_insta/";
export const INSTAGRAM_HANDLE = "@tulasihealthcare_insta";

/**
 * Reels to show on the home page. Paste the link of each reel or post from Instagram
 * (for example "https://www.instagram.com/reel/AbCdEfGhIjK/"); up to six are shown, in this order.
 * They play on the page itself. While this list is empty the section shows the account's latest
 * posts (Instagram's profile embed) instead.
 */
export const INSTAGRAM_REELS: string[] = [
  "https://www.instagram.com/reel/DeHcg5yoSiP/",
  "https://www.instagram.com/reel/Dd3_Cnco-tH/",
  "https://www.instagram.com/reel/DdZG0ZgIhfo/",
  "https://www.instagram.com/reel/DdTyxV_zK1G/",
  "https://www.instagram.com/reel/DbmmjuihN4b/",
];

/**
 * The clinic's own video files (put the .mp4 files in web/public/videos/). When this list is not empty
 * it is used instead of INSTAGRAM_REELS: the video in focus plays by itself, muted, and only the video
 * is shown (no Instagram header or buttons). Download each reel from Instagram (Meta Business Suite >
 * Content > the reel > Download) or use the original edit, save it as e.g. "what-is-cbt.mp4" and add:
 *   { src: "/videos/what-is-cbt.mp4", poster: "/videos/what-is-cbt.jpg", title: "What is CBT?" }
 * Vertical 9:16, under about 15 MB each, is ideal.
 */
export const SHORT_VIDEOS: { src: string; poster?: string; title?: string; duration?: string }[] = [
  { src: "/videos/hamare-mann.mp4", poster: "/videos/hamare-mann.jpg", duration: "1:09" },
  { src: "/videos/mental-health.mp4", poster: "/videos/mental-health.jpg", duration: "0:21" },
  { src: "/videos/cbt.mp4", poster: "/videos/cbt.jpg", duration: "0:59" },
  { src: "/videos/child.mp4", poster: "/videos/child.jpg", duration: "0:58" },
  { src: "/videos/one-question.mp4", poster: "/videos/one-question.jpg", duration: "1:04" },
];
