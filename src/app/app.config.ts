// app.config.ts

import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withRouterConfig, withNavigationErrorHandler, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader'; // Korrekter Import
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes'; // Wichtig: routes importieren

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

const createRouterProvider = () => provideRouter(
  routes,
  withRouterConfig({ onSameUrlNavigation: 'reload' }),
  withNavigationErrorHandler((error) => {
    console.error('Router Navigation Error:', error);
  }),
  withInMemoryScrolling({ anchorScrolling: 'enabled' })
);

const createTranslationProviders = () => importProvidersFrom(
  TranslateModule.forRoot({
    loader: {
      provide: TranslateLoader,
      useFactory: HttpLoaderFactory,
      deps: [HttpClient]
    },
    defaultLanguage: 'de' // Default-Sprache bleibt hier als Fallback
  })
);

const initTranslations = (translate: TranslateService) => {
  return () => {
    const pathSegments = window.location.pathname.split('/').filter(s => s);
    const availableLangs = translate.getLangs();
    const defaultLang = translate.getDefaultLang();
    let langToUse: string = defaultLang; // Standardmäßig 'de' verwenden

    // Prüfen, ob das erste Segment eine gültige Sprache ist
    if (pathSegments.length > 0 && availableLangs.includes(pathSegments[0])) {
      langToUse = pathSegments[0];
    } else {
      // Wenn keine Sprache in der URL ist oder eine ungültige Sprache,
      // leiten wir zur Standard-Sprache ('de') um.
      // Wichtig: Dies sollte nur passieren, wenn nicht schon auf der Startseite der Default-Sprache sind.
      const currentPath = window.location.pathname;
      const expectedDefaultPath = `/${defaultLang}`;
      const isHomePath = currentPath === '/' || currentPath === ''; // Prüfen, ob es der reine Root-Pfad ist

      if (!isHomePath && currentPath !== expectedDefaultPath && !availableLangs.some(l => currentPath.startsWith(`/${l}`))) {
        // Nur umleiten, wenn wir nicht schon auf einer validen Sprach-Route sind
        console.warn(`[APP_INITIALIZER] Ungültige oder fehlende Sprache in URL '${currentPath}'. Leite um zu '${expectedDefaultPath}'.`);
        window.location.replace(expectedDefaultPath);
        return Promise.reject('Redirecting...'); // Wichtig: Promise ablehnen, um weitere Initialisierung zu stoppen
      } else if (isHomePath) {
        // Wenn nur die Basis-URL aufgerufen wird, leiten wir auch auf /de um
        console.warn(`[APP_INITIALIZER] Keine Sprache in URL. Leite um zu '${expectedDefaultPath}'.`);
        window.location.replace(expectedDefaultPath);
        return Promise.reject('Redirecting...'); // Initialisierung stoppen
      }
    }

    // Stelle sicher, dass die TranslateService die korrekte Sprache verwendet
    // bevor Angular die Komponenten initialisiert.
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