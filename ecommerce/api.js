import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

const DEFAULT_PORT = "3000";

function getExpoHost() {
  const candidates = [
    Constants?.expoConfig?.hostUri,
    Constants?.manifest2?.extra?.expoClient?.hostUri,
    Constants?.manifest?.debuggerHost,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return c.trim().split(":")[0];
    }
  }
  return null;
}

function getBundleHost() {
  const scriptUrl = NativeModules?.SourceCode?.scriptURL;
  if (!scriptUrl || typeof scriptUrl !== "string") return null;
  const m = scriptUrl.match(/^https?:\/\/([^/:]+)(?::\d+)?\//i);
  return m?.[1] ?? null;
}

export function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const expoHost = getExpoHost();
  if (expoHost) return `http://${expoHost}:${DEFAULT_PORT}`;

  const bundleHost = getBundleHost();
  if (bundleHost) return `http://${bundleHost}:${DEFAULT_PORT}`;

  if (Platform.OS === "android") return `http://10.0.2.2:${DEFAULT_PORT}`;
  return `http://localhost:${DEFAULT_PORT}`;
}

export async function apiFetch(path, options) {
  const baseUrl = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return fetch(`${baseUrl}${normalized}`, options);
}
