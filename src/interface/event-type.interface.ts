export interface EventPayloads {
  "user.welcome": { name: string; email: string };
  "user.reset-password": { name: string; email: string; link: string };
  "user.verify-email": { name: string; email: string };
  "user.forgot-password": { name: string; email: string; lang: string };
  "user.registered": {
    userId: number;
    tenantId: number;
    tenantName: string;
    name: string;
    email: string;
  };
}
