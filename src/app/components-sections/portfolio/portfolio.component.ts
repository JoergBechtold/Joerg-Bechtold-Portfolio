import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../../services/translate/translate-manager.service';
import { AnimateOnScrollDirective } from '../../shared/animation-on-scroll/animate-on-scroll.directive';
import { PortfolioService, Project } from '../../services/portfolio/portfolio.service';


@Component({
    selector: 'app-portfolio',
    standalone: true,
    imports: [CommonModule, TranslateModule, AnimateOnScrollDirective],
    templateUrl: './portfolio.component.html',
    styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {

    projectsService = inject(PortfolioService); // Korrekte Injektion deines Services

    projects: Project[] = []; // Deine Projektliste, korrekt typisiert
    activeLanguage: string = 'de'; // Behält die aktive Sprache

    constructor(private translateManager: TranslateManagerService) { }

    ngOnInit(): void {
        // Beobachtet Änderungen der aktiven Sprache, falls du darauf reagieren musst
        this.translateManager.activeLanguage$.subscribe(lang => {
            this.activeLanguage = lang;
        });

        // Lädt die Projektdaten vom Service in die Komponente
        this.projects = this.projectsService.projectBox;
    }
}