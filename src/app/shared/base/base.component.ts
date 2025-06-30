import { Directive, OnInit } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

@Directive()
export abstract class BaseTranslatableComponent implements OnInit {
    protected _activeLanguage: string = 'de';

    constructor(protected translate: TranslateService) {
    }

    ngOnInit() {
        this._activeLanguage = this.translate.currentLang;
        this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
            this._activeLanguage = event.lang;
        });
    }

    get activeLanguage(): string {
        return this._activeLanguage;
    }
}