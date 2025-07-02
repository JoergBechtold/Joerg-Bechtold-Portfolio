import { Routes, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MainContentComponent } from './main-content/main-content.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// Definiert die Schlüssel für die Routen, die in den Übersetzungsdateien verwendet werden
export const AppRouteKeys = {
    home: 'ROUTES.HOME',
    privacyPolicy: 'ROUTES.PRIVACY_POLICY',
    legalNotice: 'ROUTES.LEGAL_NOTICE',
    notFound: 'ROUTES.NOT_FOUND'
};

// Hauptrouten, die die "neutralen" Pfade definieren (nicht sprachspezifisch)
export const mainRoutes: Routes = [
    {
        path: '', // Der neutrale Pfad für die Startseite
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.home, titleKey: 'HEADER.ABOUT_ME' }
    },
    {
        path: 'privacy-policy', // Der neutrale Pfad für die Datenschutzerklärung
        component: PrivacyPolicyComponent,
        data: { translationKey: AppRouteKeys.privacyPolicy, titleKey: 'LINK.PRIVACY_POLICY_TITLE' }
    },
    {
        path: 'legal-notice', // Der neutrale Pfad für das Impressum
        component: LegalNoticeComponent,
        data: { translationKey: AppRouteKeys.legalNotice, titleKey: 'LINK.LEGAL_NOTICE' }
    },
];

/**
 * Erstellt lokalisierte Routen basierend auf der aktuellen Sprache des TranslateService.
 * @param translate Der TranslateService-Instanz.
 * @returns Ein Array von Routen mit übersetzten Pfaden.
 */
export function createLocalizedRoutes(translate: TranslateService): Routes {
    const localizedRoutes: Routes = [];
    for (const route of mainRoutes) {
        const translatedPathKey = route.data?.['translationKey'];
        if (translatedPathKey) {
            let translatedPath = translate.instant(translatedPathKey);
            // Spezielle Behandlung für die Home-Route, wenn ihr übersetzter Pfad leer ist
            if (translatedPathKey === AppRouteKeys.home && translatedPath === '') {
                translatedPath = ''; // Sicherstellen, dass es ein leerer String für den Root-Pfad ist
            }
            const newRoute = { ...route, path: translatedPath };
            localizedRoutes.push(newRoute);
        } else {
            localizedRoutes.push(route);
        }
    }
    return localizedRoutes;
}

/**
 * Resolver, der die Sprache aus dem URL-Parameter extrahiert,
 * ngx-translate auf diese Sprache setzt und Umleitungen bei ungültigen Pfaden vornimmt.
 * Die Router-Konfiguration wird nun von der NavigationComponent aktualisiert.
 * @param route Der ActivatedRouteSnapshot für die aktuelle Route.
 * @param state Der RouterStateSnapshot für den aktuellen Router-Zustand.
 * @returns True, wenn die Navigation fortgesetzt werden soll, False für eine Umleitung.
 */
const langResolver = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const translate = inject(TranslateService);
    const router = inject(Router);

    const langParam = route.paramMap.get('lang');
    const defaultLang = translate.getDefaultLang();
    let currentLang = langParam || defaultLang;

    console.log(`[langResolver] --- Start Resolver für URL: '${state.url}', Lang Param: '${langParam}' ---`);

    // Fall 1: Ungültige Sprache in URL (z.B. /xyz/home)
    if (!translate.getLangs().includes(currentLang)) {
        console.warn(`[langResolver] Ungültige Sprache in URL: '${langParam}'. Leite zu '${defaultLang}' um.`);
        router.navigateByUrl(`/${defaultLang}`, { replaceUrl: true });
        console.log(`[langResolver] --- Ende Resolver (Umleitung wegen ungültiger Sprache) ---`);
        return false;
    }

    // Setze ngx-translate auf die Sprache aus der URL (currentLang).
    // Dies ist wichtig, damit `translate.instant` im Resolver die korrekten Pfade liefert.
    if (translate.currentLang !== currentLang) {
        console.log(`[langResolver] Wechsle ngx-translate Sprache von '${translate.currentLang}' zu '${currentLang}'.`);
        await translate.use(currentLang).toPromise();
    } else {
        console.log(`[langResolver] ngx-translate Sprache bereits auf '${currentLang}' gesetzt.`);
    }

    // Extrahiert den Pfadsegment nach der Sprache aus der aktuellen URL, die der Browser versucht zu erreichen.
    const currentUrlSegmentsFromState = state.url.split('/').filter(s => s !== '');
    let pathSegmentFromUrl = '';

    if (currentUrlSegmentsFromState.length > 1) {
        pathSegmentFromUrl = currentUrlSegmentsFromState.slice(1).join('/');
    }
    console.log(`[langResolver] Pfadsegment aus der URL (nach Sprache): '${pathSegmentFromUrl}'`);

    let targetAppRouteKey: keyof typeof AppRouteKeys | undefined;

    // Erstelle temporäre lokalisierte Routen, um den korrekten Pfad für die aktuelle Komponente zu finden.
    // Dies ist notwendig, da `router.resetConfig` jetzt woanders aufgerufen wird.
    const tempLocalizedRoutes = createLocalizedRoutes(translate);

    // Finde den AppRouteKey, der dem pathSegmentFromUrl in den *temporär* konfigurierten Routen entspricht.
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

        // Leite um, wenn die aktuelle URL nicht der erwarteten URL entspricht.
        // Die Sprachänderung wird nun von der NavigationComponent verarbeitet,
        // daher ist hier keine zusätzliche Umleitung für `languageWasChangedInThisRun` nötig.
        if (state.url !== fullExpectedUrl) {
            console.log(`[langResolver] Umleitung erforderlich (Zielkomponente erkannt): von '${state.url}' zu '${fullExpectedUrl}'`);
            router.navigateByUrl(fullExpectedUrl, { replaceUrl: true });
            console.log(`[langResolver] --- Ende Resolver (Umleitung zur korrekten URL für bekannte Route) ---`);
            return false; // Aktuelle Navigation abbrechen, neue Navigation gestartet
        }
        console.log(`[langResolver] Pfad '${pathSegmentFromUrl}' ist ein gültiger übersetzter Pfad für '${targetAppRouteKey}' in '${currentLang}'.`);
    } else {
        // Wenn kein targetAppRouteKey gefunden wurde, bedeutet das, dass der Pfad
        // aus der URL keinem unserer bekannten (übersetzbaren) Pfade entspricht.
        // In diesem Fall leiten wir zur Home-Seite um.
        console.warn(`[langResolver] Der Pfad '${pathSegmentFromUrl}' ist keine gültige übersetzte Route in der Sprache '${currentLang}' oder keine bekannte Route.`);
        const homeTranslatedPath = translate.instant(AppRouteKeys.home);
        const homeUrl = `/${currentLang}${(homeTranslatedPath === '') ? '' : '/' + homeTranslatedPath}`;
        console.log(`[langResolver] Leite zu Home-Seite um: '${homeUrl}'`);
        router.navigateByUrl(homeUrl, { replaceUrl: true });
        console.log(`[langResolver] --- Ende Resolver (Umleitung zu Home-Seite, unbekannter Pfad) ---`);
        return false;
    }

    console.log(`[langResolver] --- Ende Resolver (Navigation fortgesetzt) ---`);
    return true;
};

// Die Hauptrouten-Konfiguration für die Anwendung
export const routes: Routes = [
    {
        path: ':lang', // Sprachparameter in der URL (z.B. /de, /en)
        resolve: {
            lang: langResolver // Der Resolver, der die Sprache setzt und Routen prüft
        },
        children: mainRoutes // Die Kindrouten, die lokalisiert werden (werden dynamisch übersetzt)
    },
    {
        path: '', // Standard-Root-Pfad, leitet auf die Standard-Sprache um
        redirectTo: `/de`,
        pathMatch: 'full'
    },
    {
        path: '**', // Wildcard-Route für nicht gefundene Pfade
        component: PageNotFoundComponent
    }
];