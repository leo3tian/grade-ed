// Constants
const TARGET = '.feedback-comment-input';
const processed = new WeakSet();
let DEDUCTIONS = [];


// Pastes markdown into ed container
function simulatePaste(containerEl, markdown) {
  if (!containerEl || !markdown) return;

  const paragraph = containerEl.querySelector('.am-view-paragraphNode');
  if (!paragraph || !paragraph.isContentEditable) {
    console.warn("🛑 Could not find editable paragraph");
    return;
  }

  // Focus to enable potential input
  paragraph.focus();

  // Attempt to create clipboard event with markdown content
  const clipboardData = new DataTransfer();
  clipboardData.setData("text/plain", markdown);

  const pasteEvent = new ClipboardEvent("paste", {
    clipboardData,
    bubbles: true,
    cancelable: true
  });

  const result = paragraph.dispatchEvent(pasteEvent);
}

// Sets up deduction menu 
function setupDeductionsMenu(containerEl) {
  if (containerEl.querySelector('.deduction-menu')) return;

  const menu = document.createElement("div");
  menu.className = "deduction-menu";
  containerEl.firstElementChild.after(menu);

  const updateMenu = () => {
    const query = Array.from(containerEl.querySelectorAll('.am-view-paragraphNode'))
      .map(p => p.textContent.trim()).join(' ');
    const normalized = query.trim().toLowerCase();

    const filteredItems = normalized ?
      DEDUCTIONS
        .map(text => ({text, score: text.toLowerCase().indexOf(normalized)}))
        .filter(item => item.score !== -1)
        .sort((a, b) => a.score - b.score)
      : DEDUCTIONS.map(text => ({ text }));
  
    menu.innerHTML = '';
  
    filteredItems.forEach(item => {
      const menuItem = document.createElement("div");
      menuItem.className = "menu-item";
      menuItem.innerHTML = `<strong>${item.text.split('\n')[0].replaceAll('**', '')}</strong>`;
      menuItem.addEventListener("mousedown", () => simulatePaste(containerEl, item.text));
      menu.appendChild(menuItem);
    });
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.target instanceof Element && mutation.target.closest('.deduction-menu')) {
        return;
      }
      updateMenu();
    }    
  });

  observer.observe(containerEl, {
    childList: true, subtree: true, characterData: true
  });

  updateMenu();
}

// Process node (matches to TARGET)
//  - Set up deductions menu
//  - Add to processed set
function processNode(node) {
  if (!node.matches?.(TARGET) || processed.has(node)) return;
  setupDeductionsMenu(node);
  processed.add(node);
}

/* Initial setup */

// Observer for all changes to the DOM
const observer = new MutationObserver(mutations =>
  mutations.forEach(mutation =>
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        processNode(node);
        node.querySelectorAll?.(TARGET).forEach(processNode);
      }
    })
  )
);

// CSS styles
const style = document.createElement('style');
style.textContent = `
  .deduction-menu {
    margin-top: 8px;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    font-family: Arial, sans-serif;
    font-size: 14px;
    height: 150px;
    overflow-y: auto;
    width: 100%;
    cursor: default;
  }
  .menu-item {
    padding: 6px 10px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
    white-space: pre-wrap;
  }
  .menu-item:hover {
    background-color: #f0f0f0;
  }
  .menu-item:focus {
    outline: none;
    background-color: #e0e0e0;
  }
`;

// Getting deductions
chrome.storage.local.get({ customDeductions: [] }, (data) => {
  DEDUCTIONS = data.customDeductions || [];
  console.log(DEDUCTIONS);

  // Once loaded, process nodes and observe DOM
  document.querySelectorAll(TARGET).forEach(processNode);
  observer.observe(document.body, { childList: true, subtree: true });
});

document.head.appendChild(style);