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
  @Output() closeSidenav = new EventEmitter<void>();

  @Input() isMenuOpen: boolean = false;


  onClose(): void {
    console.log('SidebarComponent: closeSidenav event emitted');
    this.closeSidenav.emit();
  }



}
