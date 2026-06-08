import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  PublicAnonymousSubmissionResult,
  PublicAnonymousTemplate,
  SubmitPublicAnonymousResponsePayload,
} from '../../domain/public-anonymous-template.model';
import { PublicAnonymousTemplateService } from '../../data/public-anonymous-template.service';

@Injectable()
export class PublicAnonymousTemplateStore {
  private readonly publicAnonymousTemplateService = inject(PublicAnonymousTemplateService);
  private readonly templateSignal = signal<PublicAnonymousTemplate | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly submittingSignal = signal(false);
  private readonly submitErrorSignal = signal<string | null>(null);
  private readonly submissionSignal = signal<PublicAnonymousSubmissionResult | null>(null);

  readonly template = this.templateSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly submitting = this.submittingSignal.asReadonly();
  readonly submitError = this.submitErrorSignal.asReadonly();
  readonly submission = this.submissionSignal.asReadonly();
  readonly hasTemplate = computed(() => this.templateSignal() !== null);

  load(anonymousTemplateId: string): void {
    const normalizedId = anonymousTemplateId.trim();

    if (normalizedId.length === 0) {
      this.templateSignal.set(null);
      this.errorSignal.set('publicAnonymousTemplates.idRequired');
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.submitErrorSignal.set(null);
    this.submissionSignal.set(null);

    this.publicAnonymousTemplateService
      .getTemplate(normalizedId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (template) => {
          this.templateSignal.set(template);
          this.errorSignal.set(null);
        },
        error: (error: unknown) => {
          this.templateSignal.set(null);
          this.errorSignal.set(this.readLoadErrorKey(error));
        },
      });
  }

  submitResponse(
    anonymousTemplateId: string,
    payload: SubmitPublicAnonymousResponsePayload,
    onSubmitted: (submission: PublicAnonymousSubmissionResult) => void,
  ): void {
    const normalizedId = anonymousTemplateId.trim();

    if (normalizedId.length === 0 || this.submittingSignal()) {
      return;
    }

    this.submittingSignal.set(true);
    this.submitErrorSignal.set(null);
    this.submissionSignal.set(null);

    this.publicAnonymousTemplateService
      .submitResponse(normalizedId, payload)
      .pipe(
        take(1),
        finalize(() => this.submittingSignal.set(false)),
      )
      .subscribe({
        next: (submission) => {
          this.submissionSignal.set(submission);
          this.submitErrorSignal.set(null);
          onSubmitted(submission);
        },
        error: (error: unknown) => {
          this.submitErrorSignal.set(this.readSubmitErrorKey(error));
        },
      });
  }

  clear(): void {
    this.templateSignal.set(null);
    this.errorSignal.set(null);
    this.loadingSignal.set(false);
    this.submittingSignal.set(false);
    this.submitErrorSignal.set(null);
    this.submissionSignal.set(null);
  }

  private readLoadErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'publicAnonymousTemplates.loadError';
    }

    const resourceKey = this.readResourceKey(error);

    if (resourceKey.includes('Required')) {
      return 'publicAnonymousTemplates.idRequired';
    }
    if (resourceKey.includes('NotStarted')) {
      return 'publicAnonymousTemplates.notStarted';
    }
    if (resourceKey.includes('Expired')) {
      return 'publicAnonymousTemplates.expired';
    }
    if (resourceKey.includes('HasNoQuestions')) {
      return 'publicAnonymousTemplates.noQuestions';
    }
    if (resourceKey.includes('NotAvailable') || resourceKey.includes('Inactive')) {
      return 'publicAnonymousTemplates.notAvailable';
    }
    if (resourceKey.includes('NotFound') || error.status === 404) {
      return 'publicAnonymousTemplates.notFound';
    }
    if (error.status === 0) {
      return 'publicAnonymousTemplates.networkError';
    }

    return 'publicAnonymousTemplates.loadError';
  }

  private readSubmitErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'publicAnonymousTemplates.submitError';
    }

    const resourceKey = this.readResourceKey(error);
    const normalizedKey = resourceKey.replace(/[\s_.-]/g, '').toLowerCase();

    if (normalizedKey.includes('image')) {
      if (
        normalizedKey.includes('required') ||
        normalizedKey.includes('missing') ||
        normalizedKey.includes('empty')
      ) {
        return 'publicAnonymousTemplates.imageRequired';
      }

      return 'publicAnonymousTemplates.imageFileInvalid';
    }
    if (normalizedKey.includes('hidden') && normalizedKey.includes('answer')) {
      return 'publicAnonymousTemplates.hiddenAnswersRejected';
    }
    if (
      normalizedKey.includes('missing') ||
      (normalizedKey.includes('visible') && normalizedKey.includes('required'))
    ) {
      return 'publicAnonymousTemplates.missingVisibleAnswers';
    }
    if (normalizedKey.includes('custominput')) {
      return 'publicAnonymousTemplates.customInputValidationError';
    }
    if (normalizedKey.includes('option') && normalizedKey.includes('question')) {
      return 'publicAnonymousTemplates.optionMismatch';
    }
    if (normalizedKey.includes('starrating') || normalizedKey.includes('smile')) {
      return 'publicAnonymousTemplates.scaleValueInvalid';
    }
    if (normalizedKey.includes('voice')) {
      return 'publicAnonymousTemplates.voiceRequired';
    }
    if (normalizedKey.includes('text') || normalizedKey.includes('complain')) {
      return 'publicAnonymousTemplates.textRequired';
    }
    if (normalizedKey.includes('notfound') || error.status === 404) {
      return 'publicAnonymousTemplates.notFound';
    }
    if (normalizedKey.includes('notavailable') || normalizedKey.includes('inactive')) {
      return 'publicAnonymousTemplates.notAvailable';
    }
    if (error.status === 0) {
      return 'publicAnonymousTemplates.networkError';
    }

    return 'publicAnonymousTemplates.submitError';
  }

  private readResourceKey(error: HttpErrorResponse): string {
    const body = error.error;
    if (!this.isRecord(body)) {
      return '';
    }

    const errors = body['errors'];
    if (Array.isArray(errors)) {
      const firstError = errors.find((item): item is Record<string, unknown> =>
        this.isRecord(item),
      );
      if (firstError) {
        return this.readString(firstError['code']) || this.readString(firstError['message']);
      }
    }

    return this.readString(body['code']) || this.readString(body['message']);
  }

  private readString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
