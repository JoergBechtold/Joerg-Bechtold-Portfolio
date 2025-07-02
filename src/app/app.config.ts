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
    // NEUE LOGIK: Sprache aus der URL extrahieren
    const pathSegments = window.location.pathname.split('/').filter(s => s);
    // Überprüfen, ob das erste Segment eine gültige Sprache ist
    const langFromUrl = translate.getLangs().includes(pathSegments[0]) ? pathSegments[0] : translate.getDefaultLang();

    // Hier stellen wir sicher, dass die Sprache korrekt gesetzt wird,
    // BEVOR Angular die Komponenten initialisiert.
    return translate.use(langFromUrl).toPromise();
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