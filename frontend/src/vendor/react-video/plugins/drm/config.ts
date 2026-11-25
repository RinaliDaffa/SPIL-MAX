import type { HlsConfig } from "hls.js";

export interface KeySystemConfig {
  licenseUrl: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

export interface FairPlayConfig extends KeySystemConfig {
  certificateUrl: string;
}

export interface ClearKeyConfig {
  keys: Record<string, string>;
}

export interface DrmConfig {
  widevine?: KeySystemConfig;
  playready?: KeySystemConfig;
  fairplay?: FairPlayConfig;
  clearkey?: ClearKeyConfig;
}

export const KEY_SYSTEMS = {
  widevine: "com.widevine.alpha",
  playready: "com.microsoft.playready",
  fairplay: "com.apple.fps",
  clearkey: "org.w3.clearkey",
} as const;

export function toHlsDrm({ widevine, playready, fairplay }: DrmConfig): Partial<HlsConfig> {
  const headers = { ...widevine?.headers, ...playready?.headers, ...fairplay?.headers };
  const credentials = Boolean(
    widevine?.withCredentials || playready?.withCredentials || fairplay?.withCredentials
  );
  return {
    emeEnabled: true,
    drmSystems: {
      ...(widevine && { [KEY_SYSTEMS.widevine]: { licenseUrl: widevine.licenseUrl } }),
      ...(playready && { [KEY_SYSTEMS.playready]: { licenseUrl: playready.licenseUrl } }),
      ...(fairplay && {
        [KEY_SYSTEMS.fairplay]: {
          licenseUrl: fairplay.licenseUrl,
          serverCertificateUrl: fairplay.certificateUrl,
        },
      }),
    },
    licenseXhrSetup(xhr) {
      xhr.withCredentials = credentials;
      for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    },
  };
}
