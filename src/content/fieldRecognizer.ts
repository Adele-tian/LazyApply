import { CandidateMatch, ProfileFieldMeta, UserProfile } from '../shared/types';
import { getProfileValue, profileFields } from '../shared/profileSchema';

const keywordMap: Record<string, string[]> = {
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

function normalize(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function getNearbyText(element: Element): string {
  const parent = element.parentElement;
  if (!parent) return '';
  const siblingText = [
    parent.previousElementSibling?.textContent,
    parent.textContent,
    element.previousElementSibling?.textContent,
    element.nextElementSibling?.textContent
  ]
    .filter(Boolean)
    .join(' ');
  return normalize(siblingText);
}

function getLabelText(field: HTMLElement): string {
  const id = field.getAttribute('id');
  if (!id) return '';
  const explicit = document.querySelector(`label[for="${CSS.escape(id)}"]`);
  return normalize(explicit?.textContent);
}

function buildFieldFingerprint(element: HTMLElement): string[] {
  const attrs = [
    element.getAttribute('placeholder'),
    element.getAttribute('name'),
    element.getAttribute('id'),
    element.getAttribute('aria-label'),
    getLabelText(element),
    getNearbyText(element)
  ];

  return attrs.map(normalize).filter((v) => v.length > 0);
}

function computeMatch(
  field: HTMLElement,
  profileField: ProfileFieldMeta,
  profile: UserProfile
): CandidateMatch | null {
  const value = getProfileValue(profile, profileField.key);
  if (!value.trim()) return null;

  const fingerprints = buildFieldFingerprint(field);
  if (!fingerprints.length) return null;

  const keywords = keywordMap[profileField.key as string] ?? [];
  const reasons: string[] = [];
  let score = 0;

  fingerprints.forEach((fp) => {
    keywords.forEach((kw) => {
      if (fp.includes(kw)) {
        score += fp === kw ? 3 : 1;
        reasons.push(`命中关键字 "${kw}" in "${fp.slice(0, 40)}"`);
      }
    });
  });

  if (score <= 0) return null;

  return {
    elementId: ensureElementId(field),
    score,
    profileKey: profileField.key,
    profileLabel: profileField.label,
    reason: Array.from(new Set(reasons)).slice(0, 3),
    previewValue: value
  };
}

function ensureElementId(element: HTMLElement): string {
  if (!element.dataset.lazyApplyId) {
    element.dataset.lazyApplyId = `lazy-apply-${crypto.randomUUID()}`;
  }
  return element.dataset.lazyApplyId;
}

export function findCandidateMatches(profile: UserProfile): CandidateMatch[] {
  const fields = Array.from(
    document.querySelectorAll<HTMLElement>('input:not([type="hidden"]), textarea, select')
  ).filter((el) => !el.hasAttribute('disabled') && !el.hasAttribute('readonly'));

  const allMatches: CandidateMatch[] = [];

  fields.forEach((field) => {
    const perField = profileFields
      .map((meta) => computeMatch(field, meta, profile))
      .filter((match): match is CandidateMatch => Boolean(match))
      .sort((a, b) => b.score - a.score);

    if (perField.length > 0) {
      allMatches.push(perField[0]);
    }
  });

  const uniqueByElement = new Map<string, CandidateMatch>();
  allMatches.forEach((match) => {
    const existing = uniqueByElement.get(match.elementId);
    if (!existing || existing.score < match.score) {
      uniqueByElement.set(match.elementId, match);
    }
  });

  return [...uniqueByElement.values()].sort((a, b) => b.score - a.score);
}
