import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnInit, EventEmitter, Output, Inject, Renderer2, OnDestroy } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router'; // Router und ActivatedRoute hinzugefügt
import { NavigationComponent } from './components/navigation/navigation.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core'; // TranslateService und TranslateModule hinzugefügt
import { AppRouteKeys } from '../../app.routes'; // AppRouteKeys hinzugefügt

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NavigationComponent,
    SidebarComponent,
    TranslateModule // TranslateModule hinzugefügt
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {

  isMenuOpen: boolean = false;
  @Output() toggleSidebarEvent = new EventEmitter<void>();

  private breakpointSubscription: Subscription = new Subscription();
  private readonly maxWidthBreakpoint = 920;
  private readonly customBreakpointQuery = `(min-width: ${this.maxWidthBreakpoint + 1}px)`;

  // NEU: Für die Übersetzungslogik
  activeLanguage: string = '';
  // AppRouteKeys direkt verfügbar machen, falls im Template benötigt
  AppRouteKeys = AppRouteKeys;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver,
    private translate: TranslateService, // NEU: TranslateService injizieren
    private router: Router, // NEU: Router injizieren
    private activatedRoute: ActivatedRoute // NEU: ActivatedRoute injizieren
  ) { }

  ngOnInit(): void {
    // Bestehende Breakpoint-Logik
    this.breakpointSubscription = this.breakpointObserver
      .observe([this.customBreakpointQuery])
      .subscribe(result => {
        if (result.matches) {
          if (this.isMenuOpen) {
            this.closeSidebar(); // Sidebar schließen, wenn Breakpoint erreicht wird
          }
        }
      });

    // NEU: Logik zur Bestimmung der aktiven Sprache (ähnlich wie im Footer)
    // Initialen Sprachparameter aus der URL lesen
    this.activatedRoute.paramMap.subscribe(params => {
      const langParam = params.get('lang');
      this.activeLanguage = langParam || this.translate.getDefaultLang();
    });

    // Auf Sprachwechsel reagieren
    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
    });
  }

  ngOnDestroy(): void {
    this.breakpointSubscription.unsubscribe();
    // Optional: Abonnements für translate.onLangChange und activatedRoute.paramMap
    // könnten hier auch unsubscribed werden, wenn sie nicht von anderen Subscriptions
    // verwaltet werden (z.B. wenn sie in einem Subscription-Container gesammelt werden).
    // Für diese einfachen Fälle ist es oft nicht kritisch, da die Komponente zerstört wird.
  }

  toggleSidebar(): void {
    const currentWindowWidth = window.innerWidth;
    if (currentWindowWidth <= this.maxWidthBreakpoint) {
      this.isMenuOpen = !this.isMenuOpen;
      this.applyNoScrollToBody(this.isMenuOpen);
      this.toggleSidebarEvent.emit();
    } else {
      this.isMenuOpen = false;
      this.applyNoScrollToBody(false);
      this.toggleSidebarEvent.emit();
    }
  }

  closeSidebar(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
      this.applyNoScrollToBody(false);
      this.toggleSidebarEvent.emit();
    }
  }

  private applyNoScrollToBody(shouldApplyNoScroll: boolean): void {
    if (shouldApplyNoScroll) {
      this.renderer.addClass(this.document.body, 'no-scroll');
    } else {
      this.renderer.removeClass(this.document.body, 'no-scroll');
    }
  }

  /**
   * NEU: Methode zur Generierung von Router-Links mit aktuellem Sprachpräfix.
   * Ähnlich wie in der FooterComponent.
   */
  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    const translatedPath = this.translate.instant(AppRouteKeys[key]);
    const currentLang = this.activeLanguage; // Nutzt die in ngOnInit gesetzte aktive Sprache

    // Sonderbehandlung für die Home-Route, die einen leeren Pfad haben kann
    if (key === 'home' && translatedPath === '') { // Beachten Sie 'home' als String-Literal
      return ['/', currentLang];
    }
    // Für alle anderen Routen: ['/', Sprache, übersetzter_Pfad]
    return ['/', currentLang, translatedPath];
  }
}