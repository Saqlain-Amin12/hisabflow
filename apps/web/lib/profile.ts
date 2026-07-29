/**
 * Guest-mode profile helpers.
 * Username is stored in localStorage and acts as the user's global identity.
 */

const USERNAME_KEY = "HisabFlow_username";
const DISPLAY_NAME_KEY = "HisabFlow_display_name";
const PASSWORD_KEY = "HisabFlow_pw";

export function getStoredUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USERNAME_KEY);
}

export function setStoredUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username.toLowerCase());
}

export function getStoredDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DISPLAY_NAME_KEY);
}

export function setStoredDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name);
}

export function getStoredPassword(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PASSWORD_KEY);
}

export function setStoredPassword(pw: string): void {
  localStorage.setItem(PASSWORD_KEY, pw);
}

export function clearStoredProfile(): void {
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(DISPLAY_NAME_KEY);
  localStorage.removeItem(PASSWORD_KEY);
}
