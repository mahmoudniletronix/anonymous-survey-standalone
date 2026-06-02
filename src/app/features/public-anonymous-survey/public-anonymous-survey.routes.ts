import { Routes } from '@angular/router';
import { PublicAnonymousTemplateService } from './data/public-anonymous-template.service';
import { PublicAnonymousTemplatePageComponent } from './presentation/pages/public-anonymous-template-page.component';
import { PublicAnonymousTemplateStore } from './presentation/state/public-anonymous-template.store';

export const PUBLIC_ANONYMOUS_SURVEY_ROUTES: Routes = [
  {
    path: 'success',
    loadComponent: () =>
      import(
        './presentation/pages/public-anonymous-template-success-page.component'
      ).then((m) => m.PublicAnonymousTemplateSuccessPageComponent),
  },
  {
    path: '',
    component: PublicAnonymousTemplatePageComponent,
    providers: [PublicAnonymousTemplateService, PublicAnonymousTemplateStore],
  },
];
