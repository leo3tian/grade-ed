// Constants
const TARGET = '.feedback-comment-input';
const processed = new WeakSet();

// Deduction definitions
const DEDUCTIONS = [
  {
    markdown: `**Concepts: missing creative extension**\n\n> Once you've implemented the \`composeSong\` method, it's time to enhance your program with an additional feature! **Choose one** of the following creative options to expand your \`MusicBox\` class.\n\nMake sure to implement either the \`mostCommonNaturals\` or \`findChord\` extension!`
  },
  {
    markdown: `**Concepts: poor functional decomposition**\n\nNote that the spec requires \`composeSong\` to have 1 additional helper method.\n\n> You should use **functional decomposition** to break down \`composeSong\` into at least one additional helper method...\n\nThis is because \`composeSong\` does a lot of computation...`
  }
];

// Clipboard helper
async function copyToClipboard(markdown) {
  try {
    await navigator.clipboard.writeText(markdown);
    alert("Markdown comment copied!");
  } catch (err) {
    alert("Clipboard copy failed:\n\n" + markdown);
  }
}

// Filtering and rendering combined
function renderFilteredMenu(menu, query) {
  const normalized = query.trim().toLowerCase();

  const filteredItems = normalized ?
    DEDUCTIONS
      .map(item => ({...item, score: item.markdown.toLowerCase().indexOf(normalized)}))
      .filter(item => item.score !== -1)
      .sort((a, b) => a.score - b.score)
    : DEDUCTIONS;

  menu.innerHTML = '';

  filteredItems.forEach(item => {
    const menuItem = document.createElement("div");
    menuItem.className = "menu-item";
    menuItem.innerHTML = `<strong>${item.markdown.split('\n')[0]}</strong>`;
    menuItem.addEventListener("mousedown", () => copyToClipboard(item.markdown));
    menu.appendChild(menuItem);
  });
}

// Menu setup and observation combined
function setupDeductionsMenu(containerEl) {
  if (containerEl.querySelector('.deduction-menu')) return;

  const menu = document.createElement("div");
  menu.className = "deduction-menu";
  containerEl.firstElementChild.after(menu);

  const updateMenu = () => {
    const query = Array.from(containerEl.querySelectorAll('.am-view-paragraphNode'))
      .map(p => p.textContent.trim()).join(' ');
    renderFilteredMenu(menu, query);
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.target.closest('.deduction-menu')) return;
    }
    updateMenu();
  });

  observer.observe(containerEl, {
    childList: true, subtree: true, characterData: true
  });

  updateMenu();
}

// Process Node
function processNode(node) {
  if (!node.matches?.(TARGET) || processed.has(node)) return;
  setupDeductionsMenu(node);
  processed.add(node);
}

// Initial setup
new MutationObserver(mutations =>
  mutations.forEach(mutation =>
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        processNode(node);
        node.querySelectorAll?.(TARGET).forEach(processNode);
      }
    })
  )
).observe(document.body, { childList: true, subtree: true });

document.querySelectorAll(TARGET).forEach(processNode);

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
document.head.appendChild(style);