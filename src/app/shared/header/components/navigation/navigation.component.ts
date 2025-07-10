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

  @Input() windowWidth: number = window.innerWidth;
  @Input() isInSidebar: boolean = false;
  @Output() closeSidebarRequest = new EventEmitter<void>();
  @Output() navigateRequest = new EventEmitter<keyof typeof AppRouteKeys>();

  private isBrowser: boolean;
  private requestedFragment: string | null = null;
  private savedScrollPosition: [number, number] | null = null; // Speichert die Scrollposition
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
        // Dieses Event wird ausgelöst, wenn Angular versucht, die Scroll-Position wiederherzustellen
        // (z.B. bei Browser-Back/Forward). Wir lassen dies hier, da es für diesen Zweck nützlich ist.
        if (event.position) {
          this.viewportScroller.scrollToPosition(event.position);
        } else if (event.anchor) {
          this.scrollToElementById(event.anchor);
        }
        // Wir wollen NICHT hier scrollToPosition([0,0]) aufrufen,
        // da dies das "Nach-oben-Scrollen" verursachen würde, wenn keine explizite Position/Anchor vorhanden ist.
        // Das manuelle Scrollen wird im NavigationEnd-Event gehandhabt.
      });

      this.router.events.pipe(
        filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        if (this.requestedFragment) {
          // Wenn ein Fragment angefragt wurde, scrolle dorthin
          setTimeout(() => {
            this.scrollToElementById(this.requestedFragment!);
            this.requestedFragment = null; // Fragment zurücksetzen
          }, this.SCROLL_TIMEOUT_MS);
        } else if (this.savedScrollPosition) {
          // Wenn eine gespeicherte Scroll-Position vorhanden ist (z.B. nach Sprachwechsel)
          setTimeout(() => {
            this.viewportScroller.scrollToPosition(this.savedScrollPosition!);
            this.savedScrollPosition = null; // Position zurücksetzen
          }, this.SCROLL_TIMEOUT_MS);
        } else {
          // Wenn weder Fragment noch gespeicherte Position vorhanden sind,
          // scrolle nach oben. Dies ist das Standardverhalten, wenn keine andere
          // Scroll-Wiederherstellung gewünscht ist (z.B. bei erster Navigation).
          // Sie können dies entfernen, wenn Sie *niemals* nach oben scrollen möchten,
          // es sei denn, es ist ein Fragment oder eine gespeicherte Position vorhanden.
          // this.viewportScroller.scrollToPosition([0, 0]);
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
      // **Wichtig:** Speichern Sie die aktuelle Scrollposition, BEVOR Sie navigieren.
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
        this.savedScrollPosition = null; // Zurücksetzen bei Fehler
      }
    } else {
      // Wenn wir auf der gleichen Seite sind, aber zu einem Fragment scrollen müssen
      if (fragmentId) {
        setTimeout(() => {
          this.scrollToElementById(fragmentId);
        }, this.SCROLL_TIMEOUT_MS);
      } else {
        // Wenn wir auf der gleichen Seite sind und kein Fragment haben,
        // und wir wollen *nicht* nach oben scrollen, können Sie diese Zeile entfernen.
        // Wenn Sie möchten, dass in diesem spezifischen Fall nach oben gescrollt wird, lassen Sie es.
        // this.viewportScroller.scrollToPosition([0, 0]);
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

    const headerHeightDesktop = this.getCssVariable('--header-hight');
    const headerHeightMobile = this.getCssVariable('--header-hight-responsive');
    const breakpoint = this.getCssVariable('--breakpoint-width-920');

    let offset: number;

    if (this.windowWidth > breakpoint) {
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

    // **Wichtig:** Speichern Sie die aktuelle Scrollposition, BEVOR Sie die Sprache ändern.
    if (this.isBrowser) {
      this.savedScrollPosition = this.viewportScroller.getScrollPosition();
    }

    let targetAppRouteKey: keyof typeof AppRouteKeys | undefined;
    let currentFragment: string | null = null;

    currentFragment = this.activatedRoute.snapshot.fragment;

    let routeSnapshot = this.activatedRoute.snapshot;
    while (routeSnapshot.firstChild) {
      routeSnapshot = routeSnapshot.firstChild;
    }

    for (const mainRoute of mainRoutes) {
      if (mainRoute.component === routeSnapshot.component) {
        const foundTranslationKeyValue = mainRoute.data?.['translationKey'];

        for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
          if (AppRouteKeys[keyName] === foundTranslationKeyValue) {
            targetAppRouteKey = keyName;
            break;
          }
        }
        if (targetAppRouteKey) {
          break;
        }
      }
    }

    if (!targetAppRouteKey) {
      console.warn(`[NavigationComponent] Konnte keinen AppRouteKey für die aktuelle Komponente finden. Führe Fallback zur Home-Seite aus.`);
      targetAppRouteKey = 'home';
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
    if (targetAppRouteKey === 'home' && newTranslatedSegment === '') {
      navigationPath = [lang];
    } else {
      navigationPath = [lang, newTranslatedSegment];
    }

    const navigationExtras: NavigationExtras = {
      replaceUrl: true,
      scrollPositionRestoration: 'disabled'
    } as NavigationExtras;

    if (currentFragment) {
      navigationExtras.fragment = currentFragment;
    }

    // Hier navigieren wir. Die Wiederherstellung der Scrollposition wird dann im NavigationEnd-Abonnement ausgelöst.
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