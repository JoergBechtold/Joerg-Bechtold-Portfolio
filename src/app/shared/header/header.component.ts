import { Component, OnInit, OnDestroy, ViewChild, Inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription, filter } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AppRouteKeys } from '../../app.routes';
import { TranslateManagerService } from '../../services/translate/translate-manager.service';
import { NavigationComponent } from './components/navigation/navigation.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    NavigationComponent,
    SidebarComponent,
    TranslateModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {

  isMenuOpen: boolean = false;
  @ViewChild(NavigationComponent) navigationComponent!: NavigationComponent;
  private subscriptions: Subscription = new Subscription();
  private readonly maxWidthBreakpoint = 920;
  private readonly customBreakpointQuery = `(min-width: ${this.maxWidthBreakpoint + 1}px)`;

  activeLanguage: string = 'de';
  AppRouteKeys = AppRouteKeys;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver,
    private translate: TranslateService,
    private router: Router,
    private translateManager: TranslateManagerService
  ) { }

  ngOnInit(): void {
    this.setupBreakpointObserver();
    this.subscribeToLanguageChanges();
    this.setupRouterScrollHandling();
  }


  onLogoClick(): void {
    const currentLang = this.translateManager.currentActiveLanguage;
    const homePath = `/${currentLang}`;

    this.router.navigateByUrl(homePath, {
      replaceUrl: true,
      skipLocationChange: false,
      onSameUrlNavigation: 'reload'
    })
      .then(() => this.scrollToTopInstant())
      .catch(err => console.error('Fehler beim Navigieren zum Home-Pfad:', err));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleSidebar(): void {
    if (window.innerWidth <= this.maxWidthBreakpoint) {
      this.isMenuOpen = !this.isMenuOpen;
      this.applyNoScrollToBody(this.isMenuOpen);
    } else {
      this.isMenuOpen = false;
      this.applyNoScrollToBody(false);
    }
  }

  closeSidebar(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
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

  private setupBreakpointObserver(): void {
    this.subscriptions.add(
      this.breakpointObserver
        .observe([this.customBreakpointQuery])
        .subscribe(result => this.handleBreakpointChange(result.matches))
    );
  }

  private handleBreakpointChange(matches: boolean): void {
    if (matches && this.isMenuOpen) {
      this.closeSidebar();
    }
  }

  private subscribeToLanguageChanges(): void {
    this.subscriptions.add(
      this.translateManager.activeLanguage$.subscribe(lang => {
        this.activeLanguage = lang;
      })
    );
  }

  private setupRouterScrollHandling(): void {
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => this.handleNavigationEnd(event))
    );
  }

  private handleNavigationEnd(event: NavigationEnd): void {
    const urlWithoutFragment = event.urlAfterRedirects.split('#')[0];
    const isHomeRoute = urlWithoutFragment === `/${this.activeLanguage}` || urlWithoutFragment === `/${this.activeLanguage}/`;

    if (isHomeRoute) {
      this.scrollToTopDelayed();
    }
  }

  private scrollToTopInstant(): void {
    window.scrollTo(0, 0);
  }

  private scrollToTopDelayed(): void {
    setTimeout(() => {
      this.scrollToTopInstant();
    }, 50);
  }
}