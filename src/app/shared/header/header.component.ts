import { CommonModule } from '@angular/common';
import { Component, OnInit, EventEmitter, Output, Inject, Renderer2 } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderNavComponent } from './components/header-nav/header-nav.component';
import { SidenavComponent } from './components/side-nav/sidenav.component';
import { DOCUMENT } from '@angular/common';

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
export class HeaderComponent implements OnInit {

  isMenuOpen: boolean = false;
  @Output() toggleSidebarEvent = new EventEmitter<void>();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void { }

  toggleSidebar(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.toggleSidebarEvent.emit();

    if (this.isMenuOpen) {
      this.renderer.addClass(this.document.body, 'no-scroll');
    } else {
      this.renderer.removeClass(this.document.body, 'no-scroll');
    }
  }
}