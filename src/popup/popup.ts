import { defaultProfile, mergeProfile, profileFields } from '../shared/profileSchema';
import {
  CandidateMatch,
  ContentRequestMessage,
  ContentResponse,
  PROFILE_STORAGE_KEY,
  UserProfile
} from '../shared/types';

const form = document.getElementById('profile-form') as HTMLFormElement;
const customInput = document.getElementById('custom-input') as HTMLTextAreaElement;
const saveBtn = document.getElementById('save-profile') as HTMLButtonElement;
const scanBtn = document.getElementById('scan-btn') as HTMLButtonElement;
const fillBtn = document.getElementById('fill-btn') as HTMLButtonElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLParagraphElement;
const resultList = document.getElementById('result-list') as HTMLUListElement;

function setStatus(message: string): void {
  statusEl.textContent = message;
}

function renderProfileForm(profile: UserProfile): void {
  form.innerHTML = '';
  profileFields.forEach((field) => {
    const wrapper = document.createElement('div');
    wrapper.className = `field ${field.type === 'textarea' ? 'full' : ''}`;

    const label = document.createElement('label');
    label.textContent = field.label;
    label.setAttribute('for', field.key);

    const input = field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    input.id = field.key;
    input.setAttribute('data-key', field.key);
    input.placeholder = field.placeholder;
    input.value = profile[field.key as keyof UserProfile] as string;

    wrapper.append(label, input);
    form.appendChild(wrapper);
  });

  customInput.value = Object.entries(profile.custom)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

function collectProfileFromForm(): UserProfile {
  const profile = structuredClone(defaultProfile);

  profileFields.forEach((field) => {
    const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-key="${field.key}"]`);
    if (!input) return;
    profile[field.key as keyof UserProfile] = input.value.trim() as never;
  });

  const custom: Record<string, string> = {};
  customInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const idx = line.indexOf('=');
      if (idx <= 0) return;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key && value) custom[key] = value;
    });

  profile.custom = custom;
  return profile;
}

async function getStoredProfile(): Promise<UserProfile> {
  const result = await chrome.storage.local.get(PROFILE_STORAGE_KEY);
  return mergeProfile(result[PROFILE_STORAGE_KEY] as UserProfile | undefined);
}

async function saveProfile(profile: UserProfile): Promise<void> {
  await chrome.storage.local.set({ [PROFILE_STORAGE_KEY]: profile });
}

async function getActiveTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('未找到当前标签页');
  }
  return tab.id;
}

async function sendToContent(message: ContentRequestMessage): Promise<ContentResponse> {
  const tabId = await getActiveTabId();
  return chrome.tabs.sendMessage(tabId, message) as Promise<ContentResponse>;
}

function renderMatches(matches: CandidateMatch[]): void {
  resultList.innerHTML = '';
  if (matches.length === 0) {
    const li = document.createElement('li');
    li.textContent = '未识别到可填充字段';
    resultList.appendChild(li);
    return;
  }

  matches.forEach((match) => {
    const li = document.createElement('li');
    li.textContent = `${match.profileLabel}: ${match.previewValue} (score=${match.score})`;
    li.title = match.reason.join(' | ');
    resultList.appendChild(li);
  });
}

async function handleRun(mode: 'preview' | 'fill'): Promise<void> {
  const profile = collectProfileFromForm();
  await saveProfile(profile);

  const response = await sendToContent({
    type: 'SCAN_OR_FILL',
    mode,
    profile
  });

  if (!response.ok) {
    setStatus(`失败：${response.message ?? '未知错误'}`);
    return;
  }

  renderMatches(response.matches);
  setStatus(response.message ?? (mode === 'preview' ? '已预览' : '已填充'));
}

async function init(): Promise<void> {
  const profile = await getStoredProfile();
  renderProfileForm(profile);
  setStatus('资料已加载。请先预览，再确认填充。');
}

saveBtn.addEventListener('click', async () => {
  const profile = collectProfileFromForm();
  await saveProfile(profile);
  setStatus('资料已保存到本地。');
});

scanBtn.addEventListener('click', () => {
  handleRun('preview').catch((error: Error) => setStatus(`预览失败：${error.message}`));
});

fillBtn.addEventListener('click', () => {
  handleRun('fill').catch((error: Error) => setStatus(`填充失败：${error.message}`));
});

clearBtn.addEventListener('click', async () => {
  const response = await sendToContent({ type: 'CLEAR_PREVIEW' });
  if (response.ok) {
    setStatus('高亮已清除。');
  }
});

init().catch((error: Error) => setStatus(`初始化失败：${error.message}`));
