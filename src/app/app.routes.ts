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
    notFound: 'ROUTES.NOT_FOUND'
};

export const mainRoutes: Routes = [
    {
        path: '',
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.home }
    },
    {
        path: 'about-me',
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.aboutMe, fragmentId: 'about_me' }
    },
    {
        path: 'skills',
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.skills, fragmentId: 'skills' }
    },
    {
        path: 'portfolio',
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.portfolio, fragmentId: 'portfolio' }
    },
    {
        path: 'contact',
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.contact, fragmentId: 'contact' }
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

    // *** WICHTIG: Sicherstellen, dass die Sprachen geladen sind ***
    // Normalerweise sollte der Loader in Ihrer App-Initialisierung das erledigen.
    // Wenn nicht, stellen Sie sicher, dass TranslateService.getLangs() die erwarteten Werte hat.
    // Prüfen Sie Ihre ngx-translate-Konfiguration in app.config.ts oder app.module.ts

    const langParam = route.paramMap.get('lang');
    const defaultLang = translate.getDefaultLang(); // Dies sollte 'de' sein
    const availableLangs = translate.getLangs();    // Prüfen Sie, was hier tatsächlich drin ist!

    const currentLang = langParam || defaultLang;

    // Loggen Sie die Werte zur Fehlersuche
    console.log(`[langResolver] URL langParam: '${langParam}'`);
    console.log(`[langResolver] Default lang: '${defaultLang}'`);
    console.log(`[langResolver] Available langs: ${availableLangs.join(', ')}`);
    console.log(`[langResolver] Current lang to validate: '${currentLang}'`);

    if (!availableLangs.includes(currentLang)) {
        console.warn(`[langResolver] Invalid language in URL: '${langParam}'. Redirecting to '${defaultLang}'.`);
        // Leiten Sie nur um, wenn die URL-Sprache nicht in den verfügbaren Sprachen ist.
        // Dies sollte nur passieren, wenn jemand z.B. /xyz eingibt.
        // Wenn /en nicht in availableLangs ist, liegt das Problem bei Ihrer ngx-translate-Konfiguration.
        router.navigateByUrl(`/${defaultLang}`, { replaceUrl: true });
        return false;
    }

    // Wenn die aktuelle Sprache des TranslateService nicht der gewünschten Sprache entspricht, setze sie.
    if (translate.currentLang !== currentLang) {
        // WICHTIG: Verwenden Sie .toPromise() oder await, um sicherzustellen, dass die Sprache geladen wird.
        await translate.use(currentLang).toPromise();
    }

    // Routen neu konfigurieren nach Sprachwechsel
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

const handlePathValidation = (stateUrl: string, translate: TranslateService, router: Router, currentLang: string): boolean => {
    const pathOnlyUrl = stateUrl.split('#')[0];
    const pathSegment = extractPathSegment(stateUrl);

    const fullExpectedUrlWithoutFragment = getExpectedUrl(pathSegment, translate, currentLang); // Router-Parameter entfernt

    if (fullExpectedUrlWithoutFragment && pathOnlyUrl === fullExpectedUrlWithoutFragment) {
        return true;
    }

    if (fullExpectedUrlWithoutFragment && pathOnlyUrl !== fullExpectedUrlWithoutFragment) {
        const originalFragment = stateUrl.includes('#') ? stateUrl.split('#')[1] : undefined;
        const navigationExtras: NavigationExtras = { replaceUrl: true };
        if (originalFragment) {
            navigationExtras.fragment = originalFragment;
        }

        router.navigateByUrl(fullExpectedUrlWithoutFragment + (originalFragment ? `#${originalFragment}` : ''), navigationExtras);
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