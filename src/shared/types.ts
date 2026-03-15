export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  currentCompany: string;
  currentTitle: string;
  school: string;
  degree: string;
  major: string;
  graduationYear: string;
  yearsOfExperience: string;
  summary: string;
  custom: Record<string, string>;
}

export const PROFILE_STORAGE_KEY = 'lazyApplyProfile';

export interface ProfileFieldMeta {
  key: keyof UserProfile | `custom.${string}`;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea';
}

export interface CandidateMatch {
  elementId: string;
  score: number;
  profileKey: ProfileFieldMeta['key'];
  profileLabel: string;
  reason: string[];
  previewValue: string;
}

export type FillMode = 'preview' | 'fill';

export interface ScanRequestMessage {
  type: 'SCAN_OR_FILL';
  mode: FillMode;
  profile: UserProfile;
}

export interface ClearPreviewMessage {
  type: 'CLEAR_PREVIEW';
}

export type ContentRequestMessage = ScanRequestMessage | ClearPreviewMessage;

export interface ContentResponse {
  ok: boolean;
  mode?: FillMode;
  matches: CandidateMatch[];
  filledCount: number;
  message?: string;
}
