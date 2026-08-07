const screenCases = [...document.querySelectorAll('.screen-case')];

function showScreen(id, { updateHash = true } = {}) {
  const target = document.getElementById(id);
  if (!target || !target.classList.contains('screen-case')) return;
  screenCases.forEach((screen) => screen.classList.toggle('active', screen === target));
  const scrollArea = target.querySelector('.scroll-area');
  if (scrollArea) scrollArea.scrollTop = 0;
  if (updateHash) window.history.replaceState(null, '', `#${id}`);
}

document.querySelectorAll('[data-scroll]').forEach((button) => {
  button.addEventListener('click', () => showScreen(button.dataset.scroll));
});

const initialScreen = window.location.hash.slice(1);
if (initialScreen) showScreen(initialScreen, { updateHash: false });
window.addEventListener('hashchange', () => showScreen(window.location.hash.slice(1), { updateHash: false }));

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => button.classList.toggle('active'));
});

const propertyCards = [...document.querySelectorAll('.property-card')];
const propertyCount = document.getElementById('property-count');
const emptyState = document.getElementById('library-empty');
const loadingState = document.getElementById('library-loading');

function showProperties(filter = '全部') {
  emptyState.hidden = true;
  let count = 0;
  propertyCards.forEach((card) => {
    const matches = filter === '全部' || (filter === '已核验' && card.dataset.propertyStatus === 'verified') || (filter === '待确认' && card.dataset.propertyStatus === 'pending');
    card.hidden = !matches;
    if (matches) count += 1;
  });
  propertyCount.textContent = count;
}

document.querySelectorAll('[data-filter-group] button').forEach((button) => {
  button.addEventListener('click', () => {
    button.parentElement.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    showProperties(button.textContent.trim());
  });
});

document.querySelector('.sort-button').addEventListener('click', () => {
  loadingState.hidden = false;
  window.setTimeout(() => { loadingState.hidden = true; }, 1200);
});

document.getElementById('restore-properties').addEventListener('click', () => {
  document.querySelectorAll('[data-filter-group] button').forEach((item, index) => item.classList.toggle('active', index === 0));
  showProperties('全部');
});

document.querySelectorAll('[data-select]').forEach((button) => {
  button.addEventListener('click', () => {
    const selected = button.classList.toggle('selected');
    button.textContent = selected ? '已加入' : '加入对比';
  });
});

const taskInputs = [...document.querySelectorAll('.task input')];
const doneCount = document.getElementById('done-count');
const taskProgress = document.getElementById('task-progress');
const undoToast = document.getElementById('undo-toast');
const undoTask = document.getElementById('undo-task');
let lastChanged = null;
let toastTimer = null;

function updateTaskProgress() {
  const done = taskInputs.filter((input) => input.checked).length;
  doneCount.textContent = done;
  taskProgress.style.width = `${Math.round(done / taskInputs.length * 100)}%`;
}

taskInputs.forEach((input) => {
  input.closest('.task').addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    event.preventDefault();
    input.checked = !input.checked;
    input.closest('.task').classList.toggle('checked', input.checked);
    lastChanged = input;
    updateTaskProgress();
    undoToast.hidden = false;
    undoToast.querySelector('span').textContent = input.checked ? '已完成一项核查' : '已恢复为未完成';
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { undoToast.hidden = true; }, 3200);
  });
});

undoTask.addEventListener('click', () => {
  if (!lastChanged) return;
  lastChanged.checked = !lastChanged.checked;
  lastChanged.closest('.task').classList.toggle('checked', lastChanged.checked);
  updateTaskProgress();
  undoToast.hidden = true;
});

const noteSheet = document.getElementById('note-sheet');
const noteForm = document.getElementById('note-form');
const noteInput = document.getElementById('note-input');
const noteTitle = document.getElementById('note-title');
const saveToast = document.getElementById('save-toast');
document.querySelectorAll('[data-note]').forEach((button) => {
  button.addEventListener('click', () => {
    noteTitle.textContent = button.dataset.note;
    noteSheet.hidden = false;
    window.setTimeout(() => noteInput.focus(), 0);
  });
});
document.querySelector('[data-close-note]').addEventListener('click', () => { noteSheet.hidden = true; });
noteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  noteSheet.hidden = true;
  saveToast.hidden = false;
  window.setTimeout(() => { saveToast.hidden = true; }, 3200);
});
document.querySelector('[data-edit-note]').addEventListener('click', () => { saveToast.hidden = true; noteSheet.hidden = false; });

const addPropertySheet = document.getElementById('add-property-sheet');
const addPropertyForm = document.getElementById('add-property-form');
const budgetField = document.getElementById('budget-field');
const budgetInput = document.getElementById('budget-input');
const budgetError = document.getElementById('budget-error');
document.getElementById('open-add-property').addEventListener('click', () => { addPropertySheet.hidden = false; });
document.querySelector('[data-close-sheet]').addEventListener('click', () => { addPropertySheet.hidden = true; });
addPropertyForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const valid = Number(budgetInput.value) > 0;
  budgetField.classList.toggle('invalid', !valid);
  budgetError.hidden = valid;
});

const dataModal = document.getElementById('data-modal');
document.getElementById('open-data-modal').addEventListener('click', () => { dataModal.hidden = false; });
document.getElementById('close-data-modal').addEventListener('click', () => { dataModal.hidden = true; });

window.RentEyeDemo = {
  showScreen,
  showEmpty() {
    propertyCards.forEach((card) => { card.hidden = true; });
    propertyCount.textContent = '0';
    emptyState.hidden = false;
  },
  showLoading() { loadingState.hidden = false; },
  hideLoading() { loadingState.hidden = true; }
};
