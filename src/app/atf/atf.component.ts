import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ContactNavAtfComponent } from "./contact-nav-atf/contact-nav-atf.component";
import { BaseTranslatableComponent } from '../shared/base/base.component';
import { TranslateService, TranslateModule, LangChangeEvent } from '@ngx-translate/core';



@Component({
  selector: 'app-atf',
  standalone: true,
  imports: [CommonModule, ContactNavAtfComponent, TranslateModule],
  templateUrl: './atf.component.html',
  styleUrl: './atf.component.scss'
})


export class AtfComponent extends BaseTranslatableComponent implements OnInit {

  constructor(protected override translate: TranslateService) {
    super(translate);
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  // protected override onLanguageChanged(newLang: string): void {

  // }
}
