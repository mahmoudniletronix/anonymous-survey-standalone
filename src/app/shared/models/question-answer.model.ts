export const QUESTION_ANSWER_TYPE = {
  SingleChoice: 1,
  Voice: 2,
  StarRating: 3,
  Complain: 4,
  Smiles: 5,
  Image: 6,
} as const;

export type QuestionAnswerType =
  (typeof QUESTION_ANSWER_TYPE)[keyof typeof QUESTION_ANSWER_TYPE];
export type QuestionAnswerTypeInput =
  | QuestionAnswerType
  | number
  | string
  | null
  | undefined;
export type AnswerScaleValue = 1 | 2 | 3 | 4 | 5;

export interface SmileLevel {
  value: AnswerScaleValue;
  emoji: string;
  labelKey: string;
}

export interface QuestionAnswerOptionPayload {
  textEn: string;
  textAr?: string | null;
  order: number;
  value: AnswerScaleValue;
}

export interface UpdateQuestionAnswerOptionPayload extends QuestionAnswerOptionPayload {
  optionId?: string | null;
}

export interface QuestionAnswerOption {
  optionId: string;
  questionId: string;
  textEn: string;
  textAr: string | null;
  order: number;
  value: AnswerScaleValue | null;
  isActive: boolean;
}

export interface QuestionAnswerOptionApiResponse {
  optionId?: string | number;
  questionId?: string | number;
  textEn?: string;
  textAr?: string | null;
  order?: number | null;
  value?: number | null;
  isActive?: boolean;
}

export const QUESTION_ANSWER_TYPE_LABEL_KEYS: Record<
  QuestionAnswerType,
  string
> = {
  [QUESTION_ANSWER_TYPE.SingleChoice]: "questions.typeSingleChoice",
  [QUESTION_ANSWER_TYPE.Voice]: "questions.typeVoice",
  [QUESTION_ANSWER_TYPE.StarRating]: "questions.typeStarRating",
  [QUESTION_ANSWER_TYPE.Complain]: "questions.typeComplain",
  [QUESTION_ANSWER_TYPE.Smiles]: "questions.typeSmiles",
  [QUESTION_ANSWER_TYPE.Image]: "questions.typeImage",
};

export const SMILE_LEVELS: readonly SmileLevel[] = [
  { value: 1, emoji: "😠", labelKey: "questions.smileLevel1" },
  { value: 2, emoji: "🙁", labelKey: "questions.smileLevel2" },
  { value: 3, emoji: "😐", labelKey: "questions.smileLevel3" },
  { value: 4, emoji: "🙂", labelKey: "questions.smileLevel4" },
  { value: 5, emoji: "😄", labelKey: "questions.smileLevel5" },
];

export function toQuestionAnswerType(
  value: QuestionAnswerTypeInput,
): QuestionAnswerType | null {
  if (typeof value === "number") {
    return isQuestionAnswerType(value) ? value : null;
  }

  if (typeof value === "string") {
    const numericValue = Number(value);
    if (Number.isInteger(numericValue) && isQuestionAnswerType(numericValue)) {
      return numericValue;
    }

    const normalized = normalizeQuestionAnswerType(value);
    if (
      normalized === "singlechoice" ||
      normalized === "multichoice" ||
      normalized === "multiplechoice"
    ) {
      return QUESTION_ANSWER_TYPE.SingleChoice;
    }
    if (normalized === "voice") {
      return QUESTION_ANSWER_TYPE.Voice;
    }
    if (normalized === "starrating" || normalized === "rating") {
      return QUESTION_ANSWER_TYPE.StarRating;
    }
    if (
      normalized === "complain" ||
      normalized === "complaint" ||
      normalized === "freetext" ||
      normalized === "textarea"
    ) {
      return QUESTION_ANSWER_TYPE.Complain;
    }
    if (normalized === "smiles" || normalized === "smile") {
      return QUESTION_ANSWER_TYPE.Smiles;
    }
    if (
      normalized === "image" ||
      normalized === "photo" ||
      normalized === "picture"
    ) {
      return QUESTION_ANSWER_TYPE.Image;
    }
  }

  return null;
}

export function isSingleChoiceAnswerType(
  value: QuestionAnswerTypeInput,
): boolean {
  return toQuestionAnswerType(value) === QUESTION_ANSWER_TYPE.SingleChoice;
}

export function questionAnswerTypeLabelKey(
  value: QuestionAnswerTypeInput,
): string | null {
  const type = toQuestionAnswerType(value);
  return type === null ? null : QUESTION_ANSWER_TYPE_LABEL_KEYS[type];
}

export function toQuestionAnswerOption(
  response: QuestionAnswerOptionApiResponse,
  fallbackQuestionId = "",
): QuestionAnswerOption {
  return {
    optionId: readRecordId(response.optionId),
    questionId: readRecordId(response.questionId) || fallbackQuestionId,
    textEn: response.textEn ?? "",
    textAr: response.textAr ?? null,
    order: response.order ?? 0,
    value: toAnswerScaleValue(response.value),
    isActive: response.isActive ?? true,
  };
}

export function toAnswerScaleValue(
  value: number | string | null | undefined,
): AnswerScaleValue | null {
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (
    numericValue === 1 ||
    numericValue === 2 ||
    numericValue === 3 ||
    numericValue === 4 ||
    numericValue === 5
  ) {
    return numericValue;
  }

  return null;
}

function isQuestionAnswerType(value: number): value is QuestionAnswerType {
  return (
    value === QUESTION_ANSWER_TYPE.SingleChoice ||
    value === QUESTION_ANSWER_TYPE.Voice ||
    value === QUESTION_ANSWER_TYPE.StarRating ||
    value === QUESTION_ANSWER_TYPE.Complain ||
    value === QUESTION_ANSWER_TYPE.Smiles ||
    value === QUESTION_ANSWER_TYPE.Image
  );
}

function normalizeQuestionAnswerType(value: string): string {
  return value.replace(/[\s_-]/g, "").toLowerCase();
}

function readRecordId(id: string | number | undefined): string {
  return typeof id === "string" || typeof id === "number" ? String(id) : "";
}
