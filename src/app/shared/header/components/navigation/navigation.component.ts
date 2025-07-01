import { Component, OnInit, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Router, RouterLink } from '@angular/router'; // <-- Router und RouterLink importieren
import { AppRouteKeys } from '../../../../app.routes'; // <-- AppRouteKeys importieren (Pfad prüfen!)


@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterLink // <-- RouterLink hier hinzufügen, da es im Template verwendet wird
  ],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})

export class NavigationComponent implements OnInit {
  activeLanguage: string = 'de';
  @Input() isInSidebar: boolean = false;
  @Input() closeSidenav = new EventEmitter<void>(); // <-- Input ist korrekt, aber EventEmitter muss ein Output sein. Siehe unten!

  // Korrektur: Router injizieren
  constructor(private translate: TranslateService, private router: Router) { } // <-- Router hier injizieren

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
      return; // Keine Aktion, wenn die Sprache bereits aktiv ist
    }

    this.translate.use(lang).subscribe(() => {
      const homeTranslatedPath = this.translate.instant(AppRouteKeys.home);
      let navigationPath: string[];

      if (homeTranslatedPath === '') {
        navigationPath = ['/', lang];
      } else {
        navigationPath = ['/', lang, homeTranslatedPath];
      }

      this.router.navigate(navigationPath, { replaceUrl: true });
    });
  }

  // NEUE METHODE: getRouterLink für das Template
  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    const translatedPath = this.translate.instant(AppRouteKeys[key]);
    const currentLang = this.activeLanguage;

    // Sonderbehandlung für den Home-Pfad, wenn er leer ist.
    // Dies muss mit der Logik im langResolver in app.routes.ts übereinstimmen.
    if (key === 'home' && translatedPath === '') { // explizit 'home' String verwenden
      return ['/', currentLang];
    }
    return ['/', currentLang, translatedPath];
  }
}