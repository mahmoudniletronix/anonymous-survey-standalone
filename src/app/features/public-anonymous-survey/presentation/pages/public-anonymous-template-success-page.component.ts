import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CheckCircle2 } from 'lucide-angular';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PublicSurveyFooterComponent } from '../components/public-survey-footer.component';
import { PublicSurveyBrandingService } from '../services/public-survey-branding.service';

@Component({
  selector: 'app-public-anonymous-template-success-page',
  standalone: true,
  imports: [IconComponent, TranslatePipe, PublicSurveyFooterComponent],
  templateUrl: './public-anonymous-template-success-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicAnonymousTemplateSuccessPageComponent implements OnInit, OnDestroy {
  private readonly publicSurveyBranding = inject(PublicSurveyBrandingService);

  readonly checkIcon = CheckCircle2;

  ngOnInit(): void {
    this.publicSurveyBranding.applyPublicSurveyBranding();
  }

  ngOnDestroy(): void {
    this.publicSurveyBranding.restoreAppBranding();
  }
}
