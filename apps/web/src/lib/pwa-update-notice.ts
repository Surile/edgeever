export const PWA_UPDATE_NOTICE_EVENT = "edgeever:pwa-update-notice";

const PWA_BUILD_ID_KEY = "edgeever:pwa-build-id";
const PWA_UPDATE_RELOADED_AT_KEY = "edgeever:pwa-update-reloaded-at";

export type PwaUpdateNoticeKind = "checking" | "updated" | "reload-required";

export type PwaUpdateNoticeDetail = {
  buildLabel?: string;
  kind: PwaUpdateNoticeKind;
};

export type PwaUpdateNoticeEvent = CustomEvent<PwaUpdateNoticeDetail>;

export const emitPwaUpdateNotice = (detail: PwaUpdateNoticeDetail) => {
  window.dispatchEvent(new CustomEvent<PwaUpdateNoticeDetail>(PWA_UPDATE_NOTICE_EVENT, { detail }));
};

export const markPwaUpdateReloadPending = () => {
  try {
    window.sessionStorage.setItem(PWA_UPDATE_RELOADED_AT_KEY, String(Date.now()));
  } catch {
    // Storage can be unavailable in restricted browsing modes.
  }
};

export const consumePwaUpdateReloadPending = () => {
  try {
    const value = window.sessionStorage.getItem(PWA_UPDATE_RELOADED_AT_KEY);
    window.sessionStorage.removeItem(PWA_UPDATE_RELOADED_AT_KEY);
    return Boolean(value);
  } catch {
    return false;
  }
};

export const consumePwaBuildUpdate = (
  currentBuildId: string,
  { notifyWhenMissingBaseline = false }: { notifyWhenMissingBaseline?: boolean } = {}
) => {
  try {
    const previousBuildId = window.localStorage.getItem(PWA_BUILD_ID_KEY);
    window.localStorage.setItem(PWA_BUILD_ID_KEY, currentBuildId);

    if (!previousBuildId) {
      return notifyWhenMissingBaseline;
    }

    return previousBuildId !== currentBuildId;
  } catch {
    return false;
  }
};
