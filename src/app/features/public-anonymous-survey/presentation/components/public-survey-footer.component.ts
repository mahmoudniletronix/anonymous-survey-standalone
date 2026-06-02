import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-public-survey-footer',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <footer
      class="border-t border-[#11A7C9]/20 bg-[#1F3A56] px-4 py-3 text-center text-[11px] font-bold text-[#D8E7F3] shadow-[0_-10px_24px_rgba(15,23,42,0.05)]"
      [attr.aria-label]="'publicAnonymousTemplates.footerPoweredBy' | t"
      [attr.dir]="i18n.direction()"
    >
      <a
        class="inline-flex max-w-full flex-wrap items-center justify-center gap-2 transition duration-200 hover:text-white"
        href="https://www.niletronix.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="uppercase tracking-wide">
          {{ 'publicAnonymousTemplates.footerPoweredBy' | t }}
        </span>
        <img class="h-4 w-auto object-contain" src="images/nile.png" alt="NILETRONIX" />
        <span class="break-words text-[#B7EAF4] [unicode-bidi:isolate]" dir="ltr">
          www.niletronix.com
        </span>
      </a>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSurveyFooterComponent {
  readonly i18n = inject(I18nService);
}
