import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppRouteKeys } from '../../app.routes';
import { SocialMediaComponent } from '../social-media/social-media.component';
import { TranslateManagerService } from '../../services/translate/translate-manager.service';

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
  activeLanguage: string = 'de';

  constructor(
    private translate: TranslateService,
    private router: Router,
    private translateManager: TranslateManagerService
  ) { }

  ngOnInit(): void {
    this.translateManager.activeLanguage$.subscribe(lang => {
      this.activeLanguage = lang;
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

  onLogoClick(): void {
    const currentLang = this.translateManager.currentActiveLanguage;
    const homePath = `/${currentLang}`;

    this.router.navigateByUrl(homePath, {
      replaceUrl: true,
      skipLocationChange: false,
      onSameUrlNavigation: 'reload'
    })
      .then(() => {
        window.scrollTo(0, 0);
      })
      .catch(err => {
        console.error('Fehler beim Navigieren zum Home-Pfad:', err);
      });
  }
}