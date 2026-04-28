/*
 * linter.ts — content script for Ed's Feedback tab.
 *
 * Loads user-defined rules from chrome.storage.local (seeded with sensible
 * defaults on first run), runs them against each line of the diff view, and
 * highlights flagged lines with hover tooltips.
 */

import { Rule } from '../popup/types';
import {
  DEFAULT_RULES,
  isRule,
  LineIssue,
  lintCode,
} from '../popup/utils/rules';

console.log('🔮 Linter content script loaded');

let LINTER_ENABLED = true;
let RULES: Rule[] = [];
let feedbackObserver: MutationObserver | null = null;

async function initialLoad(): Promise<void> {
  const data = await chrome.storage.local.get(['linterEnabled', 'linterRules']);
  LINTER_ENABLED = data.linterEnabled !== false;

  if (Array.isArray(data.linterRules)) {
    RULES = data.linterRules.filter(isRule);
  } else {
    RULES = [...DEFAULT_RULES];
    chrome.storage.local.set({ linterRules: RULES });
  }

  startLinting();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;

  let needsRelint = false;
  if ('linterEnabled' in changes) {
    LINTER_ENABLED = Boolean(changes.linterEnabled.newValue);
    console.log('⚙️ Linter enabled:', LINTER_ENABLED);
    needsRelint = true;
  }
  if ('linterRules' in changes) {
    const next = changes.linterRules.newValue;
    RULES = Array.isArray(next) ? next.filter(isRule) : [];
    needsRelint = true;
  }

  if (needsRelint) {
    clearHighlights();
    if (feedbackObserver) {
      feedbackObserver.disconnect();
      feedbackObserver = null;
    }
    startLinting();
  }
});

function startLinting(): void {
  if (!LINTER_ENABLED) return;
  waitForFeedbackCode((code) => {
    const issues = lintCode(code, RULES);
    highlightIssues(issues);
  });
}

function getCodeFromDiffTable(): string {
  const rows = document.querySelectorAll('.diff-text-line');
  const code = Array.from(rows).map((row) => {
    const codeSpan = row.querySelector('.diff-text-line-code-words');
    const lineNumber = (
      row.querySelector('.diff-text-line-num') as HTMLElement | null
    )?.innerText?.trim();
    const codeText = codeSpan ? (codeSpan as HTMLElement).innerText : '';
    return lineNumber ? `${lineNumber} ${codeText}` : codeText;
  });
  return code.join('\n').trim();
}

function waitForFeedbackCode(callback: (code: string) => void): void {
  if (!LINTER_ENABLED) return;

  const lines = document.querySelectorAll('.diff-text-line');
  if (lines.length > 0) {
    callback(getCodeFromDiffTable());
    return;
  }

  if (feedbackObserver) {
    feedbackObserver.disconnect();
    feedbackObserver = null;
  }

  feedbackObserver = new MutationObserver(() => {
    if (!LINTER_ENABLED) return;
    const found = document.querySelectorAll('.diff-text-line');
    if (found.length > 0) {
      feedbackObserver?.disconnect();
      feedbackObserver = null;
      callback(getCodeFromDiffTable());
    }
  });

  feedbackObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function clearHighlights(): void {
  document.querySelectorAll('.lint-highlight, .lint-tooltip').forEach((el) => el.remove());
}

function highlightIssues(issues: LineIssue[]): void {
  clearHighlights();
  const lineEls = document.querySelectorAll('.diff-text-line');
  for (const { line, messages } of issues) {
    const el = lineEls[line - 1];
    if (el) injectLintUI(el as HTMLElement, messages);
  }
}

function injectLintUI(lineEl: HTMLElement, messages: string[]): void {
  const el = lineEl.querySelector('.diff-text-line-code') as HTMLElement | null;
  if (!el) return;

  el.style.position = 'relative';

  const highlight = document.createElement('div');
  highlight.className = 'lint-highlight';
  Object.assign(highlight.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 72, 72, 0.2)',
    pointerEvents: 'none',
    zIndex: '0',
    display: 'block',
    margin: '0',
  } as Partial<CSSStyleDeclaration>);
  el.appendChild(highlight);

  const tooltip = document.createElement('div');
  tooltip.className = 'lint-tooltip';
  // Multiple messages render as a small bullet list.
  if (messages.length === 1) {
    tooltip.textContent = messages[0];
  } else {
    const ul = document.createElement('ul');
    ul.style.margin = '0';
    ul.style.paddingLeft = '16px';
    for (const m of messages) {
      const li = document.createElement('li');
      li.textContent = m;
      ul.appendChild(li);
    }
    tooltip.appendChild(ul);
  }
  Object.assign(tooltip.style, {
    position: 'absolute',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '12px',
    lineHeight: '1.4',
    color: '#333',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    display: 'none',
    pointerEvents: 'none',
    zIndex: '2',
    maxWidth: '320px',
  } as Partial<CSSStyleDeclaration>);

  document.body.appendChild(tooltip);

  el.addEventListener('mouseenter', () => {
    const rect = el.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY + 2}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.display = 'block';
  });

  el.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });
}

initialLoad().catch((err) => console.error('Linter init failed:', err));
