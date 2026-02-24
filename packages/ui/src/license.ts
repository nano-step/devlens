const LICENSE_STORAGE_KEY = 'devlens:license';

export type LicenseStatus = 'free' | 'pro' | 'invalid';

export interface LicenseInfo {
  status: LicenseStatus;
  key: string | null;
  expiresAt: number | null;
}

export interface LicenseManager {
  getStatus(): LicenseStatus;
  getInfo(): LicenseInfo;
  activate(key: string): LicenseInfo;
  deactivate(): void;
  isPro(): boolean;
}

/**
 * License key format: DL-XXXX-XXXX-XXXX-XXXX
 * Validation is client-side only (offline-first).
 * For production, replace validateKey with server-side verification.
 */
function validateKeyFormat(key: string): boolean {
  return /^DL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key.trim().toUpperCase());
}

function decodeKeyExpiry(key: string): number | null {
  const parts = key.split('-');
  if (parts.length !== 5) return null;
  const encoded = parts[1];
  if (!encoded) return null;

  const yearCode = encoded.charCodeAt(0) - 48;
  const monthCode = encoded.charCodeAt(1) - 48;
  if (yearCode < 0 || yearCode > 9 || monthCode < 0 || monthCode > 9) return null;

  const year = 2025 + yearCode;
  const month = Math.min(monthCode, 11);
  return new Date(year, month + 1, 0, 23, 59, 59).getTime();
}

function checksumValid(key: string): boolean {
  const clean = key.replace(/-/g, '').slice(2);
  if (clean.length !== 16) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += clean.charCodeAt(i);
  }
  const expectedCheck = (sum % 36);
  const checkChar = clean.charCodeAt(15);
  const actualCheck = checkChar >= 65 ? checkChar - 55 : checkChar - 48;
  return expectedCheck === actualCheck;
}

function validateKey(key: string): { valid: boolean; expiresAt: number | null } {
  const normalized = key.trim().toUpperCase();

  if (!validateKeyFormat(normalized)) {
    return { valid: false, expiresAt: null };
  }

  if (!checksumValid(normalized)) {
    return { valid: false, expiresAt: null };
  }

  const expiresAt = decodeKeyExpiry(normalized);
  if (expiresAt !== null && expiresAt < Date.now()) {
    return { valid: false, expiresAt };
  }

  return { valid: true, expiresAt };
}

export function createLicenseManager(): LicenseManager {
  let cachedInfo: LicenseInfo = {
    status: 'free',
    key: null,
    expiresAt: null,
  };

  function loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as { key?: string };
      if (parsed.key) {
        const result = validateKey(parsed.key);
        if (result.valid) {
          cachedInfo = {
            status: 'pro',
            key: parsed.key,
            expiresAt: result.expiresAt,
          };
        } else {
          cachedInfo = {
            status: 'invalid',
            key: parsed.key,
            expiresAt: result.expiresAt,
          };
        }
      }
    } catch {
      cachedInfo = { status: 'free', key: null, expiresAt: null };
    }
  }

  loadFromStorage();

  function getStatus(): LicenseStatus {
    return cachedInfo.status;
  }

  function getInfo(): LicenseInfo {
    return { ...cachedInfo };
  }

  function activate(key: string): LicenseInfo {
    const result = validateKey(key);
    const normalized = key.trim().toUpperCase();

    if (result.valid) {
      cachedInfo = { status: 'pro', key: normalized, expiresAt: result.expiresAt };
    } else {
      cachedInfo = { status: 'invalid', key: normalized, expiresAt: result.expiresAt };
    }

    try {
      localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify({ key: normalized }));
    } catch {
      // storage unavailable
    }

    return getInfo();
  }

  function deactivate(): void {
    cachedInfo = { status: 'free', key: null, expiresAt: null };
    try {
      localStorage.removeItem(LICENSE_STORAGE_KEY);
    } catch {
      // storage unavailable
    }
  }

  function isPro(): boolean {
    return cachedInfo.status === 'pro';
  }

  return { getStatus, getInfo, activate, deactivate, isPro };
}

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const now = new Date();
  const yearCode = String.fromCharCode(48 + (now.getFullYear() - 2025));
  const monthCode = String.fromCharCode(48 + now.getMonth());

  let key = yearCode + monthCode;
  for (let i = 0; i < 13; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += key.charCodeAt(i);
  }
  const checkVal = sum % 36;
  const checkChar = checkVal >= 10 ? String.fromCharCode(55 + checkVal) : String(checkVal);
  key += checkChar;

  return `DL-${key.slice(0, 4)}-${key.slice(4, 8)}-${key.slice(8, 12)}-${key.slice(12, 16)}`;
}
