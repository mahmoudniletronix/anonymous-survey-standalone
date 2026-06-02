import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

const LANGUAGE_KEY = 'anonymous_survey_language';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    'publicAnonymousTemplates.publicSurvey': 'Public survey',
    'publicAnonymousTemplates.headerTitle': 'Customer feedback survey system',
    'publicAnonymousTemplates.cleopatraLogoAlt': 'Cleopatra Hospitals Group',
    'publicAnonymousTemplates.loadingTitle': 'Loading survey',
    'publicAnonymousTemplates.loading': 'Loading public survey...',
    'publicAnonymousTemplates.loadingDescription':
      'Please wait while we prepare the anonymous survey form.',
    'publicAnonymousTemplates.unavailableTitle': 'Survey unavailable',
    'publicAnonymousTemplates.idRequired': 'Survey link is missing the anonymous template id.',
    'publicAnonymousTemplates.notFound': 'This public survey was not found.',
    'publicAnonymousTemplates.notAvailable': 'This public survey is currently unavailable.',
    'publicAnonymousTemplates.notStarted': 'This public survey has not started yet.',
    'publicAnonymousTemplates.expired': 'This public survey has expired.',
    'publicAnonymousTemplates.noQuestions': 'This public survey has no active questions.',
    'publicAnonymousTemplates.networkError':
      'Network is temporarily unavailable. Please try again later.',
    'publicAnonymousTemplates.loadError':
      'Public survey is temporarily unavailable. Please try again later.',
    'publicAnonymousTemplates.answered': 'answered',
    'publicAnonymousTemplates.answeredOne': 'Answered',
    'publicAnonymousTemplates.until': 'Until',
    'publicAnonymousTemplates.customInputsTitle': 'Respondent details',
    'publicAnonymousTemplates.customInputsSubtitle':
      'Fill the required information before answering the survey questions.',
    'publicAnonymousTemplates.customInputsStepValidationError':
      'Complete the required respondent details before continuing.',
    'publicAnonymousTemplates.questionsTitle': 'Survey questions',
    'publicAnonymousTemplates.questionsSubtitle':
      'Questions appear dynamically based on the selected answers.',
    'publicAnonymousTemplates.visibleQuestions': 'visible questions',
    'publicAnonymousTemplates.required': 'Required',
    'publicAnonymousTemplates.requiredError': 'This field is required.',
    'publicAnonymousTemplates.minLength': 'Minimum length',
    'publicAnonymousTemplates.maxLength': 'Maximum length',
    'publicAnonymousTemplates.integerError': 'Enter a valid integer number.',
    'publicAnonymousTemplates.minValue': 'Minimum score',
    'publicAnonymousTemplates.maxValue': 'Maximum score',
    'publicAnonymousTemplates.value': 'Score',
    'publicAnonymousTemplates.textAnswerPlaceholder': 'Write your answer',
    'publicAnonymousTemplates.voiceUpload': 'Upload voice answer',
    'publicAnonymousTemplates.startRecordingAction': 'Record answer',
    'publicAnonymousTemplates.stopRecordingAction': 'Stop recording',
    'publicAnonymousTemplates.recordingInProgress': 'Recording...',
    'publicAnonymousTemplates.recordedVoiceAnswer': 'Recorded voice answer',
    'publicAnonymousTemplates.uploadedVoiceAnswer': 'Uploaded voice answer',
    'publicAnonymousTemplates.removeVoiceAction': 'Remove',
    'publicAnonymousTemplates.voiceRecordingUnsupported':
      'Voice recording is not supported in this browser.',
    'publicAnonymousTemplates.voicePermissionDenied':
      'Microphone permission was denied. Allow microphone access and try again.',
    'publicAnonymousTemplates.voiceRecordingError':
      'Voice recording could not be saved. Try recording again.',
    'publicAnonymousTemplates.questionRequiredError':
      'Answer this visible question before submitting.',
    'publicAnonymousTemplates.answerToContinue': 'Answer this question before moving next.',
    'publicAnonymousTemplates.validationError':
      'Complete required respondent details and all visible questions before submitting.',
    'publicAnonymousTemplates.stepProgress': 'Step',
    'publicAnonymousTemplates.questionProgress': 'Question',
    'publicAnonymousTemplates.of': 'of',
    'publicAnonymousTemplates.previousAction': 'Previous',
    'publicAnonymousTemplates.nextAction': 'Next',
    'publicAnonymousTemplates.submitNote': 'Review your answers, then submit your feedback.',
    'publicAnonymousTemplates.submitAction': 'Submit response',
    'publicAnonymousTemplates.submitting': 'Submitting...',
    'publicAnonymousTemplates.submitError':
      'Your response could not be submitted. Please try again later.',
    'publicAnonymousTemplates.hiddenAnswersRejected':
      'One or more hidden answers were rejected. Review the visible questions and submit again.',
    'publicAnonymousTemplates.missingVisibleAnswers':
      'All visible questions are required before submitting.',
    'publicAnonymousTemplates.customInputValidationError':
      'One respondent detail does not match its required type or range.',
    'publicAnonymousTemplates.optionMismatch':
      'One selected option does not belong to its question.',
    'publicAnonymousTemplates.scaleValueInvalid': 'Rating scores must be from 1 to 5.',
    'publicAnonymousTemplates.voiceRequired': 'Voice answers require a selected voice file.',
    'publicAnonymousTemplates.textRequired': 'Text answers cannot be empty.',
    'publicAnonymousTemplates.successEyebrow': 'Response submitted',
    'publicAnonymousTemplates.successTitle': 'Thank you for your feedback',
    'publicAnonymousTemplates.successSubtitle':
      'Your anonymous response has been saved successfully.',
    'publicAnonymousTemplates.responseSummary': 'Submission summary',
    'publicAnonymousTemplates.responseId': 'Response ID',
    'publicAnonymousTemplates.submittedOn': 'Submitted on',
    'publicAnonymousTemplates.score': 'Score',
    'publicAnonymousTemplates.answersCount': 'Answers',
    'publicAnonymousTemplates.responseSaved': 'Response saved',
    'publicAnonymousTemplates.openSurveyAgain': 'Open survey again',
    'publicAnonymousTemplates.footerPoweredBy': 'Powered by',
    'publicAnonymousTemplates.runtimeOnlyNote':
      'This screen loads and renders the public anonymous survey runtime.',
  },
  ar: {
    'publicAnonymousTemplates.publicSurvey': 'استبيان عام',
    'publicAnonymousTemplates.headerTitle': 'نظام استطلاع رأي العملاء',
    'publicAnonymousTemplates.cleopatraLogoAlt': 'مجموعة مستشفيات كليوباترا',
    'publicAnonymousTemplates.loadingTitle': 'جاري تحميل الاستبيان',
    'publicAnonymousTemplates.loading': 'جاري تحميل الاستبيان...',
    'publicAnonymousTemplates.loadingDescription': 'يرجى الانتظار أثناء تجهيز الاستبيان.',
    'publicAnonymousTemplates.unavailableTitle': 'الاستبيان غير متاح',
    'publicAnonymousTemplates.idRequired': 'رابط الاستبيان غير مكتمل.',
    'publicAnonymousTemplates.notFound': 'لم يتم العثور على هذا الاستبيان.',
    'publicAnonymousTemplates.notAvailable': 'هذا الاستبيان غير متاح حاليًا.',
    'publicAnonymousTemplates.notStarted': 'هذا الاستبيان لم يبدأ بعد.',
    'publicAnonymousTemplates.expired': 'انتهت صلاحية هذا الاستبيان.',
    'publicAnonymousTemplates.noQuestions': 'لا توجد أسئلة نشطة في هذا الاستبيان.',
    'publicAnonymousTemplates.networkError': 'الشبكة غير متاحة مؤقتًا. حاول مرة أخرى لاحقًا.',
    'publicAnonymousTemplates.loadError': 'الاستبيان غير متاح مؤقتًا. حاول مرة أخرى لاحقًا.',
    'publicAnonymousTemplates.answered': 'تمت الإجابة',
    'publicAnonymousTemplates.answeredOne': 'تمت الإجابة',
    'publicAnonymousTemplates.until': 'حتى',
    'publicAnonymousTemplates.customInputsTitle': 'بيانات العميل',
    'publicAnonymousTemplates.customInputsSubtitle': 'أدخل البيانات المطلوبة قبل الإجابة.',
    'publicAnonymousTemplates.customInputsStepValidationError':
      'أكمل بيانات العميل المطلوبة قبل المتابعة.',
    'publicAnonymousTemplates.questionsTitle': 'أسئلة الاستبيان',
    'publicAnonymousTemplates.questionsSubtitle': 'تظهر الأسئلة حسب إجاباتك.',
    'publicAnonymousTemplates.visibleQuestions': 'أسئلة ظاهرة',
    'publicAnonymousTemplates.required': 'مطلوب',
    'publicAnonymousTemplates.requiredError': 'هذا الحقل مطلوب.',
    'publicAnonymousTemplates.minLength': 'أقل عدد أحرف',
    'publicAnonymousTemplates.maxLength': 'أقصى عدد أحرف',
    'publicAnonymousTemplates.integerError': 'أدخل رقمًا صحيحًا.',
    'publicAnonymousTemplates.minValue': 'أقل قيمة',
    'publicAnonymousTemplates.maxValue': 'أقصى قيمة',
    'publicAnonymousTemplates.value': 'القيمة',
    'publicAnonymousTemplates.textAnswerPlaceholder': 'اكتب إجابتك',
    'publicAnonymousTemplates.voiceUpload': 'إرفاق إجابة صوتية',
    'publicAnonymousTemplates.startRecordingAction': 'تسجيل إجابة',
    'publicAnonymousTemplates.stopRecordingAction': 'إيقاف التسجيل',
    'publicAnonymousTemplates.recordingInProgress': 'جاري التسجيل...',
    'publicAnonymousTemplates.recordedVoiceAnswer': 'إجابة صوتية مسجلة',
    'publicAnonymousTemplates.uploadedVoiceAnswer': 'إجابة صوتية مرفوعة',
    'publicAnonymousTemplates.removeVoiceAction': 'حذف',
    'publicAnonymousTemplates.voiceRecordingUnsupported':
      'تسجيل الصوت غير مدعوم في هذا المتصفح.',
    'publicAnonymousTemplates.voicePermissionDenied':
      'تم رفض صلاحية الميكروفون. اسمح باستخدام الميكروفون وحاول مرة أخرى.',
    'publicAnonymousTemplates.voiceRecordingError':
      'تعذر حفظ التسجيل الصوتي. حاول التسجيل مرة أخرى.',
    'publicAnonymousTemplates.questionRequiredError': 'أجب على هذا السؤال قبل الإرسال.',
    'publicAnonymousTemplates.answerToContinue': 'أجب على هذا السؤال قبل الانتقال للتالي.',
    'publicAnonymousTemplates.validationError': 'أكمل البيانات المطلوبة وكل الأسئلة الظاهرة قبل الإرسال.',
    'publicAnonymousTemplates.stepProgress': 'الخطوة',
    'publicAnonymousTemplates.questionProgress': 'السؤال',
    'publicAnonymousTemplates.of': 'من',
    'publicAnonymousTemplates.previousAction': 'السابق',
    'publicAnonymousTemplates.nextAction': 'التالي',
    'publicAnonymousTemplates.submitNote': 'راجع إجاباتك ثم أرسل التقييم.',
    'publicAnonymousTemplates.submitAction': 'إرسال التقييم',
    'publicAnonymousTemplates.submitting': 'جاري الإرسال...',
    'publicAnonymousTemplates.submitError': 'تعذر إرسال التقييم. حاول مرة أخرى لاحقًا.',
    'publicAnonymousTemplates.hiddenAnswersRejected':
      'تم رفض إجابة غير ظاهرة. راجع الأسئلة وأرسل مرة أخرى.',
    'publicAnonymousTemplates.missingVisibleAnswers':
      'يجب الإجابة على كل الأسئلة الظاهرة قبل الإرسال.',
    'publicAnonymousTemplates.customInputValidationError': 'إحدى بيانات العميل غير صحيحة.',
    'publicAnonymousTemplates.optionMismatch': 'أحد الاختيارات لا يتبع السؤال الخاص به.',
    'publicAnonymousTemplates.scaleValueInvalid': 'التقييم يجب أن يكون من 1 إلى 5.',
    'publicAnonymousTemplates.voiceRequired': 'الإجابة الصوتية تتطلب اختيار ملف صوتي.',
    'publicAnonymousTemplates.textRequired': 'الإجابة النصية لا يمكن أن تكون فارغة.',
    'publicAnonymousTemplates.successEyebrow': 'تم إرسال التقييم',
    'publicAnonymousTemplates.successTitle': 'شكرًا لمشاركتك',
    'publicAnonymousTemplates.successSubtitle': 'تم حفظ تقييمك بنجاح.',
    'publicAnonymousTemplates.responseSummary': 'ملخص الإرسال',
    'publicAnonymousTemplates.responseId': 'رقم الإرسال',
    'publicAnonymousTemplates.submittedOn': 'تاريخ الإرسال',
    'publicAnonymousTemplates.score': 'التقييم',
    'publicAnonymousTemplates.answersCount': 'الإجابات',
    'publicAnonymousTemplates.responseSaved': 'تم حفظ التقييم',
    'publicAnonymousTemplates.openSurveyAgain': 'فتح الاستبيان مرة أخرى',
    'publicAnonymousTemplates.footerPoweredBy': 'مدعوم بواسطة',
    'publicAnonymousTemplates.runtimeOnlyNote': 'هذه الصفحة تعرض الاستبيان العام.',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly languageSignal = signal<Language>(this.initialLanguage());

  readonly language = this.languageSignal.asReadonly();
  readonly direction = computed<Direction>(() => (this.languageSignal() === 'ar' ? 'rtl' : 'ltr'));
  readonly isRtl = computed(() => this.direction() === 'rtl');
  readonly nextLanguageLabel = computed(() => (this.languageSignal() === 'en' ? 'AR' : 'EN'));

  constructor() {
    effect(() => {
      const language = this.languageSignal();
      this.document.documentElement.lang = language;
      this.document.documentElement.dir = this.direction();
      this.document.body.lang = language;
      this.document.body.dir = this.direction();
      this.document.defaultView?.localStorage.setItem(LANGUAGE_KEY, language);
    });
  }

  toggleLanguage(): void {
    this.languageSignal.update((language) => (language === 'en' ? 'ar' : 'en'));
  }

  translate(key: string): string {
    return TRANSLATIONS[this.languageSignal()][key] ?? TRANSLATIONS.en[key] ?? key;
  }

  private initialLanguage(): Language {
    const stored = this.document.defaultView?.localStorage.getItem(LANGUAGE_KEY);
    return stored === 'ar' || stored === 'en' ? stored : 'en';
  }
}
