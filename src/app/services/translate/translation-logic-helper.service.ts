// src/app/core/services/translate/translation-logic-helper.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { AppRouteKeys, mainRoutes, createLocalizedRoutes, routes } from '../../app.routes'; // Pfad anpassen

@Injectable({ providedIn: 'root' })
export class TranslationLogicHelperService {
    private isBrowser: boolean;
    private savedScrollPosition: [number, number] | null = null;
    private readonly SCROLL_TIMEOUT_MS = 100;

    constructor(
        private translate: TranslateService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private viewportScroller: ViewportScroller,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    async handleLanguageUpdate(lang: string, oldLang: string): Promise<void> {
        if (this.isBrowser) this.savedScrollPosition = this.viewportScroller.getScrollPosition();
        await this.translate.use(lang).toPromise();
        this.updateRouterConfig();
        await this.navigateAfterLanguageChange(lang, oldLang);
    }

    private updateRouterConfig(): void {
        const newLocalized = createLocalizedRoutes(this.translate);
        const updatedRoutes = [...routes];
        const langRouteIndex = updatedRoutes.findIndex(r => r.path === ':lang');
        if (langRouteIndex > -1) {
            updatedRoutes[langRouteIndex] = { ...updatedRoutes[langRouteIndex], children: newLocalized };
            this.router.resetConfig(updatedRoutes);
        } else { console.error(`Error: ':lang'-Route not found!`); }
    }

    private async navigateAfterLanguageChange(lang: string, oldLang: string): Promise<void> {
        const currentUrlSegments = this.router.url.split('/').filter(s => s);
        const pathSegmentAfterLang = currentUrlSegments.length > 1 ? currentUrlSegments[1] : '';
        const currentFragment = this.activatedRoute.snapshot.fragment;

        let targetPathSegments: string[] = [lang];
        const newTranslatedPath = await this.getTranslatedRoutePath(oldLang, pathSegmentAfterLang);
        if (newTranslatedPath) {
            const foundAppRouteKey = await this.findAppRouteKeyForTranslation(newTranslatedPath, oldLang);
            const isMainContent = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(foundAppRouteKey || '');
            if (isMainContent && foundAppRouteKey !== 'home') targetPathSegments.push(this.translate.instant(AppRouteKeys[foundAppRouteKey!]));
        } else {
            console.warn(`No AppRouteKey found for path '${pathSegmentAfterLang}'. Falling back to home.`);
        }

        const newTranslatedFragment = await this.getTranslatedFragmentAfterLangChange(oldLang, currentFragment);
        await this.performNavigation(targetPathSegments, newTranslatedFragment);
    }

    async handleSectionNavigation(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
        const currentLang = this.translate.currentLang;
        const pathTranslationKey = AppRouteKeys[appRouteKey];
        const isMainContent = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(appRouteKey);

        let segments: string[] = [currentLang];
        if (!isMainContent || appRouteKey === 'home') {
            const translatedPath = this.translate.instant(pathTranslationKey);
            if (translatedPath) segments.push(translatedPath);
        }
        const fragmentKey = await this.getFragmentKeyForAppRoute(appRouteKey);
        const translatedFragment = fragmentKey ? this.translate.instant(fragmentKey) : undefined;

        const currentUrlWithoutFragment = this.router.url.split('#')[0];
        const targetUrlPathWithoutFragment = `/${segments.join('/')}`;

        if (currentUrlWithoutFragment !== targetUrlPathWithoutFragment || this.activatedRoute.snapshot.fragment !== translatedFragment) {
            if (this.isBrowser) this.savedScrollPosition = this.viewportScroller.getScrollPosition();
            await this.performNavigation(segments, translatedFragment, true);
            if (appRouteKey === 'home' && !translatedFragment) this.scrollToTop();
        } else if (translatedFragment) {
            await this.performNavigation(segments, translatedFragment, true);
        } else if (appRouteKey === 'home') {
            this.scrollToTop();
            if (this.router.url.includes('#')) this.router.navigate(segments, { replaceUrl: true });
        }
    }

    getRouterLinkForAppRoute(key: keyof typeof AppRouteKeys): string[] {
        const translatedPath = this.translate.instant(AppRouteKeys[key]);
        const currentLang = this.translate.currentLang;
        const isMainContent = ['home', 'aboutMe', 'skills', 'portfolio', 'contact'].includes(key);
        return isMainContent ? ['/', currentLang] : ['/', currentLang, translatedPath];
    }

    private async performNavigation(segments: string[], fragment?: string, replaceUrl: boolean = true): Promise<void> {
        const navigationExtras: NavigationExtras = {
            replaceUrl, scrollPositionRestoration: 'disabled', fragment: fragment || undefined
        } as NavigationExtras;
        try {
            await this.router.navigate(segments, navigationExtras);
            this.scheduleScroll(fragment);
        } catch (err) {
            console.error('Navigation failed:', err);
            if (this.isBrowser) this.viewportScroller.scrollToPosition(this.savedScrollPosition || [0, 0]); // Fallback
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
                this.scrollToTop();
            }
        }, this.SCROLL_TIMEOUT_MS);
    }

    private scrollToElementById(elementId: string): void {
        const headerHeightDesktop = this.getCssVariable('--header-height');
        const headerHeightMobile = this.getCssVariable('--header-height-responsive');
        const breakpoint = this.getCssVariable('--breakpoint-width-920');
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
        return parseFloat(value.replace('px', '')) || 0;
    }

    private async getTranslatedRoutePath(oldLang: string, currentPathSegment: string): Promise<string | undefined> {
        if (!currentPathSegment) return AppRouteKeys.home; // Home key
        const oldTranslations = await this.translate.getTranslation(oldLang).toPromise();
        for (const route of mainRoutes) {
            const translationKey = route.data?.['translationKey'];
            const translatedPathInOldLang = this.getNestedTranslation(oldTranslations, translationKey);
            if (translatedPathInOldLang === currentPathSegment) return translationKey;
        }
        return undefined;
    }

    private async getTranslatedFragmentAfterLangChange(oldLang: string, currentFragment: string | null): Promise<string | undefined> {
        if (!currentFragment) return undefined;
        const oldFragmentTranslations = await this.translate.getTranslation(oldLang).toPromise();
        for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
            if (keyName.endsWith('Fragment')) {
                const translatedOldFragmentValue = this.getNestedTranslation(oldFragmentTranslations, AppRouteKeys[keyName]);
                if (typeof translatedOldFragmentValue === 'string' && translatedOldFragmentValue === currentFragment) {
                    return this.translate.instant(AppRouteKeys[keyName]);
                }
            }
        }
        return undefined;
    }

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

    private async getFragmentKeyForAppRoute(appRouteKey: keyof typeof AppRouteKeys): Promise<keyof typeof AppRouteKeys | undefined> {
        for (const r of mainRoutes) {
            const translationKey = r.data?.['translationKey'];
            if (!translationKey) continue;

            const match = await this.findAppRouteKeyForTranslation(translationKey, this.translate.currentLang);
            if (match === appRouteKey) {
                return r.data?.['fragmentKey'] as keyof typeof AppRouteKeys | undefined;
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