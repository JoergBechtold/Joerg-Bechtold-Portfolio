// src/app/app.routes.ts
import { Routes, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlSegment } from '@angular/router';
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

const mainRoutes: Routes = [
    {
        path: '', // <-- Hier ist der "neutrale" Pfad für Home
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.home, titleKey: 'HEADER.ABOUT_ME' }
    },
    {
        path: 'privacy-policy', // <-- Hier ist der "neutrale" Pfad für Privacy Policy
        component: PrivacyPolicyComponent,
        data: { translationKey: AppRouteKeys.privacyPolicy, titleKey: 'LINK.PRIVACY_POLICY_TITLE' }
    },
    {
        path: 'legal-notice', // <-- Hier ist der "neutrale" Pfad für Legal Notice
        component: LegalNoticeComponent,
        data: { translationKey: AppRouteKeys.legalNotice, titleKey: 'LINK.LEGAL_NOTICE' }
    },
];

export function createLocalizedRoutes(translate: TranslateService): Routes {
    const localizedRoutes: Routes = [];
    for (const route of mainRoutes) {
        const translatedPathKey = route.data?.['translationKey'];
        if (translatedPathKey) {
            let translatedPath = translate.instant(translatedPathKey);
            if (translatedPathKey === AppRouteKeys.home && translatedPath === '') {
                translatedPath = '';
            }
            const newRoute = { ...route, path: translatedPath };
            localizedRoutes.push(newRoute);
        } else {
            localizedRoutes.push(route);
        }
    }
    return localizedRoutes;
}

const langResolver = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const translate = inject(TranslateService);
    const router = inject(Router);

    const langParam = route.paramMap.get('lang');
    const defaultLang = translate.getDefaultLang();
    let currentLang = langParam || defaultLang;

    // Fall 1: Ungültige Sprache in URL (z.B. /xyz/home)
    if (!translate.getLangs().includes(currentLang)) {
        console.warn(`[langResolver] Ungültige Sprache in URL: '${langParam}'. Leite zu '${defaultLang}' um.`);
        router.navigateByUrl(`/${defaultLang}`, { replaceUrl: true });
        return false; // Resolver stoppt hier und leitet um
    }

    // Setze ngx-translate auf die Sprache aus der URL (currentLang).
    // DIES IST DER EINZIGE ORT, AN DEM translate.use() DIREKT AUFGERUFEN WIRD (für Router-Parameter).
    if (translate.currentLang !== currentLang) {
        await translate.use(currentLang).toPromise();
        console.log(`[langResolver] ngx-translate Sprache auf '${currentLang}' gesetzt.`);
    } else {
        console.log(`[langResolver] ngx-translate Sprache bereits auf '${currentLang}' gesetzt.`);
    }


    // Routen mit der AKTUELLEN Sprache dynamisch neu konfigurieren
    const newTranslatedChildren = createLocalizedRoutes(translate);
    const langRouteIndex = routes.findIndex(r => r.path === ':lang');
    let updatedRoutes = [...routes];

    if (langRouteIndex > -1) {
        // Überprüfen, ob die Routenkonfiguration wirklich aktualisiert werden muss
        // Um unnötiges resetConfig zu vermeiden
        const currentChildren = updatedRoutes[langRouteIndex].children;
        const needsUpdate = !currentChildren || JSON.stringify(currentChildren) !== JSON.stringify(newTranslatedChildren);

        if (needsUpdate) {
            updatedRoutes[langRouteIndex] = { ...updatedRoutes[langRouteIndex], children: newTranslatedChildren };
            router.resetConfig(updatedRoutes);
            console.log(`[langResolver] Router-Konfiguration erfolgreich für Sprache '${currentLang}' zurückgesetzt.`);
        } else {
            console.log(`[langResolver] Router-Konfiguration für Sprache '${currentLang}' ist bereits aktuell.`);
        }

        console.log(`[langResolver] Generierte Routen-Pfade für '${currentLang}':`);
        newTranslatedChildren.forEach(childRoute => {
            if (childRoute.path && childRoute.path !== '**') {
                console.log(`  - /${currentLang}/${childRoute.path}`);
            } else if (childRoute.path === '') { // Home Route
                console.log(`  - /${currentLang}/`);
            }
        });
    } else {
        console.error(`[langResolver] Fehler: ':lang'-Route nicht in den Hauptrouten gefunden!`);
    }

    // Hier ist state.url die URL, die der Browser *versucht* zu erreichen (z.B. /en/legal-notice).
    const currentUrlSegmentsFromState = state.url.split('/').filter(s => s !== '');
    let pathSegmentAfterLangInOldUrl = '';

    if (currentUrlSegmentsFromState.length > 1) {
        pathSegmentAfterLangInOldUrl = currentUrlSegmentsFromState.slice(1).join('/');
    }
    console.log(`[langResolver] Ursprünglicher Pfad nach Sprache (aus state.url): '${pathSegmentAfterLangInOldUrl}'`);

    let targetAppRouteKey: keyof typeof AppRouteKeys | undefined;

    if (pathSegmentAfterLangInOldUrl === '') {
        targetAppRouteKey = 'home';
    } else {
        // Suche den AppRouteKey, dessen ÜBERSETZTER Pfad (in `currentLang`)
        // mit `pathSegmentAfterLangInOldUrl` übereinstimmt.
        for (const key of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
            if (key === 'home') continue;

            // translate.instant() ist jetzt in der korrekten currentLang, da translate.use() bereits oben aufgerufen wurde
            const translatedPathInCurrentLang = translate.instant(AppRouteKeys[key]);

            if (translatedPathInCurrentLang === pathSegmentAfterLangInOldUrl) {
                targetAppRouteKey = key;
                console.log(`[langResolver] Gefundener AppRouteKey (via Übersetzung in aktueller Sprache '${currentLang}') für '${pathSegmentAfterLangInOldUrl}': '${targetAppRouteKey}'`);
                break;
            }
        }
    }

    let fullExpectedUrl: string | null = null;
    if (targetAppRouteKey) {
        const newTranslatedSegment = translate.instant(AppRouteKeys[targetAppRouteKey]);

        if (targetAppRouteKey === 'home' && newTranslatedSegment === '') {
            fullExpectedUrl = `/${currentLang}`;
        } else {
            fullExpectedUrl = `/${currentLang}/${newTranslatedSegment}`;
        }
        console.log(`[langResolver] Erwarteter URL nach Wechsel für Key '${targetAppRouteKey}': '${fullExpectedUrl}'`);
    }

    // Nur umleiten, wenn die URL NICHT dem erwarteten Muster entspricht
    // Dies fängt Fälle ab, wo z.B. /en/impressum eingegeben wurde, aber impressum kein en-Pfad ist.
    if (fullExpectedUrl && state.url !== fullExpectedUrl) {
        console.log(`[langResolver] Umleitung erforderlich: von '${state.url}' zu '${fullExpectedUrl}'`);
        router.navigateByUrl(fullExpectedUrl, { replaceUrl: true });
        return false; // Resolver stoppt hier und leitet um
    } else if (!fullExpectedUrl) {
        // Dieser Fall tritt ein, wenn `pathSegmentAfterLangInOldUrl` nicht '' ist (also nicht Home)
        // und kein passender AppRouteKey für diesen Pfad in der currentLang gefunden wurde.
        // Das bedeutet, der Pfad ist in der aktuellen Sprache unbekannt (z.B. /de/unknown-page).
        console.warn(`[langResolver] Konnte keinen passenden Schlüssel für den Pfad '${pathSegmentAfterLangInOldUrl}' in der Sprache '${currentLang}' finden. Leite zu Home-Seite der neuen Sprache um.`);
        const homeTranslatedPath = translate.instant(AppRouteKeys.home);
        const homeUrl = `/${currentLang}${(homeTranslatedPath === '') ? '' : '/' + homeTranslatedPath}`;
        router.navigateByUrl(homeUrl, { replaceUrl: true });
        return false; // Resolver stoppt hier und leitet um
    }

    return true; // Resolver erlaubt die Navigation fortzusetzen, da URL gültig ist
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