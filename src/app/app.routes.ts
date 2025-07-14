import { Routes, Route, ActivatedRouteSnapshot, RouterStateSnapshot, Router, NavigationExtras } from '@angular/router';
import { MainContentComponent } from './main-content/main-content.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

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
        data: { translationKey: AppRouteKeys.home, fragmentKey: AppRouteKeys.home } // Auch Home kann einen Fragment-Key haben, falls du es für den Top-Bereich brauchst
    },
    {
        path: 'about-me', // Dieser Pfad wird später dynamisch übersetzt
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.aboutMe, fragmentKey: AppRouteKeys.aboutMeFragment } // Hier den Fragment-Key verwenden
    },
    {
        path: 'skills', // Dieser Pfad wird später dynamisch übersetzt
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.skills, fragmentKey: AppRouteKeys.skillsFragment } // Hier den Fragment-Key verwenden
    },
    {
        path: 'portfolio', // Dieser Pfad wird später dynamisch übersetzt
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.portfolio, fragmentKey: AppRouteKeys.portfolioFragment } // Hier den Fragment-Key verwenden
    },
    {
        path: 'contact', // Dieser Pfad wird später dynamisch übersetzt
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.contact, fragmentKey: AppRouteKeys.contactFragment } // Hier den Fragment-Key verwenden
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

    console.log(`[langResolver] URL langParam: '${langParam}'`);
    console.log(`[langResolver] Default lang: '${defaultLang}'`);
    console.log(`[langResolver] Available langs: ${availableLangs.join(', ')}`);
    console.log(`[langResolver] Current lang to validate: '${currentLang}'`);

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

    // --- NEUE LOGIK FÜR FRAGMENT-ID ---
    const currentFragment = route.fragment;
    let newTranslatedFragment: string | undefined;

    if (currentFragment) {
        // Versuche, den AppRouteKey vom *alten* Fragment zu finden
        const currentFragmentTranslations = await translate.getTranslation(route.paramMap.get('lang') || defaultLang).toPromise();
        let targetAppRouteKeyForFragment: keyof typeof AppRouteKeys | undefined;

        for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
            if (keyName.endsWith('Fragment')) {
                const fragmentTranslationKey = AppRouteKeys[keyName];
                let currentObj: any = currentFragmentTranslations;
                const translationKeys = fragmentTranslationKey.split('.');
                for (const tKey of translationKeys) {
                    if (currentObj && typeof currentObj === 'object' && tKey in currentObj) {
                        currentObj = currentObj[tKey];
                    } else {
                        currentObj = undefined;
                        break;
                    }
                }
                if (typeof currentObj === 'string' && currentObj === currentFragment) {
                    const routeKeyPart = keyName.replace('Fragment', '');
                    if (AppRouteKeys[routeKeyPart as keyof typeof AppRouteKeys]) {
                        targetAppRouteKeyForFragment = routeKeyPart as keyof typeof AppRouteKeys;
                        break;
                    }
                }
            }
        }

        if (targetAppRouteKeyForFragment) {
            // Finde den zugehörigen Fragment-Key für die *neue* Sprache
            const foundMainRoute = mainRoutes.find(r => r.data?.['translationKey'] === AppRouteKeys[targetAppRouteKeyForFragment!]);
            const newFragmentTranslationKey = foundMainRoute?.data?.['fragmentKey'] as keyof typeof AppRouteKeys | undefined;
            if (newFragmentTranslationKey) {
                newTranslatedFragment = translate.instant(newFragmentTranslationKey);
            }
        }
    }
    // --- ENDE NEUE LOGIK FÜR FRAGMENT-ID ---

    return handlePathValidation(state.url, translate, router, currentLang, newTranslatedFragment); // Übergebe das neue Fragment
};

const validateAndSetLanguage = async (translate: TranslateService, router: Router, langParam: string | null): Promise<string | false> => {
    // Diese Funktion wird jetzt von langResolver aufgerufen und ist nicht mehr direkt der Resolver.
    // Die Validierungs- und Setzlogik wurde in langResolver verschoben, um die Kontrolle zu zentralisieren.
    // Sie können diese Funktion entfernen, wenn sie nicht mehr direkt als Resolver verwendet wird.
    // Falls doch, stellen Sie sicher, dass sie die neuen Konsolenlogs und die Prüfung für availableLangs enthält.
    const defaultLang = translate.getDefaultLang();
    const availableLangs = translate.getLangs(); // Wieder wichtig zu prüfen, was hier ist.
    const currentLang = langParam || defaultLang;

    if (!availableLangs.includes(currentLang)) {
        console.warn(`[langResolver] Invalid language in URL: '${langParam}'. Redirecting to '${defaultLang}'.`);
        router.navigateByUrl(`/${defaultLang}`, { replaceUrl: true });
        return false;
    }
    if (translate.currentLang !== currentLang) await translate.use(currentLang).toPromise();
    return currentLang;
};

// ... (restlicher Code bleibt unverändert) ...

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

const handlePathValidation = (stateUrl: string, translate: TranslateService, router: Router, currentLang: string, translatedFragment?: string): boolean => {
    const pathOnlyUrl = stateUrl.split('#')[0];
    const pathSegment = extractPathSegment(stateUrl);

    const fullExpectedUrlWithoutFragment = getExpectedUrl(pathSegment, translate, currentLang);

    if (fullExpectedUrlWithoutFragment && pathOnlyUrl === fullExpectedUrlWithoutFragment) {
        // Wenn der Pfad korrekt ist, aber ein übersetztes Fragment vorliegt und es sich vom aktuellen unterscheidet
        const currentFragmentInUrl = stateUrl.includes('#') ? stateUrl.split('#')[1] : undefined;
        if (translatedFragment && currentFragmentInUrl !== translatedFragment) {
            const navigationExtras: NavigationExtras = { replaceUrl: true, fragment: translatedFragment };
            router.navigateByUrl(fullExpectedUrlWithoutFragment + `#${translatedFragment}`, navigationExtras);
            return false; // Navigation wurde durchgeführt
        }
        return true;
    }

    if (fullExpectedUrlWithoutFragment && pathOnlyUrl !== fullExpectedUrlWithoutFragment) {
        const navigationExtras: NavigationExtras = { replaceUrl: true };
        if (translatedFragment) { // Verwende das bereits übersetzte Fragment
            navigationExtras.fragment = translatedFragment;
        }

        router.navigateByUrl(fullExpectedUrlWithoutFragment + (translatedFragment ? `#${translatedFragment}` : ''), navigationExtras);
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