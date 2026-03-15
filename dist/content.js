(() => {
  const profileFields = [
    { key: 'fullName', label: '姓名' },
    { key: 'email', label: '邮箱' },
    { key: 'phone', label: '电话' },
    { key: 'location', label: '所在地' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'github', label: 'GitHub' },
    { key: 'portfolio', label: '个人网站' },
    { key: 'currentCompany', label: '当前公司' },
    { key: 'currentTitle', label: '当前职位' },
    { key: 'school', label: '学校' },
    { key: 'degree', label: '学历' },
    { key: 'major', label: '专业' },
    { key: 'graduationYear', label: '毕业年份' },
    { key: 'yearsOfExperience', label: '工作年限' },
    { key: 'summary', label: '个人简介' }
  ];

  const keywordMap = {
    fullName: ['name', 'full name', '姓名', '名字', 'legal name'],
    email: ['email', 'e-mail', '邮箱', 'mail'],
    phone: ['phone', 'mobile', 'tel', '电话', '手机号'],
    location: ['location', 'city', 'address', '所在地', '地址', '居住地'],
    linkedin: ['linkedin', '领英'],
    github: ['github'],
    portfolio: ['portfolio', 'personal website', 'website', 'homepage', '个人网站'],
    currentCompany: ['company', 'current company', 'employer', '公司', '目前公司'],
    currentTitle: ['title', 'job title', 'position', '职位', '岗位'],
    school: ['school', 'university', 'college', '学校', '大学'],
    degree: ['degree', 'education level', '学历', '学位'],
    major: ['major', 'specialization', '专业'],
    graduationYear: ['graduation year', 'grad year', '毕业年份', '毕业时间'],
    yearsOfExperience: ['years of experience', 'experience', '工作年限', '经验年限'],
    summary: ['summary', 'about me', 'cover letter', 'self introduction', '自我介绍', '简介']
  };

  const STYLE_ID = 'lazy-apply-preview-style';
  const HIGHLIGHT_CLASS = 'lazy-apply-highlight';

  function normalize(value) { return (value || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function getProfileValue(profile, key) { return key.startsWith('custom.') ? (profile.custom?.[key.slice(7)] || '') : (profile[key] || ''); }
  function getNearbyText(element) {
    const parent = element.parentElement;
    if (!parent) return '';
    return normalize([
      parent.previousElementSibling?.textContent,
      parent.textContent,
      element.previousElementSibling?.textContent,
      element.nextElementSibling?.textContent
    ].filter(Boolean).join(' '));
  }
  function getLabelText(field) {
    const id = field.getAttribute('id');
    if (!id) return '';
    const explicit = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    return normalize(explicit?.textContent);
  }
  function ensureElementId(element) {
    if (!element.dataset.lazyApplyId) element.dataset.lazyApplyId = `lazy-apply-${crypto.randomUUID()}`;
    return element.dataset.lazyApplyId;
  }
  function buildFieldFingerprint(element) {
    return [
      element.getAttribute('placeholder'),
      element.getAttribute('name'),
      element.getAttribute('id'),
      element.getAttribute('aria-label'),
      getLabelText(element),
      getNearbyText(element)
    ].map(normalize).filter(Boolean);
  }

  function findCandidateMatches(profile) {
    const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select')).filter((el) => !el.disabled && !el.readOnly);
    const allMatches = [];

    fields.forEach((field) => {
      const fingerprints = buildFieldFingerprint(field);
      if (!fingerprints.length) return;
      let best = null;

      for (const meta of profileFields) {
        const value = getProfileValue(profile, meta.key);
        if (!String(value).trim()) continue;
        const keywords = keywordMap[meta.key] || [];
        let score = 0;
        const reason = [];
        for (const fp of fingerprints) {
          for (const kw of keywords) {
            if (fp.includes(kw)) {
              score += fp === kw ? 3 : 1;
              reason.push(`命中关键字 "${kw}"`);
            }
          }
        }
        if (score > 0 && (!best || score > best.score)) {
          best = {
            elementId: ensureElementId(field),
            score,
            profileKey: meta.key,
            profileLabel: meta.label,
            reason: [...new Set(reason)].slice(0, 3),
            previewValue: value
          };
        }
      }
      if (best) allMatches.push(best);
    });

    return allMatches.sort((a, b) => b.score - a.score);
  }

  function ensurePreviewStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `.${HIGHLIGHT_CLASS}{outline:2px solid #4f46e5 !important;background:rgba(79,70,229,.07)!important;}`;
    document.documentElement.appendChild(style);
  }
  function clearPreview() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS);
      el.removeAttribute('data-lazy-apply-hint');
    });
  }
  function applyPreview(matches) {
    ensurePreviewStyle();
    clearPreview();
    matches.forEach((m) => {
      const el = document.querySelector(`[data-lazy-apply-id="${m.elementId}"]`);
      if (!el) return;
      el.classList.add(HIGHLIGHT_CLASS);
      el.title = `${m.profileLabel} ← ${m.previewValue}`;
    });
  }
  function triggerEvents(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }
  function setNativeValue(element, value) {
    const descriptor = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value');
    descriptor?.set?.call(element, value);
  }
  function fillMatches(matches, profile) {
    let filled = 0;
    matches.forEach((m) => {
      const el = document.querySelector(`[data-lazy-apply-id="${m.elementId}"]`);
      if (!el) return;
      const value = getProfileValue(profile, m.profileKey);
      if (!String(value).trim()) return;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        setNativeValue(el, value); triggerEvents(el); filled += 1; return;
      }
      if (el instanceof HTMLSelectElement) {
        const option = Array.from(el.options).find((opt) => opt.text.toLowerCase().includes(String(value).toLowerCase()) || opt.value === value);
        if (option) { el.value = option.value; triggerEvents(el); filled += 1; }
      }
    });
    return filled;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'CLEAR_PREVIEW') {
      clearPreview();
      sendResponse({ ok: true, matches: [], filledCount: 0 });
      return;
    }
    if (message.type !== 'SCAN_OR_FILL') {
      sendResponse({ ok: false, matches: [], filledCount: 0, message: 'Unknown message type' });
      return;
    }
    const matches = findCandidateMatches(message.profile);
    applyPreview(matches);
    const filledCount = message.mode === 'fill' ? fillMatches(matches, message.profile) : 0;
    sendResponse({ ok: true, mode: message.mode, matches, filledCount, message: message.mode === 'fill' ? `已填充 ${filledCount} 个字段。` : `预览 ${matches.length} 个候选字段。` });
  });
})();
