import { CandidateMatch, UserProfile } from '../shared/types';
import { getProfileValue } from '../shared/profileSchema';

const STYLE_ID = 'lazy-apply-preview-style';
const HIGHLIGHT_CLASS = 'lazy-apply-highlight';

function ensurePreviewStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 2px solid #4f46e5 !important;
      background: rgba(79, 70, 229, 0.07) !important;
      transition: outline 120ms ease;
    }
  `;
  document.documentElement.appendChild(style);
}

function getElementByMatch(match: CandidateMatch): HTMLElement | null {
  return document.querySelector(`[data-lazy-apply-id="${match.elementId}"]`);
}

export function applyPreview(matches: CandidateMatch[]): void {
  ensurePreviewStyle();
  clearPreview();
  matches.forEach((match) => {
    const element = getElementByMatch(match);
    element?.classList.add(HIGHLIGHT_CLASS);
    if (element) {
      element.setAttribute('data-lazy-apply-hint', `${match.profileLabel} ← ${match.previewValue}`);
      element.setAttribute('title', `${match.profileLabel} ← ${match.previewValue}`);
    }
  });
}

export function clearPreview(): void {
  document.querySelectorAll<HTMLElement>(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS);
    el.removeAttribute('data-lazy-apply-hint');
  });
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value');
  descriptor?.set?.call(element, value);
}

function triggerControlledEvents(element: HTMLElement): void {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

export function fillMatches(matches: CandidateMatch[], profile: UserProfile): number {
  let filled = 0;

  matches.forEach((match) => {
    const element = getElementByMatch(match);
    if (!element) return;
    const value = getProfileValue(profile, match.profileKey);
    if (!value.trim()) return;

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      setNativeValue(element, value);
      triggerControlledEvents(element);
      filled += 1;
      return;
    }

    if (element instanceof HTMLSelectElement) {
      const option = Array.from(element.options).find((opt) =>
        opt.text.toLowerCase().includes(value.toLowerCase()) || opt.value === value
      );
      if (option) {
        element.value = option.value;
        triggerControlledEvents(element);
        filled += 1;
      }
    }
  });

  return filled;
}
