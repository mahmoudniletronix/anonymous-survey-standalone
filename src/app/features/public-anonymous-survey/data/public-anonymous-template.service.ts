import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  SKIP_ERROR_TOAST,
  SKIP_SUCCESS_TOAST,
} from '../../../core/interceptors/error-toast.interceptor';
import { SKIP_AUTH } from '../../../core/interceptors/auth.interceptor';
import { APP_RUNTIME_CONFIG } from '../../../core/config/app-runtime-config';
import { toScopeState } from '../../../shared/models/resource-scope.model';
import {
  PublicAnonymousTemplate,
  PublicAnonymousTemplateApiResponse,
  PublicAnonymousTemplateCustomInput,
  PublicAnonymousTemplateCustomInputApiResponse,
  PublicAnonymousTemplateQuestion,
  PublicAnonymousTemplateQuestionApiResponse,
  PublicAnonymousTemplateQuestionCondition,
  PublicAnonymousTemplateQuestionConditionApiResponse,
  PublicAnonymousTemplateQuestionOption,
  PublicAnonymousTemplateQuestionOptionApiResponse,
  PublicAnonymousSubmissionApiResponse,
  PublicAnonymousSubmissionResult,
  PublicCustomInputType,
  SubmitPublicAnonymousResponsePayload,
} from '../domain/public-anonymous-template.model';

@Injectable()
export class PublicAnonymousTemplateService {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(APP_RUNTIME_CONFIG);
  private readonly anonTemplatesUrl = `${this.runtimeConfig.apiBaseUrl}/api/anon-templates`;

  getTemplate(anonymousTemplateId: string): Observable<PublicAnonymousTemplate> {
    return this.http
      .get<PublicAnonymousTemplateApiResponse>(`${this.anonTemplatesUrl}/${anonymousTemplateId}`, {
        context: new HttpContext().set(SKIP_AUTH, true).set(SKIP_ERROR_TOAST, true),
      })
      .pipe(map((response) => this.toTemplate(response, anonymousTemplateId)));
  }

  submitResponse(
    anonymousTemplateId: string,
    payload: SubmitPublicAnonymousResponsePayload,
  ): Observable<PublicAnonymousSubmissionResult> {
    return this.http
      .post<PublicAnonymousSubmissionApiResponse>(
        `${this.anonTemplatesUrl}/${anonymousTemplateId}/responses`,
        this.toSubmitFormData(payload),
        {
          context: new HttpContext()
            .set(SKIP_AUTH, true)
            .set(SKIP_ERROR_TOAST, true)
            .set(SKIP_SUCCESS_TOAST, true),
        },
      )
      .pipe(map((response) => this.toSubmissionResult(response, anonymousTemplateId)));
  }

  private toSubmitFormData(payload: SubmitPublicAnonymousResponsePayload): FormData {
    const formData = new FormData();

    payload.customInputValues.forEach((customInput, index) => {
      const prefix = `customInputValues[${index}]`;
      formData.append(`${prefix}.customInputId`, customInput.customInputId);

      if (customInput.stringValue !== null) {
        formData.append(`${prefix}.stringValue`, customInput.stringValue);
      }

      if (customInput.integerValue !== null) {
        formData.append(`${prefix}.integerValue`, String(customInput.integerValue));
      }
    });

    payload.answers.forEach((answer, index) => {
      const prefix = `answers[${index}]`;
      formData.append(`${prefix}.anonymousTemplateQuestionId`, answer.anonymousTemplateQuestionId);

      if (answer.selectedQuestionOptionId !== null) {
        formData.append(`${prefix}.selectedQuestionOptionId`, answer.selectedQuestionOptionId);
      }

      if (answer.starRatingValue !== null) {
        formData.append(`${prefix}.starRatingValue`, String(answer.starRatingValue));
      }

      if (answer.smileValue !== null) {
        formData.append(`${prefix}.smileValue`, String(answer.smileValue));
      }

      if (answer.textAnswer !== null) {
        formData.append(`${prefix}.textAnswer`, answer.textAnswer);
      }

      if (answer.voiceFileName !== null) {
        formData.append(`${prefix}.voiceFileName`, answer.voiceFileName);
      }

      if (answer.imageFile !== null) {
        formData.append(`${prefix}.imageFile`, answer.imageFile, answer.imageFile.name);
      }
    });

    return formData;
  }

  private toTemplate(
    response: PublicAnonymousTemplateApiResponse,
    fallbackAnonymousTemplateId: string,
  ): PublicAnonymousTemplate {
    const questions = (response.questions ?? [])
      .map((question) => this.toQuestion(question))
      .filter((question) => question.anonymousTemplateQuestionId.length > 0)
      .sort((first, second) => first.order - second.order);
    const questionConditions = (response.questionConditions ?? [])
      .map((condition) => this.toQuestionCondition(condition))
      .filter(
        (condition) =>
          condition.parentAnonymousTemplateQuestionId.length > 0 &&
          condition.childAnonymousTemplateQuestionId.length > 0,
      )
      .sort((first, second) => first.order - second.order);

    return {
      ...toScopeState(response),
      anonymousTemplateId:
        this.readRecordId(response.anonymousTemplateId) || fallbackAnonymousTemplateId,
      branchId: this.readNullableRecordId(response.branchId),
      nameEn: response.nameEn ?? '',
      nameAr: response.nameAr ?? null,
      description: response.description ?? null,
      activeFrom: response.activeFrom ?? '',
      expireTo: response.expireTo ?? null,
      customInputs: (response.customInputs ?? [])
        .map((customInput) => this.toCustomInput(customInput))
        .filter((customInput) => customInput.customInputId.length > 0)
        .sort((first, second) => first.order - second.order),
      questions,
      questionConditions,
      rootAnonymousTemplateQuestionIds: this.toRootQuestionIds(
        response.rootAnonymousTemplateQuestionIds,
        questions,
        questionConditions,
      ),
    };
  }

  private toCustomInput(
    response: PublicAnonymousTemplateCustomInputApiResponse,
  ): PublicAnonymousTemplateCustomInput {
    const type = this.toCustomInputType(response.type ?? response.typeName);

    return {
      customInputId: this.readRecordId(response.customInputId),
      name: response.name ?? '',
      labelEn: response.labelEn ?? null,
      labelAr: response.labelAr ?? null,
      type,
      typeName: response.typeName ?? (type === 2 ? 'Integer' : 'String'),
      isRequired: response.isRequired ?? false,
      minLength: response.minLength ?? null,
      maxLength: response.maxLength ?? null,
      minValue: response.minValue ?? null,
      maxValue: response.maxValue ?? null,
      order: response.order ?? 0,
    };
  }

  private toQuestion(
    response: PublicAnonymousTemplateQuestionApiResponse,
  ): PublicAnonymousTemplateQuestion {
    return {
      ...toScopeState(response),
      anonymousTemplateQuestionId: this.readRecordId(response.anonymousTemplateQuestionId),
      questionId: this.readRecordId(response.questionId),
      groupId: this.readRecordId(response.groupId),
      groupNameEn: response.groupNameEn ?? '',
      groupNameAr: response.groupNameAr ?? null,
      textEn: response.textEn ?? '',
      textAr: response.textAr ?? null,
      type: this.toNumber(response.type),
      typeName: response.typeName ?? '',
      order: response.order ?? 0,
      isRoot: response.isRoot ?? false,
      options: (response.options ?? [])
        .map((option) => this.toQuestionOption(option))
        .filter((option) => option.optionId.length > 0)
        .sort((first, second) => first.order - second.order),
    };
  }

  private toQuestionOption(
    response: PublicAnonymousTemplateQuestionOptionApiResponse,
  ): PublicAnonymousTemplateQuestionOption {
    return {
      optionId: this.readRecordId(response.optionId),
      questionId: this.readRecordId(response.questionId),
      textEn: this.toCustomerFacingOptionText(response.textEn),
      textAr: this.toNullableCustomerFacingOptionText(response.textAr),
      order: response.order ?? 0,
      value: response.value ?? null,
    };
  }

  private toCustomerFacingOptionText(value: string | null | undefined): string {
    return this.stripOptionScoreLabel(value ?? '');
  }

  private toNullableCustomerFacingOptionText(value: string | null | undefined): string | null {
    const optionText = this.stripOptionScoreLabel(value ?? '');
    return optionText.length > 0 ? optionText : null;
  }

  private stripOptionScoreLabel(value: string): string {
    return value.replace(/\s*(?:[-–—|]\s*)?(?:Value|Score)\s+[1-5]\s*$/i, '').trim();
  }

  private toQuestionCondition(
    response: PublicAnonymousTemplateQuestionConditionApiResponse,
  ): PublicAnonymousTemplateQuestionCondition {
    return {
      conditionId: this.readRecordId(response.conditionId),
      parentAnonymousTemplateQuestionId: this.readRecordId(
        response.parentAnonymousTemplateQuestionId,
      ),
      childAnonymousTemplateQuestionId: this.readRecordId(
        response.childAnonymousTemplateQuestionId,
      ),
      triggerType: this.toNumber(response.triggerType),
      triggerTypeName: response.triggerTypeName ?? '',
      selectedQuestionOptionId: this.readNullableRecordId(response.selectedQuestionOptionId),
      triggerValue: response.triggerValue ?? null,
      order: response.order ?? 0,
    };
  }

  private toSubmissionResult(
    response: PublicAnonymousSubmissionApiResponse,
    fallbackAnonymousTemplateId: string,
  ): PublicAnonymousSubmissionResult {
    return {
      anonymousSurveyResponseId: this.readRecordId(response.anonymousSurveyResponseId),
      anonymousTemplateId:
        this.readRecordId(response.anonymousTemplateId) || fallbackAnonymousTemplateId,
      submittedOnUtc: response.submittedOnUtc ?? '',
      actualScore: response.actualScore ?? null,
      maxScore: response.maxScore ?? null,
      scorePercentage: response.scorePercentage ?? null,
      visibleQuestionsCount: response.visibleQuestionsCount ?? 0,
      answersCount: response.answersCount ?? 0,
      customInputValuesCount: response.customInputValuesCount ?? 0,
    };
  }

  private toRootQuestionIds(
    responseRootIds: readonly (string | number)[] | undefined,
    questions: readonly PublicAnonymousTemplateQuestion[],
    conditions: readonly PublicAnonymousTemplateQuestionCondition[],
  ): readonly string[] {
    const explicitRootIds = (responseRootIds ?? [])
      .map((id) => this.readRecordId(id))
      .filter((id) => id.length > 0);

    if (explicitRootIds.length > 0) {
      return explicitRootIds;
    }

    const rootsFromQuestions = questions
      .filter((question) => question.isRoot)
      .map((question) => question.anonymousTemplateQuestionId);
    if (rootsFromQuestions.length > 0) {
      return rootsFromQuestions;
    }

    const childIds = new Set(
      conditions.map((condition) => condition.childAnonymousTemplateQuestionId),
    );
    const derivedRootIds = questions
      .filter((question) => !childIds.has(question.anonymousTemplateQuestionId))
      .map((question) => question.anonymousTemplateQuestionId);

    return derivedRootIds.length > 0
      ? derivedRootIds
      : questions.slice(0, 1).map((question) => question.anonymousTemplateQuestionId);
  }

  private toCustomInputType(type: number | string | null | undefined): PublicCustomInputType {
    const normalizedType = String(type ?? '')
      .trim()
      .toLowerCase();

    return normalizedType === '2' || normalizedType === 'integer' ? 2 : 1;
  }

  private toNumber(value: number | string | null | undefined): number | null {
    const numericValue = typeof value === 'string' ? Number(value) : value;
    return typeof numericValue === 'number' && Number.isFinite(numericValue) ? numericValue : null;
  }

  private readRecordId(id: string | number | null | undefined): string {
    return typeof id === 'string' || typeof id === 'number' ? String(id) : '';
  }

  private readNullableRecordId(id: string | number | null | undefined): string | null {
    const recordId = this.readRecordId(id);
    return recordId.length > 0 ? recordId : null;
  }
}
