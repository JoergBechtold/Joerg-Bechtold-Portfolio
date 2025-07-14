import { Component, OnInit, Input, EventEmitter, Output, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Router,
  ActivatedRoute,
  NavigationExtras,
  RouterModule,
  Scroll,
  Event as RouterEvent,
  NavigationEnd
} from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AppRouteKeys, mainRoutes, routes, createLocalizedRoutes } from '../../../../app.routes'; // Sicherstellen, dass AppRouteKeys importiert ist

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  activeLanguage: string = 'de';

  @Input() isInSidebar: boolean = false;
  @Output() closeSidebarRequest = new EventEmitter<void>();
  @Output() navigateRequest = new EventEmitter<keyof typeof AppRouteKeys>();

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
  }

  ngOnInit(): void {
    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
      // Wenn die Sprache wechselt und wir ein Fragment in der URL haben, aktualisieren wir es.
      const currentFragment = this.activatedRoute.snapshot.fragment;
      if (currentFragment) {
        this.updateFragmentInUrlAfterLangChange(currentFragment);
      }
    });
    this.activatedRoute.paramMap.subscribe(params => {
      const langParam = params.get('lang');
      this.activeLanguage = langParam || this.translate.getDefaultLang();
    });

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

  onCloseSidebar(): void {
    this.closeSidebarRequest.emit();
  }

  async navigateToSection(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    if (this.isInSidebar) {
      this.onCloseSidebar();
    }

    // Hole den translationKey für den Pfad (z.B. 'ROUTES.ABOUT_ME')
    const pathTranslationKey = AppRouteKeys[appRouteKey];

    // Finde die Route, die zu diesem translationKey gehört, um den fragmentKey zu bekommen
    const targetMainRoute = mainRoutes.find(route => route.data?.['translationKey'] === pathTranslationKey);
    const fragmentTranslationKey = targetMainRoute?.data?.['fragmentKey'] as keyof typeof AppRouteKeys | undefined;

    // Übersetze den fragmentKey in die aktuelle Sprache
    const translatedFragmentId = fragmentTranslationKey ? this.translate.instant(fragmentTranslationKey) : undefined;

    const currentLang = this.activeLanguage;
    let navigationPathSegments: string[];

    const isMainContentSection = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(appRouteKey);

    if (isMainContentSection) {
      navigationPathSegments = ['/', currentLang];
    } else {
      // Wenn es eine andere Seite ist (z.B. Impressum), brauchen wir den übersetzten Pfad
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
        fragment: translatedFragmentId || undefined // Hier die übersetzte Fragment-ID verwenden
      } as NavigationExtras;

      try {
        await this.router.navigate(navigationPathSegments, navigationExtras);
        if (appRouteKey === 'home' && this.isBrowser) {
          setTimeout(() => {
            this.viewportScroller.scrollToPosition([0, 0]);
          }, this.SCROLL_TIMEOUT_MS);
        } else if (translatedFragmentId && this.isBrowser) { // Hier die übersetzte Fragment-ID verwenden
          setTimeout(() => {
            this.scrollToElementById(translatedFragmentId); // Hier die übersetzte Fragment-ID verwenden
          }, this.SCROLL_TIMEOUT_MS);
        }
      } catch (err) {
        console.error('Navigation failed:', err);
        this.savedScrollPosition = null;
      }
    } else {
      // Wenn wir bereits auf dem richtigen Pfad sind (z.B. /en)
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
      } else if (translatedFragmentId) { // Hier die übersetzte Fragment-ID verwenden
        const currentPathSegments = this.router.url.split('?')[0].split('/').filter(s => s);
        const pathForFragmentNavigation = ['/', ...currentPathSegments];

        const navigationExtras: NavigationExtras = {
          replaceUrl: true,
          fragment: translatedFragmentId, // Hier die übersetzte Fragment-ID verwenden
          scrollPositionRestoration: 'disabled'
        } as NavigationExtras;

        try {
          await this.router.navigate(pathForFragmentNavigation, navigationExtras);
        } catch (err) {
          console.error('Fragment-only navigation failed:', err);
        }
        setTimeout(() => {
          this.scrollToElementById(translatedFragmentId); // Hier die übersetzte Fragment-ID verwenden
        }, this.SCROLL_TIMEOUT_MS);
      }
    }
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

  async setLanguage(lang: string): Promise<void> {
    if (this.activeLanguage === lang) {
      return;
    }

    if (this.isBrowser) {
      this.savedScrollPosition = this.viewportScroller.getScrollPosition();
    }

    let targetAppRouteKey: keyof typeof AppRouteKeys | undefined;

    const currentFragment: string | null = this.activatedRoute.snapshot.fragment;

    // Finde den AppRouteKey basierend auf dem aktuellen Pfad
    const currentUrlParts = this.router.url.split('/');
    const currentTranslatedSegment = currentUrlParts.length > 2 ? currentUrlParts[2].split('?')[0].split('#')[0] : '';

    const currentTranslations = await this.translate.getTranslation(this.activeLanguage).toPromise();

    for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
      const translationKeyForRoute = AppRouteKeys[keyName];

      let currentTranslationValue: string | undefined = undefined;
      const translationKeys = translationKeyForRoute.split('.');

      let currentObj: any = currentTranslations;
      for (const tKey of translationKeys) {
        if (currentObj && typeof currentObj === 'object' && tKey in currentObj) {
          currentObj = currentObj[tKey];
        } else {
          currentObj = undefined;
          break;
        }
      }
      if (typeof currentObj === 'string') {
        currentTranslationValue = currentObj;
      }

      if (currentTranslationValue === currentTranslatedSegment) {
        targetAppRouteKey = keyName;
        break;
      }
    }

    // Wenn kein AppRouteKey gefunden wurde, aber ein Fragment vorhanden ist,
    // versuchen wir, den AppRouteKey über das Fragment zu finden.
    if (!targetAppRouteKey && currentFragment) {
      const currentFragmentTranslations = await this.translate.getTranslation(this.activeLanguage).toPromise();
      for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
        // Prüfen, ob der aktuelle Fragment-String zu einem der Fragment-Keys passt
        if (keyName.endsWith('Fragment')) { // Annahme, dass Fragment-Keys so enden
          const fragmentTranslationKey = AppRouteKeys[keyName];
          let currentObj: any = currentFragmentTranslations;
          const translationKeys = fragmentTranslationKey.split('.');
          for (const tKey of translationKeys) {
            if (currentObj && typeof currentObj === 'object' && tKey in currentObj) {
              currentObj = currentObj[tKey];
            } else {
              currentObj = undefined;
              break;
            }
          }
          if (typeof currentObj === 'string' && currentObj === currentFragment) {
            // Finde den zugehörigen AppRouteKey (z.B. von 'FRAGMENTS.ABOUT_ME_ID' zu 'ROUTES.ABOUT_ME')
            const routeKeyPart = keyName.replace('Fragment', '');
            if (AppRouteKeys[routeKeyPart as keyof typeof AppRouteKeys]) {
              targetAppRouteKey = routeKeyPart as keyof typeof AppRouteKeys;
              break;
            }
          }
        }
      }
    }

    if (!targetAppRouteKey) {
      if (currentTranslatedSegment === '') {
        targetAppRouteKey = 'home';
      } else {
        console.warn(`[NavigationComponent] Konnte keinen AppRouteKey für den aktuellen URL-Pfad '${currentTranslatedSegment}' finden. Führe Fallback zur Home-Seite aus.`);
        targetAppRouteKey = 'home';
      }
    }

    await this.translate.use(lang).toPromise();

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
      console.error(`[NavigationComponent] Fehler: ':lang'-Route nicht in den Hauptrouten gefunden!`);
    }

    const newTranslatedSegment = this.translate.instant(AppRouteKeys[targetAppRouteKey]);

    // Wenn ein Fragment in der URL war, ermittle die neue übersetzte Fragment-ID
    let newTranslatedFragment: string | undefined;
    if (currentFragment) {
      // Finde den Fragment-Key basierend auf dem targetAppRouteKey (z.B. 'ROUTES.ABOUT_ME' -> 'FRAGMENTS.ABOUT_ME_ID')
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
      fragment: newTranslatedFragment || undefined // Hier die neue, übersetzte Fragment-ID übergeben
    } as NavigationExtras;

    this.router.navigate(navigationPath, navigationExtras);
  }

  // Methode, um das Fragment nach Sprachwechsel zu aktualisieren
  private async updateFragmentInUrlAfterLangChange(oldFragment: string): Promise<void> {
    const currentLang = this.activeLanguage;
    const currentUrlParts = this.router.url.split('#');
    const pathWithoutFragment = currentUrlParts[0];

    // Finde den AppRouteKey, der zum alten Fragment gehörte
    let targetAppRouteKeyForFragment: keyof typeof AppRouteKeys | undefined;
    const currentFragmentTranslations = await this.translate.getTranslation(this.translate.currentLang).toPromise();

    for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
      if (keyName.endsWith('Fragment')) {
        const fragmentTranslationKey = AppRouteKeys[keyName];
        let currentObj: any = currentFragmentTranslations;
        const translationKeys = fragmentTranslationKey.split('.');
        for (const tKey of translationKeys) {
          if (currentObj && typeof currentObj === 'object' && tKey in currentObj) {
            currentObj = currentObj[tKey];
          } else {
            currentObj = undefined;
            break;
          }
        }
        if (typeof currentObj === 'string' && currentObj === oldFragment) {
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
        // Navigiere mit dem aktualisierten Fragment, ohne den Pfad zu ändern
        const navigationExtras: NavigationExtras = {
          replaceUrl: true,
          fragment: newTranslatedFragment
        };
        this.router.navigateByUrl(pathWithoutFragment + `#${newTranslatedFragment}`, navigationExtras);
      }
    }
  }

  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    const translatedPath = this.translate.instant(AppRouteKeys[key]);
    const currentLang = this.activeLanguage;

    const isMainContentSection = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(key);

    if (isMainContentSection) {
      return ['/', currentLang];
    }
    return ['/', currentLang, translatedPath];
  }
}