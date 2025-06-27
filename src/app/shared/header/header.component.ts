import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

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
    translate.addLangs(['de', 'en']);
    translate.setDefaultLang('de');
  }

  ngOnInit() {
    const browserLang = this.translate.getBrowserLang();
    const initialLang = browserLang && browserLang.match(/en|de/) ? browserLang : 'de';

    this.translate.use(initialLang).subscribe(() => {
      this.activeLanguage = initialLang;
    });

    this.translate.onLangChange.subscribe(event => {
      this.activeLanguage = event.lang;
    });
  }

  setLanguage(lang: string) {
    this.translate.use(lang);
  }
}