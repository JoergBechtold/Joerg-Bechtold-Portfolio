import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core'; // TranslateService wird hier nicht mehr direkt im Konstruktor benötigt
// Dein TranslateManagerService mit dem korrigierten Pfad
import { TranslateManagerService } from '../../services/translate/translate-manager.service';
import { AnimateOnScrollDirective } from '../../shared/animation-on-scroll/animate-on-scroll.directive';

@Component({
    selector: 'app-portfolio',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './portfolio.component.html',
    styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit { // Implementiere OnInit

    // Wenn du die aktive Sprache in der Komponente benötigst, kannst du sie so speichern
    activeLanguage: string = 'de'; // Initialwert, wird durch das Abonnement aktualisiert

    constructor(
        // Injiziere den TranslateManagerService
        private translateManager: TranslateManagerService
    ) {
        // Der Konstruktor kann hier leer bleiben, da die Initialisierungslogik
        // in ngOnInit und durch den Service gehandhabt wird.
    }

    ngOnInit(): void {
        // Abonniere die aktive Sprache vom TranslateManagerService.
        // Dies ist nützlich, wenn du basierend auf der Sprache
        // Logik in der Komponente oder im Template anpassen möchtest.
        this.translateManager.activeLanguage$.subscribe(lang => {
            this.activeLanguage = lang;
        });

        // Füge hier spezifische Initialisierungslogik für die PortfolioComponent hinzu, falls vorhanden.
    }
}