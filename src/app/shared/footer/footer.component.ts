import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppRouteKeys } from '../../app.routes';
import { SocialMediaComponent } from '../social-media/social-media.component';
import { TranslateManagerService } from '../../services/translate/translate-manager.service'; // Sicherstellen, dass dieser Import existiert

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
    private translateManager: TranslateManagerService // Hier ist er!
  ) { }

  ngOnInit(): void {
    this.translateManager.activeLanguage$.subscribe(lang => {
      this.activeLanguage = lang;
    });
  }

  // Diese Methode delegiert nun an den TranslateManagerService
  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    return this.translateManager.getRouterLink(key);
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