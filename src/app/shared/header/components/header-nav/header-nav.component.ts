// src/app/shared/header/components/header-nav/header-nav.component.ts
import { Component, OnInit } from '@angular/core'; // OnInit hinzufügen
import { CommonModule, NgClass } from '@angular/common'; // NgClass für Sprach-Buttons
import { TranslateService, TranslateModule } from '@ngx-translate/core'; // TranslateService und TranslateModule hinzufügen
import { RouterLink } from '@angular/router'; // RouterLink für die Navigationslinks

@Component({
  selector: 'app-header-nav',
  standalone: true, // Wichtig: Stelle sicher, dass sie standalone ist
  imports: [
    CommonModule,     // Für NgClass
    TranslateModule,  // Für translate Pipe
    RouterLink        // Für routerLink
  ],
  templateUrl: './header-nav.component.html',
  styleUrl: './header-nav.component.scss'
})
export class HeaderNavComponent implements OnInit { // Implementiere OnInit

  // Hier wird die TranslateService injiziert
  constructor(private translate: TranslateService) { }

  // Property, um die aktive Sprache zu speichern (für die aktive-button Klasse)
  // Initialisiere es, falls ngOnInit erst später aufgerufen wird
  activeLanguage: string = 'de'; // Setze eine Standard-Startsprache

  ngOnInit(): void {
    // Die Logik, um die aktive Sprache für NgClass zu erhalten
    this.activeLanguage = this.translate.currentLang || this.translate.getDefaultLang();

    // Abonnieren, um auf Sprachwechsel zu reagieren und activeLanguage zu aktualisieren
    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
    });
  }

  // Methode zum Setzen der Sprache
  setLanguage(lang: string): void {
    this.translate.use(lang);
  }
}