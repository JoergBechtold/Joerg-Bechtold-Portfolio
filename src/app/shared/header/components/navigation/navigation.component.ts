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
import { AppRouteKeys, mainRoutes, routes, createLocalizedRoutes } from '../../../../app.routes';

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

    const translatedPathKey = AppRouteKeys[appRouteKey];
    const currentLang = this.activeLanguage;

    const targetMainRoute = mainRoutes.find(route => route.data?.['translationKey'] === translatedPathKey);
    const fragmentId = targetMainRoute?.data?.['fragmentId'];

    const isMainContentSection = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(appRouteKey);

    let navigationPathSegments: string[] = ['/', currentLang];

    const currentUrlWithoutFragment = this.router.url.split('#')[0];
    const targetUrlPathWithoutFragment = navigationPathSegments.join('/');

    if (currentUrlWithoutFragment !== targetUrlPathWithoutFragment) {
      if (this.isBrowser) {
        this.savedScrollPosition = this.viewportScroller.getScrollPosition();
      }

      const navigationExtras: NavigationExtras = {
        replaceUrl: true,
        scrollPositionRestoration: 'disabled', // Hier bleibt es, wenn zu einem neuen Pfad navigiert wird
        fragment: fragmentId || undefined
      } as NavigationExtras;

      try {
        await this.router.navigate(navigationPathSegments, navigationExtras);
        if (appRouteKey === 'home' && this.isBrowser) {
          setTimeout(() => {
            this.viewportScroller.scrollToPosition([0, 0]);
          }, this.SCROLL_TIMEOUT_MS);
        } else if (fragmentId && this.isBrowser) {
          setTimeout(() => {
            this.scrollToElementById(fragmentId);
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
        // Wichtig: Keine Fragment-Navigation hier, um die URL sauber zu halten.
        // Falls ein Fragment in der URL ist und auf Home geklickt wird, muss es entfernt werden.
        if (this.router.url.includes('#') && this.isBrowser) {
          const currentPathSegments = this.router.url.split('?')[0].split('/').filter(s => s);
          const pathWithoutFragment = ['/', ...currentPathSegments];
          this.router.navigate(pathWithoutFragment, { replaceUrl: true }); // *** HIER WIRD scrollPositionRestoration ENTFERNT ***
        }
      } else if (fragmentId) {
        const currentPathSegments = this.router.url.split('?')[0].split('/').filter(s => s);
        const pathForFragmentNavigation = ['/', ...currentPathSegments];

        const navigationExtras: NavigationExtras = {
          replaceUrl: true,
          fragment: fragmentId,
          scrollPositionRestoration: 'disabled' // Hier bleibt es, da wir das Fragment explizit setzen und den Scroller manuell steuern
        } as NavigationExtras;

        try {
          await this.router.navigate(pathForFragmentNavigation, navigationExtras);
        } catch (err) {
          console.error('Fragment-only navigation failed:', err);
        }
        setTimeout(() => {
          this.scrollToElementById(fragmentId);
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
      fragment: currentFragment || undefined
    } as NavigationExtras;

    this.router.navigate(navigationPath, navigationExtras);
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