import { ProfileFieldMeta, UserProfile } from './types';

export const defaultProfile: UserProfile = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  currentCompany: '',
  currentTitle: '',
  school: '',
  degree: '',
  major: '',
  graduationYear: '',
  yearsOfExperience: '',
  summary: '',
  custom: {}
};

export const profileFields: ProfileFieldMeta[] = [
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

export function mergeProfile(input: Partial<UserProfile> | null | undefined): UserProfile {
  return {
    ...defaultProfile,
    ...(input ?? {}),
    custom: {
      ...defaultProfile.custom,
      ...(input?.custom ?? {})
    }
  };
}

export function getProfileValue(profile: UserProfile, key: ProfileFieldMeta['key']): string {
  if (key.startsWith('custom.')) {
    const name = key.slice('custom.'.length);
    return profile.custom[name] ?? '';
  }
  return profile[key as Exclude<keyof UserProfile, 'custom'>] ?? '';
}
