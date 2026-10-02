export type SpeechSession = (() => void) & { readAll(trigger: HTMLElement): void };
export function mountSpeech(root: HTMLElement): SpeechSession;
