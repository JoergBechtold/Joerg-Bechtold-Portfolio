import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../../services/translate/translate-manager.service';
import { AnimateOnScrollDirective } from '../../shared/animation-on-scroll/animate-on-scroll.directive';
import { PortfolioService, Project } from '../../services/portfolio/portfolio.service';


@Component({
    selector: 'app-portfolio',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './portfolio.component.html',
    styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {

    projectsService = inject(PortfolioService);

    projects: Project[] = [];
    activeLanguage: string = 'de';

    constructor(private translateManager: TranslateManagerService) { }

    ngOnInit(): void {
        this.translateManager.activeLanguage$.subscribe(lang => {
            this.activeLanguage = lang;
        });
        this.projects = this.projectsService.projectBox;
    }
}