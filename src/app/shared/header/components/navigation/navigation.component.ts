// navigation.component.ts
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras, RouterModule } from '@angular/router';
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

  constructor(
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
    });
    this.activatedRoute.paramMap.subscribe(params => {
      const langParam = params.get('lang');
      this.activeLanguage = langParam || this.translate.getDefaultLang();
    });
  }

  onClose(): void {
    this.closeSidenav.emit();
  }

  scrollToSection(fragment: string): void {
    console.log('scrollToSection called with fragment:', fragment); // <-- Hinzufügen
    if (this.isInSidebar) {
      this.onClose(); // Sidebar schließen, wenn in Sidebar-Modus
    }
    this.router.navigate(this.getRouterLink('home'), { fragment: fragment })
      .then(() => {
        console.log('Navigation successful, attempting to scroll to fragment:', fragment); // <-- Hinzufügen
      })
      .catch(err => {
        console.error('Navigation failed:', err); // <-- Hinzufügen
      });
  }

  async setLanguage(lang: string): Promise<void> {
    if (this.activeLanguage === lang) {
      return;
    }

    let targetAppRouteKey: keyof typeof AppRouteKeys | undefined;
    let currentFragment: string | null = null; // Variable zum Speichern des aktuellen Fragments

    let routeSnapshot = this.activatedRoute.snapshot;
    while (routeSnapshot.firstChild) {
      routeSnapshot = routeSnapshot.firstChild;
    }

    // Aktuelles Fragment abrufen
    currentFragment = this.activatedRoute.snapshot.fragment;

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

    let navigationPath: string[];

    const newTranslatedSegment = this.translate.instant(AppRouteKeys[targetAppRouteKey]);

    if (targetAppRouteKey === 'home' && newTranslatedSegment === '') {
      navigationPath = [lang];
    } else {
      navigationPath = [lang, newTranslatedSegment];
    }

    const navigationExtras: NavigationExtras = {
      replaceUrl: true,
      scrollPositionRestoration: 'disabled'
    } as NavigationExtras;

    // Wenn ein Fragment vorhanden ist, füge es zu den NavigationExtras hinzu
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