const tabs = document.querySelectorAll('[role="tab"][data-tab]');
const panels = document.querySelectorAll('[data-panel]');
const mainStatus = document.querySelector('#main-status');
const startButton = document.querySelector('#start-button');
const startMenu = document.querySelector('#start-menu');
const resumeWindow = document.querySelector('#resume-window');
const resumeTask = document.querySelector('#resume-task');
const resumeDocument = document.querySelector('#resume-document');
const resumeStatus = document.querySelector('#resume-status');
const profileWindow = document.querySelector('#profile');
const profileTask = document.querySelector('#profile-task');
let resumeLoaded = false;

const selectTab = (name) => {
  tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.tab === name)));
  panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
  const statuses = { general: 'General profile', experience: 'Career Explorer - Experience', projects: 'Career Explorer - Projects', education: 'Education.txt' };
  mainStatus.textContent = statuses[name];
  closeStartMenu();
};

tabs.forEach((tab) => tab.querySelector('button').addEventListener('click', () => selectTab(tab.dataset.tab)));
document.querySelectorAll('[data-tab-target]').forEach((control) => control.addEventListener('click', () => selectTab(control.dataset.tabTarget)));

const showProfile = (tabName) => {
  profileWindow.classList.remove('profile-minimized', 'profile-closed');
  profileWindow.classList.add('profile-floating');
  profileTask.hidden = false;
  if (tabName) selectTab(tabName);
};
document.querySelectorAll('[data-open-profile]').forEach((control) => control.addEventListener('click', () => showProfile(control.dataset.openProfile)));
startMenu.querySelectorAll('[data-tab-target]').forEach((control) => control.addEventListener('click', () => showProfile(control.dataset.tabTarget)));
profileTask.addEventListener('click', () => {
  if (!profileWindow.classList.contains('profile-minimized') && !profileWindow.classList.contains('profile-closed')) {
    profileWindow.classList.add('profile-minimized');
  } else {
    showProfile();
  }
});
document.querySelector('#minimize-profile').addEventListener('click', () => profileWindow.classList.add('profile-minimized'));
document.querySelector('#close-profile').addEventListener('click', () => {
  profileWindow.classList.add('profile-closed');
  profileTask.hidden = true;
});
document.querySelector('#maximize-profile').addEventListener('click', () => {
  profileWindow.classList.toggle('profile-maximized');
  profileWindow.classList.add('profile-floating');
  profileWindow.style.left = '';
  profileWindow.style.top = '';
});

const profileTitleBar = document.querySelector('#profile-title-bar');
let profileDragState = null;
profileTitleBar.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button') || profileWindow.classList.contains('profile-maximized')) return;
  const rect = profileWindow.getBoundingClientRect();
  profileWindow.classList.add('profile-floating');
  profileDragState = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  profileWindow.style.left = `${rect.left}px`;
  profileWindow.style.top = `${rect.top}px`;
  profileTitleBar.setPointerCapture(event.pointerId);
});
profileTitleBar.addEventListener('pointermove', (event) => {
  if (!profileDragState) return;
  const maxLeft = window.innerWidth - profileWindow.offsetWidth;
  const maxTop = window.innerHeight - 80;
  profileWindow.style.left = `${Math.max(0, Math.min(maxLeft, event.clientX - profileDragState.x))}px`;
  profileWindow.style.top = `${Math.max(0, Math.min(maxTop, event.clientY - profileDragState.y))}px`;
});
profileTitleBar.addEventListener('pointerup', () => { profileDragState = null; });

const closeStartMenu = () => {
  startMenu.classList.remove('open');
  startMenu.setAttribute('aria-hidden', 'true');
  startButton.setAttribute('aria-expanded', 'false');
};

startButton.addEventListener('click', (event) => {
  event.stopPropagation();
  const open = !startMenu.classList.contains('open');
  startMenu.classList.toggle('open', open);
  startMenu.setAttribute('aria-hidden', String(!open));
  startButton.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', (event) => { if (!startMenu.contains(event.target) && event.target !== startButton) closeStartMenu(); });

const openProject = (id) => {
  selectTab('projects');
  const project = document.querySelector(`#${id}`);
  if (!(project instanceof HTMLDetailsElement)) return;
  project.open = true;
  project.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};
document.querySelectorAll('[data-open-project]').forEach((control) => control.addEventListener('click', () => openProject(control.dataset.openProject)));
document.querySelectorAll('[data-project]').forEach((row) => {
  row.addEventListener('click', () => {
    document.querySelectorAll('.project-table tr.highlighted').forEach((selected) => selected.classList.remove('highlighted'));
    row.classList.add('highlighted');
  });
  row.addEventListener('dblclick', () => openProject(row.dataset.project));
});

const loadResume = async () => {
  if (resumeLoaded) return;
  try {
    const response = await fetch('resume.md');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    marked.setOptions({ gfm: true, breaks: false });
    resumeDocument.innerHTML = marked.parse(markdown);
    resumeStatus.textContent = `${markdown.split(/\r?\n/).length} lines loaded`;
    resumeLoaded = true;
  } catch (error) {
    resumeDocument.innerHTML = '<h1>Unable to open Resume.md</h1><p>The Markdown file must be loaded through an HTTP server.</p>';
    resumeStatus.textContent = `Error: ${error.message}`;
  }
};

const showResume = () => {
  resumeWindow.hidden = false;
  resumeWindow.classList.remove('minimized');
  resumeTask.hidden = false;
  loadResume();
  resumeWindow.querySelector('.resume-document').focus();
};

document.querySelector('#open-resume').addEventListener('click', showResume);
resumeTask.addEventListener('click', showResume);
document.querySelector('#close-resume').addEventListener('click', () => {
  resumeWindow.hidden = true;
  resumeTask.hidden = true;
});
document.querySelector('#minimize-resume').addEventListener('click', () => resumeWindow.classList.add('minimized'));
document.querySelector('#maximize-resume').addEventListener('click', () => resumeWindow.classList.toggle('maximized'));
document.querySelector('#print-resume').addEventListener('click', () => window.print());

const resumeTitleBar = document.querySelector('#resume-title-bar');
let dragState = null;
resumeTitleBar.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button') || resumeWindow.classList.contains('maximized')) return;
  const rect = resumeWindow.getBoundingClientRect();
  dragState = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  resumeWindow.style.transform = 'none';
  resumeWindow.style.left = `${rect.left}px`;
  resumeWindow.style.top = `${rect.top}px`;
  resumeTitleBar.setPointerCapture(event.pointerId);
});
resumeTitleBar.addEventListener('pointermove', (event) => {
  if (!dragState) return;
  const maxLeft = window.innerWidth - resumeWindow.offsetWidth;
  const maxTop = window.innerHeight - 80;
  resumeWindow.style.left = `${Math.max(0, Math.min(maxLeft, event.clientX - dragState.x))}px`;
  resumeWindow.style.top = `${Math.max(0, Math.min(maxTop, event.clientY - dragState.y))}px`;
});
resumeTitleBar.addEventListener('pointerup', () => { dragState = null; });

const updateClock = () => {
  document.querySelector('#clock').textContent = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Hong_Kong', hour: 'numeric', minute: '2-digit' }).format(new Date());
};
window.setInterval(updateClock, 30000);
updateClock();
