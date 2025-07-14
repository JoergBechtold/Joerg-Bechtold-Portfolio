import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core'; // TranslateService ist nicht mehr direkt im Konstruktor nötig
import { TranslateManagerService } from '../services/translate/translate-manager.service';// Dein Service-Pfad

@Component({
    selector: 'app-legal-notice',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './legal-notice.component.html',
    styleUrl: './legal-notice.component.scss'
})
export class LegalNoticeComponent implements OnInit, AfterViewInit { // Erbt nicht mehr von BaseTranslatableComponent

    activeLanguage: string = 'de'; // Füge diese Eigenschaft hinzu, falls du die Sprache im Template benötigst

    constructor(
        // Injiziere den TranslateManagerService
        private translateManager: TranslateManagerService
    ) {
        // super(translate) entfällt, da keine Basisklasse mehr vorhanden
    }

    ngOnInit(): void {
        // super.ngOnInit() entfällt
        // Abonniere die aktive Sprache vom TranslateManagerService,
        // falls die Komponente darauf reagieren oder sie anzeigen muss.
        this.translateManager.activeLanguage$.subscribe(lang => {
            this.activeLanguage = lang;
        });
    }

    ngAfterViewInit(): void {
        // Diese Logik bleibt hier, da sie spezifisch für diese Komponente ist.
        // Sie sorgt dafür, dass die Seite beim Initialisieren der Ansicht zum Anfang scrollt.
        window.scrollTo({ top: 0, left: 0 });
    }
}