// TARGET = the element we are interested in. Right now it's ".feedback-comment-input" because 
// all Ed inline comment boxes have this tag.
const TARGET = '.feedback-comment-input';

console.log("Content script loaded");
  
// Helper method that inserts text into the provided paragraph element
// Params:
// - el: reference to paragraph element
// - text: text to be inserted
function insertTextAtEnd(containerEl, text) {
  if (!containerEl || !document.body.contains(containerEl)) return;

  const paragraphEls = containerEl.querySelectorAll('.am-view-paragraphNode');
  if (!paragraphEls.length) return;

  const paragraph = paragraphEls[paragraphEls.length - 1];
  if (!paragraph.isContentEditable) return;

  paragraph.focus();

  try {
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    range.collapse(false);

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // Insert as "rich" HTML (but it's just Markdown-style plain text)
    document.execCommand('insertHTML', false, text);

    const inputEvent = new InputEvent("input", { bubbles: true });
    paragraph.dispatchEvent(inputEvent);
  } catch (err) {
    console.warn("Failed to insert text:", err);
  }
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

  const deductions = [
    {
      code: "C0",
      category: "Concepts",
      headline: "Missing extension",
      summary: "**Concepts: missing creative extension**",
      description: `> Once you've implemented the \`composeSong\` method, it's time to enhance your program with an additional feature! **Choose one** of the following creative options to expand your \`MusicBox\` class.
  
  Make sure to implement either the \`mostCommonNaturals\` or \`findChord\` extension!`
    },
    {
      code: "C1",
      category: "Concepts",
      headline: "Missing helper method (composeSong)",
      summary: "**Concepts: poor functional decomposition**",
      description: `Note that the spec requires \`composeSong\` to have 1 additional helper method. 
  
  > You should use **functional decomposition** to break down \`composeSong\` into at least one additional helper method...
  
  This is because \`composeSong\` does a lot of computation...`
    },
    // Add the rest...
  ];

  // Filter logic based on user-typed input
  function filterDeductions(query, options) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
  
    return options
      .map(item => ({
        ...item,
        score: (
          item.summary + item.description + item.headline + item.category
        ).toLowerCase().indexOf(normalized)
      }))
      .filter(item => item.score !== -1)
      .sort((a, b) => a.score - b.score);
  }
  

  // Render visible items
  function renderMenu(filteredItems) {
    menu.innerHTML = '';
  
    filteredItems.forEach(({ summary, description }) => {
      const item = document.createElement("div");
      item.tabIndex = 0;
      item.style.padding = "6px 10px";
      item.style.cursor = "pointer";
      item.style.borderBottom = "1px solid #eee";
      item.style.whiteSpace = "pre-wrap";
  
      item.innerHTML = `<strong>${summary}</strong><br><br>${description}`;
  
      item.addEventListener("mousedown", () => {
        insertTextAtEnd(el, `${summary}\n\n${description}`);
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

  // Initial render with all deductions
  renderMenu(deductions);

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
