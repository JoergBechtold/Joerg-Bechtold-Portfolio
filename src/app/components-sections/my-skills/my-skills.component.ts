import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Important for *ngFor
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BaseTranslatableComponent } from '../../shared/base/base.component';

@Component({
    selector: 'app-my-skills',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './my-skills.component.html',
    styleUrl: './my-skills.component.scss'
})
export class MySkillsComponent extends BaseTranslatableComponent implements OnInit {
    skillsBox = [
        {
            name: 'HTML',
            img: './../../../assets/icons/skills-icons/HTML-icon.svg',
        },

        {
            name: 'CSS',
            img: './../../../assets/icons/skills-icons/CSS-icon.svg',
        },

        {
            name: 'JavaScript',
            img: './../../../assets/icons/skills-icons/JAVASCRIPT-icon.svg',
        },
        {
            name: 'TypeScript',
            img: './../../../assets/icons/skills-icons/TYPESCRIPT-icon.svg',
        },
        {
            name: 'ANGULAR',
            img: './../../../assets/icons/skills-icons/ANGULAR-icon.svg',
        },
        {
            name: 'Firebase',
            img: './../../../assets/icons/skills-icons/FIREBASE-icon.svg',
        },
        {
            name: 'Git',
            img: './../../../assets/icons/skills-icons/GIT-icon.svg',
        },
        {
            name: 'REST-API',
            img: './../../../assets/icons/skills-icons/API-icon.svg',
        },
        {
            name: 'Scrum',
            img: './../../../assets/icons/skills-icons/SCRUM-icon.svg',
        },
        {
            name: 'Material Design',
            img: './../../../assets/icons/skills-icons/MATERIEAL-DESIGN-icon.svg',
        }
    ]

    constructor(protected override translate: TranslateService) {
        super(translate);
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }
}
