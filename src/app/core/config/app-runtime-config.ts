import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppRuntimeConfig {
  readonly apiBaseUrl: string;
}

export const DEFAULT_APP_RUNTIME_CONFIG: AppRuntimeConfig = {
  apiBaseUrl: environment.apiBaseUrl,
};

export const APP_RUNTIME_CONFIG = new InjectionToken<AppRuntimeConfig>('APP_RUNTIME_CONFIG');

export async function loadAppRuntimeConfig(): Promise<AppRuntimeConfig> {
  try {
    const response = await fetch('app-config.json', { cache: 'no-store' });

    if (!response.ok) {
      return DEFAULT_APP_RUNTIME_CONFIG;
    }

    return toAppRuntimeConfig(await response.json());
  } catch {
    return DEFAULT_APP_RUNTIME_CONFIG;
  }
}

function toAppRuntimeConfig(value: unknown): AppRuntimeConfig {
  if (!isRecord(value)) {
    return DEFAULT_APP_RUNTIME_CONFIG;
  }

  return {
    apiBaseUrl: readRequiredString(value['apiBaseUrl'], DEFAULT_APP_RUNTIME_CONFIG.apiBaseUrl),
  };
}

function readRequiredString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
