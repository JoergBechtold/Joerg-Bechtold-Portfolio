import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BaseTranslatableComponent } from '../shared/base/base.component';

@Component({
    selector: 'app-legal-notice',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './legal-notice.component.html',
    styleUrl: './legal-notice.component.scss'
})
export class LegalNoticeComponent extends BaseTranslatableComponent implements OnInit, AfterViewInit {

    constructor(
        protected override translate: TranslateService,
    ) {
        super(translate);
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }

    ngAfterViewInit(): void {
        window.scrollTo({ top: 0, left: 0 });
    }
}
