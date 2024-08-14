let active = false;
let mode = 'none';
let changes = [];

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "toggle") {
    active = !active;
    if (active) {
      createFloatingBar();
    } else {
      removeFloatingBar();
    }
  }
});

function createFloatingBar() {
  const bar = document.createElement('div');
  bar.id = 'element-editor-bar';
  bar.innerHTML = `
    <div id="element-editor-icons">
      <span id="element-remover-icon" title="Remove Element">🗑️</span>
      <span id="element-editor-icon" title="Edit Element">✏️</span>
      <span id="element-undo-icon" title="Undo">↩️</span>
    </div>
    <span id="element-close-icon" title="Close">❌</span>
  `;
  document.body.appendChild(bar);

  document.getElementById('element-remover-icon').addEventListener('click', () => toggleMode('remove'));
  document.getElementById('element-editor-icon').addEventListener('click', () => toggleMode('edit'));
  document.getElementById('element-undo-icon').addEventListener('click', undo);
  document.getElementById('element-close-icon').addEventListener('click', removeFloatingBar);
}

function removeFloatingBar() {
  const bar = document.getElementById('element-editor-bar');
  if (bar) {
    bar.remove();
  }
  mode = 'none';
  active = false;
  document.body.style.cursor = 'default';
  document.removeEventListener('click', handleElementClick);
}

function toggleMode(newMode) {
  if (mode === newMode) {
    mode = 'none';
    document.body.style.cursor = 'default';
    document.removeEventListener('click', handleElementClick);
  } else {
    mode = newMode;
    document.body.style.cursor = 'crosshair';
    document.addEventListener('click', handleElementClick);
  }
  updateIconStyles();
}

function updateIconStyles() {
  const removerIcon = document.getElementById('element-remover-icon');
  const editorIcon = document.getElementById('element-editor-icon');
  removerIcon.style.backgroundColor = mode === 'remove' ? '#ff0000' : 'transparent';
  editorIcon.style.backgroundColor = mode === 'edit' ? '#00ff00' : 'transparent';
}

function handleElementClick(e) {
  if (!e.target.closest('#element-editor-bar')) {
    e.preventDefault();
    e.stopPropagation();
    if (mode === 'remove') {
      removeElement(e.target);
    } else if (mode === 'edit') {
      editElement(e.target);
    }
  }
}

function removeElement(element) {
  const parent = element.parentNode;
  const nextSibling = element.nextSibling;
  parent.removeChild(element);
  changes.push({ type: 'remove', element, parent, nextSibling });
  showNotification("Element removed");
}

function editElement(element) {
  if (element.tagName === 'IMG') {
    const originalSrc = element.src;
    const newSrc = prompt("Enter the URL of the new image:", originalSrc);
    if (newSrc && newSrc !== originalSrc) {
      element.src = newSrc;
      changes.push({ type: 'editImage', element, originalSrc });
      showNotification("Image updated");
    }
  } else {
    const originalContent = element.innerText;
    element.contentEditable = true;
    element.focus();
    
    function saveChanges() {
      element.contentEditable = false;
      if (element.innerText !== originalContent) {
        changes.push({ type: 'editText', element, originalContent });
        showNotification("Content updated");
      }
      element.removeEventListener('blur', saveChanges);
      element.removeEventListener('keydown', handleKeyDown);
    }
    
    function handleKeyDown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveChanges();
      }
    }
    
    element.addEventListener('blur', saveChanges);
    element.addEventListener('keydown', handleKeyDown);
  }
}

function undo() {
  if (changes.length === 0) return;
  
  const lastChange = changes.pop();
  switch (lastChange.type) {
    case 'remove':
      if (lastChange.nextSibling) {
        lastChange.parent.insertBefore(lastChange.element, lastChange.nextSibling);
      } else {
        lastChange.parent.appendChild(lastChange.element);
      }
      showNotification("Removal undone");
      break;
    case 'editImage':
      lastChange.element.src = lastChange.originalSrc;
      showNotification("Image edit undone");
      break;
    case 'editText':
      lastChange.element.innerText = lastChange.originalContent;
      showNotification("Text edit undone");
      break;
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.top = '60px';
  notification.style.right = '10px';
  notification.style.padding = '10px';
  notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  notification.style.color = 'white';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '10000';
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);
}
