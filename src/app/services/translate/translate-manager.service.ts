// src/app/core/services/translate-manager.service.ts
import { Injectable } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppRouteKeys } from '../../app.routes';
import { TranslationLogicHelperService } from '../translate/translation-logic-helper.service'; // Pfad aktualisiert

@Injectable({ providedIn: 'root' })
export class TranslateManagerService {
  private _activeLanguageSubject: BehaviorSubject<string>;
  public activeLanguage$: Observable<string>;

  constructor(
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private helper: TranslationLogicHelperService, // Hier wird der Helfer injiziert
  ) {
    this._activeLanguageSubject = new BehaviorSubject<string>(this.translate.currentLang);
    this.activeLanguage$ = this._activeLanguageSubject.asObservable();
    this.setupLangChangeSubscription();
    this.setupInitialLanguage();
  }

  get currentActiveLanguage(): string {
    return this._activeLanguageSubject.getValue();
  }

  async setLanguage(lang: string): Promise<void> {
    if (this.currentActiveLanguage === lang) return;
    const oldLang = this.currentActiveLanguage;
    await this.helper.handleLanguageUpdate(lang, oldLang);
    this._activeLanguageSubject.next(lang);
  }

  async navigateToSection(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    await this.helper.handleSectionNavigation(appRouteKey);
  }

  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    return this.helper.getRouterLinkForAppRoute(key);
  }

  private setupLangChangeSubscription(): void {
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this._activeLanguageSubject.next(event.lang);
    });
  }

  private setupInitialLanguage(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      const langParam = params.get('lang');
      const determinedLang = langParam || this.translate.getDefaultLang();
      if (this._activeLanguageSubject.getValue() !== determinedLang) {
        this._activeLanguageSubject.next(determinedLang);
      }
    });
  }
}