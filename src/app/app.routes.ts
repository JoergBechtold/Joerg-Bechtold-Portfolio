import { Routes, Route, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MainContentComponent } from './main-content/main-content.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
// TranslationLogicHelperService wird hier nicht mehr direkt benötigt, da der Resolver vereinfacht wurde
// import { TranslationLogicHelperService } from './services/translate/translation-logic-helper.service';


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

// Resolver, der nur die Sprache setzt und prüft, aber keine Router-Konfiguration mehr ändert
const langResolver = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> => {
    const translate = inject(TranslateService);
    const router = inject(Router);
    // const helper = inject(TranslationLogicHelperService); // Nicht mehr benötigt für diesen Resolver

    const langParam = route.paramMap.get('lang');
    const defaultLang = translate.getDefaultLang();
    const availableLangs = translate.getLangs();
    const currentLang = langParam || defaultLang;

    if (!availableLangs.includes(currentLang)) {
        console.warn(`[langResolver] Ungültige Sprache: '${langParam}'. Weiterleitung zu '${defaultLang}'.`);
        router.navigateByUrl(`/${defaultLang}`, { replaceUrl: true });
        return false;
    }

    // Setze die Sprache, aber triggere keine Neuladung der Routen
    if (translate.currentLang !== currentLang) {
        await translate.use(currentLang).toPromise();
    }

    return true; // Erlaube die Navigation
};

// Hauptroutenkonfiguration
export const routes: Routes = [
    {
        path: ':lang',
        resolve: {
            lang: langResolver
        },
        children: [
            {
                path: '',
                component: MainContentComponent,
                data: { translationKey: AppRouteKeys.home, fragmentKey: AppRouteKeys.home }
            },
            {
                // Für Deutsch: 'datenschutzerklaerung' (aus de.json -> ROUTES.PRIVACY_POLICY)
                path: 'datenschutzerklaerung', // <-- IST DAS HIER EXAKT RICHTIG GESCHRIEBEN?
                component: PrivacyPolicyComponent,
                data: { translationKey: AppRouteKeys.privacyPolicy, titleKey: 'LINK.PRIVACY_POLICY' }
            },
            {
                // Für Englisch: 'privacy-policy' (aus en.json -> ROUTES.PRIVACY_POLICY)
                path: 'privacy-policy', // <-- IST DAS HIER EXAKT RICHTIG GESCHRIEBEN?
                component: PrivacyPolicyComponent,
                data: { translationKey: AppRouteKeys.privacyPolicy, titleKey: 'LINK.PRIVACY_POLICY' }
            },
            {
                path: 'impressum', // Dieser sollte stimmen
                component: LegalNoticeComponent,
                data: { translationKey: AppRouteKeys.legalNotice, titleKey: 'LINK.LEGAL_NOTICE' }
            },
            {
                path: 'legal-notice', // Dieser sollte stimmen
                component: LegalNoticeComponent,
                data: { translationKey: AppRouteKeys.legalNotice, titleKey: 'LINK.LEGAL_NOTICE' }
            },
            // ... weitere Child-Routen
        ]
    },
    {
        path: '',
        redirectTo: `/de`, // Standardmäßige Weiterleitung zur deutschen Version
        pathMatch: 'full'
    },
    {
        path: '**', // Catch-all für nicht gefundene Routen
        component: PageNotFoundComponent
    }
];