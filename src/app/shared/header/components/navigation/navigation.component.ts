// src/app/shared/header/components/navigation/navigation.component.ts
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Router, RouterLink, ActivatedRoute, UrlSegment, NavigationExtras } from '@angular/router'; // NavigationExtras importieren
import { AppRouteKeys } from '../../../../app.routes';

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
    this.activeLanguage = this.translate.currentLang || this.translate.getDefaultLang();
    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
    });
  }

  onClose(): void {
    this.closeSidenav.emit();
  }

  setLanguage(lang: string): void {
    if (this.activeLanguage === lang) {
      return;
    }

    const oldActiveLanguage = this.activeLanguage;
    console.log(`[NavigationComponent] Sprachwechsel angefordert: von '${oldActiveLanguage}' zu '${lang}'`);

    let currentUrlPathSegment: string = '';
    const rootSnapshot = this.router.routerState.snapshot.root;
    const langRouteSnapshot = rootSnapshot.children.find(
      child => child.url.length > 0 && child.url[0].path === oldActiveLanguage
    );

    if (langRouteSnapshot && langRouteSnapshot.firstChild) {
      currentUrlPathSegment = langRouteSnapshot.firstChild.url.map((s: UrlSegment) => s.path).join('/');
    } else {
      const urlSegments = this.router.url.split('/').filter(s => s !== '');
      if (urlSegments.length > 1) {
        currentUrlPathSegment = urlSegments.slice(1).join('/');
      } else {
        currentUrlPathSegment = '';
      }
    }
    console.log(`[NavigationComponent] Aktueller URL-Pfad (robust extrahiert): '${currentUrlPathSegment}'`);

    let targetAppRouteKey: keyof typeof AppRouteKeys | undefined;

    const currentTranslateServiceLang = this.translate.currentLang;

    this.translate.use(oldActiveLanguage);

    for (const key of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
      const translatedValueInSourceLang = this.translate.instant(AppRouteKeys[key]);
      const effectiveTranslatedValueInSourceLang = (key === 'home' && translatedValueInSourceLang === '') ? '' : translatedValueInSourceLang;

      console.log(`   [NavigationComponent] Prüfe Key: ${key}, Übersetzter Wert (in URSPRÜNGLICHER URL-Sprache '${oldActiveLanguage}'): '${translatedValueInSourceLang}', Effektiv: '${effectiveTranslatedValueInSourceLang}'`);

      if (effectiveTranslatedValueInSourceLang === currentUrlPathSegment) {
        targetAppRouteKey = key;
        console.log(`   [NavigationComponent] Match gefunden für AppRouteKey: ${key}`);
        break;
      }
    }

    this.translate.use(currentTranslateServiceLang);
    console.log(`[NavigationComponent] Nach Reverse Lookup: TranslateService wieder auf Originalzustand '${currentTranslateServiceLang}' gesetzt.`);

    let navigationPath: string[];

    if (targetAppRouteKey) {
      this.translate.use(lang); // Temporärer Wechsel zur Zielsprache für instant()
      const newTranslatedSegment = this.translate.instant(AppRouteKeys[targetAppRouteKey]);
      this.translate.use(currentTranslateServiceLang); // Sofort zurück zur ursprünglichen Sprache

      if (targetAppRouteKey === 'home' && newTranslatedSegment === '') {
        navigationPath = [lang]; // Home-Pfad ist nur /:lang
      } else {
        navigationPath = [lang, newTranslatedSegment]; // /:lang/übersetzter-pfad
      }
      console.log(`[NavigationComponent] Navigiere zu neu übersetztem Pfad basierend auf Key '${targetAppRouteKey}' (Zielpfad in Sprache ${lang}): /${navigationPath.join('/')}`);
    } else {
      console.warn(`[NavigationComponent] KEIN MATCH: Kein passender AppRouteKey für den aktuellen URL-Pfad '${currentUrlPathSegment}' in der Quellsprache gefunden. Leite zur Home-Seite um.`);
      this.translate.use(lang); // Temporärer Wechsel zur Zielsprache für instant()
      const homeTranslatedPath = this.translate.instant(AppRouteKeys.home);
      this.translate.use(currentTranslateServiceLang); // Sofort zurück zur ursprünglichen Sprache

      if (homeTranslatedPath === '') {
        navigationPath = [lang];
      } else {
        navigationPath = [lang, homeTranslatedPath];
      }
      console.log(`[NavigationComponent] Fallback-Navigation zur Home-Seite (Zielpfad in Sprache ${lang}): /${navigationPath.join('/')}`);
    }

    // Führe die Navigation aus und deaktiviere das Scrollen für den Sprachwechsel
    this.router.navigate(navigationPath, {
      replaceUrl: true,
      scrollPositionRestoration: 'disabled' // HIER WURDE ES HINZUGEFÜGT
    } as NavigationExtras); // HIER WURDE DIE TYPUMWANDLUNG HINZUGEFÜGT
  }

  /**
   * Hilfsmethode, um RouterLink-Arrays für das HTML-Template zu generieren.
   * Stellt sicher, dass die Sprache im Pfad korrekt ist.
   */
  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    const translatedPath = this.translate.instant(AppRouteKeys[key]);
    const currentLang = this.activeLanguage; // Nutze die aktuell aktive Sprache

    if (key === 'home' && translatedPath === '') {
      return ['/', currentLang]; // Home-Link ist nur /<sprache>
    }
    return ['/', currentLang, translatedPath]; // Andere Links sind /<sprache>/<übersetzter-pfad>
  }
}
