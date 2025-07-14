import { Routes, Route, ActivatedRouteSnapshot, RouterStateSnapshot, Router, NavigationExtras } from '@angular/router';
import { MainContentComponent } from './main-content/main-content.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
// Importiere den TranslateManagerService
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
    // Hier den TranslateManagerService injizieren, obwohl er für diesen Resolver nicht direkt verwendet wird,
    // um die Konsistenz zu wahren, wenn der Service später Resolver-Aufgaben übernimmt.
    // const translateManager = inject(TranslateManagerService);

    const langParam = route.paramMap.get('lang');
    const defaultLang = translate.getDefaultLang();
    const availableLangs = translate.getLangs();

    const currentLang = langParam || defaultLang;

    console.log(`[langResolver] URL langParam: '${langParam}'`);
    console.log(`[langResolver] Default lang: '${defaultLang}'`);
    console.log(`[langResolver] Available langs: ${availableLangs.join(', ')}`);
    console.log(`[langResolver] Current lang to validate: '${currentLang}'`);

    if (!availableLangs.includes(currentLang)) {
        console.warn(`[langResolver] Invalid language in URL: '${langParam}'. Redirecting to '${defaultLang}'.`);
        // Direkte Navigation hier, da der Resolver die Route blockieren muss
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

    // Die gesamte Logik zur Fragment-ID-Behandlung wird jetzt vom TranslateManagerService übernommen,
    // wenn tatsächlich eine Navigation oder ein Sprachwechsel stattfindet.
    // Daher können diese komplexen Blöcke hier entfernt werden.
    // Der Resolver ist nur für die anfängliche Routenkonfiguration und Sprachvalidierung zuständig.

    return handlePathValidation(state.url, translate, router, currentLang); // Entferne translatedFragment
};

// ... (validateAndSetLanguage kann entfernt werden, da es nicht mehr direkt als Resolver verwendet wird) ...

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

// `handlePathValidation` muss das `translatedFragment`-Argument nicht mehr erhalten, da es vom Resolver
// nicht mehr direkt zur Fragment-URL-Anpassung verwendet wird. Dies übernimmt der Service.
const handlePathValidation = (stateUrl: string, translate: TranslateService, router: Router, currentLang: string): boolean => {
    const pathOnlyUrl = stateUrl.split('#')[0];
    const pathSegment = extractPathSegment(stateUrl);

    const fullExpectedUrlWithoutFragment = getExpectedUrl(pathSegment, translate, currentLang);

    if (fullExpectedUrlWithoutFragment && pathOnlyUrl === fullExpectedUrlWithoutFragment) {
        // Wenn der Pfad korrekt ist, keine Aktion erforderlich, da Fragment-Handhabung jetzt im Service ist.
        return true;
    }

    if (fullExpectedUrlWithoutFragment && pathOnlyUrl !== fullExpectedUrlWithoutFragment) {
        // Wenn der Pfad nicht korrekt ist, aber einen erwarteten übersetzten Pfad hat, navigiere dorthin.
        // Die Fragment-Handhabung ist Sache des TranslateManagerService nach einem Sprachwechsel.
        const navigationExtras: NavigationExtras = { replaceUrl: true };
        router.navigateByUrl(fullExpectedUrlWithoutFragment, navigationExtras);
        return false; // Navigation wurde durchgeführt
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