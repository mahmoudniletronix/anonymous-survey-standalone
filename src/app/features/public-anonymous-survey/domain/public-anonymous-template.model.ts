import { ScopeApiFields, ScopeState } from '../../../shared/models/resource-scope.model';

export type PublicCustomInputType = 1 | 2;
export type PublicQuestionKind =
  | 'singleChoice'
  | 'starRating'
  | 'smiles'
  | 'complain'
  | 'voice'
  | 'image';
export type PublicVoiceAnswerSource = 'upload' | 'recording';

export interface PublicAnonymousTemplate extends ScopeState {
  anonymousTemplateId: string;
  branchId: string | null;
  nameEn: string;
  nameAr: string | null;
  description: string | null;
  activeFrom: string;
  expireTo: string | null;
  customInputs: readonly PublicAnonymousTemplateCustomInput[];
  questions: readonly PublicAnonymousTemplateQuestion[];
  questionConditions: readonly PublicAnonymousTemplateQuestionCondition[];
  rootAnonymousTemplateQuestionIds: readonly string[];
}

export interface PublicAnonymousTemplateCustomInput {
  customInputId: string;
  name: string;
  labelEn: string | null;
  labelAr: string | null;
  type: PublicCustomInputType;
  typeName: string;
  isRequired: boolean;
  minLength: number | null;
  maxLength: number | null;
  minValue: number | null;
  maxValue: number | null;
  order: number;
}

export interface PublicAnonymousTemplateQuestion extends ScopeState {
  anonymousTemplateQuestionId: string;
  questionId: string;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string | null;
  textEn: string;
  textAr: string | null;
  type: number | null;
  typeName: string;
  order: number;
  isRoot: boolean;
  options: readonly PublicAnonymousTemplateQuestionOption[];
}

export interface PublicAnonymousTemplateQuestionOption {
  optionId: string;
  questionId: string;
  textEn: string;
  textAr: string | null;
  order: number;
  value: number | null;
}

export interface PublicAnonymousTemplateQuestionCondition {
  conditionId: string;
  parentAnonymousTemplateQuestionId: string;
  childAnonymousTemplateQuestionId: string;
  triggerType: number | null;
  triggerTypeName: string;
  selectedQuestionOptionId: string | null;
  triggerValue: number | null;
  order: number;
}

export interface PublicAnonymousTemplateApiResponse extends ScopeApiFields {
  anonymousTemplateId?: string | number;
  branchId?: string | number | null;
  nameEn?: string | null;
  nameAr?: string | null;
  description?: string | null;
  activeFrom?: string | null;
  expireTo?: string | null;
  customInputs?: readonly PublicAnonymousTemplateCustomInputApiResponse[];
  questions?: readonly PublicAnonymousTemplateQuestionApiResponse[];
  questionConditions?: readonly PublicAnonymousTemplateQuestionConditionApiResponse[];
  rootAnonymousTemplateQuestionIds?: readonly (string | number)[];
}

export interface PublicAnonymousTemplateCustomInputApiResponse {
  customInputId?: string | number;
  name?: string | null;
  labelEn?: string | null;
  labelAr?: string | null;
  type?: number | string | null;
  typeName?: string | null;
  isRequired?: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  order?: number | null;
}

export interface PublicAnonymousTemplateQuestionApiResponse extends ScopeApiFields {
  anonymousTemplateQuestionId?: string | number;
  questionId?: string | number;
  groupId?: string | number;
  groupNameEn?: string | null;
  groupNameAr?: string | null;
  textEn?: string | null;
  textAr?: string | null;
  type?: number | string | null;
  typeName?: string | null;
  order?: number | null;
  isRoot?: boolean;
  options?: readonly PublicAnonymousTemplateQuestionOptionApiResponse[];
}

export interface PublicAnonymousTemplateQuestionOptionApiResponse {
  optionId?: string | number;
  questionId?: string | number;
  textEn?: string | null;
  textAr?: string | null;
  order?: number | null;
  value?: number | null;
}

export interface PublicAnonymousTemplateQuestionConditionApiResponse {
  conditionId?: string | number;
  parentAnonymousTemplateQuestionId?: string | number;
  childAnonymousTemplateQuestionId?: string | number;
  triggerType?: number | string | null;
  triggerTypeName?: string | null;
  selectedQuestionOptionId?: string | number | null;
  triggerValue?: number | null;
  order?: number | null;
}

export interface PublicAnonymousAnswerDraft {
  selectedQuestionOptionId: string;
  starRatingValue: number | null;
  smileValue: number | null;
  textAnswer: string;
  voiceFileName: string;
  voiceObjectUrl: string;
  voiceSource: PublicVoiceAnswerSource | null;
  imageFile: File | null;
  imageFileName: string;
  imageObjectUrl: string;
}

export interface SubmitPublicAnonymousResponsePayload {
  customInputValues: readonly PublicAnonymousCustomInputValuePayload[];
  answers: readonly PublicAnonymousAnswerPayload[];
}

export interface PublicAnonymousCustomInputValuePayload {
  customInputId: string;
  stringValue: string | null;
  integerValue: number | null;
}

export interface PublicAnonymousAnswerPayload {
  anonymousTemplateQuestionId: string;
  selectedQuestionOptionId: string | null;
  starRatingValue: number | null;
  smileValue: number | null;
  textAnswer: string | null;
  voiceFileName: string | null;
  imageFile: File | null;
}

export interface PublicAnonymousSubmissionResult {
  anonymousSurveyResponseId: string;
  anonymousTemplateId: string;
  submittedOnUtc: string;
  actualScore: number | null;
  maxScore: number | null;
  scorePercentage: number | null;
  visibleQuestionsCount: number;
  answersCount: number;
  customInputValuesCount: number;
}

export interface PublicAnonymousSubmissionApiResponse {
  anonymousSurveyResponseId?: string | number;
  anonymousTemplateId?: string | number;
  submittedOnUtc?: string | null;
  actualScore?: number | null;
  maxScore?: number | null;
  scorePercentage?: number | null;
  visibleQuestionsCount?: number | null;
  answersCount?: number | null;
  customInputValuesCount?: number | null;
}
