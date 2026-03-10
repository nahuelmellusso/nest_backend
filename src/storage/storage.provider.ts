export type StoredFile = {
  key: string;
  url?: string;
  bucket?: string;
};

export interface StorageProvider {
  upload(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    folder?: string;
  }): Promise<StoredFile>;

  delete?(key: string): Promise<void>;
}
