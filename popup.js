const input = document.getElementById('deductionInput');
const list = document.getElementById('deductionList');
const addBtn = document.getElementById('addButton');

function renderDeductions(deductions) {
    console.log(deductions);
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
