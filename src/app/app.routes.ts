import { Routes, Route, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MainContentComponent } from './main-content/main-content.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TranslationLogicHelperService } from './services/translate/translation-logic-helper.service';

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

// Basiskonfiguration der Routen, ohne Sprachpräfix
export const baseRoutes: Routes = [
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

// Resolver, der nur die Sprache setzt und prüft, aber keine Router-Konfiguration mehr ändert
const langResolver = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> => {
    const translate = inject(TranslateService);
    const router = inject(Router);
    const helper = inject(TranslationLogicHelperService);

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

    // Validierung der URL durchführen, falls nötig, aber nicht mehr die Routen neu setzen
    // helper.validateAndRedirectUrl(state.url, currentLang); // Diese Logik kann vereinfacht/verlagert werden

    return true; // Erlaube die Navigation
};

// Funktion zum Erzeugen der lokalisierten Routen für die dynamische Routenanpassung
// Dies wird NICHT mehr zur Laufzeit für die Router-Konfiguration verwendet,
// sondern nur, um die Pfade für Navigation zu generieren.
export function createLocalizedRoutesForNavigation(translate: TranslateService): Routes {
    return baseRoutes.map(route => {
        const translatedPathKey = route.data?.['translationKey'];
        if (!translatedPathKey) return route;

        let translatedPath = translate.instant(translatedPathKey);
        // Besondere Behandlung für die "Home"-Route, die im Pfad leer sein soll
        if (translatedPathKey === AppRouteKeys.home && translatedPath === '') {
            translatedPath = '';
        }
        return { ...route, path: translatedPath };
    });
}

// Hauptroutenkonfiguration
export const routes: Routes = [
    {
        path: ':lang', // Der Sprachparameter
        resolve: {
            lang: langResolver // Sprache setzen und validieren
        },
        children: [
            {
                path: '', // Home-Route für die Sprache (z.B. /de)
                component: MainContentComponent,
                data: { translationKey: AppRouteKeys.home, fragmentKey: AppRouteKeys.home }
            },
            // Hier fügen wir die anderen Routen statisch hinzu.
            // Wenn eine Route nur ein Fragment ist und auf MainContentComponent zeigt,
            // brauchen wir keine separate URL dafür, da wir über das Fragment scrollen.
            // Andernfalls, wenn es eine eigene Seite ist (PrivacyPolicy, LegalNotice),
            // behalten wir sie bei.
            {
                path: 'privacy-policy', // Beispiel: /de/privacy-policy
                component: PrivacyPolicyComponent,
                data: { translationKey: AppRouteKeys.privacyPolicy, titleKey: 'LINK.PRIVACY_POLICY' }
            },
            {
                path: 'legal-notice', // Beispiel: /de/legal-notice
                component: LegalNoticeComponent,
                data: { translationKey: AppRouteKeys.legalNotice, titleKey: 'LINK.LEGAL_NOTICE' }
            },
            // Wir verwenden Wildcard-Routen für die abschnittsbasierten Seiten
            // Diese Routen werden nicht direkt in der URL angezeigt, sondern über Fragmente angesprungen.
            // Wenn du möchtest, dass diese Routen auch eigene URLs haben (z.B. /de/ueber-mich),
            // musst du sie hier explizit mit ihren übersetzten Pfaden definieren
            // und die Logik im TranslateManagerService anpassen.
            // Vorerst belassen wir es bei der Fragment-basierten Navigation für diese Abschnitte
            // um die Anzahl der tatsächlichen Routenwechsel zu minimieren.
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