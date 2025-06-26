import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ContactNavAtfComponent } from "./contact-nav-atf/contact-nav-atf.component";

@Component({
  selector: 'app-atf',
  standalone: true,
  imports: [CommonModule, ContactNavAtfComponent],
  templateUrl: './atf.component.html',
  styleUrl: './atf.component.scss'
})
export class AtfComponent {

}
