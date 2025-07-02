import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppRouteKeys } from '../../app.routes';
import { SocialMediaComponent } from '../social-media/social-media.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    SocialMediaComponent
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  activeLanguage: string = '';

  constructor(
    private translate: TranslateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const langParam = this.router.url.split('/')[1];
    this.activeLanguage = langParam || this.translate.getDefaultLang();
    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
    });
  }


  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    const translatedPath = this.translate.instant(AppRouteKeys[key]);
    const currentLang = this.activeLanguage;

    if (key === AppRouteKeys.home && translatedPath === '') {
      return ['/', currentLang];
    }
    return ['/', currentLang, translatedPath];
  }
}