import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { APP_RUNTIME_CONFIG, AppRuntimeConfig } from './core/config/app-runtime-config';
import { routes } from './app.routes';

export function createAppConfig(runtimeConfig: AppRuntimeConfig): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(routes),
      provideHttpClient(),
      {
        provide: APP_RUNTIME_CONFIG,
        useValue: runtimeConfig,
      },
    ],
  };
}
