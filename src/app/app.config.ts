import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import {
  provideRouter,
  withNavigationErrorHandler,
  withInMemoryScrolling,
  withRouterConfig
} from '@angular/router';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader'; // <-- Korrigierter Importpfad
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { APP_INITIALIZER } from '@angular/core';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

function initTranslations(translate: TranslateService) {
  return () => {
    translate.addLangs(['de', 'en']);
    // Optional: Setze die Standardsprache basierend auf dem Browser oder einem gespeicherten Wert
    // translate.setDefaultLang('de');
    // translate.use('de');
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes, // Deine definierten Routen
      // Die Router-Konfiguration (ExtraOptions) wird jetzt mit withRouterConfig übergeben
      withRouterConfig({
        onSameUrlNavigation: 'reload'
        // 'runGuardsAndResolvers' ist keine gültige Eigenschaft hier und wurde entfernt.
        // Bei 'onSameUrlNavigation: 'reload'' werden Guards und Resolver in der Regel standardmäßig erneut ausgeführt.
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
      defaultLanguage: 'de' // Setze die Standardsprache hier
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