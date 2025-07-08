import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BaseTranslatableComponent } from '../../shared/base/base.component';
import { SkillsdataService } from '../../skillsdata.service';

@Component({
    selector: 'app-my-skills',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './my-skills.component.html',
    styleUrl: './my-skills.component.scss'
})
export class MySkillsComponent extends BaseTranslatableComponent implements OnInit {

    skillsdata = inject(SkillsdataService)

    constructor(protected override translate: TranslateService) {
        super(translate);
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }
}
