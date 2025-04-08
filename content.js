const TARGET = '.am-view-branchNode.am-view-documentNode';

console.log("Content script loaded");

// Activates target of event
function handleInteraction(event) {
    const el = event.currentTarget;
    showDeductionsMenu(el);
}

// Deactivates target of event
function handleBlur(event) {
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
    // Find the first editable paragraph inside the comment editor
    const paragraph = el.querySelector('.am-view-paragraphNode');

    // Focus the parent container so EdStem registers the edit
    el.focus();

    // Create and insert text
    const textNode = document.createTextNode(text);
    paragraph.appendChild(textNode);

    // Notify EdStem that content changed
    const inputEvent = new InputEvent("input", { bubbles: true });
    paragraph.dispatchEvent(inputEvent);
}

// Helper method that gets the existing text inside of the provided element
function getExistingText(el) {
    const paragraph = el.querySelector('.am-view-paragraphNode');

    if (!paragraph || !paragraph.isContentEditable) return '';

    return paragraph.innerText.trim(); // Or .textContent if you want raw text
}
  

function showDeductionsMenu(targetEl) {
    removeExistingMenu(); // Remove any previous menu

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
            insertTextAtEnd(targetEl, text)
            //removeExistingMenu();
        });

        menu.appendChild(item);
    });

    // Style the menu
    Object.assign(menu.style, {
        position: "absolute",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "6px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        maxHeight: "150px",
        overflowY: "auto",
        zIndex: 10000,
    });

    // Position the menu
    const rect = targetEl.getBoundingClientRect();
    menu.style.left = `${window.scrollX + rect.left}px`;
    menu.style.top = `${window.scrollY + rect.bottom + 4}px`;

    document.body.appendChild(menu);
}

function removeExistingMenu() {
    const old = document.querySelector(".deduction-menu");
    if (old) old.remove();
}


  
// Set that contains all nodes that we have already attached listeners to
const processed = new WeakSet();

// Checks if nodes match target and attatches listeners to node 
function processNode(node) {
  if (
    node.matches &&
    node.matches(".am-view-branchNode.am-view-documentNode") &&
    !processed.has(node)
  ) {
    node.addEventListener("focus", handleInteraction);
    node.addEventListener("input", handleInteraction);
    node.addEventListener("blur", handleBlur);
    processed.add(node);
    console.log("Attached listeners to:", node);

    // Handle case where element is already focused
    if (document.activeElement === node) {
      handleInteraction({ currentTarget: node });
      console.log("Element was already focused — applied style immediately.");
    }
  }
}

// Initial pass for any already-present elements
document.querySelectorAll(".am-view-branchNode.am-view-documentNode").forEach(processNode);

// Watch for new elements added to the DOM
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // Direct match
        processNode(node);
        // Or children that match
        node.querySelectorAll?.(".am-view-branchNode.am-view-documentNode").forEach(processNode);
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
