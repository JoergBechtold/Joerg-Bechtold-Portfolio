// navigation.component.ts
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { AppRouteKeys, mainRoutes } from '../../../../app.routes';

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

    // Hole die aktuell aktive Route vom ActivatedRoute
    let routeSnapshot = this.activatedRoute.snapshot;
    while (routeSnapshot.firstChild) {
      routeSnapshot = routeSnapshot.firstChild;
    }

    // Finde den MainRoute-Eintrag, der zum aktuellen Komponenten-Typ passt.
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

    // Wenn kein passender Key gefunden wurde (z.B. auf einer 404-Seite oder anderen dynamischen Routen),
    // fallback auf die Home-Seite.
    if (!targetAppRouteKey) {
      console.warn(`[NavigationComponent] Konnte keinen AppRouteKey für die aktuelle Komponente finden. Führe Fallback zur Home-Seite aus.`);
      targetAppRouteKey = 'home';
    }

    // WICHTIG: Die Sprache von ngx-translate muss JETZT auf die NEUE Sprache umgestellt werden,
    // BEVOR wir `translate.instant` aufrufen, um den ZIEL-Pfad zu erhalten.
    // Dies stellt sicher, dass `translate.instant` den Pfad in der NEUEN Sprache zurückgibt.
    await this.translate.use(lang).toPromise();

    let navigationPath: string[];
    // Hole den übersetzten Pfad für den gefundenen AppRouteKey in der NEUEN Sprache.
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