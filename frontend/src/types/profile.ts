export interface Experience {
  _id: string;
  title: string;
  company: string;
  from: string;
  to?: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role: 'user' | 'admin';
  skills: string[];
  experiences: Experience[];
  createdAt: string;
  updatedAt: string;
}
