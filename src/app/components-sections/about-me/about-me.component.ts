import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
// Importiere deinen TranslateManagerService mit dem korrigierten Pfad
import { TranslateManagerService } from '../../services/translate/translate-manager.service';
import { AnimateOnScrollDirective } from '../../shared/animation-on-scroll/animate-on-scroll.directive';

@Component({
    selector: 'app-about-me',
    standalone: true,
    imports: [
        TranslateModule,
        CommonModule,
        AnimateOnScrollDirective
    ],
    templateUrl: './about-me.component.html',
    styleUrl: './about-me.component.scss'
})
export class AboutMeComponent implements OnInit { // Erbt nicht mehr von BaseTranslatableComponent

    // Wenn du die aktive Sprache in der Komponente benötigst, kannst du sie so speichern
    activeLanguage: string = 'de'; // Initialwert, wird durch das Abonnement aktualisiert

    constructor(
        // Injiziere den TranslateManagerService
        private translateManager: TranslateManagerService
    ) {
        // Die Logik, die vorher in super(translate) war, ist jetzt im TranslateManagerService gekapselt.
    }

    ngOnInit(): void {
        // Abonniere die aktive Sprache vom TranslateManagerService,
        // falls die Komponente darauf reagieren oder sie anzeigen muss.
        this.translateManager.activeLanguage$.subscribe(lang => {
            this.activeLanguage = lang;
        });

        // Hier kannst du weitere Initialisierungslogik deiner AboutMeComponent hinzufügen.
        // Die Logik, die vorher in super.ngOnInit() war (z.B. das Abonnieren von onLangChange),
        // wird jetzt direkt vom TranslateManagerService verwaltet.
    }
}