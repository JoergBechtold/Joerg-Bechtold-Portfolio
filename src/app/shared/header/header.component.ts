import { CommonModule } from '@angular/common';
import { Component, OnInit, EventEmitter, Output, Inject, Renderer2, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderNavComponent } from './components/header-nav/header-nav.component';
import { SidenavComponent } from './components/side-nav/sidenav.component';
import { DOCUMENT } from '@angular/common';

import { BreakpointObserver } from '@angular/cdk/layout'; // <-- Importe für BreakpointObserver
import { Subscription } from 'rxjs'; // <-- Import für Subscription

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeaderNavComponent,
    SidenavComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {

  isMenuOpen: boolean = false;
  @Output() toggleSidebarEvent = new EventEmitter<void>();

  private breakpointSubscription: Subscription = new Subscription();

  // Definiere BEIDE Breakpoints:
  // 1. Numerischer Breakpoint für window.innerWidth Vergleiche
  private readonly maxWidthBreakpoint = 920;
  // 2. String-Breakpoint für den BreakpointObserver
  private readonly customBreakpointQuery = `(min-width: ${this.maxWidthBreakpoint + 1}px)`;


  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit(): void {
    // Beobachte die Media Query
    this.breakpointSubscription = this.breakpointObserver
      .observe([this.customBreakpointQuery]) // <-- Verwende den String-Breakpoint hier
      .subscribe(result => {
        if (result.matches) {
          // Wenn die Breite > 920px ist und das Menü geöffnet ist, schließe es
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


    if (currentWindowWidth > this.maxWidthBreakpoint) {
      this.isMenuOpen = false;
    } else {
      this.isMenuOpen = !this.isMenuOpen;
    }

    this.toggleSidebarEvent.emit();

    if (this.isMenuOpen) {
      this.renderer.addClass(this.document.body, 'no-scroll');
    } else {
      this.renderer.removeClass(this.document.body, 'no-scroll');
    }
  }
}