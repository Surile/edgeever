import type { TFunction } from "i18next";

export const ALL_TOKEN_SCOPES = [
  "read:notebooks",
  "write:notebooks",
  "read:memos",
  "write:memos",
  "read:resources",
  "write:resources",
  "read:tags",
  "write:tags",
];

export const getTokenScopeLabel = (scope: string, t: TFunction) => t(`mcp.scopes.${scope}`, { defaultValue: scope });

export const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to the textarea path below.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
};

export const getMcpRemoteServerUrl = () => {
  if (typeof window === "undefined") {
    return "/mcp";
  }

  return `${window.location.origin}/mcp`;
};

export const getEdgeEverBaseUrl = () => {
  if (typeof window === "undefined") {
    return "https://your-domain.example";
  }

  return window.location.origin;
};

export const buildMcpRemoteConfig = (token: string) =>
  JSON.stringify(
    {
      mcpServers: {
        edgeever: {
          url: getMcpRemoteServerUrl(),
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    },
    null,
    2
  );
