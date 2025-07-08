import { Component, OnInit, Input, EventEmitter, Output, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras, RouterModule, Scroll, Event as RouterEvent } from '@angular/router';
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

    // Diesen Teil können wir beibehalten, er ist für die Browser-Zurück/Vorwärts-Navigation nützlich,
    // falls ein Nutzer direkt zu einer URL mit Fragment navigiert hat.
    if (this.isBrowser) {
      this.router.events.pipe(
        filter((event: RouterEvent): event is Scroll => event instanceof Scroll)
      ).subscribe((event: Scroll) => {
        if (event.position) {
          this.viewportScroller.scrollToPosition(event.position);
        } else if (event.anchor) {
          // Hier können wir das Scrollen auslösen, wenn der Router ein Fragment findet (z.B. bei einem Browser-Refresh auf einer Fragment-URL)
          // Wir verwenden unsere scrollToElementById Methode
          this.scrollToElementById(event.anchor);
        } else {
          this.viewportScroller.scrollToPosition([0, 0]);
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
    const fragmentId = targetMainRoute?.data?.['fragmentId']; // Diesen behalten wir für das manuelle Scrollen

    const translatedPath = this.translate.instant(translatedPathKey);

    let navigationPath: string[];

    if (appRouteKey === 'home' && translatedPath === '') {
      navigationPath = ['/', currentLang];
    } else {
      navigationPath = ['/', currentLang, translatedPath];
    }

    const navigationExtras: NavigationExtras = {
      replaceUrl: true,
      // *** Wichtig: Hier KEIN 'fragment' übergeben! ***
      // scrollPositionRestoration auf 'disabled' setzen, wenn du die volle Kontrolle übernehmen willst,
      // oder 'top', wenn du nur das Fragment entfernen willst, aber Angular den Scrolltop selbst verwalten soll.
      // Da wir manuell scrollen, ist 'disabled' oft sinnvoller.
      scrollPositionRestoration: 'disabled'
    } as NavigationExtras;

    try {
      await this.router.navigate(navigationPath, navigationExtras);
      console.log(`Mapsd to ${navigationPath.join('/')}. Fragment '${fragmentId || 'none'}' will be scrolled manually.`);

      // Führe das Scrollen manuell aus, nachdem die Navigation abgeschlossen ist.
      // Ein kleiner Timeout kann helfen, falls das DOM noch nicht ganz stabil ist.
      if (fragmentId) {
        // Option 1: Scrollen direkt nach der Navigation
        // Dies funktioniert oft, aber bei sehr schnellen Navigationen oder komplexen Komponenten
        // könnte das Element noch nicht vollständig im DOM sein.
        // this.scrollToElementById(fragmentId);

        // Option 2 (Empfohlen): Scrollen mit einem kleinen Timeout
        // Gibt dem Browser etwas Zeit, das DOM zu aktualisieren und das Element zu rendern.
        setTimeout(() => {
          this.scrollToElementById(fragmentId);
        }, 100); // 100ms ist oft ein guter Wert, kann bei Bedarf angepasst werden.
      }

    } catch (err) {
      console.error('Navigation failed:', err);
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
      // Bei Sprachwechsel behalten wir das Fragment bei, damit die Seite an derselben Stelle bleibt.
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