import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import * as path from "path";
import { StorageProvider, StoredFile } from "./storage.provider";

@Injectable()
export class LocalStorage implements StorageProvider {
  private baseDir = path.join(process.cwd(), "uploads");

  async upload({ buffer, mimeType, originalName, folder }: any): Promise<StoredFile> {
    const ext = path.extname(originalName) || "";
    const fileName = `${randomUUID()}${ext}`;
    const relDir = folder ? path.join(folder) : "";
    const relKey = path.join(relDir, fileName).replaceAll("\\", "/");

    const absDir = path.join(this.baseDir, relDir);
    await fs.mkdir(absDir, { recursive: true });

    const absPath = path.join(absDir, fileName);
    await fs.writeFile(absPath, buffer);

    return { key: relKey, url: `/uploads/${relKey}` };
  }

  async delete(key: string) {
    const absPath = path.join(this.baseDir, key);
    await fs.unlink(absPath).catch(() => undefined);
  }
}
