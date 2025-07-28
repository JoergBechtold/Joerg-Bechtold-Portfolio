import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { AppRouteKeys } from '../../app.routes';
import { take } from 'rxjs/operators';

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

    async handleLanguageUpdate(lang: string, oldLang: string): Promise<void> {
        if (this.isBrowser) this.savedScrollPosition = this.viewportScroller.getScrollPosition();
        await this.navigateAfterLanguageChange(lang, oldLang);
    }

    async navigateAfterLanguageChange(lang: string, oldLang: string): Promise<void> {
        const { pathSegmentAfterLang, currentFragment } = this._getNavigationDetailsForLanguageChange();
        const appRouteKeyForCurrentPath = await this.getAppRouteKeyForTranslatedPath(oldLang, pathSegmentAfterLang);

        let newPathSegment = '';
        if (appRouteKeyForCurrentPath) {
            newPathSegment = this.translate.instant(AppRouteKeys[appRouteKeyForCurrentPath]);

            if (appRouteKeyForCurrentPath === 'home' && newPathSegment === '') {
                newPathSegment = '';
            }
        }

        const newTranslatedFragment = await this.getTranslatedFragmentAfterLangChange(oldLang, currentFragment);

        const segments: string[] = [`/${lang}`];
        if (newPathSegment) {
            segments.push(newPathSegment);
        }

        await this.performNavigation(segments, newTranslatedFragment);
    }

    private _getNavigationDetailsForLanguageChange(): { pathSegmentAfterLang: string; currentFragment: string | null } {
        const currentUrlSegments = this.router.url.split('/').filter(s => s);
        const pathSegmentAfterLang = currentUrlSegments.length > 1 ? currentUrlSegments.slice(1).join('/') : '';
        const currentFragment = this.activatedRoute.snapshot.fragment;
        return { pathSegmentAfterLang, currentFragment };
    }

    async handleSectionNavigation(appRouteKey: keyof typeof AppRouteKeys): Promise<void> {
        const currentLang = this.translate.currentLang
        const translatedPath = this.translate.instant(AppRouteKeys[appRouteKey]);

        const segments: string[] = [`/${currentLang}`];
        const isDedicatedRoute = (appRouteKey === 'privacyPolicy' || appRouteKey === 'legalNotice');

        if (isDedicatedRoute) {
            if (translatedPath) {
                segments.push(translatedPath);
            }
        }

        const translatedFragment = await this.getFragmentIdForAppRouteKey(appRouteKey);

        const targetUrlPathWithoutFragment = segments.join('/');
        const currentUrlWithoutFragment = this.router.url.split('#')[0];

        const targetUrlNormalized = targetUrlPathWithoutFragment.endsWith('/') ? targetUrlPathWithoutFragment.slice(0, -1) : targetUrlPathWithoutFragment;
        const currentUrlNormalized = currentUrlWithoutFragment.endsWith('/') ? currentUrlWithoutFragment.slice(0, -1) : currentUrlWithoutFragment;

        const shouldNavigate = currentUrlNormalized !== targetUrlNormalized || this.activatedRoute.snapshot.fragment !== translatedFragment;

        if (shouldNavigate) {
            this._saveScrollPositionIfBrowser();
            await this.performNavigation(segments, translatedFragment, true);
        } else if (translatedFragment && this.isBrowser) {
            this.scrollToElementById(translatedFragment);
        } else if (appRouteKey === 'home') {
            this.scrollToTop();
            if (this.router.url.includes('#') || this.router.url !== `/${currentLang}`) {
                this.router.navigate(segments, { replaceUrl: true });
            }
        }
    }

    private _saveScrollPositionIfBrowser(): void {
        if (this.isBrowser) {
            this.savedScrollPosition = this.viewportScroller.getScrollPosition();
        }
    }

    getRouterLinkForAppRoute(key: keyof typeof AppRouteKeys): string[] {
        const currentLang = this.translate.currentLang;
        const translatedPath = this.translate.instant(AppRouteKeys[key]);

        const isDedicatedRoute = (key === 'privacyPolicy' || key === 'legalNotice');

        if (key === 'home' && translatedPath === '') {
            return ['/', currentLang];
        } else if (isDedicatedRoute) {
            return ['/', currentLang, translatedPath];
        } else {
            return ['/', currentLang];
        }
    }

    private async performNavigation(segments: string[], fragment?: string, replaceUrl: boolean = true): Promise<void> {
        const navigationExtras: NavigationExtras = {
            replaceUrl,
            fragment: fragment || undefined
        };
        try {
            const targetUrl = segments.join('/') + (fragment ? `#${fragment}` : '');
            if (this.router.url !== targetUrl) {
                await this.router.navigate(segments, navigationExtras);
            } else if (fragment && this.activatedRoute.snapshot.fragment !== fragment) {
                await this.router.navigate([], { relativeTo: this.activatedRoute, fragment: fragment, replaceUrl: true });
            }
            this.scheduleScroll(fragment);
        } catch (err) {
            console.error('Navigation failed:', err);
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

    private async getAppRouteKeyForTranslatedPath(lang: string, translatedPath: string): Promise<keyof typeof AppRouteKeys | undefined> {
        if (!translatedPath) return 'home';
        const translations = await this.translate.getTranslation(lang).pipe(take(1)).toPromise();

        for (const key of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
            if (key === 'privacyPolicy' || key === 'legalNotice' || key === 'home') {
                const pathInLang = this.getNestedTranslation(translations, AppRouteKeys[key]);
                if (typeof pathInLang === 'string' && pathInLang === translatedPath) {
                    return key as keyof typeof AppRouteKeys;
                }
            }
        }
        return undefined;
    }

    private async getFragmentIdForAppRouteKey(appRouteKey: keyof typeof AppRouteKeys): Promise<string | undefined> {
        let fragmentTranslationKey: string | undefined;
        switch (appRouteKey) {
            case 'home':
                fragmentTranslationKey = AppRouteKeys.home;
                break;
            case 'aboutMe':
                fragmentTranslationKey = AppRouteKeys.aboutMeFragment;
                break;
            case 'skills':
                fragmentTranslationKey = AppRouteKeys.skillsFragment;
                break;
            case 'portfolio':
                fragmentTranslationKey = AppRouteKeys.portfolioFragment;
                break;
            case 'contact':
                fragmentTranslationKey = AppRouteKeys.contactFragment;
                break;
            default:
                fragmentTranslationKey = undefined;
        }

        if (fragmentTranslationKey) {
            return this.translate.instant(fragmentTranslationKey);
        }
        return undefined;
    }

    private async getTranslatedFragmentAfterLangChange(oldLang: string, currentFragment: string | null): Promise<string | undefined> {
        if (!currentFragment) return undefined;
        const oldFragmentTranslations = await this.translate.getTranslation(oldLang).pipe(take(1)).toPromise();

        for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
            if (keyName.endsWith('Fragment') || keyName === 'home') {
                const translatedOldFragmentValue = this.getNestedTranslation(oldFragmentTranslations, AppRouteKeys[keyName]);
                if (typeof translatedOldFragmentValue === 'string' && translatedOldFragmentValue === currentFragment) {
                    return this.translate.instant(AppRouteKeys[keyName]);
                }
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