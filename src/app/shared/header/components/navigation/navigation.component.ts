import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { AppRouteKeys } from '../../../../app.routes'; // Sicherstellen, dass AppRouteKeys importiert ist
import { TranslateManagerService } from '../../../../services/translate/translate-manager.service'; // Importiere den neuen Dienst

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
  activeLanguage: string = 'de'; // Wird jetzt vom Dienst abonniert

  @Input() isInSidebar: boolean = false;
  @Output() closeSidebarRequest = new EventEmitter<void>();
  @Output() navigateRequest = new EventEmitter<keyof typeof AppRouteKeys>();

  // Entferne alle privaten Variablen, die in den Dienst verschoben wurden:
  // private isBrowser: boolean;
  // private savedScrollPosition: [number, number] | null = null;
  // private readonly SCROLL_TIMEOUT_MS = 5;

  constructor(
    public translateManager: TranslateManagerService // Injiziere den TranslateManagerService
    // Entferne die anderen Injektionen, die jetzt im Dienst sind:
    // private translate: TranslateService,
    // private router: Router,
    // private activatedRoute: ActivatedRoute,
    // private viewportScroller: ViewportScroller,
    // @Inject(PLATFORM_ID) platformId: Object
  ) {
    // this.isBrowser = isPlatformBrowser(platformId); // Diese Logik ist jetzt im Dienst
  }

  ngOnInit(): void {
    // Abonnieren der aktiven Sprache vom TranslateManagerService
    this.translateManager.activeLanguage$.subscribe(lang => {
      this.activeLanguage = lang;
    });

    // Die gesamte Logik zur Behandlung von LangChange und ParamMap wurde in den Dienst verschoben.
    // Die Scroll-Restoration Logik wurde ebenfalls in den Dienst verschoben.
  }

  onCloseSidebar(): void {
    this.closeSidebarRequest.emit();
  }

  async navigateToSection(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    if (this.isInSidebar) {
      this.onCloseSidebar();
    }
    // Delegiere die Navigation an den TranslateManagerService
    await this.translateManager.navigateToSection(appRouteKey);
  }

  async setLanguage(lang: string): Promise<void> {
    // Delegiere den Sprachwechsel an den TranslateManagerService
    await this.translateManager.setLanguage(lang);
  }

  // Die Methoden getCssVariable und scrollToElementById wurden in den Dienst verschoben und können hier entfernt werden.
  // getRouterLink wurde auch in den Dienst verschoben.
  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    return this.translateManager.getRouterLink(key);
  }
}