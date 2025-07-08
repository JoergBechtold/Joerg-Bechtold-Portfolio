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

    // Abonniere Router-Events, um nach dem Scroll-Ereignis zu handeln
    // Dies ist hauptsächlich für Browser-Zurück/Vorwärts-Navigation relevant,
    // da unser navigateToSection den ViewportScroller direkt steuert.
    if (this.isBrowser) {
      this.router.events.pipe(
        filter((event: RouterEvent): event is Scroll => event instanceof Scroll)
      ).subscribe((event: Scroll) => {
        if (event.position) {
          // Backward navigation (e.g., browser back button)
          this.viewportScroller.scrollToPosition(event.position);
        } else if (event.anchor) {
          // Forward navigation with anchor (hash fragment)
          // Der Router ruft hier intern ViewportScroller.scrollToAnchor auf,
          // wenn anchorScrolling enabled ist. Wir können hier Logik hinzufügen,
          // wenn wir ein benutzerdefiniertes Verhalten für Router-gesteuertes Scrollen wünschen.
          // In deinem Fall, da du `scrollToElementById` mit `viewportScroller.scrollToAnchor` nutzt,
          // ist dieser Teil redundant, da der Router dies bereits tut.
          // console.log(`Router event scroll to anchor: ${event.anchor}`);
          // this.scrollToElementById(event.anchor); // Dies würde die Doppelausführung verursachen, wenn anchorScrolling: 'enabled' ist
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
      // Das Fragment wird hier direkt übergeben. Der Router wird es dann mit
      // `anchorScrolling: 'enabled'` im Zusammenspiel mit dem ViewportScroller verarbeiten.
      fragment: fragmentId || undefined
    };

    try {
      await this.router.navigate(navigationPath, navigationExtras);
      console.log(`Mapsd to ${navigationPath.join('/')} with fragment ${fragmentId || 'none'}.`);
    } catch (err) {
      console.error('Navigation failed:', err);
    }
  }

  /**
   * Hilfsfunktion zum Scrollen zu einem Element anhand seiner ID unter Verwendung von ViewportScroller.
   * Diese Funktion wird jetzt primär vom Router über `anchorScrolling` aufgerufen,
   * oder falls du sie für andere Zwecke benötigst. Der `setTimeout`-Fallback wird entfernt.
   * @param elementId Die ID des HTML-Elements, zu dem gescrollt werden soll.
   */
  private scrollToElementById(elementId: string): void {
    if (!this.isBrowser) {
      return;
    }
    this.viewportScroller.setOffset([0, 60]); // Beispiel: 60px Offset für einen festen Header
    this.viewportScroller.scrollToAnchor(elementId);
    console.log(`ViewportScroller attempted to scroll to anchor: ${elementId}`);

    // Der setTimeout-Fallback wurde entfernt, da der ViewportScroller zuverlässiger ist
    // und doppelte Scroll-Aktionen vermieden werden sollen.
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