import { Component, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core'; // OnDestroy, Renderer2, Inject hinzugefügt
import { CommonModule, DOCUMENT } from '@angular/common'; // DOCUMENT hinzugefügt
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../../services/translate/translate-manager.service';
import { AnimateOnScrollDirective } from '../../shared/animation-on-scroll/animate-on-scroll.directive';
import { RouterLink, Router } from '@angular/router';
import { AppRouteKeys } from '../../app.routes';
import { Subscription } from 'rxjs'; // Subscription hinzugefügt, falls du später Observables abonnierst

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit, OnDestroy { // OnDestroy implementiert

  activeLanguage: string = 'de';
  showEmailSentOverlay: boolean = false;

  // Injiziere Renderer2 und DOCUMENT
  constructor(
    private translate: TranslateService,
    private router: Router,
    private translateManager: TranslateManagerService,
    private renderer: Renderer2, // <-- Hinzugefügt
    @Inject(DOCUMENT) private document: Document // <-- Hinzugefügt
  ) { }

  ngOnInit(): void {
    const langParam = this.router.url.split('/')[1];
    this.activeLanguage = langParam || this.translate.getDefaultLang();
    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
    });
  }

  // Wichtig: Beim Zerstören der Komponente sicherstellen, dass die 'no-scroll'-Klasse entfernt wird.
  ngOnDestroy(): void {
    this.applyNoScrollToBody(false); // Stellt sicher, dass der Scroll wieder aktiviert wird
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

  sendEmailAndShowConfirmation(): void {
    // Hier würdest du deine Logik zum Senden der E-Mail einfügen.
    // Zum Beispiel ein Service-Aufruf:
    // this.emailService.sendEmail().subscribe(() => {
    //   this.showEmailSentOverlay = true;
    //   this.applyNoScrollToBody(true); // <-- no-scroll hinzufügen
    // });

    // Für dieses Beispiel simulieren wir das Senden und zeigen das Overlay direkt
    this.showEmailSentOverlay = true;
    this.applyNoScrollToBody(true); // <-- no-scroll hinzufügen
  }

  closeEmailSentOverlay(): void {
    this.showEmailSentOverlay = false;
    this.applyNoScrollToBody(false); // <-- no-scroll entfernen
  }

  /**
   * Navigiert zur 'home'-Sektion der Anwendung.
   * Dies repliziert die Funktionalität des Logo-Klicks im Header.
   */
  async navigateToHomeSection(): Promise<void> {
    await this.translateManager.navigateToSection('home');
  }

  /**
   * Fügt die 'no-scroll'-Klasse zum Body hinzu oder entfernt sie.
   * @param shouldApplyNoScroll True, um 'no-scroll' hinzuzufügen, false zum Entfernen.
   */
  private applyNoScrollToBody(shouldApplyNoScroll: boolean): void {
    if (shouldApplyNoScroll) {
      this.renderer.addClass(this.document.body, 'no-scroll');
    } else {
      this.renderer.removeClass(this.document.body, 'no-scroll');
    }
  }
}