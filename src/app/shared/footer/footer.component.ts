import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { LangChangeEvent } from '@ngx-translate/core';
import { SocialMediaComponent } from '../social-media/social-media.component';



@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, SocialMediaComponent, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  activeLanguage: string = 'de';

  constructor(private translate: TranslateService) { }

  ngOnInit() {
    this.activeLanguage = this.translate.currentLang;
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.activeLanguage = event.lang;
      console.log('Sprache im Footer geändert zu:', this.activeLanguage);
    });
  }
}
