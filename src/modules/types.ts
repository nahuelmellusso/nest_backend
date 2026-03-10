export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};

export type role = "GK" | "DF" | "MD" | "FW";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data: T;
  message?: string;
};
