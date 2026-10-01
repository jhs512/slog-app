import { pronunciationText } from './speech-pronunciation.mjs';
export const speechRates = Object.freeze([0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3]);

// Segment sentences before bounded utterances, retaining both sets of offsets.
export function speechSentences(text) {
  const result = [];
  const segments = new Intl.Segmenter('ko', { granularity: 'sentence' }).segment(text);
  const abbreviation = /(?:\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc)\.|(?:[A-Za-z]\.){2,})$/i;
  for (const segment of segments) {
    let start = segment.index, end = start + segment.segment.length;
    while (start < end && /\s/.test(text[start])) start++;
    while (end > start && /\s/.test(text[end - 1])) end--;
    if (start === end) continue;
    const previous = result.at(-1);
    if (previous && abbreviation.test(previous.text)) {
      previous.end = end; previous.text = text.slice(previous.start, end);
    } else result.push({ text: text.slice(start, end), start, end });
  }
  return result;
}
export function splitSpeechRanges(text, limit = 180) {
  const result = [];
  for (const [sentenceIndex, sentence] of speechSentences(text).entries()) {
    let start = sentence.start; const end = sentence.end;
    while (start < end) {
      let stop = Math.min(start + limit, end);
      if (stop < end) { const space = text.lastIndexOf(' ', stop); if (space > start + limit / 2) stop = space; }
      if (stop > start + 1 && stop < end && /[\uDC00-\uDFFF]/.test(text[stop]) && /[\uD800-\uDBFF]/.test(text[stop - 1])) stop--;
      result.push({ text: text.slice(start, stop), start, end: stop, sentenceIndex, sentenceStart: sentence.start, sentenceEnd: end });
      start = stop; while (start < end && /\s/.test(text[start])) start++;
    }
  }
  return result;
}
export function splitSpeech(text, limit = 180) {
  return splitSpeechRanges(text.replace(/\s+/g, ' ').trim(), limit).map(chunk => chunk.text);
}

export function koreanVoice(voices) {
  return voices.filter(v => /^ko(?:[-_]|$)/i.test(v.lang))
    .sort((a, b) => Number(b.localService) - Number(a.localService) || Number(b.default) - Number(a.default))[0];
}

export class StorySpeech {
  constructor(synth, Utterance, chunks, update, timers = globalThis) {
    Object.assign(this, { synth, Utterance, chunks, update, timers });
    this.state = 'idle'; this.index = 0; this.rate = 1; this.generation = 0;
  }
  emit(message) { this.update({ state: this.state, index: this.index, total: this.chunks.length, message }); }
  cancel() {
    this.generation++;
    this.timers.clearTimeout(this.timer);
    this.utterance = null;
    this.synth.cancel();
  }
  start() {
    if (['starting', 'speaking'].includes(this.state)) return;
    this.voice = koreanVoice(this.synth.getVoices());
    if (!this.voice) { this.emit('한국어 음성을 찾지 못했습니다. 기기의 한국어 음성을 확인한 뒤 본문의 읽기 버튼을 다시 눌러 주세요.'); return; }
    if (this.state !== 'paused') this.index = 0;
    this.cancel();
    this.synth.resume();
    this.next();
  }
  next() {
    if (this.index >= this.chunks.length) { this.state = 'ended'; this.emit('모두 읽었습니다.'); return; }
    const token = ++this.generation;
    const utterance = new this.Utterance(pronunciationText(this.chunks[this.index]));
    this.utterance = utterance; // Keep a strong reference until the utterance finishes.
    utterance.lang = 'ko-KR'; utterance.voice = this.voice; utterance.rate = this.rate;
    const valid = () => token === this.generation;
    const fail = () => {
      if (!valid()) return;
      this.cancel(); this.state = 'error';
      this.emit('음성 재생이 멈췄습니다. 본문의 읽기 버튼을 눌러 다시 시작해 주세요.');
    };
    utterance.onstart = () => {
      if (!valid()) return;
      this.timers.clearTimeout(this.timer);
      this.state = 'speaking'; this.emit(`읽는 중 · ${this.index + 1}/${this.chunks.length}`);
      this.timer = this.timers.setTimeout(fail, 60000);
    };
    utterance.onend = () => {
      if (!valid()) return;
      this.timers.clearTimeout(this.timer);
      this.utterance = null; this.index++; this.next();
    };
    utterance.onerror = fail;
    this.state = 'starting'; this.emit(`재생 준비 중 · ${this.index + 1}/${this.chunks.length}`);
    this.timer = this.timers.setTimeout(fail, 12000);
    try { this.synth.speak(utterance); } catch { fail(); }
  }
  pause() {
    if (!['starting', 'speaking'].includes(this.state)) return;
    // Sentence-level pause works even on devices that cannot resume native speech reliably.
    this.cancel(); this.state = 'paused'; this.emit('일시정지 · 이어읽기는 멈춘 문장부터 시작합니다.');
  }
  stop() { this.cancel(); this.index = 0; this.state = 'idle'; this.emit('정지했습니다.'); }
  setRate(rate) {
    if (!speechRates.includes(rate)) return;
    this.rate = rate;
    this.emit(['starting', 'speaking'].includes(this.state) ? '속도는 다음 문장부터 적용됩니다.' : `읽기 속도 ${rate}배`);
  }
}
