import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { AppRouteKeys } from '../../../../app.routes';
import { TranslateManagerService } from '../../../../services/translate/translate-manager.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  activeLanguage: string = 'de';

  @Input() isInSidebar: boolean = false;
  @Output() closeSidebarRequest = new EventEmitter<void>();
  @Output() navigateRequest = new EventEmitter<keyof typeof AppRouteKeys>();

  constructor(public translateManager: TranslateManagerService) { }

  ngOnInit(): void {
    this.translateManager.activeLanguage$.subscribe(lang => {
      this.activeLanguage = lang;
    });
  }

  onCloseSidebar(): void {
    this.closeSidebarRequest.emit();
  }

  async navigateToSection(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    if (this.isInSidebar) {
      this.onCloseSidebar();
    }
    await this.translateManager.navigateToSection(appRouteKey);
  }

  async setLanguage(lang: string): Promise<void> {
    await this.translateManager.setLanguage(lang);
  }

  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    return this.translateManager.getRouterLink(key);
  }
}