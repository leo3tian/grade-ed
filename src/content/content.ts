/* 
content.ts is the script that handles the deductions window appearing in ed. Content listens
for new instances of the Ed feedback window (where TA's write comments), and upon finding them,
injects the HTML + CSS for the deduction window.
*/
import { marked } from 'marked';
import { Library } from '../popup/types';

// TARGET is how we identify Ed feedback windows
const TARGET = '.feedback-comment-input';
// Set containing all feedback windows already "handled" (ones with the deduction window already added)
let processed = new WeakSet<Element>();
let DEDUCTIONS = [];

// Utility method for forcing selection of existing text in deduction window
// Used by simulatePaste() so existing text disappears after paste
function selectText(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  console.log("Selected text:", selection.toString());
}

// Pastes markdown into ed container
function simulatePaste(containerEl, markdown) {
  if (!containerEl || !markdown) return;

  const paragraph = containerEl.querySelector('.am-view-paragraphNode');
  if (!paragraph || !paragraph.isContentEditable) {
    console.warn("Could not find editable paragraph");
    return;
  }

  // Focus to enable potential input
  paragraph.focus();

  // Let the browser settle focus before selecting
  requestAnimationFrame(() => {
    selectText(paragraph);

    // Super janky but waits a sec before pasting to allow the selection to register in the browser
    setTimeout(() => {
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", markdown);

      const pasteEvent = new ClipboardEvent("paste", {
        clipboardData,
        bubbles: true,
        cancelable: true
      });

      const result = paragraph.dispatchEvent(pasteEvent);
    }, 100);
  });
}

// Sets up deduction menu by:
// - Inserting HTML + CSS
// - Adding a listener for changes in the deduction menu, then updates the HTML 
//   accordingly (this is the search feature)
function setupDeductionsMenu(containerEl) {
  if (containerEl.querySelector('.deduction-menu')) return;

  const menu = document.createElement("div");
  menu.className = "deduction-menu";
  containerEl.firstElementChild.after(menu);

  const updateMenu = () => {
    const query = Array.from(containerEl.querySelectorAll('.am-view-paragraphNode'))
      .map(p => (p as Element).textContent.trim()).join(' ');
    const normalized = query.trim().toLowerCase();

    // Janky search functionality, currently just searches for direct matches to query
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

      const [header] = item.text.split('\n');
      menuItem.innerHTML = `<strong>${header.replaceAll('**', '')}</strong>`;

      // Preview on hover
      menuItem.addEventListener("mouseenter", () => {
        const paragraph = containerEl.querySelector('.am-view-paragraphNode');
        if (!paragraph || !paragraph.isContentEditable) return;

        showGhostPreview(paragraph as HTMLElement, item.text);
      });

      // Restore after hover
      menuItem.addEventListener("mouseleave", () => {
        removeGhostPreview();
      });

      // Paste on click
      menuItem.addEventListener("mousedown", () => {
        
        simulatePaste(containerEl, item.text);
        removeGhostPreview();
      });

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

function showGhostPreview(targetEl: HTMLElement, content: string) {
  // Remove any existing preview
  removeGhostPreview();

  const ghost = document.createElement('div');
  ghost.className = 'ghost-preview';

  // Parse as markdown
  ghost.innerHTML = marked.parse(content) as string; 

  // Match size/position of paragraphNode
  const padding: number = 5;
  const rect = targetEl.parentElement.getBoundingClientRect();
  ghost.style.position = 'absolute';
  ghost.style.top = `${rect.top + window.scrollY + padding}px`;
  ghost.style.left = `${rect.left + window.scrollX + padding}px`;
  ghost.style.width = `${rect.width - padding}px`;
  ghost.style.height = `${rect.height - padding}px`;
  ghost.style.overflow = 'hidden';

  document.body.appendChild(ghost);
}

function removeGhostPreview() {
  document.querySelectorAll('.ghost-preview').forEach(el => el.remove());
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

        // Ensure node is an Element
        if(!(node instanceof Element)) return;
        node.querySelectorAll?.(TARGET).forEach(processNode);
      }
    })
  )
);

// CSS styles to be injected
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
    position: relative;
    z-index: 1;
  }
  .menu-item {
    padding: 6px 10px;
    cursor: pointer;
    border-bottom: 1px solid #eee;

    position: relative;
    overflow: visible;
  }
  .menu-item:hover {
    background-color: #f0f0f0;
  }
  .menu-item:focus {
    outline: none;
    background-color: #e0e0e0;
  }
  .menu-item-text {
    position: relative;
    display: inline-block;
    width: 100%;
  }

.ghost-preview {
  pointer-events: none;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 14px;
  background: white;
  color: #444;
  border-radius: 0;
  z-index: 9999;
}

.ghost-preview {
  margin: 2px 0; /* tighten spacing between lines */
}

.ghost-preview {
  line-height: 1.4;
}

`;

// Getting deductions
chrome.storage.local.get({ libraries: {} }, (data) => {
  const libs = data.libraries || {};

  // Only take enabled libraries
  const libraries = Object.values(libs) as Library[];

  const enabledDeductions = libraries
    .filter(lib => lib.enabled)
    .flatMap(lib => lib.deductions);
  
  DEDUCTIONS = enabledDeductions;
  console.log("Loaded deductions:", DEDUCTIONS);

  document.querySelectorAll(TARGET).forEach(processNode);
  observer.observe(document.body, { childList: true, subtree: true });
});

function isEnabledLibrary(lib: unknown): lib is { enabled: boolean; deductions: string[] } {
  return (
    typeof lib === 'object' &&
    lib !== null &&
    'enabled' in lib &&
    typeof (lib as any).enabled === 'boolean' &&
    (lib as any).enabled
  );
}

// Listen for data changes to the Libraries and reload menus upon change
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.libraries) {
    const newLibraries = changes.libraries.newValue || {};

    const enabledDeductions = Object.values(newLibraries)
      .filter(lib => isEnabledLibrary(lib))
      .flatMap(lib => lib.deductions || []);

    DEDUCTIONS = enabledDeductions;
    console.log('🔄 Deductions updated from storage change:', DEDUCTIONS);

    // Close all open deduction menus
    document.querySelectorAll('.deduction-menu').forEach(menu => menu.remove());
    processed = new WeakSet;
    // Reopen
    document.querySelectorAll(TARGET).forEach(processNode);
  }
});

document.head.appendChild(style);