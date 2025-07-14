import { Component, OnInit } from '@angular/core'; // Importiere OnInit
import { CommonModule } from '@angular/common'; // Häufig benötigt für Angular-Direktiven wie *ngIf, *ngFor
import { TranslateModule } from '@ngx-translate/core'; // Für Übersetzungen im Template
// Dein TranslateManagerService mit dem korrigierten Pfad
import { TranslateManagerService } from '../../services/translate/translate-manager.service';

@Component({
  selector: 'app-contact',
  standalone: true, // Annahme: Sollte auch eine Standalone-Komponente sein
  imports: [CommonModule, TranslateModule], // Füge die benötigten Module hinzu
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit { // Implementiere OnInit

  activeLanguage: string = 'de'; // Initialwert, wird durch das Abonnement aktualisiert

  constructor(
    private translateManager: TranslateManagerService // Injiziere den TranslateManagerService
  ) { }

  ngOnInit(): void {
    // Abonniere die aktive Sprache vom TranslateManagerService,
    // falls die Komponente darauf reagieren oder sie anzeigen muss.
    this.translateManager.activeLanguage$.subscribe(lang => {
      this.activeLanguage = lang;
    });
  }
}