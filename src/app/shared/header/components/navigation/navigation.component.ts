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
  private requestedFragment: string | null = null;
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

      this.router.events.pipe(
        filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        if (this.requestedFragment) {
          setTimeout(() => {
            this.scrollToElementById(this.requestedFragment!);
            this.requestedFragment = null;
          }, this.SCROLL_TIMEOUT_MS);
        } else if (this.savedScrollPosition) {
          setTimeout(() => {
            this.viewportScroller.scrollToPosition(this.savedScrollPosition!);
            this.savedScrollPosition = null;
          }, this.SCROLL_TIMEOUT_MS);
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

    const translatedPathSegment = this.translate.instant(translatedPathKey);

    let navigationPathSegments: string[];
    let targetUrlPath: string;

    if (appRouteKey === 'home' && translatedPathSegment === '') {
      navigationPathSegments = ['/', currentLang];
      targetUrlPath = `/${currentLang}`;
    } else {
      navigationPathSegments = ['/', currentLang, translatedPathSegment];
      targetUrlPath = `/${currentLang}/${translatedPathSegment}`;
    }

    const currentRouterUrl = this.router.url.split('#')[0];

    if (currentRouterUrl !== targetUrlPath) {
      if (this.isBrowser) {
        this.savedScrollPosition = this.viewportScroller.getScrollPosition();
      }

      const navigationExtras: NavigationExtras = {
        replaceUrl: true,
        scrollPositionRestoration: 'disabled'
      } as NavigationExtras;

      try {
        this.requestedFragment = fragmentId || null;
        await this.router.navigate(navigationPathSegments, navigationExtras);
      } catch (err) {
        console.error('Navigation failed:', err);
        this.requestedFragment = null;
        this.savedScrollPosition = null;
      }
    } else {
      if (fragmentId) {
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
    const currentTranslatedSegment = currentUrlParts.length > 2 ? currentUrlParts[2].split('#')[0] : '';

    // NEU & KORRIGIERT: Abrufen der Übersetzungsdaten für die aktive Sprache
    // Wir rufen die Übersetzungen für die *aktuelle* Sprache ab, um den Pfad zu identifizieren.
    // Dies muss asynchron geschehen, da die Übersetzungen möglicherweise noch nicht geladen sind.
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

    await this.translate.use(lang).toPromise(); // Sprache wechseln

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
    if (targetAppRouteKey === 'home' && newTranslatedSegment === '') {
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

    if (key === 'home' && translatedPath === '') {
      return ['/', currentLang];
    }
    return ['/', currentLang, translatedPath];
  }
}