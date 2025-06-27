// src/app/shared/footer/footer.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateService, TranslateModule, LangChangeEvent } from '@ngx-translate/core';
import { SocialMediaComponent } from '../social-media/social-media.component';
import { BaseTranslatableComponent } from '../base/base.component';

@Component({
    selector: 'app-footer',
    imports: [CommonModule, SocialMediaComponent, TranslateModule],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
})

export class FooterComponent extends BaseTranslatableComponent implements OnInit {

  constructor(protected override translate: TranslateService) {
    super(translate);
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  // protected override onLanguageChanged(newLang: string): void {

  // }
}