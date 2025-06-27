import { ApplicationConfig, importProvidersFrom, inject, provideAppInitializer, APP_ID } from '@angular/core';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';


import { routes } from './app.routes';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

function appInitializer(translate: TranslateService) {
  return () => {
    translate.addLangs(['de', 'en']);
    translate.setDefaultLang('de');

    const browserLang = translate.getBrowserLang();
    const initialLang = browserLang && browserLang.match(/en|de/) ? browserLang : 'de';
    return translate.use(initialLang).toPromise();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: APP_ID, useValue: 'joerg-bechtold-app' },
    provideRouter(
      routes,
      withNavigationErrorHandler((error) => {
        console.error('Router Navigation Error:', error);

      })
    ),

    provideHttpClient(withFetch()),
    importProvidersFrom(TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })),

    provideAppInitializer(() => {
      const initializerFn = appInitializer(inject(TranslateService));
      return initializerFn();
    })
  ]
};