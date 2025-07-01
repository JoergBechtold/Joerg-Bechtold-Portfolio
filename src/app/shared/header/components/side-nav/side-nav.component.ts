import { Component } from '@angular/core';
import { HeaderNavComponent } from "../header-nav/header-nav.component";
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [HeaderNavComponent, CommonModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss'
})
export class SidenavComponent {

}
