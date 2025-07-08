// app.config.ts
import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withRouterConfig, withNavigationErrorHandler, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

const createRouterProvider = () => provideRouter(
  routes,
  withNavigationErrorHandler((error) => {
    console.error('Router Navigation Error:', error);
  }),
  // *** Wichtig: scrollPositionRestoration auf 'top' setzen, damit der Router immer den Seitenanfang ansteuert,
  // bevor unser setTimeout das eigentliche Scrollen übernimmt.
  withInMemoryScrolling({ anchorScrolling: 'disabled', scrollPositionRestoration: 'top' })
);

const createTranslationProviders = () => importProvidersFrom(
  TranslateModule.forRoot({
    loader: {
      provide: TranslateLoader,
      useFactory: HttpLoaderFactory,
      deps: [HttpClient]
    },
    defaultLanguage: 'de'
  })
);

const initTranslations = (translate: TranslateService) => {
  return () => {
    const pathSegments = window.location.pathname.split('/').filter(s => s);
    const availableLangs = translate.getLangs();
    const defaultLang = translate.getDefaultLang();
    let langToUse: string = defaultLang;

    if (pathSegments.length > 0 && availableLangs.includes(pathSegments[0])) {
      langToUse = pathSegments[0];
    } else {
      const currentPath = window.location.pathname;
      const expectedDefaultPath = `/${defaultLang}`;
      const isHomePath = currentPath === '/' || currentPath === '';

      if (!isHomePath && currentPath !== expectedDefaultPath && !availableLangs.some(l => currentPath.startsWith(`/${l}`))) {
        console.warn(`[APP_INITIALIZER] Ungültige oder fehlende Sprache in URL '${currentPath}'. Leite um zu '${expectedDefaultPath}'.`);
        window.location.replace(expectedDefaultPath);
        return Promise.reject('Redirecting...');
      } else if (isHomePath) {
        console.warn(`[APP_INITIALIZER] Keine Sprache in URL. Leite um zu '${expectedDefaultPath}'.`);
        window.location.replace(expectedDefaultPath);
        return Promise.reject('Redirecting...');
      }
    }
    return translate.use(langToUse).toPromise();
  };
};

export const appConfig: ApplicationConfig = {
  providers: [
    createRouterProvider(),
    provideHttpClient(withFetch()),
    createTranslationProviders(),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initTranslations,
      deps: [TranslateService],
      multi: true
    }
  ]
};