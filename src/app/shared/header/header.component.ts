// src/app/shared/header/header.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateService, TranslateModule, LangChangeEvent } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { BaseTranslatableComponent } from '../base/base.component';

@Component({
    selector: 'app-header',
    imports: [
        CommonModule,
        RouterLink,
        TranslateModule
    ],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent extends BaseTranslatableComponent implements OnInit {

  constructor(public override translate: TranslateService) {
    super(translate);
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  // protected override onLanguageChanged(newLang: string): void {
  // }

  setLanguage(lang: string) {
    this.translate.use(lang);
  }
}