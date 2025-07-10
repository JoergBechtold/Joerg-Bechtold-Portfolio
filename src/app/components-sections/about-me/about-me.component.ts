import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BaseTranslatableComponent } from '../../shared/base/base.component';
import { AnimateOnScrollDirective } from '../../shared/animation-on-scroll/animate-on-scroll.directive'; // Importiere die neue Direktive

@Component({
    selector: 'app-about-me',
    standalone: true,
    imports: [
        TranslateModule,
        CommonModule,
        AnimateOnScrollDirective // Füge die Direktive zu den Imports hinzu
    ],
    templateUrl: './about-me.component.html',
    styleUrl: './about-me.component.scss'
})
export class AboutMeComponent extends BaseTranslatableComponent implements OnInit {
    // Alle @ViewChild, animateLeft/Right Booleans und Observer-Logik können jetzt entfernt werden!
    // Die Direktive übernimmt diese Aufgabe.

    constructor(protected override translate: TranslateService) {
        super(translate);
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }
}