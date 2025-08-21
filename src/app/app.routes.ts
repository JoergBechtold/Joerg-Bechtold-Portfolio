import {
  Routes,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
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
  contactFragment: 'FRAGMENTS.CONTACT_ID',
};

const langResolver = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Promise<boolean> => {
  const translate = inject(TranslateService);
  const router = inject(Router);

  const langParam = route.paramMap.get('lang');
  const defaultLang = translate.getDefaultLang();
  const availableLangs = translate.getLangs();
  const currentLang = langParam || defaultLang;

  if (!availableLangs.includes(currentLang)) {
    console.warn(
      `[langResolver] Ungültige Sprache: '${langParam}'. Weiterleitung zu '${defaultLang}'.`
    );
    router.navigateByUrl(`/${defaultLang}`, { replaceUrl: true });
    return false;
  }

  if (translate.currentLang !== currentLang) {
    await translate.use(currentLang).toPromise();
  }
  return true;
};

export const routes: Routes = [
  {
    path: ':lang',
    resolve: {
      lang: langResolver,
    },
    children: [
      {
        path: '',
        component: MainContentComponent,
        data: {
          translationKey: AppRouteKeys.home,
          fragmentKey: AppRouteKeys.home,
        },
      },

      {
        path: 'impressum',
        component: LegalNoticeComponent,
        data: {
          translationKey: AppRouteKeys.legalNotice,
          titleKey: 'LINK.LEGAL_NOTICE',
        },
      },
      {
        path: 'datenschutzerklaerung',
        component: PrivacyPolicyComponent,
        data: {
          translationKey: AppRouteKeys.privacyPolicy,
          titleKey: 'LINK.PRIVACY_POLICY',
        },
      },
      {
        path: 'legal-notice',
        component: LegalNoticeComponent,
        data: {
          translationKey: AppRouteKeys.legalNotice,
          titleKey: 'LINK.LEGAL_NOTICE',
        },
      },
      {
        path: 'privacy-policy',
        component: PrivacyPolicyComponent,
        data: {
          translationKey: AppRouteKeys.privacyPolicy,
          titleKey: 'LINK.PRIVACY_POLICY',
        },
      },
    ],
  },
  {
    path: '',
    redirectTo: `/de`,
    pathMatch: 'full',
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];
