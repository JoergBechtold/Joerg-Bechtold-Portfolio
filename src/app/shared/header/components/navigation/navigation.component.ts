import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterLink
  ],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent implements OnInit {
  activeLanguage: string = 'de';
  @Input() isInSidebar: boolean = false;

  constructor(private translate: TranslateService) { }

  ngOnInit(): void {
    this.activeLanguage = this.translate.currentLang || this.translate.getDefaultLang();
    this.translate.onLangChange.subscribe(lang => {
      this.activeLanguage = lang.lang;
    });
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
  }
}