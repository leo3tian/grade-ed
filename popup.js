const input = document.getElementById('deductionInput');
const list = document.getElementById('deductionList');
const addBtn = document.getElementById('addButton');

function renderDeductions(deductions) {
  list.innerHTML = '';
  deductions.forEach((markdown, index) => {
    const li = document.createElement('li');
    li.textContent = markdown.split('\n')[0]; // show first line
    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.className = 'remove-btn';
    remove.addEventListener('click', () => {
      deductions.splice(index, 1);
      chrome.storage.local.set({ customDeductions: deductions });
      renderDeductions(deductions);
    });
    li.appendChild(remove);
    list.appendChild(li);
  });
}

addBtn.addEventListener('click', () => {
  const newText = input.value.trim();
  if (!newText) return;

  chrome.storage.local.get({ customDeductions: [] }, (data) => {
    const updated = [...data.customDeductions, newText];
    chrome.storage.local.set({ customDeductions: updated }, () => {
      input.value = '';
      renderDeductions(updated);
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get({ customDeductions: [] }, (data) => {
    renderDeductions(data.customDeductions);
  });
});

// Export button logic
function exportDeductions() {
  chrome.storage.local.get({ customDeductions: [] }, (data) => {
    const blob = new Blob([JSON.stringify(data.customDeductions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'deductions.json';
    a.click();

    URL.revokeObjectURL(url);
  });
}

// Import button logic
function importDeductions(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (Array.isArray(imported)) {
        chrome.storage.local.set({ customDeductions: imported }, () => {
          renderDeductions(imported);
        });
      } else {
        alert("Invalid format. Expected an array of markdown strings.");
      }
    } catch (e) {
      alert("Failed to parse JSON file.");
    }
  };
  reader.readAsText(file);
}

// In popup.js, add listeners:
document.getElementById('exportBtn').addEventListener('click', exportDeductions);
document.getElementById('importInput').addEventListener('change', importDeductions);
