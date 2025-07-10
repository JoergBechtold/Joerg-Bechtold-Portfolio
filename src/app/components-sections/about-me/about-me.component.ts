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
        AnimateOnScrollDirective
    ],
    templateUrl: './about-me.component.html',
    styleUrl: './about-me.component.scss'
})
export class AboutMeComponent extends BaseTranslatableComponent implements OnInit {


    constructor(protected override translate: TranslateService) {
        super(translate);
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }
}