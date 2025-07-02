import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { AppRouteKeys, mainRoutes, routes, createLocalizedRoutes } from '../../../../app.routes'; // Importiere 'routes' und 'createLocalizedRoutes'

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
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

  async setLanguage(lang: string): Promise<void> {
    if (this.activeLanguage === lang) {
      return;
    }

    console.log(`[NavigationComponent] Sprachwechsel angefordert: von '${this.activeLanguage}' zu '${lang}'`);

    let targetAppRouteKey: keyof typeof AppRouteKeys | undefined;
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
          console.log(`[NavigationComponent] Gefundener neutraler Pfad (aus mainRoutes): '${mainRoute.path || ''}'`);
          console.log(`[NavigationComponent] Gefundener AppRouteKey (aus mainRoutes): '${targetAppRouteKey}'`);
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
      console.log(`[NavigationComponent] Router-Konfiguration erfolgreich für Sprache '${lang}' zurückgesetzt.`);
      console.log(`[NavigationComponent] Konfigurierte Kindrouten für /${lang}:`, newLocalizedRoutes.map(r => r.path));
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
    console.log(`[NavigationComponent] Navigiere zu neu übersetztem Pfad basierend auf Key '${targetAppRouteKey}' (Zielpfad in Sprache ${lang}): /${navigationPath.join('/')}`);

    this.router.navigate(navigationPath, {
      replaceUrl: true,
      scrollPositionRestoration: 'disabled'
    } as NavigationExtras);
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