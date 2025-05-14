console.log("🧠 Linter content script loaded");
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

    const deductions = longLineCheck(studentCode);
    highlightDeductions(deductions);
});

function highlightDeductions(deductions) {
    const lineEls = document.querySelectorAll('.diff-text-line');

    deductions.forEach(({ line, comment }) => {
    const lineIndex = line - 1;
    const el = lineEls[lineIndex];
    if (el) {
        (el as HTMLElement).style.backgroundColor = 'rgba(255, 0, 0, 0.2)';

        const tooltip = document.createElement('div');
        tooltip.textContent = comment;
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

function longLineCheck(code: string): { line: number, issue: string }[] {
    const lines = code.split('\n');
    const issues = [];

    for (let i = 0; i < lines.length; i++) {
    const content = lines[i].replace(/^\d+\s+/, ''); // strip line number prefix if present
    if (content.length > 100) {
        issues.push({
        line: i + 1,
        issue: `Line exceeds 100 characters (${content.length}).`
        });
    }
    }

    return issues;
}

