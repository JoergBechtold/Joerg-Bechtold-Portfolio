import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../../services/translate/translate-manager.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {

  activeLanguage: string = 'de';

  constructor(private translateManager: TranslateManagerService) { }

  ngOnInit(): void {
    this.translateManager.activeLanguage$.subscribe(lang => {
      this.activeLanguage = lang;
    });
  }
}