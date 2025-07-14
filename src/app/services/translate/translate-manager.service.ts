import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras, Scroll, Event as RouterEvent } from '@angular/router';
import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppRouteKeys, mainRoutes, createLocalizedRoutes, routes } from '../../app.routes';

@Injectable({
  providedIn: 'root'
})
export class TranslateManagerService {
  private _activeLanguageSubject: BehaviorSubject<string>;
  // ✅ Umbenennung zu activeLanguage$ (Konvention für Observables)
  public activeLanguage$: Observable<string>;

  private isBrowser: boolean;
  private savedScrollPosition: [number, number] | null = null;
  private readonly SCROLL_TIMEOUT_MS = 5;

  constructor(
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private viewportScroller: ViewportScroller,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this._activeLanguageSubject = new BehaviorSubject<string>(this.translate.currentLang);
    // ✅ Zuweisung des Observable
    this.activeLanguage$ = this._activeLanguageSubject.asObservable();

    // Abonnieren von Sprachänderungen von ngx-translate
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this._activeLanguageSubject.next(event.lang);
      // Wenn die Sprache wechselt und wir ein Fragment in der URL haben, aktualisieren wir es.
      const currentFragment = this.activatedRoute.snapshot.fragment;
      if (currentFragment) {
        this.updateFragmentInUrlAfterLangChange(currentFragment);
      }
    });

    // Initialisiere die aktuelle Sprache basierend auf den Parametern oder der Standardsprache
    this.activatedRoute.paramMap.subscribe(params => {
      const langParam = params.get('lang');
      const determinedLang = langParam || this.translate.getDefaultLang();
      if (this._activeLanguageSubject.getValue() !== determinedLang) {
        this._activeLanguageSubject.next(determinedLang);
      }
    });

    // Scroll-Restoration Logik (wie in NavigationComponent)
    if (this.isBrowser) {
      this.router.events.pipe(
        filter((event: RouterEvent): event is Scroll => event instanceof Scroll)
      ).subscribe((event: Scroll) => {
        if (event.position) {
          this.viewportScroller.scrollToPosition(event.position);
        } else if (event.anchor) {
          this.scrollToElementById(event.anchor);
        }
      });
    }
  }

  // ✅ Getter für den aktuellen STRING-Wert der aktiven Sprache
  get currentActiveLanguage(): string {
    return this._activeLanguageSubject.getValue();
  }

  /**
   * Ändert die aktive Sprache der Anwendung und aktualisiert die URL.
   * @param lang Die Zielsprache ('de' oder 'en').
   */
  async setLanguage(lang: string): Promise<void> {
    if (this.currentActiveLanguage === lang) { // ✅ Verwende den neuen Getter
      return;
    }

    if (this.isBrowser) {
      this.savedScrollPosition = this.viewportScroller.getScrollPosition();
    }

    let targetAppRouteKey: keyof typeof AppRouteKeys | undefined;
    const currentFragment: string | null = this.activatedRoute.snapshot.fragment;
    const currentUrlParts = this.router.url.split('/');
    const currentTranslatedSegment = currentUrlParts.length > 2 ? currentUrlParts[2].split('?')[0].split('#')[0] : '';

    const currentTranslations = await this.translate.getTranslation(this.currentActiveLanguage).toPromise(); // ✅ Verwende den neuen Getter

    // Finde den AppRouteKey basierend auf dem aktuellen Pfad
    for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
      const translationKeyForRoute = AppRouteKeys[keyName];
      let currentTranslationValue: string | undefined = this.getNestedTranslation(currentTranslations, translationKeyForRoute);

      if (currentTranslationValue === currentTranslatedSegment) {
        targetAppRouteKey = keyName;
        break;
      }
    }

    // Wenn kein AppRouteKey über den Pfad gefunden wurde, aber ein Fragment vorhanden ist,
    // versuchen wir, den AppRouteKey über das Fragment zu finden.
    if (!targetAppRouteKey && currentFragment) {
      const currentFragmentTranslations = currentTranslations;
      for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
        if (keyName.endsWith('Fragment')) {
          const fragmentTranslationKey = AppRouteKeys[keyName];
          let translatedFragmentValue: string | undefined = this.getNestedTranslation(currentFragmentTranslations, fragmentTranslationKey);

          if (typeof translatedFragmentValue === 'string' && translatedFragmentValue === currentFragment) {
            const routeKeyPart = keyName.replace('Fragment', '');
            if (AppRouteKeys[routeKeyPart as keyof typeof AppRouteKeys]) {
              targetAppRouteKey = routeKeyPart as keyof typeof AppRouteKeys;
              break;
            }
          }
        }
      }
    }

    // Fallback zur Home-Seite, falls kein passender AppRouteKey gefunden wurde
    if (!targetAppRouteKey) {
      if (currentTranslatedSegment === '') {
        targetAppRouteKey = 'home';
      } else {
        console.warn(`[TranslateManagerService] Konnte keinen AppRouteKey für den aktuellen URL-Pfad '${currentTranslatedSegment}' finden. Führe Fallback zur Home-Seite aus.`);
        targetAppRouteKey = 'home';
      }
    }

    await this.translate.use(lang).toPromise();

    // Routen-Konfiguration dynamisch aktualisieren
    const newLocalizedRoutes = createLocalizedRoutes(this.translate);
    const updatedRoutes = [...routes];
    const langRouteIndex = updatedRoutes.findIndex(r => r.path === ':lang');

    if (langRouteIndex > -1) {
      updatedRoutes[langRouteIndex] = {
        ...updatedRoutes[langRouteIndex],
        children: newLocalizedRoutes
      };
      this.router.resetConfig(updatedRoutes);
    } else {
      console.error(`[TranslateManagerService] Fehler: ':lang'-Route nicht in den Hauptrouten gefunden!`);
    }

    const newTranslatedSegment = this.translate.instant(AppRouteKeys[targetAppRouteKey]);

    let newTranslatedFragment: string | undefined;
    if (currentFragment && targetAppRouteKey) {
      const foundMainRoute = mainRoutes.find(route => route.data?.['translationKey'] === AppRouteKeys[targetAppRouteKey!]);
      const targetFragmentKey = foundMainRoute?.data?.['fragmentKey'] as keyof typeof AppRouteKeys | undefined;
      if (targetFragmentKey) {
        newTranslatedFragment = this.translate.instant(targetFragmentKey);
      }
    }

    let navigationPath: string[];
    const isMainContentSection = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(targetAppRouteKey);
    if (isMainContentSection) {
      navigationPath = [lang];
    } else {
      navigationPath = [lang, newTranslatedSegment];
    }

    const navigationExtras: NavigationExtras = {
      replaceUrl: true,
      scrollPositionRestoration: 'disabled',
      fragment: newTranslatedFragment || undefined
    } as NavigationExtras;

    this.router.navigate(navigationPath, navigationExtras);
  }

  /**
   * Navigiert zu einem bestimmten Abschnitt der Anwendung basierend auf einem AppRouteKey.
   * Aktualisiert die URL mit der korrekten Sprache und dem übersetzten Fragment (falls zutreffend).
   * @param appRouteKey Der Schlüssel des Routenabschnitts aus AppRouteKeys.
   */
  async navigateToSection(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    // Hole den translationKey für den Pfad (z.B. 'ROUTES.ABOUT_ME')
    const pathTranslationKey = AppRouteKeys[appRouteKey];

    // Finde die Route, die zu diesem translationKey gehört, um den fragmentKey zu bekommen
    const targetMainRoute = mainRoutes.find(route => route.data?.['translationKey'] === pathTranslationKey);
    const fragmentTranslationKey = targetMainRoute?.data?.['fragmentKey'] as keyof typeof AppRouteKeys | undefined;

    // Übersetze den fragmentKey in die aktuelle Sprache
    const translatedFragmentId = fragmentTranslationKey ? this.translate.instant(fragmentTranslationKey) : undefined;

    const currentLang = this.currentActiveLanguage; // ✅ Verwende den neuen Getter
    let navigationPathSegments: string[];

    const isMainContentSection = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(appRouteKey);

    if (isMainContentSection) {
      navigationPathSegments = ['/', currentLang];
    } else {
      const translatedPathSegment = this.translate.instant(pathTranslationKey);
      navigationPathSegments = ['/', currentLang, translatedPathSegment];
    }

    const currentUrlWithoutFragment = this.router.url.split('#')[0];
    const targetUrlPathWithoutFragment = navigationPathSegments.join('/');

    if (currentUrlWithoutFragment !== targetUrlPathWithoutFragment) {
      if (this.isBrowser) {
        this.savedScrollPosition = this.viewportScroller.getScrollPosition();
      }

      const navigationExtras: NavigationExtras = {
        replaceUrl: true,
        scrollPositionRestoration: 'disabled',
        fragment: translatedFragmentId || undefined
      } as NavigationExtras;

      try {
        await this.router.navigate(navigationPathSegments, navigationExtras);
        if (appRouteKey === 'home' && this.isBrowser) {
          setTimeout(() => {
            this.viewportScroller.scrollToPosition([0, 0]);
          }, this.SCROLL_TIMEOUT_MS);
        } else if (translatedFragmentId && this.isBrowser) {
          setTimeout(() => {
            this.scrollToElementById(translatedFragmentId);
          }, this.SCROLL_TIMEOUT_MS);
        }
      } catch (err) {
        console.error('Navigation failed:', err);
        this.savedScrollPosition = null;
      }
    } else {
      if (appRouteKey === 'home') {
        if (this.isBrowser) {
          setTimeout(() => {
            this.viewportScroller.scrollToPosition([0, 0]);
          }, this.SCROLL_TIMEOUT_MS);
        }
        if (this.router.url.includes('#') && this.isBrowser) {
          const currentPathSegments = this.router.url.split('?')[0].split('/').filter(s => s);
          const pathWithoutFragment = ['/', ...currentPathSegments];
          this.router.navigate(pathWithoutFragment, { replaceUrl: true });
        }
      } else if (translatedFragmentId) {
        const currentPathSegments = this.router.url.split('?')[0].split('/').filter(s => s);
        const pathForFragmentNavigation = ['/', ...currentPathSegments];

        const navigationExtras: NavigationExtras = {
          replaceUrl: true,
          fragment: translatedFragmentId,
          scrollPositionRestoration: 'disabled'
        } as NavigationExtras;

        try {
          await this.router.navigate(pathForFragmentNavigation, navigationExtras);
        } catch (err) {
          console.error('Fragment-only navigation failed:', err);
        }
        setTimeout(() => {
          this.scrollToElementById(translatedFragmentId);
        }, this.SCROLL_TIMEOUT_MS);
      }
    }
  }

  /**
   * Gibt den RouterLink für eine gegebene AppRouteKey zurück.
   * @param key Der Schlüssel des Routenabschnitts aus AppRouteKeys.
   * @returns Ein Array von Strings, das als RouterLink verwendet werden kann.
   */
  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    const translatedPath = this.translate.instant(AppRouteKeys[key]);
    const currentLang = this.currentActiveLanguage; // ✅ Verwende den neuen Getter

    const isMainContentSection = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(key);

    if (isMainContentSection) {
      return ['/', currentLang];
    }
    return ['/', currentLang, translatedPath];
  }

  // Methode, um das Fragment nach Sprachwechsel zu aktualisieren
  private async updateFragmentInUrlAfterLangChange(oldFragment: string): Promise<void> {
    const currentLang = this.currentActiveLanguage; // ✅ Verwende den neuen Getter
    const currentUrlParts = this.router.url.split('#');
    const pathWithoutFragment = currentUrlParts[0];

    // Finde den AppRouteKey, der zum alten Fragment gehörte
    let targetAppRouteKeyForFragment: keyof typeof AppRouteKeys | undefined;
    const currentFragmentTranslations = await this.translate.getTranslation(this.translate.currentLang).toPromise();

    for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
      if (keyName.endsWith('Fragment')) {
        const fragmentTranslationKey = AppRouteKeys[keyName];
        let translatedFragmentValue: string | undefined = this.getNestedTranslation(currentFragmentTranslations, fragmentTranslationKey);

        if (typeof translatedFragmentValue === 'string' && translatedFragmentValue === oldFragment) {
          const routeKeyPart = keyName.replace('Fragment', '');
          if (AppRouteKeys[routeKeyPart as keyof typeof AppRouteKeys]) {
            targetAppRouteKeyForFragment = routeKeyPart as keyof typeof AppRouteKeys;
            break;
          }
        }
      }
    }

    if (targetAppRouteKeyForFragment) {
      // Finde den zugehörigen Fragment-Key für die neue Sprache
      const foundMainRoute = mainRoutes.find(route => route.data?.['translationKey'] === AppRouteKeys[targetAppRouteKeyForFragment!]);
      const newFragmentTranslationKey = foundMainRoute?.data?.['fragmentKey'] as keyof typeof AppRouteKeys | undefined;

      if (newFragmentTranslationKey) {
        const newTranslatedFragment = this.translate.instant(newFragmentTranslationKey);
        // ✅ Hier verwenden wir wieder router.navigate statt navigateByUrl
        const currentPathSegments = pathWithoutFragment.split('/').filter(s => s); // Pfad-Segmente extrahieren

        const navigationExtras: NavigationExtras = {
          replaceUrl: true,
          fragment: newTranslatedFragment,
          scrollPositionRestoration: 'disabled' // ✅ Wichtig für korrekte Scroll-Behandlung
        } as NavigationExtras;
        this.router.navigate(currentPathSegments, navigationExtras);
      }
    }
  }

  /**
   * Hilfsmethode zum Abrufen von verschachtelten Übersetzungen.
   * @param translations Das Übersetzungsobjekt.
   * @param key Der Schlüssel der Übersetzung (z.B. 'ROUTES.ABOUT_ME').
   * @returns Der übersetzte Wert oder undefined.
   */
  private getNestedTranslation(translations: any, key: string): string | undefined {
    const keys = key.split('.');
    let currentObj: any = translations;
    for (const tKey of keys) {
      if (currentObj && typeof currentObj === 'object' && tKey in currentObj) {
        currentObj = currentObj[tKey];
      } else {
        return undefined;
      }
    }
    return typeof currentObj === 'string' ? currentObj : undefined;
  }

  private getCssVariable(variableName: string): number {
    if (!this.isBrowser) {
      return 0;
    }
    const rootStyles = getComputedStyle(document.documentElement);
    const value = rootStyles.getPropertyValue(variableName).trim();
    const parsedValue = parseFloat(value.replace('px', ''));
    return isNaN(parsedValue) ? 0 : parsedValue;
  }

  private scrollToElementById(elementId: string): void {
    if (!this.isBrowser) {
      return;
    }

    const headerHeightDesktop = this.getCssVariable('--header-height');
    const headerHeightMobile = this.getCssVariable('--header-height-responsive');
    const breakpoint = this.getCssVariable('--breakpoint-width-920');

    let offset: number;

    if (window.innerWidth > breakpoint) {
      offset = headerHeightDesktop;
    } else {
      offset = headerHeightMobile;
    }

    this.viewportScroller.setOffset([0, offset]);
    this.viewportScroller.scrollToAnchor(elementId);
  }
}