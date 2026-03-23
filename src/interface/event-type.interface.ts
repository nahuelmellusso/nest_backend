export interface EventPayloads {
  "user.registered": {
    userId: number;
    tenantId: number;
    tenantName: string;
    name: string;
    email: string;
  };
  "user.password-reset-requested": {
    userId: number;
    tenantId: number;
    name: string;
    email: string;
    lang: string;
  };
}
