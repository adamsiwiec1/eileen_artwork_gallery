/**
 * Persistence for guided-demo coach marks. Ported from the OpticTruckWorks
 * portal feature-demo (framework-agnostic; no UI deps) so the tour can
 * remember whether Eileen has already seen it, with URL overrides for QA.
 */

const STORAGE_KEY = 'featureDemo:v1';
const SESSION_PREFIX = 'featureDemo:session:';

export type FeatureDemoChoice = 'skipped' | 'completed';

export interface FeatureDemoRecord {
  dismissed: boolean;
  choice?: FeatureDemoChoice;
}

const canUseStorage = (): boolean => typeof window !== 'undefined' && !!window.localStorage;

export function isFeatureDemoForcedOff(search = typeof window === 'undefined' ? '' : window.location.search): boolean {
  return new URLSearchParams(search).get('featureDemo') === '0';
}

export function isFeatureDemoForcedOn(search = typeof window === 'undefined' ? '' : window.location.search): boolean {
  return new URLSearchParams(search).get('featureDemo') === '1';
}

export function readFeatureDemo(id: string): FeatureDemoRecord | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, FeatureDemoRecord>;
    const entry = parsed[id];
    if (!entry || typeof entry.dismissed !== 'boolean') return null;
    return entry;
  } catch {
    return null;
  }
}

type SessionStore = Pick<Storage, 'getItem' | 'setItem'>;

const defaultSession = (): SessionStore | null => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  return window.sessionStorage;
};

export function writeFeatureDemoSessionDismissed(id: string, storage = defaultSession()): void {
  if (!storage) return;
  try {
    storage.setItem(`${SESSION_PREFIX}${id}`, '1');
  } catch {
    // private mode
  }
}

export function isFeatureDemoSessionDismissed(id: string, storage = defaultSession()): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(`${SESSION_PREFIX}${id}`) === '1';
  } catch {
    return false;
  }
}

export function writeFeatureDemoDismissed(id: string, choice: FeatureDemoChoice = 'skipped'): void {
  writeFeatureDemoSessionDismissed(id);
  if (!canUseStorage()) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, FeatureDemoRecord>) : {};
    parsed[id] = { dismissed: true, choice };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // quota / private mode
  }
}

export function shouldShowFeatureDemo(
  id: string,
  options: { enabled: boolean; alwaysShow?: boolean },
  search?: string,
  session?: SessionStore | null,
): boolean {
  const sessionStore = session === undefined ? defaultSession() : session;
  if (!options.enabled) return false;
  if (isFeatureDemoForcedOff(search)) {
    writeFeatureDemoSessionDismissed(id, sessionStore);
    return false;
  }
  if (isFeatureDemoForcedOn(search)) return true;
  if (isFeatureDemoSessionDismissed(id, sessionStore)) return false;
  if (options.alwaysShow) return true;
  return readFeatureDemo(id)?.dismissed !== true;
}
