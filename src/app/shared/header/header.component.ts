// src/app/shared/header/header.component.ts
import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { BaseTranslatableComponent } from '../base/base.component';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent extends BaseTranslatableComponent implements OnInit {
  isMenuOpen: boolean = false;
  @Output() toggleSidebarEvent = new EventEmitter<void>();


  constructor(public override translate: TranslateService) {
    super(translate);
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  setLanguage(lang: string) {
    this.translate.use(lang);
  }


  toggleSidebar(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.toggleSidebarEvent.emit();
  }
}