// TARGET = the element we are interested in. Right now it's ".feedback-comment-input" because 
// all Ed inline comment boxes have this tag.
const TARGET = '.feedback-comment-input';

console.log("Content script loaded");
  
// Helper method that inserts text into the provided paragraph element
// Params:
// - el: reference to paragraph element
// - text: text to be inserted
function insertTextAtEnd(el, text) {
    if (!el || !document.body.contains(el)) return;

    const paragraphEls = el.querySelectorAll('.am-view-paragraphNode');
    if (!paragraphEls.length) return;

    const paragraph = paragraphEls[paragraphEls.length - 1]; // last paragraph
    if (!paragraph.isContentEditable) return;

    // Focus the paragraph
    paragraph.focus();

    // Move cursor to the end
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    range.collapse(false); // Move to end

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // Insert text at cursor [deprecated]
    document.execCommand('insertText', false, text);

    // Dispatch input event on the actual paragraph, letting Ed know we've made changes
    const inputEvent = new InputEvent("input", { bubbles: true });
    paragraph.dispatchEvent(inputEvent);
}

function getExistingText(containerEl) {
  const paragraphEls = containerEl.querySelectorAll('.am-view-paragraphNode');
  console.log(paragraphEls);
  if (!paragraphEls.length) return '';

  const combinedText = Array.from(paragraphEls)
    .map(el => el.textContent.trim())
    .join('\n') // or ' ' if you want a flat line

  return combinedText;
}

// 
function showDeductionsMenu(el) {
  const existing = el.querySelector('.deduction-menu');
  if (existing) return;

  const paragraphEl = el.querySelector('.am-view-paragraphNode');
  if (!paragraphEl) return;

  const menu = document.createElement("div");
  menu.className = "deduction-menu";
  menu.tabIndex = -1;

  const commonDeductions = [
    "Missing method comment",
    "Incorrect loop condition",
    "Off-by-one error",
    "Hardcoded value instead of variable",
    "Improper exception handling",
    "Wrong return value",
    "Infinite loop",
    "Incorrect variable initialization",
    "Forgot to update loop variable",
    "Incorrect method signature"
  ];

  // Filter logic based on user-typed input
  function filterDeductions(query, options) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options
      .map(text => ({
        text,
        score: text.toLowerCase().indexOf(normalized)
      }))
      .filter(item => item.score !== -1)
      .sort((a, b) => a.score - b.score)
      .map(item => item.text);
  }

  // Render visible items
  function renderMenu(filtered) {
    menu.innerHTML = ''; // clear current

    filtered.forEach(text => {
      const item = document.createElement("div");
      item.textContent = text;
      item.tabIndex = 0;
      item.style.padding = "6px 10px";
      item.style.cursor = "pointer";
      item.style.borderBottom = "1px solid #eee";

      item.addEventListener("mousedown", () => {
        const existing = getExistingText(el);
        if (!existing.includes(text)) {
          insertTextAtEnd(el, text);
        }
      });

      menu.appendChild(item);
    });
  }

  // 
  function observeParagraphText(el, onUpdate) {
    //const paragraphEl = el.querySelector('.am-view-paragraphNode');
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          (mutation.target.nodeType === 1 && mutation.target.closest('.deduction-menu')) ||
          Array.from(mutation.addedNodes).some(node => node.nodeType === 1 && node.closest('.deduction-menu'))
        ) {
          return;
        }        
      }
    
      const text = getExistingText(el);
      const filtered = filterDeductions(text, commonDeductions);
      onUpdate(filtered);
    });
    

    observer.observe(el, {
      childList: true,
      characterData: true,
      subtree: true
    });

    return observer;
  }

  // Initial render with all deductions
  renderMenu(commonDeductions);

  observeParagraphText(el, renderMenu);


  // Style the menu as inline block, not floating
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
    width: "100%",
  });

  const firstChild = el.firstElementChild;
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
