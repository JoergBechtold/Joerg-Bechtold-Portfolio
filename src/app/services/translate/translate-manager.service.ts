import { Injectable } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppRouteKeys } from '../../app.routes';
import { TranslationLogicHelperService } from '../translate/translation-logic-helper.service';
import { map } from 'rxjs/operators'; // Importiere map
import { ViewportScroller } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class TranslateManagerService {
  private _activeLanguageSubject: BehaviorSubject<string>;
  public activeLanguage$: Observable<string>;

  constructor(
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private helper: TranslationLogicHelperService,
    private viewportScroller: ViewportScroller,
  ) {
    // Initialisiere mit der aktuellen Sprache des Browsers oder der Standardeinstellung
    this._activeLanguageSubject = new BehaviorSubject<string>(this.translate.currentLang || this.translate.getDefaultLang());
    this.activeLanguage$ = this._activeLanguageSubject.asObservable();
    this.setupLangChangeSubscription();
    this.setupInitialLanguage();
  }


  public scrollToTop(): void { // <-- HIER IST DIE WICHTIGE ÄNDERUNG: public hinzufügen
    this.viewportScroller.scrollToPosition([0, 0]);
  }

  get currentActiveLanguage(): string {
    return this._activeLanguageSubject.getValue();
  }

  async setLanguage(lang: string): Promise<void> {
    if (this.currentActiveLanguage === lang) {
      // Wenn die Sprache bereits die aktuelle ist, brauche wir keine Navigation
      // Nur die ngx-translate Sprache setzen, falls nicht schon geschehen
      if (this.translate.currentLang !== lang) {
        await this.translate.use(lang).toPromise();
      }
      return;
    }

    const oldLang = this.currentActiveLanguage;
    // Sprache im ngx-translate Service wechseln
    await this.translate.use(lang).toPromise();
    this._activeLanguageSubject.next(lang);

    // Navigiere zur entsprechenden übersetzten URL
    await this.helper.navigateAfterLanguageChange(lang, oldLang);
  }

  async navigateToSection(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
    await this.helper.handleSectionNavigation(appRouteKey);
  }

  getRouterLink(key: keyof typeof AppRouteKeys): string[] {
    return this.helper.getRouterLinkForAppRoute(key);
  }

  private setupLangChangeSubscription(): void {
    // Abonnieren von Änderungen der Sprache im TranslateService
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this._activeLanguageSubject.next(event.lang);
    });
  }

  private setupInitialLanguage(): void {
    // Setze die initiale Sprache basierend auf dem URL-Parameter
    this.activatedRoute.paramMap.pipe(
      map(params => params.get('lang'))
    ).subscribe(langParam => {
      const determinedLang = langParam || this.translate.getDefaultLang();
      if (this._activeLanguageSubject.getValue() !== determinedLang) {
        this._activeLanguageSubject.next(determinedLang);
        // Stelle sicher, dass ngx-translate auch diese Sprache verwendet
        this.translate.use(determinedLang).toPromise();
      }
    });
  }




}