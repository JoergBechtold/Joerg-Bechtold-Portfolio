<<<<<<< HEAD
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
=======
import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withRouterConfig, withNavigationErrorHandler, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
>>>>>>> e33374e62679289c60dac6928ed3f0c7bc494cd7
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
    defaultLanguage: 'de'
  })
);


const initTranslations = (translate: TranslateService) => {
  return () => {
<<<<<<< HEAD
    translate.addLangs(['de', 'en']);
=======
    return translate.use(translate.getDefaultLang()).toPromise();
>>>>>>> e33374e62679289c60dac6928ed3f0c7bc494cd7
  };
};


export const appConfig: ApplicationConfig = {
  providers: [
<<<<<<< HEAD
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
=======
    createRouterProvider(),
    provideHttpClient(withFetch()),
    createTranslationProviders(),
>>>>>>> e33374e62679289c60dac6928ed3f0c7bc494cd7
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initTranslations,
      deps: [TranslateService],
      multi: true
    }
  ]
};