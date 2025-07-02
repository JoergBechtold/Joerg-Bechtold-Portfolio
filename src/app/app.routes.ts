import { Routes, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlSegment } from '@angular/router';
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
export const mainRoutes: Routes = [ // <--- HIER 'export' HINZUFÜGEN
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
 * ngx-translate auf diese Sprache setzt und die Router-Konfiguration
 * dynamisch mit den lokalisierten Routen aktualisiert.
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
    if (translate.currentLang !== currentLang) {
        console.log(`[langResolver] Wechsle ngx-translate Sprache von '${translate.currentLang}' zu '${currentLang}'.`);
        await translate.use(currentLang).toPromise();
    } else {
        console.log(`[langResolver] ngx-translate Sprache bereits auf '${currentLang}' gesetzt.`);
    }

    // Routen mit der AKTUELLEN Sprache dynamisch neu konfigurieren
    const newTranslatedChildren = createLocalizedRoutes(translate);
    const langRouteIndex = routes.findIndex(r => r.path === ':lang');
    let updatedRoutes = [...routes];

    if (langRouteIndex > -1) {
        updatedRoutes[langRouteIndex] = { ...updatedRoutes[langRouteIndex], children: newTranslatedChildren };
        router.resetConfig(updatedRoutes);
        console.log(`[langResolver] Router-Konfiguration erfolgreich für Sprache '${currentLang}' zurückgesetzt.`);
        console.log(`[langResolver] Konfigurierte Kindrouten für /${currentLang}:`, newTranslatedChildren.map(r => r.path));
    } else {
        console.error(`[langResolver] Fehler: ':lang'-Route nicht in den Hauptrouten gefunden!`);
    }

    // Extrahiert den Pfadsegment nach der Sprache aus der aktuellen URL, die der Browser versucht zu erreichen.
    const currentUrlSegmentsFromState = state.url.split('/').filter(s => s !== '');
    let pathSegmentFromUrl = '';

    if (currentUrlSegmentsFromState.length > 1) {
        pathSegmentFromUrl = currentUrlSegmentsFromState.slice(1).join('/');
    }
    console.log(`[langResolver] Pfadsegment aus der URL (nach Sprache): '${pathSegmentFromUrl}'`);

    let targetComponentRoute: any = null;
    let targetAppRouteKey: keyof typeof AppRouteKeys | undefined;

    // Finde die Komponente, die dieser Route zugeordnet ist, wenn sie existiert
    // durch Iterieren über die neu konfigurierten Kindrouten (newTranslatedChildren)
    for (const routeConfig of newTranslatedChildren) {
        if (routeConfig.path === pathSegmentFromUrl) {
            targetComponentRoute = routeConfig;
            // Wir müssen jetzt den AppRouteKey aus den Daten der Route finden
            const foundTranslationKeyValue = targetComponentRoute.data?.['translationKey'];
            for (const keyName of Object.keys(AppRouteKeys) as Array<keyof typeof AppRouteKeys>) {
                if (AppRouteKeys[keyName] === foundTranslationKeyValue) {
                    targetAppRouteKey = keyName;
                    break;
                }
            }
            break;
        }
    }

    // NEUE LOGIK:
    // Wenn eine Komponente gefunden wurde, aber der Pfad in der URL nicht dem
    // aktuell übersetzten Pfad für DIESE Komponente in der aktuellen Sprache entspricht,
    // dann leiten wir auf den korrekten Pfad um.
    if (targetAppRouteKey) {
        const correctTranslatedPathForTargetKey = translate.instant(AppRouteKeys[targetAppRouteKey]);
        const effectiveCorrectPath = (targetAppRouteKey === 'home' && correctTranslatedPathForTargetKey === '') ? '' : correctTranslatedPathForTargetKey;

        let fullExpectedUrl: string;
        if (effectiveCorrectPath === '') {
            fullExpectedUrl = `/${currentLang}`;
        } else {
            fullExpectedUrl = `/${currentLang}/${effectiveCorrectPath}`;
        }

        if (state.url !== fullExpectedUrl) {
            console.log(`[langResolver] Umleitung erforderlich (Zielkomponente erkannt): von '${state.url}' zu '${fullExpectedUrl}'`);
            router.navigateByUrl(fullExpectedUrl, { replaceUrl: true });
            console.log(`[langResolver] --- Ende Resolver (Umleitung zur korrekten URL für bekannte Route) ---`);
            return false;
        }
        console.log(`[langResolver] Pfad '${pathSegmentFromUrl}' ist ein gültiger übersetzter Pfad für '${targetAppRouteKey}' in '${currentLang}'.`);
    } else {
        // Wenn kein targetAppRouteKey gefunden wurde, bedeutet das, dass der Pfad
        // aus der URL keinem unserer bekannten (übersetzbaren) Pfade entspricht.
        // In diesem Fall leiten wir zur 404-Seite um oder zur Home-Seite.
        // Dein aktueller Code leitet zur Home-Seite um, was für 404-Fälle ok ist.
        console.warn(`[langResolver] Der Pfad '${pathSegmentFromUrl}' ist keine gültige übersetzte Route in der Sprache '${currentLang}' oder keine bekannte Route.`);
        // Dein Original-Fallback zur Home-Seite bleibt hier bestehen:
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
            lang: langResolver // Der Resolver, der die Sprache setzt und Routen neu konfiguriert
        },
        children: mainRoutes // Die Kindrouten, die lokalisiert werden
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