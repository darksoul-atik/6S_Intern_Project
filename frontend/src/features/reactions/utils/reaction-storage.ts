import type { ReactionTargetType, ReactionType, UserReactionsMap } from "../types/reaction";

const STORAGE_PREFIX = "devpulse_reactions_";

/**
 * Retrieve stored user reactions from browser localStorage.
 * Safe for server-side rendering (SSR).
 */
export function getStoredReactions(targetType: ReactionTargetType): UserReactionsMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${targetType}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save full map of user reactions to localStorage.
 */
export function setStoredReactions(
  targetType: ReactionTargetType,
  map: UserReactionsMap,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${targetType}`, JSON.stringify(map));
  } catch {
    // Ignore storage quota or disabled localStorage errors
  }
}

/**
 * Update or delete a single reaction in localStorage.
 */
export function updateStoredReaction(
  targetType: ReactionTargetType,
  targetId: string,
  reaction: ReactionType | null,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const current = getStoredReactions(targetType);

    if (reaction) {
      current[targetId] = reaction;
    } else {
      delete current[targetId];
    }

    setStoredReactions(targetType, current);
  } catch {
    // Ignore storage quota or disabled localStorage errors
  }
}

/**
 * Clear all stored reaction caches (e.g. on user logout).
 */
export function clearStoredReactions(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(`${STORAGE_PREFIX}post`);
    localStorage.removeItem(`${STORAGE_PREFIX}comment`);
  } catch {
    // Ignore
  }
}
