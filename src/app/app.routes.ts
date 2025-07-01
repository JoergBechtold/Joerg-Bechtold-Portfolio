// src/app/app.routes.ts
import { Routes, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { MainContentComponent } from './main-content/main-content.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component'; // WICHTIG: Prüfe diesen Pfad!
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// Diese Keys mappen auf die Schlüssel in deinen ROUTES-Objekten in den JSON-Dateien
export const AppRouteKeys = {
    home: 'ROUTES.HOME',
    privacyPolicy: 'ROUTES.PRIVACY_POLICY',
    legalNotice: 'ROUTES.LEGAL_NOTICE',
    notFound: 'ROUTES.NOT_FOUND'
    // Keine Keys für AboutMe, Skills, Portfolio, Contact, da diese Fragment-Links sind
};

// Dies sind die "internen" Routen deiner Anwendung.
// Die 'path'-Eigenschaft hier sind die Standard-Pfade (oft englisch oder leer),
// die als Basis dienen, bevor sie durch die Übersetzung ersetzt werden.
const mainRoutes: Routes = [
    {
        path: '', // Die Startseite für jede Sprache
        component: MainContentComponent,
        data: { translationKey: AppRouteKeys.home, titleKey: 'HEADER.ABOUT_ME' }
    },
    {
        path: 'privacy-policy', // Standard-Pfad für Datenschutzerklärung
        component: PrivacyPolicyComponent,
        data: { translationKey: AppRouteKeys.privacyPolicy, titleKey: 'LINK.PRIVACY_POLICY_TITLE' }
    },
    {
        path: 'legal-notice', // <-- Dieser Pfad ist der "Standard" oder Fallback-Pfad
        component: LegalNoticeComponent, // <-- Stelle sicher, dass LegalNoticeComponent importiert ist
        data: { translationKey: AppRouteKeys.legalNotice, titleKey: 'LINK.LEGAL_NOTICE' }
    },
    // Hier keine '**'-Route, da diese global behandelt wird, um Endlosschleifen zu vermeiden.
];

// Diese Funktion generiert die übersetzten Routen zur Laufzeit
export function createLocalizedRoutes(translate: TranslateService): Routes {
    const localizedRoutes: Routes = [];
    for (const route of mainRoutes) {
        const translatedPathKey = route.data?.['translationKey'];
        if (translatedPathKey) {
            let translatedPath = translate.instant(translatedPathKey);
            // Sonderbehandlung für den Home-Pfad, wenn er leer ist
            if (translatedPathKey === AppRouteKeys.home && translatedPath === '') {
                translatedPath = ''; // Stellt sicher, dass der Pfad als leerer String behandelt wird
            }
            const newRoute = { ...route, path: translatedPath };
            localizedRoutes.push(newRoute);
        } else {
            localizedRoutes.push(route);
        }
    }
    return localizedRoutes;
}

// Der Resolver, der die Sprache setzt und die Routen neu konfiguriert
const langResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const translate = inject(TranslateService);
    const router = inject(Router);

    const langParam = route.paramMap.get('lang');
    const defaultLang = translate.getDefaultLang();

    let currentLang = langParam || defaultLang;

    if (!translate.getLangs().includes(currentLang)) {
        console.warn(`Ungültige Sprache in URL: ${langParam}. Leite zu ${defaultLang} um.`);
        router.navigateByUrl(`/${defaultLang}`, { replaceUrl: true });
        return false;
    }

    // ACHTUNG: Hier wird translate.use aufgerufen, bevor die Routen neu konfiguriert werden.
    // Dies ist der kritische Punkt.
    return translate.use(currentLang).toPromise().then(() => {
        const newTranslatedChildren = createLocalizedRoutes(translate);
        const langRouteIndex = routes.findIndex(r => r.path === ':lang');
        if (langRouteIndex > -1) {
            const updatedRoutes = [...routes];
            updatedRoutes[langRouteIndex] = { ...updatedRoutes[langRouteIndex], children: newTranslatedChildren };
            router.resetConfig(updatedRoutes);
        }
        return currentLang;
    });
};

// Die Haupt-Routenkonfiguration für die Anwendung
export const routes: Routes = [
    {
        path: ':lang', // Fängt das Sprachpräfix ab (z.B. /de, /en)
        resolve: {
            lang: langResolver // Ruft den Resolver auf, um die Sprache zu setzen und Routen zu laden
        },
        children: mainRoutes // Die Kindrouten, die dynamisch übersetzt werden
    },
    // Umleitung von der Root-URL (z.B. '/') zur Standard-Sprache (z.B. '/de')
    {
        path: '',
        redirectTo: `/de`, // Leitet zu /de/ (oder /de/impressum, etc. je nach Standard-Home-Pfad)
        pathMatch: 'full'
    },
    // Globale Wildcard-Route für alle nicht erkannten Pfade.
    // Diese muss ZULETZT stehen und fängt wirklich ALLES ab, was nicht gematcht wurde.
    {
        path: '**',
        component: PageNotFoundComponent // Lade die 404-Komponente direkt
    }
];