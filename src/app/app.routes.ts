import { Routes, Route, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MainContentComponent } from './main-content/main-content.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export const AppRouteKeys = {
    home: 'ROUTES.HOME',
    privacyPolicy: 'ROUTES.PRIVACY_POLICY',
    legalNotice: 'ROUTES.LEGAL_NOTICE',
    notFound: 'ROUTES.NOT_FOUND'
};

export const mainRoutes: Routes = [
    {
        path: '',
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.home, titleKey: 'HEADER.ABOUT_ME' }
    },
    {
        path: 'privacy-policy',
        component: PrivacyPolicyComponent,
        data: { translationKey: AppRouteKeys.privacyPolicy, titleKey: 'LINK.PRIVACY_POLICY_TITLE' }
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
    let currentLang = langParam || defaultLang;

    if (!translate.getLangs().includes(currentLang)) {
        console.warn(`[langResolver] Ungültige Sprache in URL: '${langParam}'. Leite zu '${defaultLang}' um.`);
        router.navigateByUrl(`/${defaultLang}`, { replaceUrl: true });
        return false;
    }

    if (translate.currentLang !== currentLang) {
        await translate.use(currentLang).toPromise();
    }

    const currentUrlSegmentsFromState = state.url.split('/').filter(s => s !== '');
    let pathSegmentFromUrl = '';

    if (currentUrlSegmentsFromState.length > 1) {
        pathSegmentFromUrl = currentUrlSegmentsFromState.slice(1).join('/');
    }

    let targetAppRouteKey: keyof typeof AppRouteKeys | undefined;
    const tempLocalizedRoutes = createLocalizedRoutes(translate);

    for (const routeConfig of tempLocalizedRoutes) {
        if (routeConfig.path === pathSegmentFromUrl) {
            const foundTranslationKeyValue = routeConfig.data?.['translationKey'];
            for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
                if (AppRouteKeys[keyName] === foundTranslationKeyValue) {
                    targetAppRouteKey = keyName;
                    break;
                }
            }
            break;
        }
    }

    let fullExpectedUrl: string;
    if (targetAppRouteKey) {
        const correctTranslatedPathForTargetKey = translate.instant(AppRouteKeys[targetAppRouteKey]);
        const effectiveCorrectPath = (targetAppRouteKey === 'home' && correctTranslatedPathForTargetKey === '') ? '' : correctTranslatedPathForTargetKey;

        if (effectiveCorrectPath === '') {
            fullExpectedUrl = `/${currentLang}`;
        } else {
            fullExpectedUrl = `/${currentLang}/${effectiveCorrectPath}`;
        }

        if (state.url !== fullExpectedUrl) {
            router.navigateByUrl(fullExpectedUrl, { replaceUrl: true });
            return false;
        }
        console.log(`[langResolver] Pfad '${pathSegmentFromUrl}' ist ein gültiger übersetzter Pfad für '${targetAppRouteKey}' in '${currentLang}'.`);
    } else {
        console.warn(`[langResolver] Der Pfad '${pathSegmentFromUrl}' ist keine gültige übersetzte Route in der Sprache '${currentLang}' oder keine bekannte Route.`);
        const homeTranslatedPath = translate.instant(AppRouteKeys.home);
        const homeUrl = `/${currentLang}${(homeTranslatedPath === '') ? '' : '/' + homeTranslatedPath}`;
        router.navigateByUrl(homeUrl, { replaceUrl: true });
        return false;
    }
    return true;
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