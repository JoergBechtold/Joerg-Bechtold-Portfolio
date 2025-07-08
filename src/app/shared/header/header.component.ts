// header.component.ts
import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnInit, EventEmitter, Output, Inject, Renderer2, OnDestroy } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { NavigationComponent } from './components/navigation/navigation.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppRouteKeys } from '../../app.routes';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NavigationComponent,
    SidebarComponent,
    TranslateModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {

  isMenuOpen: boolean = false;
  // @Output() toggleSidebarEvent = new EventEmitter<void>(); // Dieser Output wird für die Kommunikation mit dem NavigationComponent nicht mehr direkt benötigt.

  private breakpointSubscription: Subscription = new Subscription();
  private readonly maxWidthBreakpoint = 920;
  private readonly customBreakpointQuery = `(min-width: ${this.maxWidthBreakpoint + 1}px)`;

  activeLanguage: string = '';
  AppRouteKeys = AppRouteKeys;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver,
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.breakpointSubscription = this.breakpointObserver
      .observe([this.customBreakpointQuery])
      .subscribe(result => {
        if (result.matches) {
          if (this.isMenuOpen) {
            this.closeSidebar();
          }
        }
      });

    this.activatedRoute.paramMap.subscribe(params => {
      const langParam = params.get('lang');
      this.activeLanguage = langParam || this.translate.getDefaultLang();
    });

    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
    });
  }

  ngOnDestroy(): void {
    this.breakpointSubscription.unsubscribe();
  }

  toggleSidebar(): void {
    const currentWindowWidth = window.innerWidth;
    if (currentWindowWidth <= this.maxWidthBreakpoint) {
      this.isMenuOpen = !this.isMenuOpen;
      console.log('HeaderComponent: toggleSidebar - isMenuOpen is now:', this.isMenuOpen); // Hinzufügen
      this.applyNoScrollToBody(this.isMenuOpen);
    } else {
      this.isMenuOpen = false;
      console.log('HeaderComponent: toggleSidebar - isMenuOpen is now (else branch):', this.isMenuOpen); // Hinzufügen
      this.applyNoScrollToBody(false);
    }
  }

  // Diese Funktion soll vom Kind aufgerufen werden können
  closeSidebar(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
      console.log('HeaderComponent: closeSidebar called - isMenuOpen is now:', this.isMenuOpen); // Hinzufügen
      this.applyNoScrollToBody(false);
    }
  }

  private applyNoScrollToBody(shouldApplyNoScroll: boolean): void {
    if (shouldApplyNoScroll) {
      this.renderer.addClass(this.document.body, 'no-scroll');
    } else {
      this.renderer.removeClass(this.document.body, 'no-scroll');
    }
  }

  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    const translatedPath = this.translate.instant(AppRouteKeys[key]);
    const currentLang = this.activeLanguage;

    if (key === 'home' && translatedPath === '') {
      return ['/', currentLang];
    }
    return ['/', currentLang, translatedPath];
  }
}