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
  NavigationEnd // Importiere NavigationEnd
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
  @Output() closeSidenav = new EventEmitter<void>();

  private isBrowser: boolean;
  private requestedFragment: string | null = null;
  private readonly SCROLL_TIMEOUT_MS = 5; // Dein Wert, der gut funktioniert

  constructor(
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private viewportScroller: ViewportScroller,
    @Inject(PLATFORM_ID) private platformId: Object
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
      // Abonnieren von Router-Events für Scroll-Wiederherstellung (z.B. Browser zurück)
      this.router.events.pipe(
        filter((event: RouterEvent): event is Scroll => event instanceof Scroll)
      ).subscribe((event: Scroll) => {
        if (event.position) {
          this.viewportScroller.scrollToPosition(event.position);
        } else if (event.anchor) {
          // Dies ist für direkte Navigation zu einer Fragment-URL oder Browser-Back/Forward
          this.scrollToElementById(event.anchor);
        } else {
          this.viewportScroller.scrollToPosition([0, 0]);
        }
      });

      // Abonnieren von NavigationEnd-Events für unser manuelles Scrollen bei unterschiedlicher Route
      this.router.events.pipe(
        filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        if (this.requestedFragment) {
          setTimeout(() => {
            this.scrollToElementById(this.requestedFragment!);
            this.requestedFragment = null;
          }, this.SCROLL_TIMEOUT_MS);
        }
      });
    }
  }

  onClose(): void {
    this.closeSidenav.emit();
  }

  /**
   * Navigiert zum übersetzten Pfad, der zu einer Section gehört, und scrollt dann manuell.
   * Das Fragment wird NICHT in die URL aufgenommen.
   * @param appRouteKey Der Schlüssel aus AppRouteKeys, der den Pfad repräsentiert (z.B. 'aboutMe').
   */
  async navigateToSection(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    console.log('navigateToSection called with AppRouteKey:', appRouteKey);

    if (this.isInSidebar) {
      this.onClose(); // Sidebar schließen, wenn im Sidebar-Modus
    }

    const translatedPathKey = AppRouteKeys[appRouteKey];
    const currentLang = this.activeLanguage;

    const targetMainRoute = mainRoutes.find(route => route.data?.['translationKey'] === translatedPathKey);
    const fragmentId = targetMainRoute?.data?.['fragmentId'];

    const translatedPath = this.translate.instant(translatedPathKey);

    let navigationPathSegments: string[]; // Wird für den Router verwendet
    let targetUrlPath: string; // Wird für den Vergleich verwendet

    if (appRouteKey === 'home' && translatedPath === '') {
      navigationPathSegments = ['/', currentLang];
      targetUrlPath = `/${currentLang}`; // Beispiel: /de
    } else {
      navigationPathSegments = ['/', currentLang, translatedPath];
      targetUrlPath = `/${currentLang}/${translatedPath}`; // Beispiel: /de/faehigkeiten
    }

    // Aktueller vollständiger Pfad der URL (ohne Fragment)
    const currentUrlPath = this.router.url.split('#')[0];

    // *** Wichtig: Hier die Logik anpassen ***
    if (currentUrlPath === targetUrlPath) {
      // Wir sind bereits auf dem gewünschten Pfad.
      // Kein Router-Navigate, sondern direkt scrollen.
      console.log(`Already on path '${targetUrlPath}'. Directly scrolling to '${fragmentId}'.`);
      if (fragmentId) {
        setTimeout(() => {
          this.scrollToElementById(fragmentId);
        }, this.SCROLL_TIMEOUT_MS);
      }
    } else {
      // Pfade sind unterschiedlich, normale Navigation über den Router
      const navigationExtras: NavigationExtras = {
        replaceUrl: true,
        scrollPositionRestoration: 'top' // Bleibt auf 'top'
      } as NavigationExtras;

      try {
        this.requestedFragment = fragmentId || null; // Fragment speichern
        await this.router.navigate(navigationPathSegments, navigationExtras);
        console.log(`Mapsd to ${navigationPathSegments.join('/')}. Fragment '${fragmentId || 'none'}' will be scrolled after NavigationEnd.`);
      } catch (err) {
        console.error('Navigation failed:', err);
        this.requestedFragment = null; // Im Fehlerfall zurücksetzen
      }
    }
  }

  /**
   * Hilfsfunktion zum Scrollen zu einem Element anhand seiner ID unter Verwendung von ViewportScroller.
   * @param elementId Die ID des HTML-Elements, zu dem gescrollt werden soll.
   */
  private scrollToElementById(elementId: string): void {
    if (!this.isBrowser) {
      return;
    }
    this.viewportScroller.setOffset([0, 60]); // Beispiel: 60px Offset für einen festen Header
    this.viewportScroller.scrollToAnchor(elementId);
    console.log(`ViewportScroller attempted to scroll to anchor: ${elementId}`);
  }

  async setLanguage(lang: string): Promise<void> {
    if (this.activeLanguage === lang) {
      return;
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