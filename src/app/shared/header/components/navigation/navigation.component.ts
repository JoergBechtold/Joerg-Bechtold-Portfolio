// navigation.component.ts
import { Component, OnInit, Input, EventEmitter, Output, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras, RouterModule, Scroll, Event as RouterEvent } from '@angular/router'; // Importiere Scroll und Event
import { ViewportScroller } from '@angular/common'; // Importiere ViewportScroller
import { filter } from 'rxjs/operators'; // Importiere filter
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
    private viewportScroller: ViewportScroller, // Injiziere ViewportScroller
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

    // **NEU:** Abonniere Router-Events, um nach dem Scroll-Ereignis zu handeln
    if (this.isBrowser) {
      this.router.events.pipe(
        filter((event: RouterEvent): event is Scroll => event instanceof Scroll)
      ).subscribe((event: Scroll) => {
        if (event.position) {
          // Backward navigation (e.g., browser back button)
          this.viewportScroller.scrollToPosition(event.position);
        } else if (event.anchor) {
          // Forward navigation with anchor (hash fragment)
          // Hier können wir reagieren, aber wir nutzen es für unsere Pfad-Fragmente
          this.scrollToElementById(event.anchor);
        } else {
          // Normal navigation to top of the page (if scrollPositionRestoration is 'top')
          this.viewportScroller.scrollToPosition([0, 0]);
        }
      });
    }
  }

  onClose(): void {
    this.closeSidenav.emit();
  }

  /**
   * Navigiert zum übersetzten Pfad, der zu einer Section gehört.
   * Das Scrollen wird über den Router und den ViewportScroller gehandhabt.
   * @param appRouteKey Der Schlüssel aus AppRouteKeys, der den Pfad repräsentiert (z.B. 'aboutMe').
   */
  async navigateToSection(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    console.log('navigateToSection called with AppRouteKey:', appRouteKey);

    if (this.isInSidebar) {
      this.onClose(); // Sidebar schließen, wenn im Sidebar-Modus
    }

    const translatedPathKey = AppRouteKeys[appRouteKey];
    const currentLang = this.activeLanguage;

    // Finde die entsprechende Route, um die fragmentId und den übersetzten Pfad zu erhalten
    const targetMainRoute = mainRoutes.find(route => route.data?.['translationKey'] === translatedPathKey);
    const fragmentId = targetMainRoute?.data?.['fragmentId'];
    const translatedPath = this.translate.instant(translatedPathKey);

    let navigationPath: string[];

    if (appRouteKey === 'home' && translatedPath === '') {
      navigationPath = ['/', currentLang];
    } else {
      navigationPath = ['/', currentLang, translatedPath];
    }

    const navigationExtras: NavigationExtras = {
      replaceUrl: true,
      // HINWEIS: Hier KEIN 'fragment' angeben!
      // 'onSameUrlNavigation: "reload"' in app.config.ts hilft, Navigationen zur gleichen Komponente zu behandeln.
      // Der ViewportScroller kümmert sich um das Scrollen über die fragmentId.
    };

    try {
      // Wenn wir bereits auf dem korrekten Pfad sind, aber zu einer anderen Sektion wollen,
      // müssen wir den Router "zwingen" neu zu navigieren oder das Scrollen direkt auslösen.
      const currentUrlSegments = this.router.url.split('/').filter(s => s !== '' && s !== currentLang);
      const targetUrlSegments = navigationPath.slice(2); // ['ueber-mich']

      // Prüfen, ob der Zielpfad (ohne Sprache) bereits der aktuelle Pfad ist
      const isSamePath = currentUrlSegments.join('/') === targetUrlSegments.join('/');

      if (isSamePath && fragmentId) {
        // Wir sind bereits auf der richtigen URL, aber wir wollen zu einem Fragment scrollen.
        // Der Router wird keine neue Navigation auslösen, also scrollen wir manuell.
        console.log(`Already on path '${navigationPath.join('/')}', directly scrolling to '${fragmentId}'.`);
        this.scrollToElementById(fragmentId);
      } else {
        // Navigiere zur neuen URL. Der ViewportScroller wird im Idealfall das Scrollen übernehmen.
        // Wir übergeben das Fragment als Teil der Navigation, damit der Router es verarbeiten kann.
        // Dies funktioniert im Zusammenspiel mit `anchorScrolling: 'enabled'` in app.config.ts.
        await this.router.navigate(navigationPath, { ...navigationExtras, fragment: fragmentId || undefined });
        console.log(`Mapsd to ${navigationPath.join('/')} with fragment ${fragmentId || 'none'}.`);
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
    // Verwende ViewportScroller für reibungsloses Scrollen.
    // setOffset sorgt dafür, dass ein fester Header (falls vorhanden) nicht überdeckt.
    this.viewportScroller.setOffset([0, 60]); // Beispiel: 60px Offset für einen festen Header
    this.viewportScroller.scrollToAnchor(elementId);
    console.log(`ViewportScroller attempted to scroll to anchor: ${elementId}`);

    // Fallback, falls ViewportScroller aus irgendeinem Grund nicht funktioniert
    // (z.B. wenn das Element nicht sofort im DOM ist).
    // Diese setTimeout-Variante ist dein bestehender Code.
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log(`Fallback: Manually scrolled to element with ID: ${elementId}`);
      } else {
        console.warn(`Element with ID '${elementId}' not found for manual fallback scrolling.`);
      }
    }, 300); // Etwas höherer Timeout für den Fallback
  }

  async setLanguage(lang: string): Promise<void> {
    if (this.activeLanguage === lang) {
      return;
    }

    let targetAppRouteKey: keyof typeof AppRouteKeys | undefined;
    let currentFragment: string | null = null;

    currentFragment = this.activatedRoute.snapshot.fragment; // Holen des aktuellen Fragments

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
      scrollPositionRestoration: 'disabled' // Hier disabled, da wir nur die URL aktualisieren und Fragment beibehalten
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