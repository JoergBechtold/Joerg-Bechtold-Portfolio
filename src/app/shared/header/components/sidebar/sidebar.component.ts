import { Component, Output, EventEmitter } from '@angular/core';
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


  onClose(): void {
    this.closeSidenav.emit();
  }

}
