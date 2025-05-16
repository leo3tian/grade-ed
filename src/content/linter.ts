console.log("🔮 Linter content script loaded");

let LINTER_ENABLED = true;
let feedbackObserver: MutationObserver | null = null;

// Load setting
chrome.storage.local.get(['linterEnabled'], (data) => {
  LINTER_ENABLED = data.linterEnabled !== false;
});

// Listen for setting change
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && 'linterEnabled' in changes) {
    LINTER_ENABLED = Boolean(changes.linterEnabled.newValue);
    console.log("⚙️ Linter enabled:", LINTER_ENABLED);

    clearHighlights();

    if (!LINTER_ENABLED && feedbackObserver) {
      feedbackObserver.disconnect();
      feedbackObserver = null;
    }

    if (LINTER_ENABLED) {
      waitForFeedbackCode((studentCode) => {
        console.log("📄 Extracted student code from Feedback tab:", studentCode);
        const deductions = runAllLintChecks(studentCode);
        highlightDeductions(deductions);
      });
    }
  }
});

function getCodeFromDiffTable(): string {
  const rows = document.querySelectorAll('.diff-text-line');
  const code = Array.from(rows).map(row => {
    const codeSpan = row.querySelector('.diff-text-line-code-words');
    const lineNumber = (row.querySelector('.diff-text-line-num') as HTMLElement)?.innerText?.trim();
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

    const lines = document.querySelectorAll('.diff-text-line');
    if (lines.length > 0) {
      feedbackObserver?.disconnect();
      feedbackObserver = null;
      callback(getCodeFromDiffTable());
    }
  });

  feedbackObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

waitForFeedbackCode((studentCode) => {
  console.log("📄 Extracted student code from Feedback tab:", studentCode);

  if (!LINTER_ENABLED) {
    console.log("🚫 Linter is disabled");
    return;
  }

  const deductions = runAllLintChecks(studentCode);
  highlightDeductions(deductions);
});

function clearHighlights(): void {
  document.querySelectorAll('.lint-highlight, .lint-tooltip').forEach(el => el.remove());
}

function highlightDeductions(deductions: { line: number, issue: string }[]): void {
  clearHighlights();
  const lineEls = document.querySelectorAll('.diff-text-line');

  deductions.forEach(({ line, issue }) => {
    const lineIndex = line - 1;
    const el = lineEls[lineIndex];
    if (el) {
      injectLintUI(el as HTMLElement, issue);
    }
  });
}

function injectLintUI(lineEl: HTMLElement, issue: string): void {
  const el = lineEl.querySelector('.diff-text-line-code') as HTMLElement;
  if (!el) return;

  el.style.position = 'relative';

  const highlight = document.createElement('div');
  highlight.className = 'lint-highlight';
  highlight.style.position = 'absolute';
  highlight.style.top = '0';
  highlight.style.left = '0';
  highlight.style.width = '100%';
  highlight.style.height = '100%';
  highlight.style.backgroundColor = 'rgba(255, 72, 72, 0.2)';
  highlight.style.pointerEvents = 'none';
  highlight.style.zIndex = '0';
  highlight.style.display = 'block';
  highlight.style.margin = '0';

  el.appendChild(highlight);

  const tooltip = document.createElement('div');
  tooltip.className = 'lint-tooltip';
  tooltip.textContent = issue;
  tooltip.style.position = 'absolute';
  tooltip.style.background = '#fff';
  tooltip.style.border = '1px solid #ccc';
  tooltip.style.padding = '4px';
  tooltip.style.fontSize = '12px';
  tooltip.style.display = 'none';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.zIndex = '2';

  document.body.appendChild(tooltip);

  el.addEventListener('mouseenter', () => {
    const rect = el.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.display = 'block';
  });

  el.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });
}

function runAllLintChecks(code: string): { line: number, issue: string }[] {
  const lines = code.split('\n');
  const issues: { line: number, issue: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const content = lines[i].replace(/^\d+\s+/, '');
    const lineNum = i + 1;

    const checks = [longLineCheck, breakCheck];
    for (const check of checks) {
      const issue = check(content);
      if (issue) {
        issues.push({ line: lineNum, issue });
      }
    }
  }

  return issues;
}

function longLineCheck(line: string): string | null {
  return line.length > 100 ? `Line exceeds 100 characters (${line.length}).` : null;
}

function breakCheck(line: string): string | null {
  return /\bbreak\b/.test(line) ? `Use of 'break' detected.` : null;
}
