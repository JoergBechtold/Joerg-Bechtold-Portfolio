// app.routes.ts
import { Routes, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
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
    privacyPolicy: 'ROUTES.PRIVACY_POLICY', // Bleibt ein Translation Key
    legalNotice: 'ROUTES.LEGAL_NOTICE',   // Bleibt ein Translation Key
    notFound: 'ROUTES.NOT_FOUND',
    aboutMeFragment: 'FRAGMENTS.ABOUT_ME_ID',
    skillsFragment: 'FRAGMENTS.SKILLS_ID',
    portfolioFragment: 'FRAGMENTS.PORTFOLIO_ID',
    contactFragment: 'FRAGMENTS.CONTACT_ID'
};

const langResolver = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> => {
    const translate = inject(TranslateService);
    const router = inject(Router);

    const langParam = route.paramMap.get('lang');
    const defaultLang = translate.getDefaultLang();
    const availableLangs = translate.getLangs();
    const currentLang = langParam || defaultLang;

    if (!availableLangs.includes(currentLang)) {
        console.warn(`[langResolver] Ungültige Sprache: '${langParam}'. Weiterleitung zu '${defaultLang}'.`);
        router.navigateByUrl(`/${defaultLang}`, { replaceUrl: true });
        return false;
    }

    if (translate.currentLang !== currentLang) {
        await translate.use(currentLang).toPromise();
    }
    return true;
};

// Importiere hier den TranslateService für die statische Verwendung im Router
// Da dies außerhalb einer Komponente/Service geschieht, müssen wir es direkt instanziieren oder
// eine Funktion verwenden, die zur Laufzeit inject aufruft.
// Für statische Routen kann das aber knifflig sein, da translate.instant()
// nicht synchron die korrekten Übersetzungen liefert, wenn die Sprache noch nicht geladen ist.

// Besser ist es, die Pfade dynamisch zu generieren, sobald die Übersetzung verfügbar ist.
// Eine robustere Lösung wäre, die Routen dynamisch zur Laufzeit hinzuzufügen oder
// einen Guard zu verwenden, der die übersetzten Pfade validiert.

// Für den Anfang können wir es so versuchen und müssen sicherstellen, dass die
// Übersetzungen frühzeitig geladen werden (was du mit APP_INITIALIZER machst).

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
            // Korrigierte Routen für Impressum und Datenschutz
            {
                // Nutze den festen übersetzten Pfad aus deinen Translation Keys
                path: 'impressum', // DE
                component: LegalNoticeComponent,
                data: { translationKey: AppRouteKeys.legalNotice, titleKey: 'LINK.LEGAL_NOTICE' }
            },
            {
                // Nutze den festen übersetzten Pfad aus deinen Translation Keys
                path: 'datenschutzerklaerung', // DE
                component: PrivacyPolicyComponent,
                data: { translationKey: AppRouteKeys.privacyPolicy, titleKey: 'LINK.PRIVACY_POLICY' }
            },
            {
                // Nutze den festen übersetzten Pfad aus deinen Translation Keys
                path: 'legal-notice', // EN
                component: LegalNoticeComponent,
                data: { translationKey: AppRouteKeys.legalNotice, titleKey: 'LINK.LEGAL_NOTICE' }
            },
            {
                // Nutze den festen übersetzten Pfad aus deinen Translation Keys
                path: 'privacy-policy', // EN
                component: PrivacyPolicyComponent,
                data: { translationKey: AppRouteKeys.privacyPolicy, titleKey: 'LINK.PRIVACY_POLICY' }
            },
            // ... weitere Child-Routen (die möglicherweise Fragmente verwenden)
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