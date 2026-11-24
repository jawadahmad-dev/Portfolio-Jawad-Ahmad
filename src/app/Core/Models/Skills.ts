export interface SkillsModel {
  id?: string;
  iconLink: string;
  title: string;
  description: string;
  category?: 'Frontend' | 'Backend' | 'Database' | 'Tools' | string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  years?: number;
}
