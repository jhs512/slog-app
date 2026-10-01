import { splitSpeechRanges, speechSentences, koreanVoice, StorySpeech, speechRates } from './speech-engine.mjs';
import { excluded, visible, readableText, mapSpeechText, speechRanges, speechChunkText } from './speech-text.mjs';
import { createSpeechHighlight } from './speech-highlight.mjs';
export { visible, readableText } from './speech-text.mjs';

export function mountSpeech(main) {
  const rateKey = 'slog:tts-rate';
  let savedRate = 1;
  try { const value = Number(localStorage.getItem(rateKey)); if (speechRates.includes(value)) savedRate = value; } catch {}
  let disposed = false, frame;
  const listeners = new AbortController();
  const panel = document.createElement('section');
  panel.className = 'speech-controls'; panel.dataset.speechControls = ''; panel.hidden = true;
  panel.setAttribute('aria-label', '텍스트 읽어주기');
  panel.innerHTML = `<button type="button" class="speech-close" aria-label="읽어주기 닫기 및 정지">닫기 ×</button><div class="speech-buttons"><button type="button" data-action="play" disabled>이어읽기</button><button type="button" data-action="pause" disabled>일시정지</button><button type="button" data-action="stop" disabled>정지</button><label>속도 <select aria-label="읽기 속도">${speechRates.map(rate => `<option value="${rate}"${rate === savedRate ? ' selected' : ''}>${rate}배</option>`).join('')}</select></label></div><div class="speech-context" hidden aria-label="낭독 문맥" aria-live="off">${['이전 문장', '현재 읽는 문장', '다음 문장'].map((label, i) => `<div class="speech-context-item${i === 1 ? ' speech-current-sentence' : ''}"><span class="speech-context-label">${label}</span><p data-sentence="${i - 1}" tabindex="0"></p></div>`).join('')}</div><p class="speech-status" role="status"></p><p class="speech-help">이어읽기는 멈춘 문장부터, 속도는 다음 문장부터 적용됩니다. 화면을 떠나면 정지합니다.</p>`;
  document.body.append(panel);
  const notice = document.createElement('p'); notice.className = 'speech-notice'; notice.setAttribute('role', 'status'); notice.hidden = true;
  const content = main;
  if (content) content.before(notice); else main.append(notice);
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    notice.hidden = false; notice.textContent = '이 브라우저는 읽어주기를 지원하지 않습니다.';
    return () => { panel.remove(); notice.remove(); };
  }
  const synth = window.speechSynthesis, entries = new Map();
  const play = panel.querySelector('[data-action="play"]'), pause = panel.querySelector('[data-action="pause"]'), stop = panel.querySelector('[data-action="stop"]'), close = panel.querySelector('.speech-close');
  let active, origin, spokenText, observer, mapping, chunks, sentences, shownSentence;
  const context = panel.querySelector('.speech-context');
  const navigation = document.createElement('div'); navigation.className = 'speech-buttons speech-navigation';
  navigation.innerHTML = '<button type="button" data-direction="-1" disabled>이전 문장</button><button type="button" data-direction="1" disabled>다음 문장</button>';
  context.before(navigation);
  const highlight = createSpeechHighlight();
  const controller = new StorySpeech(synth, window.SpeechSynthesisUtterance, [], ({ state, message, index }) => {
    if (disposed) return;
    const chunk = chunks?.[index];
    for (const button of navigation.querySelectorAll('button')) {
      const next = (chunk?.sentenceIndex ?? 0) + Number(button.dataset.direction);
      button.disabled = !['starting', 'speaking', 'paused'].includes(state) || !sentences?.[next];
    }
    if (state === 'speaking' && mapping && chunk) {
      highlight.show(speechRanges(mapping, chunk.sentenceStart, chunk.sentenceEnd));
      if (shownSentence !== chunk.sentenceIndex) {
        shownSentence = chunk.sentenceIndex;
        for (const item of context.querySelectorAll('[data-sentence]')) item.textContent = sentences[shownSentence + Number(item.dataset.sentence)]?.text || '없음';
      }
      context.hidden = false;
    } else if (state !== 'paused') {
      highlight.clear();
      if (state !== 'starting' || shownSentence !== chunk?.sentenceIndex) context.hidden = true;
      if (state !== 'starting') { shownSentence = undefined; context.querySelectorAll('[data-sentence]').forEach(item => item.textContent = ''); }
    }
    const wasHidden = panel.hidden, focusInside = panel.contains(document.activeElement);
    panel.hidden = !['starting', 'speaking', 'paused', 'error'].includes(state);
    panel.dataset.state = state; play.disabled = state !== 'paused';
    pause.disabled = !['starting', 'speaking'].includes(state); stop.disabled = !['starting', 'speaking', 'paused'].includes(state);
    panel.querySelector('.speech-status').textContent = message;
    notice.hidden = !panel.hidden || state === 'idle' && message === '정지했습니다.';
    if (!notice.hidden) notice.textContent = message;
    active?.classList.toggle('speech-active', ['starting', 'speaking', 'paused'].includes(state));
    if (panel.hidden && focusInside && origin?.isConnected && visible(origin)) origin.focus({ preventScroll: true });
    else if (wasHidden && !panel.hidden) close.focus({ preventScroll: true });
  });
  controller.rate = savedRate;
  const dismiss = () => controller.stop();
  for (const button of navigation.querySelectorAll('button')) button.onclick = () => {
    if (!active || !visible(active) || readableText(active) !== spokenText) { dismiss(); return; }
    const target = (chunks[controller.index]?.sentenceIndex ?? 0) + Number(button.dataset.direction);
    const index = chunks.findIndex(chunk => chunk.sentenceIndex === target);
    if (index < 0) return;
    controller.cancel(); controller.index = index; controller.state = 'paused'; controller.start();
  };
  play.onclick = () => { if (active && visible(active) && readableText(active) === spokenText) controller.start(); else dismiss(); };
  pause.onclick = () => controller.pause(); stop.onclick = close.onclick = dismiss;
  panel.querySelector('select').onchange = event => {
    const rate = Number(event.target.value);
    if (!speechRates.includes(rate)) return;
    controller.setRate(rate);
    try { localStorage.setItem(rateKey, String(rate)); } catch {}
  };
  panel.onkeydown = event => { if (event.key === 'Escape') { event.preventDefault(); dismiss(); } };
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || panel.hidden) return;
    event.preventDefault(); dismiss();
    if (origin?.isConnected && visible(origin)) origin.focus({ preventScroll: true });
  }, { signal: listeners.signal });
  function remove(node) {
    const entry = entries.get(node);
    entry?.button.remove(); entry?.host.classList.remove('speech-block'); entries.delete(node); node.classList.remove('speech-block', 'speech-active');
    if (entry?.headingText?.parentElement === node) entry.headingText.replaceWith(...entry.headingText.childNodes);
    node.classList.remove('speech-heading');
    if (entry && /^H[1-6]$/.test(node.tagName)) {
      if (entry?.originalLabel !== null && entry?.originalLabel !== undefined) node.setAttribute('aria-label', entry.originalLabel);
      else node.removeAttribute('aria-label');
    }
  }
  function eligible(node) {
    return node.matches('.tts-readable') && !!node.closest('[data-tts-content]') && visible(node) && !node.closest(excluded) && !node.parentElement?.closest('.tts-readable') && !node.closest('a,button') && (!node.closest('label,form') || node.closest('.tts-option'));
  }
  function reconcile(roots) {
    if (disposed) return;
    observer.disconnect();
    try {
      // Only changed branches need visibility checks; book diagrams/progress updates must not rescan every paragraph.
      for (const node of entries.keys()) {
        if (!node.isConnected || roots.some(root => root instanceof Element && (root.contains(node) || node.contains(root))) && !eligible(node)) remove(node);
      }
      const candidates = new Set();
      for (const root of roots) {
        if (!(root instanceof Element) || !main.contains(root) && root !== main) continue;
        if (root.matches('.tts-readable')) candidates.add(root);
        const parent = root.closest('.tts-readable'); if (parent) candidates.add(parent);
        root.querySelectorAll('.tts-readable').forEach(node => candidates.add(node));
      }
      // Measure before inserting buttons. Interleaving visibility reads and DOM
      // writes forces a full layout for each item in a large question list.
      const measured = [...candidates].map(node => {
        const excluded = !!node.closest('[data-tts-exclude]');
        const allowed = !excluded && eligible(node);
        return {node, excluded, allowed, text: allowed ? readableText(node) : ''};
      });
      for (const {node, excluded, allowed, text} of measured) {
        if (excluded) { remove(node); node.classList.remove('tts-readable'); continue; }
        if (!allowed) continue;
        if (!text) { remove(node); continue; }
        let entry = entries.get(node);
        if (entry && !node.contains(entry.button)) { remove(node); entry = undefined; }
        if (!entry) {
          const button = document.createElement('button'); button.type = 'button'; button.className = 'block-speech-button'; button.title = '이 텍스트 읽기';
          button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 2L12 8L4 14Z" fill="currentColor"/></svg>';
          // Loose Markdown lists contain block paragraphs. Keep the button with
          // the item's own final paragraph, before any nested list.
          const host = node.closest('.tts-option') || (node.tagName === 'LI' && [...node.children].filter(child => child.tagName === 'P').at(-1)) || node;
          let headingText;
          if (/^H[1-6]$/.test(node.tagName)) {
            headingText = document.createElement('span'); headingText.className = 'speech-heading-text';
            headingText.append(...node.childNodes); node.append(headingText); node.classList.add('speech-heading');
          }
          host.classList.add('speech-block'); host.append(button);
          entry = { button, host, headingText, originalLabel: node.getAttribute('aria-label') }; entries.set(node, entry);
          button.onclick = event => {
            event.preventDefault(); event.stopPropagation();
            const current = readableText(node); if (disposed || !eligible(node) || !current) return;
            if (active !== node || current !== spokenText) { dismiss(); active?.classList.remove('speech-active'); active = node; spokenText = current; mapping = mapSpeechText(node); sentences = speechSentences(mapping.text); chunks = splitSpeechRanges(mapping.text); controller.chunks = chunks.map(chunk => speechChunkText(mapping, chunk.start, chunk.end)); }
            origin = button; controller.start();
          };
        }
        // Never put answer text in accessibility labels; hidden content cannot leak through a stale label.
        entry.button.setAttribute('aria-label', '이 텍스트 읽기');
        if (/^H[1-6]$/.test(node.tagName)) node.setAttribute('aria-label', text);
      }
    } finally { observe(); }
  }
  let scheduled = false; const dirty = new Set();
  function schedule(root) {
    if (disposed) return;
    dirty.add(root);
    if (!scheduled) { scheduled = true; frame = requestAnimationFrame(() => { scheduled = false; const roots = [...dirty]; dirty.clear(); reconcile(roots); }); }
  }
  observer = new MutationObserver(records => {
    if (active && (!active.isConnected || !eligible(active) || readableText(active) !== spokenText || [...(mapping?.nodes || [])].some(([node, text]) => !node.isConnected || node.data !== text))) { dismiss(); active?.classList.remove('speech-active'); active = null; }
    for (const record of records) {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (target?.closest('[data-tts-exclude]')) { schedule(target.closest('[data-tts-exclude]')); continue; }
      if (!target || target.closest(excluded)) continue;
      if (record.type === 'attributes' && record.attributeName === 'class') {
        const clean = value => (value || '').replace(/\bspeech-(active|block)\b/g, '').trim();
        if (clean(record.oldValue) === clean(target.className)) continue;
      }
      if (record.type === 'childList') {
        for (const node of [...record.addedNodes, ...record.removedNodes]) if (node instanceof Element) schedule(node);
        const parent = target.closest('.tts-readable'); if (parent) schedule(parent);
      } else schedule(target);
    }
  });
  function observe() { if (!disposed) observer.observe(main, { subtree: true, childList: true, characterData: true, attributes: true, attributeOldValue: true, attributeFilter: ['hidden', 'aria-hidden', 'style', 'class', 'open', 'data-tts-exclude', 'data-tts-content'] }); }
  reconcile([main]);
  synth.addEventListener('voiceschanged', () => { if (!disposed && koreanVoice(synth.getVoices()) && panel.hidden) { notice.hidden = true; } }, { signal: listeners.signal });
  // Warm only the voice list; actual playback always requires a text button click.
  synth.getVoices();
  for (const event of ['site-route-change', 'popstate', 'pagehide']) addEventListener(event, dismiss, { signal: listeners.signal });
  addEventListener('resize', () => { if (active && !visible(active)) dismiss(); schedule(main); }, { signal: listeners.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) dismiss(); }, { signal: listeners.signal });
  return () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect(); cancelAnimationFrame(frame); dirty.clear(); listeners.abort();
    controller.stop(); highlight.dispose();
    for (const node of [...entries.keys()]) remove(node);
    active = origin = null;
    panel.remove(); notice.remove();
  };
}
