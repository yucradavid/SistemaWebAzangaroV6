export type UserRole =
  | 'admin'
  | 'director'
  | 'coordinator'
  | 'secretary'
  | 'teacher'
  | 'student'
  | 'apoderado'
  | 'guardian'
  | 'cashier'
  | 'administrative'
  | 'finance'
  | 'web_editor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
