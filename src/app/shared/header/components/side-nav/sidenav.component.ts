import { Component } from '@angular/core';
import { HeaderNavComponent } from "../header-nav/header-nav.component";

@Component({
  selector: 'app-sidenav',
  imports: [HeaderNavComponent, HeaderNavComponent],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {

}
