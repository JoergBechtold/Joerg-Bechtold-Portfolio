import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../../services/translate/translate-manager.service';
import { SkillsdataService } from '../../services/skills/skillsdata.service';
import { AnimateOnScrollDirective } from '../../shared/animation-on-scroll/animate-on-scroll.directive';
import { AppRouteKeys } from '../../app.routes';


@Component({
    selector: 'app-my-skills',
    standalone: true,
    imports: [CommonModule, TranslateModule, AnimateOnScrollDirective],
    templateUrl: './my-skills.component.html',
    styleUrl: './my-skills.component.scss'
})
export class MySkillsComponent implements OnInit {

    skillsdata = inject(SkillsdataService);
    activeLanguage: string = 'de';

    constructor(private translateManager: TranslateManagerService) {

    }

    ngOnInit(): void {
        this.translateManager.activeLanguage$.subscribe(lang => {
            this.activeLanguage = lang;
        });
    }

    async navigateFromSkills(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
        await this.translateManager.navigateToSection(appRouteKey);
    }
}