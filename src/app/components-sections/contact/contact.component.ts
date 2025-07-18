import { Component, OnInit, OnDestroy, Renderer2, Inject, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../../services/translate/translate-manager.service';
import { AnimateOnScrollDirective } from '../../shared/animation-on-scroll/animate-on-scroll.directive';
import { RouterLink, Router } from '@angular/router';
import { AppRouteKeys } from '../../app.routes';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit, OnDestroy {

  http = inject(HttpClient);

  activeLanguage: string = 'de';
  showEmailSentOverlay: boolean = false;
  privacyAccepted: boolean = false;

  contactData = {
    name: "",
    email: "",
    message: ""
  }

  post = {
    endPoint: 'https://joergbechtold.com/sendMail.php',
    body: (payload: any) => JSON.stringify(payload),
    options: {
      headers: {
        'Content-Type': 'text/plain',
        responseType: 'text',
      },
    },
  };

  constructor(
    private translate: TranslateService,
    private router: Router,
    private translateManager: TranslateManagerService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    const langParam = this.router.url.split('/')[1];
    this.activeLanguage = langParam || this.translate.getDefaultLang();
    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
    });
  }

  ngOnDestroy(): void {
    this.applyNoScrollToBody(false);
  }

  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    const translatedPath = this.translate.instant(AppRouteKeys[key]);
    const currentLang = this.activeLanguage;

    if (key === AppRouteKeys.home && translatedPath === '') {
      return ['/', currentLang];
    }
    return ['/', currentLang, translatedPath];
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  onSubmit(ngForm: NgForm) {
    if (ngForm.submitted && ngForm.form.valid) {
      this.http.post(this.post.endPoint, this.post.body(this.contactData), { responseType: 'text' })
        .subscribe({
          next: (response) => {
            this.showEmailSentOverlay = true;
            this.applyNoScrollToBody(true);

            ngForm.resetForm();
            this.privacyAccepted = false;
          },
          error: (error) => {
            console.error('Angular HTTP Error:', error);
          },
          complete: () => console.info('send post complete'),
        });
    }
  }

  closeEmailSentOverlay(): void {
    this.showEmailSentOverlay = false;
    this.applyNoScrollToBody(false);
  }

  async navigateToHomeSection(): Promise<void> {
    await this.translateManager.navigateToSection('home');
  }

  private applyNoScrollToBody(shouldApplyNoScroll: boolean): void {
    if (shouldApplyNoScroll) {
      this.renderer.addClass(this.document.body, 'no-scroll');
    } else {
      this.renderer.removeClass(this.document.body, 'no-scroll');
    }
  }
}