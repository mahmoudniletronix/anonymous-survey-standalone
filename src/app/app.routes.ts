import { Routes } from '@angular/router';
import { PublicAnonymousTemplateService } from './features/public-anonymous-survey/data/public-anonymous-template.service';
import { PublicAnonymousTemplatePageComponent } from './features/public-anonymous-survey/presentation/pages/public-anonymous-template-page.component';
import { PublicAnonymousTemplateStore } from './features/public-anonymous-survey/presentation/state/public-anonymous-template.store';

export const routes: Routes = [
  {
    path: 'survey/:anonymousTemplateId/success',
    redirectTo: ':anonymousTemplateId/success',
  },
  {
    path: 'survey/:anonymousTemplateId',
    pathMatch: 'full',
    redirectTo: ':anonymousTemplateId',
  },
  {
    path: 'survey',
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: '',
    pathMatch: 'full',
    component: PublicAnonymousTemplatePageComponent,
    providers: [PublicAnonymousTemplateService, PublicAnonymousTemplateStore],
  },
  {
    path: ':anonymousTemplateId',
    loadChildren: () =>
      import('./features/public-anonymous-survey/public-anonymous-survey.routes').then(
        (m) => m.PUBLIC_ANONYMOUS_SURVEY_ROUTES,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
