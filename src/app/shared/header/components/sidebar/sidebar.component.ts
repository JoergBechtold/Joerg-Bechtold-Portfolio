import { Component, Output, EventEmitter, Input } from '@angular/core';
import { NavigationComponent } from "../navigation/navigation.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NavigationComponent, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Output() closeSidebarEvent = new EventEmitter<void>();
  @Input() isMenuOpen: boolean = false;


  handleNavigationCloseRequest(): void {
    this.closeSidebarEvent.emit();
  }
}