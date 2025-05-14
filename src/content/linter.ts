console.log("🔮 Linter content script loaded");

let LINTER_ENABLED = true;

// Load setting
chrome.storage.local.get(['linterEnabled'], (data) => {
  LINTER_ENABLED = data.linterEnabled !== false;
});

// Listen for setting change
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && 'linterEnabled' in changes) {
    LINTER_ENABLED = Boolean(changes.linterEnabled.newValue);
    console.log("⚙️ Linter enabled:", LINTER_ENABLED);
    if (LINTER_ENABLED) {
      waitForFeedbackCode((studentCode) => {
        console.log("📄 Extracted student code from Feedback tab:", studentCode);
        const deductions = runAllLintChecks(studentCode);
        highlightDeductions(deductions);
      });
    } else {
      clearHighlights();
    }
  }
});

function getCodeFromDiffTable() {
  const rows = document.querySelectorAll('.diff-text-line');
  const code = Array.from(rows).map(row => {
    const codeSpan = row.querySelector('.diff-text-line-code-words');
    const lineNumber = (row.querySelector('.diff-text-line-num') as HTMLElement)?.innerText?.trim();
    const codeText = codeSpan ? (codeSpan as HTMLElement).innerText : '';
    return lineNumber ? `${lineNumber} ${codeText}` : codeText;
  });
  return code.join('\n').trim();
}

function waitForFeedbackCode(callback) {
  if (!LINTER_ENABLED) return;

  const lines = document.querySelectorAll('.diff-text-line');
  if (lines.length > 0) {
    const code = getCodeFromDiffTable();
    callback(code);
  }

  const observer = new MutationObserver(() => {
    const lines = document.querySelectorAll('.diff-text-line');
    if (lines.length > 0) {
      observer.disconnect();
      const code = getCodeFromDiffTable();
      callback(code);
    }
  });

  observer.observe(document.body, {
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

function clearHighlights() {
  document.querySelectorAll('.lint-highlight').forEach(el => el.remove());
  document.querySelectorAll('.diff-text-line').forEach(el => {
    (el as HTMLElement).style.backgroundColor = '';
  });
  document.querySelectorAll('.lint-tooltip').forEach(tip => tip.remove());

  // Clone each line node to strip attached listeners
  document.querySelectorAll('.diff-text-line').forEach(el => {
    const clone = el.cloneNode(true);
    el.parentNode?.replaceChild(clone, el);
  });
}

function highlightDeductions(deductions) {
  clearHighlights();
  const lineEls = document.querySelectorAll('.diff-text-line');
  

  deductions.forEach(({ line, issue }) => {
    const lineIndex = line - 1;
    const el = lineEls[lineIndex];
    if (el) {
      (el as HTMLElement).style.backgroundColor = 'rgba(255, 0, 0, 0.2)';

      const tooltip = document.createElement('div');
      tooltip.className = 'lint-tooltip';
      tooltip.textContent = issue;
      tooltip.style.position = 'absolute';
      tooltip.style.background = '#fff';
      tooltip.style.border = '1px solid #ccc';
      tooltip.style.padding = '4px';
      tooltip.style.fontSize = '12px';
      tooltip.style.zIndex = '1000';
      tooltip.style.display = 'none';

      document.body.appendChild(tooltip);

      el.addEventListener('mouseenter', () => {
        const rect = el.getBoundingClientRect();
        tooltip.style.top = rect.bottom + window.scrollY + 'px';
        tooltip.style.left = rect.left + window.scrollX + 'px';
        tooltip.style.display = 'block';
      });

      el.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
    }
  });
}

function runAllLintChecks(code: string): { line: number, issue: string }[] {
  const lines = code.split('\n');
  const issues = [];

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
