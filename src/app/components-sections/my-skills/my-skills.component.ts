import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
// Importiere deinen TranslateManagerService mit dem neuen Pfad
import { TranslateManagerService } from '../../services/translate/translate-manager.service';
import { SkillsdataService } from '../../services/skills/skillsdata.service';
import { AnimateOnScrollDirective } from '../../shared/animation-on-scroll/animate-on-scroll.directive';

@Component({
    selector: 'app-my-skills',
    standalone: true,
    imports: [CommonModule, TranslateModule, AnimateOnScrollDirective],
    templateUrl: './my-skills.component.html',
    styleUrl: './my-skills.component.scss'
})
export class MySkillsComponent implements OnInit { // Erbt nicht mehr von BaseTranslatableComponent

    skillsdata = inject(SkillsdataService);
    activeLanguage: string = 'de'; // Füge diese Eigenschaft hinzu, falls du die Sprache im Template benötigst

    constructor(
        // Injiziere den TranslateManagerService
        private translateManager: TranslateManagerService
        // TranslateService ist hier nicht mehr direkt im Konstruktor nötig,
        // da der TranslateManagerService ihn intern verwendet.
        // Falls du TranslateService für andere Zwecke benötigst, kannst du ihn beibehalten.
        // protected translate: TranslateService // <-- nur wenn du ihn hier noch direkt brauchst
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
}