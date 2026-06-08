import { Injectable, computed, signal } from "@angular/core";

export interface PublicSurveyVoiceRecording {
  readonly questionId: string;
  readonly fileName: string;
  readonly objectUrl: string;
  readonly mimeType: string;
  readonly size: number;
}

const RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/wav",
] as const;

@Injectable()
export class PublicSurveyVoiceRecorderService {
  private readonly recordingQuestionIdSignal = signal<string | null>(null);
  private readonly errorKeySignal = signal<string | null>(null);
  private readonly recordingElapsedSecondsSignal = signal(0);

  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordingTimerId: number | null = null;
  private recordingStartedAtMs = 0;
  private chunks: Blob[] = [];
  private activeQuestionId: string | null = null;

  readonly recordingQuestionId = this.recordingQuestionIdSignal.asReadonly();
  readonly errorKey = this.errorKeySignal.asReadonly();
  readonly recordingElapsedSeconds = this.recordingElapsedSecondsSignal.asReadonly();
  readonly isRecording = computed(() => this.recordingQuestionIdSignal() !== null);

  isSupported(): boolean {
    return (
      this.isSecureContext() &&
      typeof navigator !== "undefined" &&
      navigator.mediaDevices !== undefined &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof MediaRecorder !== "undefined"
    );
  }

  supportErrorKey(): string | null {
    if (this.isSupported()) {
      return null;
    }

    return this.isSecureContext()
      ? "publicAnonymousTemplates.voiceRecordingUnsupported"
      : "publicAnonymousTemplates.voiceRecordingSecureContextRequired";
  }

  async start(questionId: string): Promise<void> {
    this.errorKeySignal.set(null);
    this.recordingElapsedSecondsSignal.set(0);

    if (!this.isSupported()) {
      this.errorKeySignal.set(this.supportErrorKey());
      return;
    }

    if (this.mediaRecorder !== null) {
      this.cancel();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = this.recordingOptions();
      const recorder =
        options !== undefined ? new MediaRecorder(stream, options) : new MediaRecorder(stream);

      this.chunks = [];
      this.mediaStream = stream;
      this.mediaRecorder = recorder;
      this.activeQuestionId = questionId;

      recorder.addEventListener("dataavailable", (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      });

      recorder.start();
      this.recordingQuestionIdSignal.set(questionId);
      this.startTimer();
    } catch (error: unknown) {
      this.cleanup();
      this.errorKeySignal.set(this.toErrorKey(error));
    }
  }

  stop(): Promise<PublicSurveyVoiceRecording | null> {
    const recorder = this.mediaRecorder;
    const questionId = this.activeQuestionId;

    if (recorder === null || questionId === null) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      recorder.addEventListener(
        "stop",
        () => {
          const mimeType = recorder.mimeType || this.fallbackMimeType();
          const blob = new Blob(this.chunks, { type: mimeType });

          this.cleanup();

          if (blob.size === 0) {
            this.errorKeySignal.set("publicAnonymousTemplates.voiceRecordingError");
            resolve(null);
            return;
          }

          resolve({
            questionId,
            fileName: this.recordingFileName(mimeType),
            objectUrl: URL.createObjectURL(blob),
            mimeType,
            size: blob.size,
          });
        },
        { once: true },
      );

      if (recorder.state === "inactive") {
        this.cleanup();
        resolve(null);
        return;
      }

      recorder.stop();
    });
  }

  cancel(): void {
    const recorder = this.mediaRecorder;

    if (recorder !== null && recorder.state !== "inactive") {
      recorder.stop();
    }

    this.cleanup();
  }

  private recordingOptions(): MediaRecorderOptions | undefined {
    const mimeType = RECORDING_MIME_TYPES.find((type) => this.isMimeTypeSupported(type));
    return mimeType !== undefined ? { mimeType } : undefined;
  }

  private isMimeTypeSupported(mimeType: string): boolean {
    return (
      typeof MediaRecorder !== "undefined" &&
      typeof MediaRecorder.isTypeSupported === "function" &&
      MediaRecorder.isTypeSupported(mimeType)
    );
  }

  private fallbackMimeType(): string {
    return "audio/webm";
  }

  private isSecureContext(): boolean {
    return typeof window !== "undefined" && window.isSecureContext === true;
  }

  private recordingFileName(mimeType: string): string {
    return `voice-recording-${Date.now()}.${this.extensionForMimeType(mimeType)}`;
  }

  private extensionForMimeType(mimeType: string): string {
    if (mimeType.includes("mp4")) {
      return "m4a";
    }
    if (mimeType.includes("wav")) {
      return "wav";
    }
    return "webm";
  }

  private cleanup(): void {
    this.stopTimer();
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.activeQuestionId = null;
    this.chunks = [];
    this.recordingQuestionIdSignal.set(null);
  }

  private startTimer(): void {
    this.stopTimer();
    this.recordingStartedAtMs = Date.now();
    this.recordingElapsedSecondsSignal.set(0);
    this.recordingTimerId = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - this.recordingStartedAtMs) / 1000);
      this.recordingElapsedSecondsSignal.set(elapsedSeconds);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.recordingTimerId !== null) {
      window.clearInterval(this.recordingTimerId);
    }

    this.recordingTimerId = null;
    this.recordingStartedAtMs = 0;
    this.recordingElapsedSecondsSignal.set(0);
  }

  private toErrorKey(error: unknown): string {
    const errorName = error instanceof DOMException ? error.name : "";

    if (errorName === "NotAllowedError" || errorName === "SecurityError") {
      return "publicAnonymousTemplates.voicePermissionDenied";
    }

    return "publicAnonymousTemplates.voiceRecordingError";
  }
}
