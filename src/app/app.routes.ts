import { Routes, Route, ActivatedRouteSnapshot, RouterStateSnapshot, Router, NavigationExtras } from '@angular/router';
import { MainContentComponent } from './main-content/main-content.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TranslateManagerService } from './services/translate/translate-manager.service';

export const AppRouteKeys = {
    home: 'ROUTES.HOME',
    aboutMe: 'ROUTES.ABOUT_ME',
    skills: 'ROUTES.SKILLS',
    portfolio: 'ROUTES.PORTFOLIO',
    contact: 'ROUTES.CONTACT',
    privacyPolicy: 'ROUTES.PRIVACY_POLICY',
    legalNotice: 'ROUTES.LEGAL_NOTICE',
    notFound: 'ROUTES.NOT_FOUND',

    aboutMeFragment: 'FRAGMENTS.ABOUT_ME_ID',
    skillsFragment: 'FRAGMENTS.SKILLS_ID',
    portfolioFragment: 'FRAGMENTS.PORTFOLIO_ID',
    contactFragment: 'FRAGMENTS.CONTACT_ID'
};

export const mainRoutes: Routes = [
    {
        path: '',
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.home, fragmentKey: AppRouteKeys.home }
    },
    {
        path: 'about-me',
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.aboutMe, fragmentKey: AppRouteKeys.aboutMeFragment }
    },
    {
        path: 'skills',
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.skills, fragmentKey: AppRouteKeys.skillsFragment }
    },
    {
        path: 'portfolio',
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.portfolio, fragmentKey: AppRouteKeys.portfolioFragment }
    },
    {
        path: 'contact',
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.contact, fragmentKey: AppRouteKeys.contactFragment }
    },
    {
        path: 'privacy-policy',
        component: PrivacyPolicyComponent,
        data: { translationKey: AppRouteKeys.privacyPolicy, titleKey: 'LINK.PRIVACY_POLICY' }
    },
    {
        path: 'legal-notice',
        component: LegalNoticeComponent,
        data: { translationKey: AppRouteKeys.legalNotice, titleKey: 'LINK.LEGAL_NOTICE' }
    },
];

export function createLocalizedRoutes(translate: TranslateService): Routes {
    const localizedRoutes: Routes = [];
    for (const route of mainRoutes) {
        localizedRoutes.push(createTranslatedRoute(route, translate));
    }
    return localizedRoutes;
}

function createTranslatedRoute(route: Route, translate: TranslateService): Route {
    const translatedPathKey = route.data?.['translationKey'];
    if (translatedPathKey) {
        let translatedPath = translate.instant(translatedPathKey);
        if (translatedPathKey === AppRouteKeys.home && translatedPath === '') {
            translatedPath = '';
        }
        return { ...route, path: translatedPath };
    }
    return route;
}

const langResolver = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const translate = inject(TranslateService);
    const router = inject(Router);
    const langParam = route.paramMap.get('lang');
    const defaultLang = translate.getDefaultLang();
    const availableLangs = translate.getLangs();

    const currentLang = langParam || defaultLang;

    if (!availableLangs.includes(currentLang)) {
        console.warn(`[langResolver] Invalid language in URL: '${langParam}'. Redirecting to '${defaultLang}'.`);
        router.navigateByUrl(`/${defaultLang}`, { replaceUrl: true });
        return false;
    }

    if (translate.currentLang !== currentLang) {
        await translate.use(currentLang).toPromise();
    }

    const newLocalizedRoutes = createLocalizedRoutes(translate);
    const updatedRoutes = [...routes];
    const langRouteIndex = updatedRoutes.findIndex(r => r.path === ':lang');

    if (langRouteIndex > -1) {
        updatedRoutes[langRouteIndex] = {
            ...updatedRoutes[langRouteIndex],
            children: newLocalizedRoutes
        };
        router.resetConfig(updatedRoutes);
    } else {
        console.error(`[langResolver] Fehler: ':lang'-Route nicht in den Hauptrouten gefunden!`);
    }

    return handlePathValidation(state.url, translate, router, currentLang);
};



const extractPathSegment = (stateUrl: string): string => {
    const urlWithoutFragment = stateUrl.split('#')[0];
    return urlWithoutFragment.split('/').filter(s => s !== '').slice(1).join('/');
};

const getExpectedUrl = (pathSegment: string, translate: TranslateService, currentLang: string): string | undefined => {
    const tempLocalizedRoutes = createLocalizedRoutes(translate);
    const targetRoute = tempLocalizedRoutes.find(r => r.path === pathSegment);

    if (!targetRoute) return undefined;

    const foundTranslationKey = targetRoute.data?.['translationKey'];
    const targetAppRouteKey = (Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>)
        .find(keyName => AppRouteKeys[keyName] === foundTranslationKey);

    if (!targetAppRouteKey) return undefined;

    const correctTranslatedPath = translate.instant(AppRouteKeys[targetAppRouteKey]);
    const effectivePath = (targetAppRouteKey === 'home' && correctTranslatedPath === '') ? '' : correctTranslatedPath;

    return `/${currentLang}${effectivePath ? '/' + effectivePath : ''}`;
};

const redirectToHome = (router: Router, translate: TranslateService, currentLang: string): boolean => {
    console.warn(`[langResolver] Path is not a valid translated route in '${currentLang}'.`);
    const homeTranslatedPath = translate.instant(AppRouteKeys.home);
    const homeUrl = `/${currentLang}${homeTranslatedPath === '' ? '' : '/' + homeTranslatedPath}`;
    router.navigateByUrl(homeUrl, { replaceUrl: true });
    return false;
};


const handlePathValidation = (stateUrl: string, translate: TranslateService, router: Router, currentLang: string): boolean => {
    const pathOnlyUrl = stateUrl.split('#')[0];
    const pathSegment = extractPathSegment(stateUrl);

    const fullExpectedUrlWithoutFragment = getExpectedUrl(pathSegment, translate, currentLang);

    if (fullExpectedUrlWithoutFragment && pathOnlyUrl === fullExpectedUrlWithoutFragment) {
        return true;
    }

    if (fullExpectedUrlWithoutFragment && pathOnlyUrl !== fullExpectedUrlWithoutFragment) {
        const navigationExtras: NavigationExtras = { replaceUrl: true };
        router.navigateByUrl(fullExpectedUrlWithoutFragment, navigationExtras);
        return false;
    }

    return redirectToHome(router, translate, currentLang);
};

export const routes: Routes = [
    {
        path: ':lang',
        resolve: {
            lang: langResolver
        },
        children: mainRoutes
    },
    {
        path: '',
        redirectTo: `/de`,
        pathMatch: 'full'
    },
    {
        path: '**',
        component: PageNotFoundComponent
    }
];