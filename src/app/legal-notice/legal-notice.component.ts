import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../services/translate/translate-manager.service';

@Component({
    selector: 'app-legal-notice',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './legal-notice.component.html',
    styleUrl: './legal-notice.component.scss'
})
export class LegalNoticeComponent implements OnInit, AfterViewInit {
    activeLanguage: string = 'de';

    constructor(private translateManager: TranslateManagerService) { }

    ngOnInit(): void {
        this.translateManager.activeLanguage$.subscribe(lang => {
            this.activeLanguage = lang;
        });
    }

    ngAfterViewInit(): void {
        // Entferne dieses manuelle Scrollen!
        // window.scrollTo({ top: 0, left: 0 });

        // Stattdessen rufe die Service-Methode auf, die das Scrollen mit Timer übernimmt
        // Dies stellt sicher, dass das Scrollen nach der Komponente und Übersetzung geladen ist.
        this.translateManager.scrollToTop(); // <-- Rufe die Methode deines Managers auf
    }
}