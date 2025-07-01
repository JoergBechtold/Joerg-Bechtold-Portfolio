// src/app/shared/LINK/LINK.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Für Angular-Direktiven wie ngIf, ngFor etc.
import { RouterLink, Router } from '@angular/router'; // Für [routerLink] und Router
import { TranslateService, TranslateModule } from '@ngx-translate/core'; // Für die Übersetzungen
import { AppRouteKeys } from '../../app.routes'; // WICHTIG: Pfad zu deiner app.routes.ts
import { SocialMediaComponent } from '../social-media/social-media.component';

@Component({
  selector: 'app-footer',
  standalone: true, // Oder entferne dies, wenn es kein Standalone-Component ist und in einem Modul deklariert wird
  imports: [
    CommonModule,
    RouterLink,       // Für [routerLink]
    TranslateModule,
    SocialMediaComponent  // Für die translate-Pipe
    // Wenn du <app-social-media> hast, muss SocialMediaComponent hier auch importiert werden
    // SocialMediaComponent
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  activeLanguage: string = '';

  constructor(
    private translate: TranslateService,
    private router: Router // Den Router hier injizieren, um die aktuelle Sprache zu bekommen
  ) { }

  ngOnInit(): void {
    // Hole die aktuelle Sprache aus dem Router, wenn die Komponente initialisiert wird
    const langParam = this.router.url.split('/')[1]; // Holt 'de' aus '/de/impressum'
    this.activeLanguage = langParam || this.translate.getDefaultLang();

    // Reagiere auf Sprachwechsel, falls der Nutzer die Sprache später ändert
    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
    });
  }

  // Hilfsfunktion, um den routerLink für die Navigation zu generieren
  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    const translatedPath = this.translate.instant(AppRouteKeys[key]);
    const currentLang = this.activeLanguage;

    // Sonderbehandlung für den Home-Pfad, wenn er leer ist
    if (key === AppRouteKeys.home && translatedPath === '') {
      return ['/', currentLang];
    }
    return ['/', currentLang, translatedPath];
  }
}