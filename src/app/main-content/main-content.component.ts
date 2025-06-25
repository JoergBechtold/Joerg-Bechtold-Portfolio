import { Component } from '@angular/core';
import { AtfComponent } from "../atf/atf.component";

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [AtfComponent],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {

}
