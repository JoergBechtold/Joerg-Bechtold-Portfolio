// app.config.ts

import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core'; // APP_INITIALIZER importieren
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// Factory-Funktion für den TranslateLoader
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // Stellt HttpClient für den TranslateLoader bereit
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        },
        defaultLanguage: 'de', // Legt die Standardsprache fest
        // initialNavigation: 'enabledBlocking' // Kann nützlich sein, um Routing zu blockieren, bis Initialisierung abgeschlossen
      })
    ),
    // Dies ist der SCHLÜSSELTEIL: APP_INITIALIZER stellt sicher, dass addLangs VOR dem Routing ausgeführt wird.
    {
      provide: APP_INITIALIZER,
      useFactory: (translate: TranslateService) => {
        return () => {
          // Hier fügen Sie alle unterstützten Sprachen hinzu!
          translate.addLangs(['de', 'en']);
          // Optional: Setzen Sie die Standardsprache hier, falls nicht in .forRoot() geschehen
          // translate.setDefaultLang('de');
          return Promise.resolve(); // Oder eine Promise, die auflöst, wenn alles bereit ist
        };
      },
      deps: [TranslateService],
      multi: true // Ermöglicht mehrere APP_INITIALIZER
    }
  ]
};