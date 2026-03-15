(() => {
  const PROFILE_STORAGE_KEY = 'lazyApplyProfile';
  const defaultProfile = {
    fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '',
    currentCompany: '', currentTitle: '', school: '', degree: '', major: '', graduationYear: '',
    yearsOfExperience: '', summary: '', custom: {}
  };
  const profileFields = [
    { key: 'fullName', label: '姓名', placeholder: '张三', type: 'text' },
    { key: 'email', label: '邮箱', placeholder: 'name@example.com', type: 'text' },
    { key: 'phone', label: '电话', placeholder: '+86 13800000000', type: 'text' },
    { key: 'location', label: '所在地', placeholder: '上海', type: 'text' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/you', type: 'text' },
    { key: 'github', label: 'GitHub', placeholder: 'https://github.com/you', type: 'text' },
    { key: 'portfolio', label: '个人网站', placeholder: 'https://your.site', type: 'text' },
    { key: 'currentCompany', label: '当前公司', placeholder: '公司名称', type: 'text' },
    { key: 'currentTitle', label: '当前职位', placeholder: '软件工程师', type: 'text' },
    { key: 'school', label: '学校', placeholder: 'XX大学', type: 'text' },
    { key: 'degree', label: '学历', placeholder: '本科/硕士', type: 'text' },
    { key: 'major', label: '专业', placeholder: '计算机科学', type: 'text' },
    { key: 'graduationYear', label: '毕业年份', placeholder: '2024', type: 'text' },
    { key: 'yearsOfExperience', label: '工作年限', placeholder: '3', type: 'text' },
    { key: 'summary', label: '个人简介', placeholder: '请简要介绍自己', type: 'textarea' }
  ];
  const mergeProfile = (input) => ({ ...defaultProfile, ...(input || {}), custom: { ...(input?.custom || {}) } });

  const form = document.getElementById('profile-form');
  const customInput = document.getElementById('custom-input');
  const saveBtn = document.getElementById('save-profile');
  const scanBtn = document.getElementById('scan-btn');
  const fillBtn = document.getElementById('fill-btn');
  const clearBtn = document.getElementById('clear-btn');
  const statusEl = document.getElementById('status');
  const resultList = document.getElementById('result-list');

  const setStatus = (m) => (statusEl.textContent = m);

  function renderProfileForm(profile) {
    form.innerHTML = '';
    profileFields.forEach((field) => {
      const wrapper = document.createElement('div');
      wrapper.className = `field ${field.type === 'textarea' ? 'full' : ''}`;
      const label = document.createElement('label');
      label.textContent = field.label;
      label.setAttribute('for', field.key);
      const input = field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      input.id = field.key;
      input.dataset.key = field.key;
      input.placeholder = field.placeholder;
      input.value = profile[field.key] || '';
      wrapper.append(label, input);
      form.appendChild(wrapper);
    });
    customInput.value = Object.entries(profile.custom || {}).map(([k, v]) => `${k}=${v}`).join('\n');
  }

  function collectProfileFromForm() {
    const profile = structuredClone(defaultProfile);
    profileFields.forEach((field) => {
      const input = form.querySelector(`[data-key="${field.key}"]`);
      if (input) profile[field.key] = input.value.trim();
    });
    const custom = {};
    customInput.value.split('\n').map((s) => s.trim()).filter(Boolean).forEach((line) => {
      const idx = line.indexOf('=');
      if (idx > 0) custom[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    });
    profile.custom = custom;
    return profile;
  }

  async function getStoredProfile() {
    const result = await chrome.storage.local.get(PROFILE_STORAGE_KEY);
    return mergeProfile(result[PROFILE_STORAGE_KEY]);
  }
  async function saveProfile(profile) {
    await chrome.storage.local.set({ [PROFILE_STORAGE_KEY]: profile });
  }
  async function getActiveTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('未找到当前标签页');
    return tab.id;
  }
  async function sendToContent(message) {
    const tabId = await getActiveTabId();
    return chrome.tabs.sendMessage(tabId, message);
  }

  function renderMatches(matches) {
    resultList.innerHTML = '';
    if (!matches.length) {
      const li = document.createElement('li');
      li.textContent = '未识别到可填充字段';
      resultList.appendChild(li);
      return;
    }
    matches.forEach((m) => {
      const li = document.createElement('li');
      li.textContent = `${m.profileLabel}: ${m.previewValue} (score=${m.score})`;
      li.title = (m.reason || []).join(' | ');
      resultList.appendChild(li);
    });
  }

  async function handleRun(mode) {
    const profile = collectProfileFromForm();
    await saveProfile(profile);
    const response = await sendToContent({ type: 'SCAN_OR_FILL', mode, profile });
    if (!response.ok) return setStatus(`失败：${response.message || '未知错误'}`);
    renderMatches(response.matches || []);
    setStatus(response.message || (mode === 'preview' ? '已预览' : '已填充'));
  }

  saveBtn.addEventListener('click', async () => {
    await saveProfile(collectProfileFromForm());
    setStatus('资料已保存到本地。');
  });
  scanBtn.addEventListener('click', () => handleRun('preview').catch((e) => setStatus(`预览失败：${e.message}`)));
  fillBtn.addEventListener('click', () => handleRun('fill').catch((e) => setStatus(`填充失败：${e.message}`)));
  clearBtn.addEventListener('click', async () => {
    const r = await sendToContent({ type: 'CLEAR_PREVIEW' });
    if (r.ok) setStatus('高亮已清除。');
  });

  getStoredProfile().then((p) => {
    renderProfileForm(p);
    setStatus('资料已加载。请先预览，再确认填充。');
  }).catch((e) => setStatus(`初始化失败：${e.message}`));
})();
