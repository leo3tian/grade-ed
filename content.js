const TARGET = '.feedback-comment-input';

console.log("Content script loaded");

// Activates target of event
function handleInteraction(event) {
    console.log("Handling interaction");
    const el = event.currentTarget;
    showDeductionsMenu(el);
}

// Deactivates target of event
function handleBlur(event) {
    console.log("Handling blur");
    const previousTarget = event.currentTarget;
  
    setTimeout(() => {
      const active = document.activeElement;

      // Case 1: Check if hovering deduction menu
      const menu = document.querySelector('.deduction-menu');
      if (menu && menu.matches(':hover')) return;
  
      // Case 2: User switched to another valid input
      if (active && active.matches(TARGET)) return;
  
      // Otherwise, clean up
      removeExistingMenu();
    }, 100);
}
  
// Helper method that inserts text at the end of the provided element 
// - Params: only takes in TARGET element 
function insertTextAtEnd(el, text) {
    const paragraph = el;

    if (!paragraph) return;

    // Focus so EdStem activates its editor
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

    // Dispatch input event on the actual paragraph
    const inputEvent = new InputEvent("input", { bubbles: true });
    paragraph.dispatchEvent(inputEvent);
    
}

// Helper method that gets the existing text inside of the provided element
function getExistingText(el) {
    const paragraph = el;

    if (!paragraph || !paragraph.isContentEditable) return '';

    return paragraph.innerText.trim(); // Or .textContent if you want raw text
}
  

function showDeductionsMenu(el) {
  const existing = el.querySelector('.deduction-menu');
  if(existing) return;

  const paragraphEl = el.querySelector('.am-view-paragraphNode');
  const menu = document.createElement("div");
  
  menu.className = "deduction-menu";
  menu.tabIndex = -1;

  const commonDeductions = [
      "Missing method comment",
      "Incorrect loop condition",
      "Off-by-one error",
      "Hardcoded value instead of variable",
      "Improper exception handling",
  ];

  commonDeductions.forEach(text => {
      const item = document.createElement("div");
      item.textContent = text;
      item.tabIndex = 0;
      item.style.padding = "6px 10px";
      item.style.cursor = "pointer";
      item.style.borderBottom = "1px solid #eee";

      item.addEventListener("mousedown", () => {
          insertTextAtEnd(paragraphEl, text);
      });

      menu.appendChild(item);
  });

  // Style the menu as inline block, not floating
  Object.assign(menu.style, {
      marginTop: "8px",
      backgroundColor: "#fff",
      border: "1px solid #ccc",
      borderRadius: "6px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      maxHeight: "150px",
      overflowY: "auto",
      width: "100%", // or fixed like "300px"
  });

  // Insert the menu after the paragraph node
  const firstChild = el.firstElementChild;
  firstChild.parentNode.insertBefore(menu, firstChild.nextSibling);
  
}


function removeExistingMenu() {
    const old = document.querySelector(".deduction-menu");
    if (old) old.remove();
}


  
// Set that contains all nodes that we have already attached listeners to
const processed = new WeakSet();

//
function processNode(node) {
  if (
    node.matches &&
    node.matches(".feedback-comment-input")
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
