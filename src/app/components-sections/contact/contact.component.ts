import { Component, OnInit, OnDestroy, Renderer2, Inject, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../../services/translate/translate-manager.service';
import { AnimateOnScrollDirective } from '../../shared/animation-on-scroll/animate-on-scroll.directive';
import { Router, RouterLink } from '@angular/router';
import { AppRouteKeys } from '../../app.routes';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, AnimateOnScrollDirective, RouterLink],
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
    this.translateManager.activeLanguage$.subscribe(lang => {
      this.activeLanguage = lang;
    });
  }

  ngOnDestroy(): void {
    this.applyNoScrollToBody(false);
  }

  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    return this.translateManager.getRouterLink(key);
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  navigateToPrivacyPolicy(): void {
    // Rufe die navigateToSection-Methode des TranslateManagerService auf
    // Hier ist das Problem: 'privacyPolicy' ist der String-Key, nicht die Variable AppRouteKeys.privacyPolicy
    this.translateManager.navigateToSection('privacyPolicy' as keyof typeof AppRouteKeys) // <-- Korrektur hier
      .catch(err => {
        console.error('Fehler beim Navigieren zur Datenschutzseite:', err);
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

  private applyNoScrollToBody(shouldApplyNoScroll: boolean): void {
    if (shouldApplyNoScroll) {
      this.renderer.addClass(this.document.body, 'no-scroll');
    } else {
      this.renderer.removeClass(this.document.body, 'no-scroll');
    }
  }
}