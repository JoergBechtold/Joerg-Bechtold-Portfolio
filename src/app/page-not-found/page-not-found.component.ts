import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppRouteKeys } from '../app.routes';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule
  ],
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})
export class PageNotFoundComponent implements OnInit {
  activeLanguage: string = '';

  constructor(private translate: TranslateService, private router: Router) { }

  ngOnInit(): void {
    const langParam = this.router.url.split('/')[1];
    this.activeLanguage = langParam || this.translate.getDefaultLang();
    this.translate.use(this.activeLanguage);

    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
    });
  }

  getHomeLink(): string[] {
    const translatedHomePath = this.translate.instant(AppRouteKeys.home);
    if (translatedHomePath === '') {
      return ['/', this.activeLanguage];
    }
    return ['/', this.activeLanguage, translatedHomePath];
  }
}