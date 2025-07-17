import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ContactNavAtfComponent } from "./contact-nav-atf/contact-nav-atf.component";
import { TranslateModule } from '@ngx-translate/core';
import { TranslateManagerService } from '../services/translate/translate-manager.service';
import { AppRouteKeys } from '../app.routes';

@Component({
  selector: 'app-atf',
  standalone: true,
  imports: [CommonModule, ContactNavAtfComponent, TranslateModule],
  templateUrl: './atf.component.html',
  styleUrl: './atf.component.scss'
})
export class AtfComponent implements OnInit {

  activeLanguage: string = 'de';

  constructor(private translateManager: TranslateManagerService) { }

  ngOnInit(): void {
    this.translateManager.activeLanguage$.subscribe(lang => {
      this.activeLanguage = lang;
    });
  }

  async navigateFromAtf(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    await this.translateManager.navigateToSection(appRouteKey);
  }
}