import { CommonModule } from '@angular/common';
import { Component, OnInit, EventEmitter, Output, Inject, Renderer2, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationComponent } from './components/navigation/navigation.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DOCUMENT } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NavigationComponent,
    SidebarComponent
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

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit(): void {
    this.breakpointSubscription = this.breakpointObserver
      .observe([this.customBreakpointQuery])
      .subscribe(result => {
        if (result.matches) {
          if (this.isMenuOpen) {
            this.isMenuOpen = false;
            this.renderer.removeClass(this.document.body, 'no-scroll');
            this.toggleSidebarEvent.emit();
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.breakpointSubscription.unsubscribe();
  }

  toggleSidebar(): void {
    const currentWindowWidth = window.innerWidth;

    this.checkBreakpointAndWindowWith(currentWindowWidth);
    this.toggleSidebarEvent.emit();
    this.applyNoScrollToBody(this.isMenuOpen);
  }

  private checkBreakpointAndWindowWith(currentWindowWidth: number): void {
    if (currentWindowWidth > this.maxWidthBreakpoint) {
      this.isMenuOpen = false;
    } else {
      this.isMenuOpen = !this.isMenuOpen;
    }
  }

  private applyNoScrollToBody(shouldApplyNoScroll: boolean): void {
    if (shouldApplyNoScroll) {
      this.renderer.addClass(this.document.body, 'no-scroll');
    } else {
      this.renderer.removeClass(this.document.body, 'no-scroll');
    }
  }
}