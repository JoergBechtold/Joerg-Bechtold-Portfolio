import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // CommonModule kann entfernt werden, wenn nicht explizit in der Klasse verwendet wird
import { TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../services/translate/translate-manager.service'; // Dein Service-Pfad

@Component({
    selector: 'app-privacy-policy',
    // standalone: true, // Fehlte im Original, falls dies eine Standalone-Komponente sein soll
    imports: [CommonModule, TranslateModule], // CommonModule belassen, falls es in deinem Template gebraucht wird
    templateUrl: './privacy-policy.component.html',
    styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent implements OnInit, AfterViewInit { // Erbt nicht mehr von BaseTranslatableComponent

    activeLanguage: string = 'de'; // Füge diese Eigenschaft hinzu, falls du die Sprache im Template benötigst

    constructor(
        private translateManager: TranslateManagerService // Injiziere den TranslateManagerService
    ) {
        // super(translate) entfällt
    }

    ngOnInit(): void {
        // super.ngOnInit() entfällt
        // Abonniere die aktive Sprache, falls benötigt
        this.translateManager.activeLanguage$.subscribe(lang => {
            this.activeLanguage = lang;
        });
    }

    ngAfterViewInit(): void {
        // Diese Logik bleibt hier bestehen
        window.scrollTo({ top: 0, left: 0 });
    }
}