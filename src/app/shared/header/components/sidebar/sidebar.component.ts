import { Component } from '@angular/core';
import { HeaderNavComponent } from "../navigation/navigation.component";
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [HeaderNavComponent, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

}
