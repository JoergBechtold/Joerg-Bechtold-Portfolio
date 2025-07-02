import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import {
  provideRouter,
  withNavigationErrorHandler,
  withInMemoryScrolling,
  withRouterConfig
} from '@angular/router';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { APP_INITIALIZER } from '@angular/core';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

function initTranslations(translate: TranslateService) {
  return () => {
    translate.addLangs(['de', 'en']);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      }),
      withNavigationErrorHandler((error) => {
        console.error('Router Navigation Error:', error);
      }),
      withInMemoryScrolling({
        anchorScrolling: 'enabled'
      })
    ),
    provideHttpClient(withFetch()),
    importProvidersFrom(TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'de'
    })),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initTranslations,
      deps: [TranslateService],
      multi: true
    }
  ]
};