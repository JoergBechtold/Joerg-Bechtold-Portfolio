import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BaseTranslatableComponent } from '../../shared/base/base.component';



@Component({
    selector: 'app-about-me',
    imports: [TranslateModule],
    templateUrl: './about-me.component.html',
    styleUrl: './about-me.component.scss'
})
export class AboutMeComponent extends BaseTranslatableComponent {
    constructor(protected override translate: TranslateService) {
        super(translate);
    }
    override ngOnInit(): void {
        super.ngOnInit();
    }

}
