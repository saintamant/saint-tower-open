export type OfficeType = 'main' | 'sub' | 'independent';

export interface Office {
  id: string;
  name: string;
  type: OfficeType;
  parentId?: string;
  color: string;
  githubOrg?: string;
  telegramGroupId?: string;
}
