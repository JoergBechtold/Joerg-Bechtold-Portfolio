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
import { AppRouteKeys, mainRoutes, routes, createLocalizedRoutes } from '../../../../app.routes'; // Stellen Sie sicher, dass diese Pfade stimmen

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

  private isBrowser: boolean;
  private requestedFragment: string | null = null;
  // Der Timeout muss groß genug sein, damit Angular das DOM gerendert hat.
  // 5ms ist oft zu kurz, besonders auf langsameren Geräten oder bei Bild-Last.
  private readonly SCROLL_TIMEOUT_MS = 5; // Erhöht auf 100ms für Zuverlässigkeit


  constructor(
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private viewportScroller: ViewportScroller,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  testEmitClose(): void {
    console.log('NavigationComponent: testEmitClose called. Manually emitting closeSidebarRequest.');
    this.closeSidebarRequest.emit();
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
      // Dies ist für die normale Browser-Funktionalität (Back/Forward-Button)
      this.router.events.pipe(
        filter((event: RouterEvent): event is Scroll => event instanceof Scroll)
      ).subscribe((event: Scroll) => {
        if (event.position) {
          this.viewportScroller.scrollToPosition(event.position);
        } else if (event.anchor) {
          // Dies ist für direkte Navigation zu einer Fragment-URL oder Browser-Back/Forward
          // Hier wird event.anchor direkt verwendet, was für den Browser-Verlauf gut ist.
          this.scrollToElementById(event.anchor);
        } else {
          // Standardverhalten: Scrolle zum Seitenanfang, wenn keine Position/Anchor vorhanden
          this.viewportScroller.scrollToPosition([0, 0]);
        }
      });

      // Abonnieren von NavigationEnd-Events für unser manuelles Scrollen nach einer Router-Navigation.
      // DIESER Teil ist entscheidend für das Scrollen NACHDEM wir über `this.router.navigate` eine neue URL gesetzt haben.
      this.router.events.pipe(
        filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        if (this.requestedFragment) {
          console.log(`NavigationEnd detected. Attempting to scroll to stored fragment: ${this.requestedFragment}`);
          setTimeout(() => {
            this.scrollToElementById(this.requestedFragment!);
            this.requestedFragment = null; // Fragment zurücksetzen, nachdem gescrollt wurde
          }, this.SCROLL_TIMEOUT_MS);
        }
      });
    }
  }

  onCloseSidebar(): void {
    console.log('NavigationComponent: onCloseSidebar called. Emitting closeSidebarRequest.');
    this.closeSidebarRequest.emit();
  }

  /**
   * Navigiert zum übersetzten Pfad, der zu einer Section gehört, und scrollt dann manuell.
   * Das Fragment wird NICHT in die URL aufgenommen.
   * @param appRouteKey Der Schlüssel aus AppRouteKeys, der den Pfad repräsentiert (z.B. 'aboutMe').
   */
  async navigateToSection(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    console.log('NavigationComponent: navigateToSection called with AppRouteKey:', appRouteKey);
    console.log('NavigationComponent: isInSidebar is:', this.isInSidebar);

    if (this.isInSidebar) {
      this.onCloseSidebar(); // Sidebar schließen, wenn im Sidebar-Modus
    }

    const translatedPathKey = AppRouteKeys[appRouteKey];
    const currentLang = this.activeLanguage;

    const targetMainRoute = mainRoutes.find(route => route.data?.['translationKey'] === translatedPathKey);
    const fragmentId = targetMainRoute?.data?.['fragmentId'];

    const translatedPathSegment = this.translate.instant(translatedPathKey);

    let navigationPathSegments: string[];
    let targetUrlPath: string; // Die vollständige Ziel-URL (ohne Fragment)

    if (appRouteKey === 'home' && translatedPathSegment === '') {
      navigationPathSegments = ['/', currentLang];
      targetUrlPath = `/${currentLang}`;
    } else {
      navigationPathSegments = ['/', currentLang, translatedPathSegment];
      targetUrlPath = `/${currentLang}/${translatedPathSegment}`;
    }

    const currentRouterUrl = this.router.url.split('#')[0]; // Aktueller Pfad ohne Fragment

    console.log('--- Debugging navigateToSection ---');
    console.log('targetAppRouteKey:', appRouteKey);
    console.log('translatedPathKey (from AppRouteKeys):', translatedPathKey);
    console.log('translatedPathSegment (translated):', translatedPathSegment);
    console.log('fragmentId:', fragmentId);
    console.log('targetUrlPath (calculated target):', targetUrlPath);
    console.log('currentRouterUrl (Router.url without fragment):', currentRouterUrl);

    // KERNLOGIK: Wenn der aktuelle Pfad NICHT dem Zielpfad entspricht, navigieren wir.
    // Wenn er entspricht, scrollen wir direkt.
    if (currentRouterUrl !== targetUrlPath) {
      console.log(`Paths are different. Performing Router Navigation.`);
      const navigationExtras: NavigationExtras = {
        replaceUrl: true,
        scrollPositionRestoration: 'disabled' // Ganz wichtig: Router soll NICHT automatisch scrollen
      } as NavigationExtras;

      try {
        this.requestedFragment = fragmentId || null; // Fragment für NavigationEnd speichern
        await this.router.navigate(navigationPathSegments, navigationExtras);
        console.log(`Router navigated to: ${navigationPathSegments.join('/')}. Fragment '${fragmentId || 'none'}' will be scrolled after NavigationEnd.`);
      } catch (err) {
        console.error('Navigation failed:', err);
        this.requestedFragment = null; // Im Fehlerfall zurücksetzen
      }
    } else {
      // Wir sind bereits auf dem gewünschten Pfad (z.B. von /de/ueber-mich zu /de/ueber-mich#skills)
      console.log(`Already on path '${targetUrlPath}'. Directly scrolling to '${fragmentId}'.`);
      if (fragmentId) {
        setTimeout(() => {
          this.scrollToElementById(fragmentId);
        }, this.SCROLL_TIMEOUT_MS); // Verwende hier auch den erhöhten Timeout
      } else {
        // Fallback: Wenn keine Fragment-ID, aber gleiche URL, scrolle zum Seitenanfang
        this.viewportScroller.scrollToPosition([0, 0]);
      }
    }
    console.log('--- End Debugging navigateToSection ---');
  }

  // Hilfsfunktion zum Auslesen einer CSS Custom Property
  private getCssVariable(variableName: string): number {
    if (!this.isBrowser) {
      return 0; // Standardwert für SSR
    }
    const rootStyles = getComputedStyle(document.documentElement);
    const value = rootStyles.getPropertyValue(variableName).trim();
    const parsedValue = parseFloat(value.replace('px', ''));
    return isNaN(parsedValue) ? 0 : parsedValue; // Sicherstellen, dass es eine Zahl ist
  }

  /**
   * Hilfsfunktion zum Scrollen zu einem Element anhand seiner ID unter Verwendung von ViewportScroller.
   * @param elementId Die ID des HTML-Elements, zu dem gescrollt werden soll.
   */
  private scrollToElementById(elementId: string): void {
    if (!this.isBrowser) {
      return;
    }

    const headerHeightDesktop = this.getCssVariable('--header-hight');
    const headerHeightMobile = this.getCssVariable('--header-hight-responsive');
    const breakpoint = this.getCssVariable('--breakpoint-width-920');

    let offset: number;

    if (window.innerWidth > breakpoint) {
      offset = headerHeightDesktop;
    } else {
      offset = headerHeightMobile;
    }

    // ACHTUNG: setOffset erwartet ein Array [x, y], wobei y der vertikale Offset ist.
    // Der Offset sollte negativ sein, um Platz für den Header zu lassen.
    // D.h. wir wollen *über* das Element scrollen, nicht das Element *unter* den Header schieben.
    this.viewportScroller.setOffset([0, offset]); // setOffset legt den *Abstand* vom oberen Rand fest, nicht den Scroll-Punkt selbst.
    // Die Funktion scrollt dann zu `element.offsetTop - offset`.

    this.viewportScroller.scrollToAnchor(elementId); // scrollToAnchor ist die korrekte Methode, um mit dem Offset zu scrollen.

    console.log(`ViewportScroller attempted to scroll to anchor: ${elementId} with offset: ${offset} (D: ${headerHeightDesktop}, M: ${headerHeightMobile}, B: ${breakpoint})`);
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
      scrollPositionRestoration: 'disabled' // WICHTIG: Hier auch auf 'disabled' setzen!
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