import { Injectable } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppRouteKeys } from '../../app.routes';
import { TranslationLogicHelperService } from '../translate/translation-logic-helper.service';
import { map } from 'rxjs/operators';
import { ViewportScroller } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class TranslateManagerService {
  private activeLanguageSubject: BehaviorSubject<string>;
  public activeLanguage$: Observable<string>;

  constructor(
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private helper: TranslationLogicHelperService,
    private viewportScroller: ViewportScroller,
  ) {
    this.activeLanguageSubject = new BehaviorSubject<string>(this.translate.currentLang || this.translate.getDefaultLang());
    this.activeLanguage$ = this.activeLanguageSubject.asObservable();
    this.setupLangChangeSubscription();
    this.setupInitialLanguage();
  }

  public scrollToTop(): void {
    this.viewportScroller.scrollToPosition([0, 0]);
  }

  get currentActiveLanguage(): string {
    return this.activeLanguageSubject.getValue();
  }

  async setLanguage(lang: string): Promise<void> {
    if (this.currentActiveLanguage === lang) {
      if (this.translate.currentLang !== lang) {
        await this.translate.use(lang).toPromise();
      }
      return;
    }

    const oldLang = this.currentActiveLanguage;
    await this.translate.use(lang).toPromise();
    this.activeLanguageSubject.next(lang);
    await this.helper.navigateAfterLanguageChange(lang, oldLang);
  }

  async navigateToSection(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    await this.helper.handleSectionNavigation(appRouteKey);
  }

  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    return this.helper.getRouterLinkForAppRoute(key);
  }

  private setupLangChangeSubscription(): void {
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.activeLanguageSubject.next(event.lang);
    });
  }

  private setupInitialLanguage(): void {
    this.activatedRoute.paramMap.pipe(
      map(params => params.get('lang'))
    ).subscribe(langParam => {
      const determinedLang = langParam || this.translate.getDefaultLang();
      if (this.activeLanguageSubject.getValue() !== determinedLang) {
        this.activeLanguageSubject.next(determinedLang);
        this.translate.use(determinedLang).toPromise();
      }
    });
  }
}