import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidenavComponent } from "./components/side-nav/sidenav.component";
import { HeaderNavComponent } from './components/header-nav/header-nav.component';

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

  constructor() { }

  ngOnInit(): void { }

  toggleSidebar(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.toggleSidebarEvent.emit();
  }
}