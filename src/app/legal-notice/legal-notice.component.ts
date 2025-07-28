import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../services/translate/translate-manager.service';
import { TranslationLogicHelperService } from '../services/translate/translation-logic-helper.service';

@Component({
    selector: 'app-legal-notice',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './legal-notice.component.html',
    styleUrl: './legal-notice.component.scss'
})
export class LegalNoticeComponent implements OnInit, AfterViewInit {
    activeLanguage: string = 'de';

    constructor(private translateManager: TranslateManagerService, private translationLogicHelper: TranslationLogicHelperService) { }

    ngOnInit(): void {
        this.translateManager.activeLanguage$.subscribe(lang => {
            this.activeLanguage = lang;
        });
    }

    ngAfterViewInit(): void {
        this.translationLogicHelper.scrollToTop();
    }
}