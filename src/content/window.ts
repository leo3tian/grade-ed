/* 
window.ts is the script that handles the deductions window appearing in ed. Content listens
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
let LIVE_PREVIEW_ENABLED = true;

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

      paragraph.dispatchEvent(pasteEvent);
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
    removeGhostPreview();
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

    if (filteredItems.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "menu-item no-results";
      noResults.textContent = "No deductions found";
      menu.appendChild(noResults);
    } else {
      filteredItems.forEach(item => {
        const menuItem = document.createElement("div");
        menuItem.className = "menu-item";

        const [header] = item.text.split('\n');
        menuItem.innerHTML = `<strong>${header.replaceAll('**', '')}</strong>`;

        // Preview on hover
        menuItem.addEventListener("mouseenter", () => {
          if(!LIVE_PREVIEW_ENABLED) return;
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
    }
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

// Renders a markdown preview that visually replaces the live paragraph node.
// The ghost is anchored to the paragraph's own rect (not its parent's) so the
// first character lines up with where the cursor would be, and it inherits the
// paragraph's typography so wrapping/line-height are identical.
function showGhostPreview(targetEl: HTMLElement, content: string) {
  removeGhostPreview();

  const container = targetEl.parentElement;
  if (!container) return;

  const ghost = document.createElement('div');
  ghost.className = 'am-theme-light ghost';
  ghost.innerHTML = marked.parse(content) as string;

  const targetRect = targetEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const targetStyle = window.getComputedStyle(targetEl);
  const containerStyle = window.getComputedStyle(container);
  const padBottom = parseFloat(containerStyle.paddingBottom) || 0;

  // Anchor to where the paragraph's text actually starts.
  ghost.style.top = `${targetRect.top + window.scrollY}px`;
  ghost.style.left = `${targetRect.left + window.scrollX}px`;
  ghost.style.width = `${targetRect.width}px`;
  // Allow the preview to grow downward, but never past the editor's bottom.
  ghost.style.maxHeight = `${Math.max(targetRect.height, containerRect.bottom - padBottom - targetRect.top)}px`;

  // Inherit typography so wrapping matches the live editor exactly.
  ghost.style.fontFamily = targetStyle.fontFamily;
  ghost.style.fontSize = targetStyle.fontSize;
  ghost.style.fontWeight = targetStyle.fontWeight;
  ghost.style.lineHeight = targetStyle.lineHeight;
  ghost.style.color = targetStyle.color;
  ghost.style.letterSpacing = targetStyle.letterSpacing;

  document.body.appendChild(ghost);

  const scrollContainer = targetEl.closest('.ffview-scroll');
  scrollContainer?.addEventListener('scroll', removeGhostPreview, { once: true });
}

function removeGhostPreview() {
  document.querySelectorAll('.ghost').forEach(el => el.remove());
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
    max-height: 150px;
    min-height: 30px;
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

/* Markdown hover preview — overlaid on top of the live paragraph node. */
.ghost {
  position: absolute;
  background: white;
  box-sizing: border-box;
  overflow: hidden;
  pointer-events: none;
  z-index: 999;
  border-radius: 2px;
  margin: 0;
  padding: 0;
  animation: ghost-fade 80ms ease-out;
}
@keyframes ghost-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
/* Reset block margins so marked's output starts at exactly the same y as
   the paragraph's first character. */
.ghost > *:first-child { margin-top: 0; }
.ghost > *:last-child  { margin-bottom: 0; }
.ghost p {
  margin: 0 0 0.5em;
}
.ghost h1, .ghost h2, .ghost h3, .ghost h4, .ghost h5, .ghost h6 {
  margin: 0.4em 0 0.25em;
  line-height: 1.25;
}
.ghost ul, .ghost ol {
  margin: 0.25em 0;
  padding-left: 1.5em;
}
.ghost li { margin: 0.1em 0; }
.ghost code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.92em;
}
.ghost pre {
  background: #f6f6f6;
  padding: 8px 10px;
  border-radius: 4px;
  margin: 0.4em 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.ghost pre code {
  background: none;
  padding: 0;
  font-size: 0.95em;
}
.ghost blockquote {
  margin: 0.4em 0;
  padding: 0 0 0 10px;
  border-left: 3px solid #ddd;
  color: #555;
}
.ghost a {
  color: #562C87;
  text-decoration: underline;
}

.menu-item.no-results {
  font-style: italic;
  color: #888;
  cursor: default;
  pointer-events: none;
}

`;

// Getting deductions
chrome.storage.local.get(['libraries', 'livePreview'], (data) => {
  const libs = data.libraries || {};
  LIVE_PREVIEW_ENABLED = data.livePreview !== false; // default true

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
  if (areaName === 'local') {
    let shouldReload = false;

    if ('livePreview' in changes) {
      LIVE_PREVIEW_ENABLED = Boolean(changes.livePreview.newValue);
      //console.log('Live preview setting changed:', LIVE_PREVIEW_ENABLED); // debug
      shouldReload = true;
    }

    if ('libraries' in changes) {
      const newLibraries = changes.libraries.newValue || {};
      const enabledDeductions = Object.values(newLibraries)
        .filter(lib => isEnabledLibrary(lib))
        .flatMap(lib => lib.deductions || []);
      DEDUCTIONS = enabledDeductions;
      //console.log('Deductions updated from storage change:', DEDUCTIONS); // debug
      shouldReload = true;
    }

    if (shouldReload) {
      document.querySelectorAll('.deduction-menu').forEach(menu => menu.remove());
      processed = new WeakSet();
      document.querySelectorAll(TARGET).forEach(processNode);
    }
  }
});


document.head.appendChild(style);