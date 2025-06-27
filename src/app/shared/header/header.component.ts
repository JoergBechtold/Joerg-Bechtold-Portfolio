import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { LangChangeEvent } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  activeLanguage: string = 'de';

  constructor(public translate: TranslateService) {

  }

  ngOnInit() {
    this.activeLanguage = this.translate.currentLang;
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.activeLanguage = event.lang;
      console.log('Sprache im Header geändert zu:', this.activeLanguage);
    });


  }
  setLanguage(lang: string) {
    this.translate.use(lang);
  }
}