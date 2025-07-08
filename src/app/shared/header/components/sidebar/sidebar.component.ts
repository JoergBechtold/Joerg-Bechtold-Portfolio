// sidebar.component.ts
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
  // Das Event, das an den Header weitergeleitet wird (könnte umbenannt werden, um klarer zu sein)
  @Output() closeSidebarEvent = new EventEmitter<void>(); // Umbenannt von closeSidenav zu closeSidebarEvent für mehr Klarheit

  // Der Input-Parameter, der den Öffnungszustand vom Header erhält
  @Input() isMenuOpen: boolean = false; // Dieser ist korrekt

  // Methode, die aufgerufen wird, wenn die NavigationComponent ein Schließ-Event sendet
  handleNavigationCloseRequest(): void {
    console.log('SidebarComponent: Received close request from NavigationComponent. Emitting to HeaderComponent.');
    this.closeSidebarEvent.emit(); // Emittiert das Event an den Header
  }
}