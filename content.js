// TARGET = the element we are interested in. Right now it's ".feedback-comment-input" because 
// all Ed inline comment boxes have this tag.
const TARGET = '.feedback-comment-input';

console.log("Content script loaded");
  
// Helper method that inserts text into the provided paragraph element
// Params:
// - el: reference to paragraph element
// - text: text to be inserted
async function copyMarkdownToClipboard(markdown) {
  try {
    await navigator.clipboard.writeText(markdown);
    alert("Copied! Now press Ctrl+Shift+V to paste into EdStem.");
  } catch (err) {
    alert("Clipboard copy failed. Please copy manually:\n\n" + markdown);
  }
}

function showDeductionsMenu(containerEl) {
  const existing = containerEl.querySelector('.deduction-menu');
  if (existing) return;

  const paragraphEl = containerEl.querySelector('.am-view-paragraphNode');
  if (!paragraphEl) return;

  const menu = document.createElement("div");
  menu.className = "deduction-menu";
  menu.tabIndex = -1;

  const deductions = [
    {
      markdown: `**Concepts: missing creative extension**\n\n> Once you've implemented the \`composeSong\` method, it's time to enhance your program with an additional feature! **Choose one** of the following creative options to expand your \`MusicBox\` class.\n\nMake sure to implement either the \`mostCommonNaturals\` or \`findChord\` extension!`
    },
    {
      markdown: `**Concepts: poor functional decomposition**\n\nNote that the spec requires \`composeSong\` to have 1 additional helper method.\n\n> You should use **functional decomposition** to break down \`composeSong\` into at least one additional helper method...\n\nThis is because \`composeSong\` does a lot of computation...`
    }
  ];

  function filterDeductions(query, options) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options
      .map(item => ({
        ...item,
        score: item.markdown.toLowerCase().indexOf(normalized)
      }))
      .filter(item => item.score !== -1)
      .sort((a, b) => a.score - b.score);
  }

  function renderMenu(filteredItems) {
    menu.innerHTML = '';

    filteredItems.forEach(({ markdown }) => {
      const item = document.createElement("div");
      item.tabIndex = 0;
      item.style.padding = "6px 10px";
      item.style.cursor = "pointer";
      item.style.borderBottom = "1px solid #eee";
      item.style.whiteSpace = "pre-wrap";

      const firstLine = markdown.split('\n')[0];
      item.innerHTML = `<strong>${firstLine}</strong>`;

      item.addEventListener("mousedown", () => {
        copyMarkdownToClipboard(markdown);
      });

      menu.appendChild(item);
    });
  }

  function observeParagraphText(el, onUpdate) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          (mutation.target.nodeType === 1 && mutation.target.closest('.deduction-menu')) ||
          Array.from(mutation.addedNodes).some(node => node.nodeType === 1 && node.closest('.deduction-menu'))
        ) {
          return;
        }
      }

      const text = Array.from(el.querySelectorAll('.am-view-paragraphNode'))
        .map(p => p.textContent.trim())
        .join(' ');
      const filtered = filterDeductions(text, deductions);
      onUpdate(filtered);
    });

    observer.observe(el, {
      childList: true,
      characterData: true,
      subtree: true
    });

    return observer;
  }

  renderMenu(deductions);
  observeParagraphText(containerEl, renderMenu);

  Object.assign(menu.style, {
    marginTop: "8px",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    height: "150px",
    overflowY: "auto",
    width: "100%"
  });

  const firstChild = containerEl.firstElementChild;
  firstChild.parentNode.insertBefore(menu, firstChild.nextSibling);
}


// Set that contains all nodes that we have already attached listeners to
const processed = new WeakSet();

// 
function processNode(node) {
  if (
    node.matches &&
    node.matches(TARGET)
  ) {
    const paragraph = node.querySelector(".am-view-paragraphNode");
    if (!paragraph || !paragraph.isContentEditable || processed.has(node)) return;

    showDeductionsMenu(node); // insert menu right away
    processed.add(node);
    console.log("Inserted menu into:", node);
  }
}


// Initial pass for any already-present elements
document.querySelectorAll(TARGET).forEach(processNode);

// Watch for new elements added to the DOM
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // Direct match
        processNode(node);
        // Or children that match
        node.querySelectorAll?.(TARGET).forEach(processNode);
      }
    });
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Extra styling for the menu
const style = document.createElement('style');
style.textContent = `
  .deduction-menu div:hover {
    background-color: #f0f0f0;
  }
  .deduction-menu div:focus {
    outline: none;
    background-color: #e0e0e0;
  }
  .deduction-menu {
    cursor: default;
  }
`;
document.head.appendChild(style);
