import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  AlertCircle,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleStop,
  Languages,
  Mic,
  Trash2,
  Upload,
  Send,
  Star,
} from "lucide-angular";
import type { LucideIconData } from "lucide-angular";
import { I18nService } from "../../../../core/services/i18n.service";
import {
  QUESTION_ANSWER_TYPE,
  toQuestionAnswerType,
} from "../../../../shared/models/question-answer.model";
import {
  PublicAnonymousAnswerDraft,
  PublicAnonymousAnswerPayload,
  PublicAnonymousCustomInputValuePayload,
  PublicAnonymousTemplate,
  PublicAnonymousTemplateCustomInput,
  PublicAnonymousTemplateQuestion,
  PublicAnonymousTemplateQuestionCondition,
  PublicAnonymousTemplateQuestionOption,
  PublicQuestionKind,
  SubmitPublicAnonymousResponsePayload,
} from "../../domain/public-anonymous-template.model";
import { TranslatePipe } from "../../../../shared/pipes/translate.pipe";
import { IconComponent } from "../../../../shared/ui/icon/icon.component";
import { PublicSurveyFooterComponent } from "../components/public-survey-footer.component";
import { PublicSurveyBrandingService } from "../services/public-survey-branding.service";
import { PublicSurveyVoiceRecorderService } from "../services/public-survey-voice-recorder.service";
import { PublicAnonymousTemplateStore } from "../state/public-anonymous-template.store";

const RATING_VALUES = [1, 2, 3, 4, 5] as const;
const IMAGE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;
type PublicSurveyStep = "details" | "questions";

@Component({
  selector: "app-public-anonymous-template-page",
  standalone: true,
  imports: [IconComponent, TranslatePipe, PublicSurveyFooterComponent],
  providers: [PublicSurveyVoiceRecorderService],
  templateUrl: "./public-anonymous-template-page.component.html",
  styleUrl: "./public-anonymous-template-page.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicAnonymousTemplatePageComponent implements OnInit, OnDestroy {
  readonly publicAnonymousTemplateStore = inject(PublicAnonymousTemplateStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly publicSurveyBranding = inject(PublicSurveyBrandingService);
  private readonly publicSurveyVoiceRecorder = inject(
    PublicSurveyVoiceRecorderService,
  );

  readonly alertIcon = AlertCircle;
  readonly languageIcon = Languages;
  readonly micIcon = Mic;
  readonly stopRecordingIcon = CircleStop;
  readonly removeVoiceIcon = Trash2;
  readonly uploadIcon = Upload;
  readonly cameraIcon = Camera;
  readonly sendIcon = Send;
  readonly starIcon = Star;
  readonly ratingValues = RATING_VALUES;

  readonly customInputValues = signal<Readonly<Record<string, string>>>({});
  readonly answers = signal<
    Readonly<Record<string, PublicAnonymousAnswerDraft>>
  >({});
  readonly surveyStep = signal<PublicSurveyStep>("details");
  readonly currentQuestionIndex = signal(0);
  readonly navigationQuestionId = signal<string | null>(null);
  readonly validationSubmitted = signal(false);
  readonly validationError = signal<string | null>(null);
  readonly voiceRecordingError = this.publicSurveyVoiceRecorder.errorKey;
  readonly voiceRecordingElapsedSeconds =
    this.publicSurveyVoiceRecorder.recordingElapsedSeconds;
  readonly previousNavigationIcon = computed<LucideIconData>(() =>
    this.i18n.isRtl() ? ChevronRight : ChevronLeft,
  );
  readonly nextNavigationIcon = computed<LucideIconData>(() =>
    this.i18n.isRtl() ? ChevronLeft : ChevronRight,
  );

  readonly templateName = computed(() => {
    const template = this.publicAnonymousTemplateStore.template();
    return template ? this.localizedText(template.nameEn, template.nameAr) : "";
  });

  readonly templateDescription = computed(() => {
    const template = this.publicAnonymousTemplateStore.template();
    return template ? this.localizedText(template.description ?? "", null) : "";
  });

  readonly visibleQuestions = computed<
    readonly PublicAnonymousTemplateQuestion[]
  >(() => {
    const template = this.publicAnonymousTemplateStore.template();
    return template
      ? this.visibleQuestionsFromAnswers(template, this.answers())
      : [];
  });
  readonly currentVisibleQuestionIndex = computed(() => {
    const questionsCount = this.visibleQuestions().length;
    return questionsCount > 0
      ? Math.min(this.currentQuestionIndex(), questionsCount - 1)
      : 0;
  });
  readonly currentQuestion = computed<PublicAnonymousTemplateQuestion | null>(
    () => {
      if (!this.isQuestionsStep()) {
        return null;
      }

      const questions = this.visibleQuestions();
      return questions[this.currentVisibleQuestionIndex()] ?? null;
    },
  );
  readonly isDetailsStep = computed(() => {
    const template = this.publicAnonymousTemplateStore.template();
    return (
      template !== null &&
      template.customInputs.length > 0 &&
      this.surveyStep() === "details"
    );
  });
  readonly isQuestionsStep = computed(() => {
    const template = this.publicAnonymousTemplateStore.template();
    return template !== null && !this.isDetailsStep();
  });
  readonly canGoPrevious = computed(
    () =>
      !this.publicAnonymousTemplateStore.submitting() &&
      !this.publicSurveyVoiceRecorder.isRecording() &&
      this.isQuestionsStep() &&
      (this.currentVisibleQuestionIndex() > 0 || this.hasDetailsStep()),
  );
  readonly canGoNext = computed(
    () =>
      !this.publicAnonymousTemplateStore.submitting() &&
      !this.publicSurveyVoiceRecorder.isRecording() &&
      this.isQuestionsStep() &&
      this.currentVisibleQuestionIndex() < this.visibleQuestions().length - 1,
  );
  readonly shouldShowNextAction = computed(() => {
    if (this.isDetailsStep()) {
      return true;
    }

    const question = this.currentQuestion();
    return (
      this.canGoNext() ||
      (question !== null &&
        !this.hasAnswer(question) &&
        this.hasPotentialChildQuestion(question))
    );
  });
  readonly isLastVisibleQuestion = computed(() => {
    const visibleQuestionsCount = this.visibleQuestions().length;
    return (
      visibleQuestionsCount > 0 &&
      this.currentVisibleQuestionIndex() === visibleQuestionsCount - 1 &&
      !this.shouldShowNextAction()
    );
  });
  readonly hierarchyDepthByQuestionId = computed<
    Readonly<Record<string, number>>
  >(() => {
    const template = this.publicAnonymousTemplateStore.template();
    return template ? this.buildQuestionHierarchyDepths(template) : {};
  });

  readonly answeredVisibleQuestionsCount = computed(
    () =>
      this.visibleQuestions().filter((question) => this.hasAnswer(question))
        .length,
  );
  readonly progressPercent = computed(() => {
    const visibleQuestionsCount = this.visibleQuestions().length;
    return visibleQuestionsCount > 0
      ? (this.answeredVisibleQuestionsCount() / visibleQuestionsCount) * 100
      : 0;
  });
  readonly canSubmit = computed(
    () =>
      !this.publicAnonymousTemplateStore.submitting() &&
      !this.publicSurveyVoiceRecorder.isRecording() &&
      this.isQuestionsStep(),
  );

  ngOnInit(): void {
    this.publicSurveyBranding.applyPublicSurveyBranding();

    const anonymousTemplateId =
      this.route.snapshot.paramMap.get("anonymousTemplateId") ?? "";
    this.publicAnonymousTemplateStore.load(anonymousTemplateId);
  }

  ngOnDestroy(): void {
    this.publicSurveyVoiceRecorder.cancel();
    this.revokeAllAnswerObjectUrls(this.answers());
    this.publicAnonymousTemplateStore.clear();
    this.publicSurveyBranding.restoreAppBranding();
  }

  toggleLanguage(): void {
    this.i18n.toggleLanguage();
  }

  nextLanguageLabel(): string {
    return this.i18n.nextLanguageLabel();
  }

  questionText(question: PublicAnonymousTemplateQuestion): string {
    return this.localizedText(question.textEn, question.textAr);
  }

  isRootQuestion(question: PublicAnonymousTemplateQuestion): boolean {
    const template = this.publicAnonymousTemplateStore.template();

    return template
      ? template.rootAnonymousTemplateQuestionIds.includes(
          question.anonymousTemplateQuestionId,
        )
      : question.isRoot;
  }

  questionHierarchyDepth(question: PublicAnonymousTemplateQuestion): number {
    const depth =
      this.hierarchyDepthByQuestionId()[question.anonymousTemplateQuestionId];
    return depth ?? (this.isRootQuestion(question) ? 0 : 1);
  }

  hasPotentialChildQuestion(
    question: PublicAnonymousTemplateQuestion,
  ): boolean {
    const template = this.publicAnonymousTemplateStore.template();
    return template
      ? template.questionConditions.some(
          (condition) =>
            condition.parentAnonymousTemplateQuestionId ===
            question.anonymousTemplateQuestionId,
        )
      : false;
  }

  groupName(question: PublicAnonymousTemplateQuestion): string {
    return this.localizedText(question.groupNameEn, question.groupNameAr);
  }

  customInputLabel(input: PublicAnonymousTemplateCustomInput): string {
    return this.localizedText(input.labelEn ?? input.name, input.labelAr);
  }

  customInputValue(input: PublicAnonymousTemplateCustomInput): string {
    return this.customInputValues()[input.customInputId] ?? "";
  }

  hasDetailsStep(): boolean {
    const template = this.publicAnonymousTemplateStore.template();
    return template !== null && template.customInputs.length > 0;
  }

  customInputError(input: PublicAnonymousTemplateCustomInput): string {
    const value = this.customInputValue(input).trim();

    if (input.isRequired && value.length === 0) {
      return this.i18n.translate("publicAnonymousTemplates.requiredError");
    }

    if (value.length === 0) {
      return "";
    }

    if (input.type === 1) {
      if (input.minLength !== null && value.length < input.minLength) {
        return `${this.i18n.translate("publicAnonymousTemplates.minLength")} ${input.minLength}`;
      }
      if (input.maxLength !== null && value.length > input.maxLength) {
        return `${this.i18n.translate("publicAnonymousTemplates.maxLength")} ${input.maxLength}`;
      }
    }

    if (input.type === 2) {
      const numberValue = Number(value);
      if (!Number.isInteger(numberValue)) {
        return this.i18n.translate("publicAnonymousTemplates.integerError");
      }
      if (input.minValue !== null && numberValue < input.minValue) {
        return `${this.i18n.translate("publicAnonymousTemplates.minValue")} ${input.minValue}`;
      }
      if (input.maxValue !== null && numberValue > input.maxValue) {
        return `${this.i18n.translate("publicAnonymousTemplates.maxValue")} ${input.maxValue}`;
      }
    }

    return "";
  }

  updateCustomInputValue(
    input: PublicAnonymousTemplateCustomInput,
    event: Event,
  ): void {
    const value = this.readInputValue(event);
    this.customInputValues.update((values) => ({
      ...values,
      [input.customInputId]: value,
    }));
  }

  answerFor(questionId: string): PublicAnonymousAnswerDraft {
    return this.answers()[questionId] ?? this.emptyAnswer();
  }

  setSingleChoiceAnswer(questionId: string, optionId: string): void {
    this.replaceAnswer(questionId, {
      ...this.emptyAnswer(),
      selectedQuestionOptionId: optionId,
    });
  }

  setStarRatingAnswer(questionId: string, value: number): void {
    this.replaceAnswer(questionId, {
      ...this.emptyAnswer(),
      starRatingValue: value,
    });
  }

  setSmileAnswer(questionId: string, value: number): void {
    this.replaceAnswer(questionId, {
      ...this.emptyAnswer(),
      smileValue: value,
    });
  }

  updateTextAnswer(questionId: string, event: Event): void {
    const value = this.readInputValue(event);
    this.replaceAnswer(questionId, {
      ...this.emptyAnswer(),
      textAnswer: value,
    });
  }

  updateVoiceFile(questionId: string, event: Event): void {
    const input =
      event.target instanceof HTMLInputElement ? event.target : null;
    const file = input?.files?.item(0) ?? null;

    if (file === null) {
      return;
    }

    this.replaceAnswer(questionId, {
      ...this.emptyAnswer(),
      voiceFileName: file.name,
      voiceObjectUrl: URL.createObjectURL(file),
      voiceSource: "upload",
    });
  }

  async startVoiceRecording(questionId: string): Promise<void> {
    this.clearAnswerNavigationError();
    await this.publicSurveyVoiceRecorder.start(questionId);
  }

  async stopVoiceRecording(): Promise<void> {
    const recording = await this.publicSurveyVoiceRecorder.stop();

    if (recording === null) {
      return;
    }

    this.replaceAnswer(recording.questionId, {
      ...this.emptyAnswer(),
      voiceFileName: recording.fileName,
      voiceObjectUrl: recording.objectUrl,
      voiceSource: "recording",
    });
  }

  clearVoiceAnswer(questionId: string): void {
    this.replaceAnswer(questionId, this.emptyAnswer());
  }

  updateImageFile(questionId: string, event: Event): void {
    const input =
      event.target instanceof HTMLInputElement ? event.target : null;
    const file = input?.files?.item(0) ?? null;

    if (file === null) {
      return;
    }

    if (!this.isSupportedImageFile(file)) {
      if (input) {
        input.value = "";
      }
      this.replaceAnswer(questionId, this.emptyAnswer());
      this.navigationQuestionId.set(questionId);
      this.validationError.set("publicAnonymousTemplates.imageFileInvalid");
      return;
    }

    this.replaceAnswer(questionId, {
      ...this.emptyAnswer(),
      imageFile: file,
      imageFileName: file.name,
      imageObjectUrl: URL.createObjectURL(file),
    });
  }

  clearImageAnswer(questionId: string): void {
    this.replaceAnswer(questionId, this.emptyAnswer());
  }

  isVoiceRecording(questionId: string): boolean {
    return this.publicSurveyVoiceRecorder.recordingQuestionId() === questionId;
  }

  isVoiceRecordingActive(): boolean {
    return this.publicSurveyVoiceRecorder.isRecording();
  }

  canRecordVoice(): boolean {
    return this.publicSurveyVoiceRecorder.isSupported();
  }

  voiceRecordingMessageKey(): string | null {
    return (
      this.voiceRecordingError() ??
      this.publicSurveyVoiceRecorder.supportErrorKey()
    );
  }

  voiceAnswerSourceLabel(questionId: string): string {
    const source = this.answerFor(questionId).voiceSource;

    if (source === "recording") {
      return this.i18n.translate(
        "publicAnonymousTemplates.recordedVoiceAnswer",
      );
    }

    if (source === "upload") {
      return this.i18n.translate(
        "publicAnonymousTemplates.uploadedVoiceAnswer",
      );
    }

    return "";
  }

  voiceRecordingTimer(): string {
    const elapsedSeconds = this.voiceRecordingElapsedSeconds();
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    return `${this.padTimerValue(minutes)}:${this.padTimerValue(seconds)}`;
  }

  goToPreviousQuestion(): void {
    if (this.currentVisibleQuestionIndex() === 0 && this.hasDetailsStep()) {
      this.surveyStep.set("details");
      this.clearAnswerNavigationError();
      return;
    }

    this.currentQuestionIndex.set(
      Math.max(this.currentVisibleQuestionIndex() - 1, 0),
    );
    this.clearAnswerNavigationError();
  }

  goToNextQuestion(): void {
    if (this.isDetailsStep()) {
      this.goToQuestionsStep();
      return;
    }

    const question = this.currentQuestion();
    if (
      !question ||
      this.publicAnonymousTemplateStore.submitting() ||
      this.publicSurveyVoiceRecorder.isRecording()
    ) {
      return;
    }

    if (!this.hasAnswer(question)) {
      this.navigationQuestionId.set(question.anonymousTemplateQuestionId);
      this.validationError.set("publicAnonymousTemplates.answerToContinue");
      return;
    }

    if (!this.canGoNext()) {
      return;
    }

    this.validationError.set(null);
    this.currentQuestionIndex.set(
      Math.min(
        this.currentVisibleQuestionIndex() + 1,
        this.visibleQuestions().length - 1,
      ),
    );
  }

  goToQuestionsStep(): void {
    const template = this.publicAnonymousTemplateStore.template();
    if (!template) {
      return;
    }

    this.validationSubmitted.set(true);
    this.validationError.set(null);

    if (!this.areCustomInputsValid(template)) {
      this.validationError.set(
        "publicAnonymousTemplates.customInputsStepValidationError",
      );
      return;
    }

    this.validationError.set(null);
    this.validationSubmitted.set(false);
    this.navigationQuestionId.set(null);
    this.surveyStep.set("questions");
    this.currentQuestionIndex.set(0);
  }

  questionKind(question: PublicAnonymousTemplateQuestion): PublicQuestionKind {
    const answerType = toQuestionAnswerType(question.typeName || question.type);

    if (answerType === QUESTION_ANSWER_TYPE.SingleChoice) {
      return "singleChoice";
    }
    if (answerType === QUESTION_ANSWER_TYPE.StarRating) {
      return "starRating";
    }
    if (answerType === QUESTION_ANSWER_TYPE.Smiles) {
      return "smiles";
    }
    if (answerType === QUESTION_ANSWER_TYPE.Complain) {
      return "complain";
    }
    if (answerType === QUESTION_ANSWER_TYPE.Image) {
      return "image";
    }

    return "voice";
  }

  optionPrimaryText(option: PublicAnonymousTemplateQuestionOption): string {
    return this.toCustomerFacingOptionText(
      this.localizedText(option.textEn, option.textAr),
    );
  }

  private toCustomerFacingOptionText(value: string): string {
    return value
      .replace(/\s*(?:[-|]\s*)?(?:Value|Score)\s+[1-5]\s*$/i, "")
      .trim();
  }

  isSingleChoiceSelected(questionId: string, optionId: string): boolean {
    return this.answerFor(questionId).selectedQuestionOptionId === optionId;
  }

  isStarRatingSelected(questionId: string, value: number): boolean {
    return this.answerFor(questionId).starRatingValue === value;
  }

  isSmileSelected(questionId: string, value: number): boolean {
    return this.answerFor(questionId).smileValue === value;
  }

  hasAnswer(question: PublicAnonymousTemplateQuestion): boolean {
    const answer = this.answers()[question.anonymousTemplateQuestionId];
    if (!answer) {
      return false;
    }

    const kind = this.questionKind(question);

    if (kind === "singleChoice") {
      return answer.selectedQuestionOptionId.length > 0;
    }
    if (kind === "starRating") {
      return answer.starRatingValue !== null;
    }
    if (kind === "smiles") {
      return answer.smileValue !== null;
    }
    if (kind === "complain") {
      return answer.textAnswer.trim().length > 0;
    }
    if (kind === "image") {
      return answer.imageFile !== null;
    }

    return answer.voiceFileName.length > 0;
  }

  questionError(question: PublicAnonymousTemplateQuestion): string {
    const shouldShowError =
      this.validationSubmitted() ||
      this.navigationQuestionId() === question.anonymousTemplateQuestionId;

    if (!shouldShowError || this.hasAnswer(question)) {
      return "";
    }

    return this.i18n.translate(
      "publicAnonymousTemplates.questionRequiredError",
    );
  }

  submitSurvey(): void {
    const template = this.publicAnonymousTemplateStore.template();
    if (!template || !this.canSubmit()) {
      return;
    }

    this.validationSubmitted.set(true);
    this.validationError.set(null);

    if (!this.isFormValid(template)) {
      this.validationError.set("publicAnonymousTemplates.validationError");
      this.moveToFirstInvalidStep(template);
      return;
    }

    const payload = this.toSubmitPayload();
    this.publicAnonymousTemplateStore.submitResponse(
      template.anonymousTemplateId,
      payload,
      (submission) => {
        void this.router.navigate(
          ["/survey", template.anonymousTemplateId, "success"],
          {
            queryParams: {
              responseId: submission.anonymousSurveyResponseId,
            },
            state: {
              submission,
            },
          },
        );
      },
    );
  }

  private toSubmitPayload(): SubmitPublicAnonymousResponsePayload {
    const template = this.publicAnonymousTemplateStore.template();
    if (!template) {
      return {
        customInputValues: [],
        answers: [],
      };
    }

    return {
      customInputValues: template.customInputs
        .map((input) => this.toCustomInputValuePayload(input))
        .filter(
          (value): value is PublicAnonymousCustomInputValuePayload =>
            value !== null,
        ),
      answers: this.visibleQuestions().map((question) =>
        this.toAnswerPayload(question),
      ),
    };
  }

  private toCustomInputValuePayload(
    input: PublicAnonymousTemplateCustomInput,
  ): PublicAnonymousCustomInputValuePayload | null {
    const value = this.customInputValue(input).trim();

    if (!input.isRequired && value.length === 0) {
      return null;
    }

    return {
      customInputId: input.customInputId,
      stringValue: input.type === 1 ? value : null,
      integerValue: input.type === 2 ? Number(value) : null,
    };
  }

  private toAnswerPayload(
    question: PublicAnonymousTemplateQuestion,
  ): PublicAnonymousAnswerPayload {
    const answer = this.answerFor(question.anonymousTemplateQuestionId);
    const kind = this.questionKind(question);

    return {
      anonymousTemplateQuestionId: question.anonymousTemplateQuestionId,
      selectedQuestionOptionId:
        kind === "singleChoice" ? answer.selectedQuestionOptionId : null,
      starRatingValue: kind === "starRating" ? answer.starRatingValue : null,
      smileValue: kind === "smiles" ? answer.smileValue : null,
      textAnswer: kind === "complain" ? answer.textAnswer.trim() : null,
      voiceFileName: kind === "voice" ? answer.voiceFileName : null,
      imageFile: kind === "image" ? answer.imageFile : null,
    };
  }

  private isConditionMatched(
    condition: PublicAnonymousTemplateQuestionCondition,
    answer: PublicAnonymousAnswerDraft,
  ): boolean {
    const normalizedTriggerName = condition.triggerTypeName
      .replace(/[\s_-]/g, "")
      .toLowerCase();

    if (
      condition.triggerType === 1 ||
      normalizedTriggerName.includes("single")
    ) {
      return (
        condition.selectedQuestionOptionId !== null &&
        answer.selectedQuestionOptionId === condition.selectedQuestionOptionId
      );
    }

    if (condition.triggerType === 2 || normalizedTriggerName.includes("star")) {
      return (
        condition.triggerValue !== null &&
        answer.starRatingValue === condition.triggerValue
      );
    }

    return (
      condition.triggerValue !== null &&
      answer.smileValue === condition.triggerValue
    );
  }

  private replaceAnswer(
    questionId: string,
    answer: PublicAnonymousAnswerDraft,
  ): void {
    const previousAnswer = this.answers()[questionId];
    if (
      previousAnswer?.voiceObjectUrl &&
      previousAnswer.voiceObjectUrl !== answer.voiceObjectUrl
    ) {
      this.revokeObjectUrl(previousAnswer.voiceObjectUrl);
    }
    if (
      previousAnswer?.imageObjectUrl &&
      previousAnswer.imageObjectUrl !== answer.imageObjectUrl
    ) {
      this.revokeObjectUrl(previousAnswer.imageObjectUrl);
    }

    this.answers.update((answers) => ({
      ...answers,
      [questionId]: answer,
    }));
    this.clearHiddenAnswers();
    this.clearAnswerNavigationError();
  }

  private clearHiddenAnswers(): void {
    const template = this.publicAnonymousTemplateStore.template();
    if (!template) {
      return;
    }

    this.answers.update((answers) => {
      const nextAnswers = this.visibleAnswerSubset(template, answers);
      this.revokeRemovedAnswerObjectUrls(answers, nextAnswers);
      return nextAnswers;
    });
    this.clampCurrentQuestionIndex();
  }

  private clearAnswerNavigationError(): void {
    this.navigationQuestionId.set(null);

    if (
      this.validationError() === "publicAnonymousTemplates.answerToContinue"
    ) {
      this.validationError.set(null);
    }
  }

  private clampCurrentQuestionIndex(): void {
    const lastVisibleQuestionIndex = this.visibleQuestions().length - 1;
    this.currentQuestionIndex.update((index) =>
      lastVisibleQuestionIndex >= 0
        ? Math.min(index, lastVisibleQuestionIndex)
        : 0,
    );
  }

  private revokeRemovedAnswerObjectUrls(
    previousAnswers: Readonly<Record<string, PublicAnonymousAnswerDraft>>,
    nextAnswers: Readonly<Record<string, PublicAnonymousAnswerDraft>>,
  ): void {
    Object.entries(previousAnswers).forEach(([questionId, answer]) => {
      const nextAnswer = nextAnswers[questionId];

      if (
        answer.voiceObjectUrl &&
        (nextAnswer === undefined ||
          nextAnswer.voiceObjectUrl !== answer.voiceObjectUrl)
      ) {
        this.revokeObjectUrl(answer.voiceObjectUrl);
      }

      if (
        answer.imageObjectUrl &&
        (nextAnswer === undefined ||
          nextAnswer.imageObjectUrl !== answer.imageObjectUrl)
      ) {
        this.revokeObjectUrl(answer.imageObjectUrl);
      }
    });
  }

  private revokeAllAnswerObjectUrls(
    answers: Readonly<Record<string, PublicAnonymousAnswerDraft>>,
  ): void {
    Object.values(answers).forEach((answer) => {
      if (answer.voiceObjectUrl) {
        this.revokeObjectUrl(answer.voiceObjectUrl);
      }
      if (answer.imageObjectUrl) {
        this.revokeObjectUrl(answer.imageObjectUrl);
      }
    });
  }

  private revokeObjectUrl(objectUrl: string): void {
    URL.revokeObjectURL(objectUrl);
  }

  private isSupportedImageFile(file: File): boolean {
    return (
      file.size > 0 &&
      file.size <= IMAGE_MAX_FILE_SIZE_BYTES &&
      SUPPORTED_IMAGE_MIME_TYPES.has(file.type) &&
      SUPPORTED_IMAGE_EXTENSIONS.some((extension) =>
        file.name.toLowerCase().endsWith(extension),
      )
    );
  }

  private padTimerValue(value: number): string {
    return value.toString().padStart(2, "0");
  }

  private visibleAnswerSubset(
    template: PublicAnonymousTemplate,
    answers: Readonly<Record<string, PublicAnonymousAnswerDraft>>,
  ): Readonly<Record<string, PublicAnonymousAnswerDraft>> {
    const visibleQuestionIds = new Set(
      this.visibleQuestionsFromAnswers(template, answers).map(
        (question) => question.anonymousTemplateQuestionId,
      ),
    );
    const nextAnswers: Record<string, PublicAnonymousAnswerDraft> = {};

    Object.entries(answers).forEach(([questionId, answer]) => {
      if (visibleQuestionIds.has(questionId)) {
        nextAnswers[questionId] = answer;
      }
    });

    return nextAnswers;
  }

  private visibleQuestionsFromAnswers(
    template: PublicAnonymousTemplate,
    answers: Readonly<Record<string, PublicAnonymousAnswerDraft>>,
  ): readonly PublicAnonymousTemplateQuestion[] {
    const questionsById = new Map(
      template.questions.map((question) => [
        question.anonymousTemplateQuestionId,
        question,
      ]),
    );
    const orderedIds: string[] = [];

    const visitQuestion = (
      questionId: string,
      path: ReadonlySet<string>,
    ): void => {
      if (path.has(questionId)) {
        return;
      }

      const question = questionsById.get(questionId);
      if (!question || orderedIds.includes(questionId)) {
        return;
      }

      orderedIds.push(questionId);

      const answer = answers[questionId];
      if (!answer) {
        return;
      }

      const nextPath = new Set(path);
      nextPath.add(questionId);

      template.questionConditions
        .filter(
          (condition) =>
            condition.parentAnonymousTemplateQuestionId === questionId &&
            this.isConditionMatched(condition, answer),
        )
        .sort((first, second) => first.order - second.order)
        .forEach((condition) =>
          visitQuestion(condition.childAnonymousTemplateQuestionId, nextPath),
        );
    };

    template.rootAnonymousTemplateQuestionIds.forEach((questionId) =>
      visitQuestion(questionId, new Set()),
    );

    return orderedIds
      .map((questionId) => questionsById.get(questionId))
      .filter(
        (question): question is PublicAnonymousTemplateQuestion =>
          question !== undefined,
      );
  }

  private buildQuestionHierarchyDepths(
    template: PublicAnonymousTemplate,
  ): Readonly<Record<string, number>> {
    const depths: Record<string, number> = {};
    const childIdsByParent = new Map<string, string[]>();

    template.questionConditions
      .slice()
      .sort((first, second) => first.order - second.order)
      .forEach((condition) => {
        const childIds =
          childIdsByParent.get(condition.parentAnonymousTemplateQuestionId) ??
          [];

        if (!childIds.includes(condition.childAnonymousTemplateQuestionId)) {
          childIds.push(condition.childAnonymousTemplateQuestionId);
        }

        childIdsByParent.set(
          condition.parentAnonymousTemplateQuestionId,
          childIds,
        );
      });

    const visitQuestion = (
      questionId: string,
      depth: number,
      path: ReadonlySet<string>,
    ): void => {
      const currentDepth = depths[questionId];
      if (currentDepth !== undefined && currentDepth <= depth) {
        return;
      }

      depths[questionId] = depth;

      if (path.has(questionId)) {
        return;
      }

      const nextPath = new Set(path);
      nextPath.add(questionId);

      (childIdsByParent.get(questionId) ?? []).forEach((childQuestionId) =>
        visitQuestion(childQuestionId, depth + 1, nextPath),
      );
    };

    template.rootAnonymousTemplateQuestionIds.forEach((questionId) =>
      visitQuestion(questionId, 0, new Set()),
    );

    template.questions.forEach((question) => {
      depths[question.anonymousTemplateQuestionId] ??= question.isRoot ? 0 : 1;
    });

    return depths;
  }

  private isFormValid(template: PublicAnonymousTemplate): boolean {
    const customInputsValid = this.areCustomInputsValid(template);
    const visibleQuestionsValid = this.visibleQuestions().every((question) =>
      this.hasAnswer(question),
    );

    return customInputsValid && visibleQuestionsValid;
  }

  private areCustomInputsValid(template: PublicAnonymousTemplate): boolean {
    return template.customInputs.every(
      (input) => this.customInputError(input).length === 0,
    );
  }

  private moveToFirstInvalidStep(template: PublicAnonymousTemplate): void {
    if (!this.areCustomInputsValid(template)) {
      this.surveyStep.set("details");
      return;
    }

    this.surveyStep.set("questions");
    this.moveToFirstInvalidQuestion();
  }

  private moveToFirstInvalidQuestion(): void {
    const firstInvalidQuestionIndex = this.visibleQuestions().findIndex(
      (question) => !this.hasAnswer(question),
    );

    if (firstInvalidQuestionIndex >= 0) {
      this.currentQuestionIndex.set(firstInvalidQuestionIndex);
    }
  }

  private localizedText(primary: string, secondary: string | null): string {
    if (this.i18n.language() === "ar") {
      return secondary?.trim() || primary;
    }

    return primary.trim() || secondary?.trim() || "";
  }

  private emptyAnswer(): PublicAnonymousAnswerDraft {
    return {
      selectedQuestionOptionId: "",
      starRatingValue: null,
      smileValue: null,
      textAnswer: "",
      voiceFileName: "",
      voiceObjectUrl: "",
      voiceSource: null,
      imageFile: null,
      imageFileName: "",
      imageObjectUrl: "",
    };
  }

  private readInputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
      ? event.target.value
      : "";
  }
}
