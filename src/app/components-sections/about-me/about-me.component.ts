import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
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
export class AboutMeComponent implements OnInit {
    activeLanguage: string = 'de';

    constructor(private translateManager: TranslateManagerService) { }

    ngOnInit(): void {
        this.translateManager.activeLanguage$.subscribe(lang => {
            this.activeLanguage = lang;
        });
    }
}