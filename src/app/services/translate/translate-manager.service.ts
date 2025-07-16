import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras, Scroll, Event as RouterEvent } from '@angular/router';
import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppRouteKeys, mainRoutes, createLocalizedRoutes, routes } from '../../app.routes'; // Pfad anpassen

@Injectable({
  providedIn: 'root'
})
export class TranslateManagerService {
  private _activeLanguageSubject: BehaviorSubject<string>;
  public activeLanguage$: Observable<string>;

  private isBrowser: boolean;
  private savedScrollPosition: [number, number] | null = null;
  private readonly SCROLL_TIMEOUT_MS = 100; // Erhöht auf 100ms für bessere Zuverlässigkeit

  constructor(
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private viewportScroller: ViewportScroller,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this._activeLanguageSubject = new BehaviorSubject<string>(this.translate.currentLang);
    this.activeLanguage$ = this._activeLanguageSubject.asObservable();

    // Abonnieren von Sprachänderungen von ngx-translate
    // Aktualisiert das interne Observable, aber triggert KEINE Navigation oder Fragment-Logik,
    // da setLanguage die Hauptkontrolle hat.
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this._activeLanguageSubject.next(event.lang);
      // Alle Navigation/Fragment-Logik wird in setLanguage() oder resolve-Guards gehandhabt.
    });

    // Initialisiere die aktuelle Sprache basierend auf den Parametern oder der Standardsprache
    // Dies ist wichtig für den Initialladevorgang, wenn die URL direkt aufgerufen wird.
    this.activatedRoute.paramMap.subscribe(params => {
      const langParam = params.get('lang');
      const determinedLang = langParam || this.translate.getDefaultLang();
      if (this._activeLanguageSubject.getValue() !== determinedLang) {
        this._activeLanguageSubject.next(determinedLang);
        // Bei direktem Aufruf mit anderem Lang-Parameter (z.B. tippt Benutzer URL ein),
        // wird die Sprache gesetzt. Die Fragment-Wiederherstellung erfolgt dann durch
        // den Router selbst, da wir in der setLanguage-Methode scrollPositionRestoration disabled haben.
        // Wenn es hier ein Fragment gibt, und der Router es nicht selbst wiederherstellt,
        // müsste man hier ebenfalls manuell scrollen, aber das ist ein Edge-Case.
      }
    });

    // Scroll-Restoration Logik (aus der NavigationComponent)
    // Wir deaktivieren scrollPositionRestoration in der Navigation und scrollen manuell.
    // Dies stellt sicher, dass wir die Kontrolle über die Scroll-Position haben.
    // Das Abonnement hier dient hauptsächlich der Fehlerbehebung und zum Verständnis,
    // wie Angular den Scroll-Event wahrnimmt. Die tatsächliche Scroll-Position
    // wird in `setLanguage` und `MapsToSection` gesetzt.
    if (this.isBrowser) {
      this.router.events.pipe(
        filter((event: RouterEvent): event is Scroll => event instanceof Scroll)
      ).subscribe((event: Scroll) => {
        // Diese Logik ist primär für die Router-interne Scroll-Restoration,
        // die wir über `scrollPositionRestoration: 'disabled'` in unserer Navigation
        // explizit abschalten. Manuell scrollen wir via `scrollToElementById`.
        // Daher sind die folgenden Blöcke im Kontext dieses Service oft nicht aktiv relevant,
        // können aber zum Debugging nützlich sein.
        // if (event.position) {
        //   this.viewportScroller.scrollToPosition(event.position);
        // } else if (event.anchor) {
        //   this.scrollToElementById(event.anchor);
        // }
      });
    }
  }

  get currentActiveLanguage(): string {
    return this._activeLanguageSubject.getValue();
  }

  /**
   * Ändert die aktive Sprache der Anwendung und aktualisiert die URL.
   * Behält dabei die aktuelle Sektion/Fragment bei.
   * @param lang Die Zielsprache ('de' oder 'en').
   */
  async setLanguage(lang: string): Promise<void> {
    if (this.currentActiveLanguage === lang) {
      return;
    }

    const oldLang = this.currentActiveLanguage;
    const currentUrl = this.router.url;
    const currentFragment = this.activatedRoute.snapshot.fragment; // Aktuelles Fragment

    // 1. Speichere die aktuelle Scroll-Position VOR dem Navigieren
    if (this.isBrowser) {
      this.savedScrollPosition = this.viewportScroller.getScrollPosition();
    }

    // Führe den Sprachwechsel aus und warte darauf, dass Übersetzungen geladen sind.
    await this.translate.use(lang).toPromise();

    // WICHTIG: Aktualisiere das BehaviorSubject ERST NACHDEM die Sprache erfolgreich gewechselt wurde.
    this._activeLanguageSubject.next(lang);

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
      return;
    }

    // 2. Bestimme den neuen Pfad basierend auf der aktuellen URL in der alten Sprache
    let targetPathSegments: string[] = [];
    let foundAppRouteKey: keyof typeof AppRouteKeys | undefined;

    const currentUrlSegments = currentUrl.split('/').filter(s => s); // z.B. ['de', 'ueber-mich'] oder ['de']
    const pathSegmentAfterLang = currentUrlSegments.length > 1 ? currentUrlSegments[1] : ''; // 'ueber-mich' oder ''

    if (pathSegmentAfterLang === '') {
      // Wenn es keinen Pfad nach der Sprache gibt (z.B. /de), ist es die Home-Route
      foundAppRouteKey = 'home';
    } else {
      // Versuche, den AppRouteKey aus den mainRoutes basierend auf dem OLDEN übersetzten Pfad zu finden
      const oldTranslations = await this.translate.getTranslation(oldLang).toPromise();

      for (const route of mainRoutes) {
        const translationKey = route.data?.['translationKey'];
        if (translationKey) {
          const translatedPathInOldLang = this.getNestedTranslation(oldTranslations, translationKey);
          // Prüfe, ob der übersetzte Pfad (in der alten Sprache) dem aktuellen Pfadsegment entspricht
          if (translatedPathInOldLang === pathSegmentAfterLang) {
            // Finde den AppRouteKey, der zu diesem translationKey gehört
            for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
              if (AppRouteKeys[keyName] === translationKey) {
                foundAppRouteKey = keyName;
                break;
              }
            }
            if (foundAppRouteKey) break; // Schlüssel gefunden, Schleife beenden
          }
        }
      }
    }

    if (foundAppRouteKey) {
      const newTranslatedSegment = this.translate.instant(AppRouteKeys[foundAppRouteKey]);
      const isMainContentSection = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(foundAppRouteKey);

      if (isMainContentSection && foundAppRouteKey !== 'home') {
        targetPathSegments = [lang, newTranslatedSegment];
      } else if (foundAppRouteKey === 'home') {
        targetPathSegments = [lang];
      } else { // Für Routen wie privacy-policy, legal-notice
        targetPathSegments = [lang, newTranslatedSegment];
      }
    } else {
      console.warn(`[TranslateManagerService] Konnte keinen AppRouteKey für den aktuellen URL-Pfad '${currentUrlSegments.join('/')}' finden. Führe Fallback zur Home-Seite aus.`);
      targetPathSegments = [lang];
    }

    let newTranslatedFragment: string | undefined = undefined;

    // 3. Übersetze das Fragment in die neue Sprache
    if (currentFragment) {
      let originalFragmentKey: keyof typeof AppRouteKeys | undefined;

      // Finde den ursprünglichen Fragment-Key (z.B. 'aboutMeFragment'), der dem currentFragment entspricht
      // Hier müssen wir auf die Übersetzungen der ALTEN Sprache zugreifen, um den ursprünglichen Key zu finden.
      const oldFragmentTranslations = await this.translate.getTranslation(oldLang).toPromise();

      for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
        if (keyName.endsWith('Fragment')) {
          const fragmentTranslationKey = AppRouteKeys[keyName];
          // Überprüfe, ob der übersetzte Wert des fragmentTranslationKey in der OLDEN Sprache
          // mit dem aktuellen Fragment übereinstimmt.
          let translatedOldFragmentValue: string | undefined = this.getNestedTranslation(oldFragmentTranslations, fragmentTranslationKey);

          if (typeof translatedOldFragmentValue === 'string' && translatedOldFragmentValue === currentFragment) {
            originalFragmentKey = keyName;
            break;
          }
        }
      }

      if (originalFragmentKey) {
        // Jetzt, da wir den ursprünglichen Key haben, übersetzen wir ihn in die neue Sprache.
        newTranslatedFragment = this.translate.instant(AppRouteKeys[originalFragmentKey]);
      } else {
        console.warn(`[TranslateManagerService] Konnte keinen passenden Original-Fragment-Key für '${currentFragment}' in alter Sprache '${oldLang}' finden.`);
      }
    }

    // 4. Navigiere zur neuen URL mit dem übersetzten Fragment
    const navigationExtras: NavigationExtras = {
      replaceUrl: true,
      scrollPositionRestoration: 'disabled',
      fragment: newTranslatedFragment || undefined
    } as NavigationExtras;

    try {
      // Verwende die Path-Segmente ohne führenden Slash, damit Angular sie korrekt auflöst.
      await this.router.navigate(targetPathSegments, navigationExtras);

      // 5. Scrolle manuell zur Sektion, falls ein Fragment vorhanden ist
      if (this.isBrowser) {
        setTimeout(() => {
          if (newTranslatedFragment) {
            this.scrollToElementById(newTranslatedFragment);
          } else if (this.savedScrollPosition) {
            this.viewportScroller.scrollToPosition(this.savedScrollPosition);
            this.savedScrollPosition = null;
          } else if (targetPathSegments.length === 1 && targetPathSegments[0] === lang) {
            // Wenn wir auf der Home-Seite ohne Fragment landen, scrolle zum Anfang
            this.viewportScroller.scrollToPosition([0, 0]);
          }
        }, this.SCROLL_TIMEOUT_MS);
      }
    } catch (err) {
      console.error('Navigation beim Sprachwechsel fehlgeschlagen:', err);
      this.savedScrollPosition = null;
    }
  }

  /**
   * Navigiert zu einem bestimmten Abschnitt der Anwendung basierend auf einem AppRouteKey.
   * Aktualisiert die URL mit der korrekten Sprache und dem übersetzten Fragment (falls zutreffend).
   * @param appRouteKey Der Schlüssel des Routenabschnitts aus AppRouteKeys.
   */
  async navigateToSection(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    const pathTranslationKey = AppRouteKeys[appRouteKey];
    const targetMainRoute = mainRoutes.find(route => route.data?.['translationKey'] === pathTranslationKey);
    const fragmentTranslationKey = targetMainRoute?.data?.['fragmentKey'] as keyof typeof AppRouteKeys | undefined;
    const translatedFragmentId = fragmentTranslationKey ? this.translate.instant(fragmentTranslationKey) : undefined;

    const currentLang = this.currentActiveLanguage;
    let navigationPathSegments: string[];

    const isMainContentSection = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(appRouteKey);

    if (isMainContentSection) {
      navigationPathSegments = [currentLang]; // Keine führender Slash hier
    } else {
      const translatedPathSegment = this.translate.instant(pathTranslationKey);
      navigationPathSegments = [currentLang, translatedPathSegment]; // Keine führender Slash hier
    }

    const currentUrlWithoutFragment = this.router.url.split('#')[0];
    // Erstelle den Ziel-URL-Pfad ohne Fragment für den Vergleich
    const targetUrlPathWithoutFragment = `/${navigationPathSegments.join('/')}`;

    // Nur navigieren, wenn sich der Pfad ändert (um unnötige Router-Events zu vermeiden)
    // Wenn sich nur das Fragment ändert, muss eine spezielle Fragment-Navigation erfolgen.
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
        await this.router.navigate(navigationPathSegments, navigationExtras); // Keine führender Slash hier
        if (this.isBrowser) {
          setTimeout(() => {
            if (appRouteKey === 'home') {
              this.viewportScroller.scrollToPosition([0, 0]);
            } else if (translatedFragmentId) {
              this.scrollToElementById(translatedFragmentId);
            }
          }, this.SCROLL_TIMEOUT_MS);
        }
      } catch (err) {
        console.error('Navigation failed:', err);
        this.savedScrollPosition = null;
      }
    } else {
      // Der Pfad ist derselbe, aber vielleicht muss das Fragment aktualisiert oder gescrollt werden.
      if (translatedFragmentId && this.activatedRoute.snapshot.fragment !== translatedFragmentId) {
        // Nur das Fragment hat sich geändert, nutze die Router-eigene Fragment-Navigation
        // Dafür muss der Pfad leer sein oder dem aktuellen Pfad entsprechen.
        const currentPathSegments = currentUrlWithoutFragment.split('/').filter(s => s);

        const navigationExtras: NavigationExtras = {
          replaceUrl: true,
          fragment: translatedFragmentId,
          scrollPositionRestoration: 'disabled'
        } as NavigationExtras;

        try {
          // Navigiere zum aktuellen Pfad mit neuem Fragment
          await this.router.navigate(currentPathSegments, navigationExtras); // Keine führender Slash hier

          if (this.isBrowser) {
            setTimeout(() => {
              this.scrollToElementById(translatedFragmentId);
            }, this.SCROLL_TIMEOUT_MS);
          }
        } catch (err) {
          console.error('Fragment-only navigation failed:', err);
        }
      } else if (appRouteKey === 'home') {
        // Wenn auf Home geklickt wird und wir schon auf Home sind, scrolle zum Anfang
        if (this.isBrowser) {
          setTimeout(() => {
            this.viewportScroller.scrollToPosition([0, 0]);
          }, this.SCROLL_TIMEOUT_MS);
        }
        // Wenn die URL ein Fragment hat, aber wir auf Home wollen, das Fragment entfernen.
        if (this.router.url.includes('#') && this.isBrowser) {
          const currentPathSegments = this.router.url.split('?')[0].split('/').filter(s => s);
          this.router.navigate(currentPathSegments, { replaceUrl: true });
        }
      } else if (translatedFragmentId && this.isBrowser) {
        // Bereits am richtigen Pfad, Fragment ist auch schon korrekt, aber vielleicht nochmal scrollen
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
    const currentLang = this.currentActiveLanguage;

    const isMainContentSection = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(key);

    if (isMainContentSection) {
      return ['/', currentLang];
    }
    return ['/', currentLang, translatedPath];
  }

  /**
   * Hilfsmethoden
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