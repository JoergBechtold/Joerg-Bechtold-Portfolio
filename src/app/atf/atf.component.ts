import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ContactNavAtfComponent } from "./contact-nav-atf/contact-nav-atf.component";
import { TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../services/translate/translate-manager.service'; // Importiere deinen Service

@Component({
  selector: 'app-atf',
  imports: [CommonModule, ContactNavAtfComponent, TranslateModule],
  templateUrl: './atf.component.html',
  styleUrl: './atf.component.scss'
})
export class AtfComponent implements OnInit { // Erbt nicht mehr von BaseTranslatableComponent

  // Wenn du die aktive Sprache in der Komponente benötigst, kannst du sie so abonnieren
  activeLanguage: string = 'de'; // Initialwert, wird durch das Abonnement aktualisiert

  constructor(
    private translateManager: TranslateManagerService // Injiziere den TranslateManagerService
  ) { }

  ngOnInit(): void {
    // Abonniere die aktive Sprache vom TranslateManagerService
    this.translateManager.activeLanguage$.subscribe(lang => {
      this.activeLanguage = lang;
    });

    // Hier könntest du weitere Initialisierungslogik deiner AtfComponent hinzufügen.
    // Die Logik, die vorher in super.ngOnInit() war, ist jetzt im TranslateManagerService gekapselt.
  }

  // Wenn du Methoden des TranslateManagerService in deinem Template verwenden möchtest,
  // kannst du sie entweder direkt im Template über translateManager.methodeName() aufrufen
  // oder Wrapper-Methoden in dieser Komponente erstellen, falls nötig.
}