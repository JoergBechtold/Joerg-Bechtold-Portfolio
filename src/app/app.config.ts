// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom, inject } from '@angular/core';
import { provideRouter, withNavigationErrorHandler, withInMemoryScrolling } from '@angular/router'; // withInMemoryScrolling hinzugefügt
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes'; // Deine definierten Routen
import { provideAnimations } from '@angular/platform-browser/animations'; // Für Animationen
import { APP_INITIALIZER } from '@angular/core'; // Für APP_INITIALIZER (aber anders verwendet)

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

// **WICHTIGE ÄNDERUNG:** Der APP_INITIALIZER wird nur noch dazu genutzt, ngx-translate zu initialisieren (Sprachen hinzufügen),
// aber NICHT die Sprache zu setzen oder Routen zu manipulieren. Das übernimmt der langResolver.
function initTranslations(translate: TranslateService) {
  return () => {
    translate.addLangs(['de', 'en']);
    // translate.setDefaultLang('de'); // Kann hier bleiben, wird aber vom Resolver überschrieben wenn URL-Sprache da ist
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // APP_ID ist OK
    // { provide: APP_ID, useValue: 'joerg-bechtold-app' }, // Kann entfernt werden, wenn nicht explizit benötigt

    // Router-Konfiguration:
    provideRouter(
      routes,
      // Optional: Fehlerbehandlung für die Navigation (schon vorhanden, ist gut)
      withNavigationErrorHandler((error) => {
        console.error('Router Navigation Error:', error);
      }),
      // Optional: Wenn du zu Fragmenten scrollen willst (z.B. #about_me)
      withInMemoryScrolling({
        // scrollPositionRestoration: 'top',

        // Scrollt beim Navigieren nach oben
        anchorScrolling: 'enabled' // Ermöglicht das Scrollen zu Ankern (Fragmenten)
      })
    ),

    // HTTP Client für TranslateLoader
    provideHttpClient(withFetch()),

    // ngx-translate Modul-Import
    importProvidersFrom(TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'de' // Setze hier die Fallback-Sprache
    })),

    // Animationen (falls verwendet)
    provideAnimations(),

    // **WICHTIGE ÄNDERUNG:** APP_INITIALIZER wird nur noch für grundlegende ngx-translate Setup genutzt.
    // Die Sprachauswahl und Routen-Reset erfolgt im langResolver.
    {
      provide: APP_INITIALIZER,
      useFactory: initTranslations,
      deps: [TranslateService],
      multi: true // Wichtig, um mehrere APP_INITIALIZER zuzulassen
    }
  ]
};