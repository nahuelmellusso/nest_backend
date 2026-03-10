export const FOOTBALL_POSITIONS = ["GK", "DF", "MD", "FW"] as const;
export type FootballPosition = (typeof FOOTBALL_POSITIONS)[number];

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
