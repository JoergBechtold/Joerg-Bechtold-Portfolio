import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { MainContentComponent } from '../../main-content/main-content.component';
import { AppRouteKeys, baseRoutes, createLocalizedRoutesForNavigation } from '../../app.routes'; // Importiere baseRoutes und die neue Funktion

@Injectable({ providedIn: 'root' })
export class TranslationLogicHelperService {
    private isBrowser: boolean;
    private savedScrollPosition: [number, number] | null = null;
    private readonly SCROLL_TIMEOUT_MS = 60;

    constructor(
        private translate: TranslateService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private viewportScroller: ViewportScroller,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    // Diese Methode wird vom TranslateManagerService aufgerufen
    async handleLanguageUpdate(lang: string, oldLang: string): Promise<void> {
        // Scrollposition speichern, bevor die URL geändert wird
        if (this.isBrowser) this.savedScrollPosition = this.viewportScroller.getScrollPosition();

        // Nur die URL anpassen, nicht die Router-Konfiguration ändern!
        await this.navigateAfterLanguageChange(lang, oldLang);
    }

    // Diese Methode ist jetzt für die Navigation nach Sprachwechsel verantwortlich
    // Sie ersetzt die alte private updateRouterConfig und navigateAfterLanguageChange Logik
    async navigateAfterLanguageChange(lang: string, oldLang: string): Promise<void> {
        const { pathSegmentAfterLang, currentFragment } = this._getNavigationDetailsForLanguageChange();

        // Ermittle den neuen übersetzten Pfad basierend auf der alten URL
        const translatedPathKey = await this.getTranslationKeyForPath(oldLang, pathSegmentAfterLang);
        let newPathSegment = '';
        if (translatedPathKey) {
            newPathSegment = this.translate.instant(translatedPathKey);
            // Sonderfall für Home-Route
            if (translatedPathKey === AppRouteKeys.home && newPathSegment === '') {
                newPathSegment = '';
            }
        }

        // Ermittle das neue übersetzte Fragment
        const newTranslatedFragment = await this.getTranslatedFragmentAfterLangChange(oldLang, currentFragment);

        // Baue die neue URL
        const segments: string[] = [`/${lang}`];
        if (newPathSegment) {
            // Vermeide doppelten Schrägstrich, wenn newPathSegment nicht leer ist
            segments.push(newPathSegment);
        }

        // Führe die Navigation aus
        await this.performNavigation(segments, newTranslatedFragment);
    }

    private _getNavigationDetailsForLanguageChange(): { pathSegmentAfterLang: string; currentFragment: string | null } {
        const currentUrlSegments = this.router.url.split('/').filter(s => s);
        // Extrahiere den Teil der URL nach dem Sprachpräfix
        const pathSegmentAfterLang = currentUrlSegments.length > 1 ? currentUrlSegments.slice(1).join('/') : '';
        const currentFragment = this.activatedRoute.snapshot.fragment;
        return { pathSegmentAfterLang, currentFragment };
    }

    async handleSectionNavigation(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
        const currentLang = this.translate.currentLang;
        const pathTranslationKey = AppRouteKeys[appRouteKey];
        const isMainContentRoute = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(appRouteKey);

        let segments: string[] = [`/${currentLang}`]; // Startet immer mit /lang

        // Ermittle den übersetzten Pfad für die Navigation (nicht für Fragmente)
        const translatedPath = this.translate.instant(pathTranslationKey);

        if (!isMainContentRoute) { // Für "echte" Routen wie Datenschutz, Impressum
            if (translatedPath) {
                segments.push(translatedPath);
            }
        }
        // Für MainContent-Routen (home, aboutMe, skills, portfolio, contact)
        // navigieren wir zur Basis-URL der Sprache und steuern Abschnitte über Fragmente.
        // Die "home"-Route hat einen leeren Pfad.
        // Wenn appRouteKey "home" ist, bleibt segments bei ['/', currentLang].

        const translatedFragment = await this._getTranslatedFragmentForSection(appRouteKey);

        // Die URL, die wir erreichen wollen, ohne Fragment
        const targetUrlPathWithoutFragment = segments.join('');

        // Die aktuelle URL, ohne Fragment
        const currentUrlWithoutFragment = this.router.url.split('#')[0];

        // Prüfen, ob eine Navigation notwendig ist
        // Navigation ist notwendig, wenn sich der Pfad ändert ODER das Fragment sich ändert
        const shouldNavigate = currentUrlWithoutFragment !== targetUrlPathWithoutFragment || this.activatedRoute.snapshot.fragment !== translatedFragment;

        if (shouldNavigate) {
            this._saveScrollPositionIfBrowser();
            await this.performNavigation(segments, translatedFragment, true); // replaceUrl true für sauberen Verlauf
        } else if (translatedFragment && this.isBrowser) {
            // Wenn der Pfad derselbe ist, aber das Fragment sich ändert, scrolle nur zum Fragment
            // Aber nur, wenn wir tatsächlich im Browser sind und das Element existiert.
            this.scrollToElementById(translatedFragment);
        } else if (appRouteKey === 'home') {
            // Wenn auf Home geklickt wird und wir schon auf Home sind und kein Fragment vorliegt,
            // einfach nach oben scrollen.
            this.scrollToTop();
            // Wenn die aktuelle URL ein Fragment hat, aber wir zu Home (ohne Fragment) navigieren wollen,
            // müssen wir die URL ohne Fragment aktualisieren.
            if (this.router.url.includes('#')) {
                this.router.navigate(segments, { replaceUrl: true });
            }
        }
    }

    private _getTranslatedFragmentForSection(appRouteKey: keyof typeof AppRouteKeys): Promise<string | undefined> {
        // Findet den Fragment-Schlüssel für die gegebene AppRouteKey
        const routeConfig = baseRoutes.find(r => r.data?.['translationKey'] === AppRouteKeys[appRouteKey]);
        const fragmentKey = routeConfig?.data?.['fragmentKey'];
        return Promise.resolve(fragmentKey ? this.translate.instant(fragmentKey) : undefined);
    }

    private _saveScrollPositionIfBrowser(): void {
        if (this.isBrowser) {
            this.savedScrollPosition = this.viewportScroller.getScrollPosition();
        }
    }

    // Generiert den Router-Link für `[routerLink]` in den Templates
    getRouterLinkForAppRoute(key: keyof typeof AppRouteKeys): string[] {
        const currentLang = this.translate.currentLang;
        const translatedPath = this.translate.instant(AppRouteKeys[key]);

        // Finde die Originalroute in baseRoutes
        const originalRoute = baseRoutes.find(r => r.data?.['translationKey'] === AppRouteKeys[key]);

        // Wenn es sich um eine MainContentComponent-Route handelt und keine dedizierte URL hat (Fragment-basiert)
        // navigieren wir zur Sprach-URL (z.B. /de) und überlassen die Fragment-Navigation dem `MapsToSection`.
        // Das gilt auch für 'home'.
        const isMainContentFragmentRoute = originalRoute && originalRoute.component === MainContentComponent && key !== 'home';

        if (key === 'home' && translatedPath === '') {
            return ['/', currentLang];
        } else if (isMainContentFragmentRoute) {
            // Für Abschnitte innerhalb der Hauptseite (z.B. AboutMe, Skills), die als Fragment navigiert werden
            // Der Link ist nur die Basis-Sprach-URL, das Fragment wird separat behandelt
            return ['/', currentLang];
        } else {
            // Für andere "echte" Seiten wie Datenschutz, Impressum
            return ['/', currentLang, translatedPath];
        }
    }


    private async performNavigation(segments: string[], fragment?: string, replaceUrl: boolean = true): Promise<void> {
        const navigationExtras: NavigationExtras = {
            replaceUrl,
            scrollPositionRestoration: 'disabled', // Wichtig, um manuelles Scrollen zu steuern
            fragment: fragment || undefined
        } as NavigationExtras;
        try {
            // Navigiere nur, wenn die Ziel-URL sich von der aktuellen unterscheidet
            const targetUrl = segments.join('/') + (fragment ? `#${fragment}` : '');
            if (this.router.url !== targetUrl) {
                await this.router.navigate(segments, navigationExtras);
            }
            this.scheduleScroll(fragment);
        } catch (err) {
            console.error('Navigation failed:', err);
            // Wenn Navigation fehlschlägt, versuche zur gespeicherten Position zu scrollen
            if (this.isBrowser) this.viewportScroller.scrollToPosition(this.savedScrollPosition || [0, 0]);
            this.savedScrollPosition = null;
        }
    }

    private scheduleScroll(fragment?: string): void {
        if (!this.isBrowser) return;
        setTimeout(() => {
            if (fragment) {
                this.scrollToElementById(fragment);
            } else if (this.savedScrollPosition) {
                this.viewportScroller.scrollToPosition(this.savedScrollPosition);
                this.savedScrollPosition = null;
            } else {
                // Falls kein Fragment und keine gespeicherte Position, scrolle nach oben
                this.scrollToTop();
            }
        }, this.SCROLL_TIMEOUT_MS);
    }

    private scrollToElementById(elementId: string): void {
        const headerHeightDesktop = this.getCssVariable('--header-height');
        const headerHeightMobile = this.getCssVariable('--header-height-responsive');
        const breakpoint = this.getCssVariable('--breakpoint-width-920'); // Beispielwert
        const offset = window.innerWidth > breakpoint ? headerHeightDesktop : headerHeightMobile;
        this.viewportScroller.setOffset([0, offset]);
        this.viewportScroller.scrollToAnchor(elementId);
    }

    private scrollToTop(): void {
        this.viewportScroller.scrollToPosition([0, 0]);
    }

    private getCssVariable(variableName: string): number {
        if (!this.isBrowser) return 0;
        const rootStyles = getComputedStyle(document.documentElement);
        const value = rootStyles.getPropertyValue(variableName).trim();
        // Stelle sicher, dass der Wert in Pixel ist und entferne 'px' vor dem Parsen
        return parseFloat(value.replace('px', '')) || 0;
    }

    // Hilfsfunktion, um den Übersetzungsschlüssel für einen gegebenen Pfad in einer bestimmten Sprache zu finden
    private async getTranslationKeyForPath(lang: string, pathSegment: string): Promise<string | undefined> {
        if (!pathSegment) return AppRouteKeys.home; // Leerer Pfad ist immer Home

        const translations = await this.translate.getTranslation(lang).toPromise();

        for (const key of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
            if (key.startsWith('ROUTES.')) { // Betrachte nur Routen-Schlüssel
                const translatedPath = this.getNestedTranslation(translations, AppRouteKeys[key]);
                if (translatedPath === pathSegment) {
                    return AppRouteKeys[key];
                }
            }
        }
        return undefined;
    }

    private async getTranslatedFragmentAfterLangChange(oldLang: string, currentFragment: string | null): Promise<string | undefined> {
        if (!currentFragment) return undefined;
        const oldFragmentTranslations = await this.translate.getTranslation(oldLang).toPromise();

        for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
            if (keyName.endsWith('Fragment')) { // Betrachte nur Fragment-Schlüssel
                const translatedOldFragmentValue = this.getNestedTranslation(oldFragmentTranslations, AppRouteKeys[keyName]);
                if (typeof translatedOldFragmentValue === 'string' && translatedOldFragmentValue === currentFragment) {
                    // Jetzt den neuen übersetzten Fragmentwert in der aktuellen Sprache zurückgeben
                    return this.translate.instant(AppRouteKeys[keyName]);
                }
            }
        }
        return undefined;
    }

    // Eine vereinfachte Version von findAppRouteKeyForTranslation, die nur auf baseRoutes basiert.
    // Diese Methode ist möglicherweise nicht mehr notwendig, da wir keine dynamischen Routen mehr erstellen.
    // Sie ist hier belassen, falls noch irgendwo eine ähnliche Logik benötigt wird.
    private async findAppRouteKeyForTranslation(
        translationKey: string,
        targetLang: string
    ): Promise<keyof typeof AppRouteKeys | undefined> {
        const targetTranslations = await this.translate.getTranslation(targetLang).toPromise();

        for (const key of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
            const translated = this.getNestedTranslation(targetTranslations, AppRouteKeys[key]);
            if (translated === translationKey || AppRouteKeys[key] === translationKey) {
                return key;
            }
        }
        return undefined;
    }


    private getNestedTranslation(translations: any, key: string): string | undefined {
        const keys = key.split('.');
        let currentObj: any = translations;
        for (const tKey of keys) {
            if (currentObj && typeof currentObj === 'object' && tKey in currentObj) {
                currentObj = currentObj[tKey];
            } else { return undefined; }
        }
        return typeof currentObj === 'string' ? currentObj : undefined;
    }
}