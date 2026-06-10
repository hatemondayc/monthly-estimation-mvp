// 데이터 접근 계층 (PRD §12 "Repository/Service 구조 분리", §14 Step 4).
// MVP는 로컬 JSON 파일 저장. 동일 인터페이스로 추후 Prisma/Supabase 교체 가능.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { buildSeed, type Store } from "@/lib/seed";
import type { EstimateLine, EstimateVersion } from "@/types/estimate";

/** 저장소 계약 — 구현체(파일/DB)를 갈아끼울 수 있게 분리. */
export interface EstimateRepository {
  listVersions(): Promise<EstimateVersion[]>;
  getVersion(id: string): Promise<EstimateVersion | null>;
  createVersion(
    data: Omit<EstimateVersion, "id" | "createdAt" | "updatedAt">,
  ): Promise<EstimateVersion>;
  updateVersion(
    id: string,
    patch: Partial<EstimateVersion>,
  ): Promise<EstimateVersion | null>;
  deleteVersion(id: string): Promise<boolean>;

  listLines(versionId?: string): Promise<EstimateLine[]>;
  createLine(
    data: Omit<EstimateLine, "id" | "createdAt" | "updatedAt">,
  ): Promise<EstimateLine>;
  updateLine(
    id: string,
    patch: Partial<EstimateLine>,
  ): Promise<EstimateLine | null>;
  deleteLine(id: string): Promise<boolean>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "estimates.local.json");

function nowIso(): string {
  return new Date().toISOString();
}

/** JSON 파일 기반 저장소 구현. */
class FileRepository implements EstimateRepository {
  // Fix 4: 쓰기 직렬화 큐 — 동시 요청이 같은 파일을 read-modify-write 할 때
  // 중간 상태를 덮어쓰지 않도록 한 번에 하나의 쓰기 작업만 실행한다.
  private writeQueue: Promise<void> = Promise.resolve();

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.writeQueue.then(task, task);
    // writeQueue는 에러를 삼키지 않도록 항상 void 체인으로 유지한다.
    this.writeQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  private async read(): Promise<Store> {
    try {
      const raw = await fs.readFile(DATA_FILE, "utf-8");
      // Fix 3: JSON.parse가 SyntaxError를 던지면 파일이 깨진 것이므로 시드로 복구한다.
      let parsed: Store;
      try {
        parsed = JSON.parse(raw) as Store;
      } catch {
        const seed = buildSeed();
        await this.write(seed);
        return seed;
      }
      return {
        versions: parsed.versions ?? [],
        lines: parsed.lines ?? [],
      };
    } catch (err: unknown) {
      // 파일이 없으면 익명 시드로 초기화한다.
      if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
        const seed = buildSeed();
        await this.write(seed);
        return seed;
      }
      throw err;
    }
  }

  private async write(store: Store): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  }

  async listVersions(): Promise<EstimateVersion[]> {
    const store = await this.read();
    return store.versions;
  }

  async getVersion(id: string): Promise<EstimateVersion | null> {
    const store = await this.read();
    return store.versions.find((v) => v.id === id) ?? null;
  }

  async createVersion(
    data: Omit<EstimateVersion, "id" | "createdAt" | "updatedAt">,
  ): Promise<EstimateVersion> {
    return this.enqueue(async () => {
      const store = await this.read();
      const version: EstimateVersion = {
        ...data,
        id: randomUUID(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      store.versions.push(version);
      await this.write(store);
      return version;
    });
  }

  async updateVersion(
    id: string,
    patch: Partial<EstimateVersion>,
  ): Promise<EstimateVersion | null> {
    return this.enqueue(async () => {
      const store = await this.read();
      const idx = store.versions.findIndex((v) => v.id === id);
      if (idx === -1) return null;
      const updated: EstimateVersion = {
        ...store.versions[idx],
        ...patch,
        id: store.versions[idx].id,
        updatedAt: nowIso(),
      };
      store.versions[idx] = updated;
      await this.write(store);
      return updated;
    });
  }

  async deleteVersion(id: string): Promise<boolean> {
    return this.enqueue(async () => {
      const store = await this.read();
      const before = store.versions.length;
      store.versions = store.versions.filter((v) => v.id !== id);
      store.lines = store.lines.filter((l) => l.versionId !== id);
      const removed = store.versions.length !== before;
      if (removed) await this.write(store);
      return removed;
    });
  }

  async listLines(versionId?: string): Promise<EstimateLine[]> {
    const store = await this.read();
    return versionId
      ? store.lines.filter((l) => l.versionId === versionId)
      : store.lines;
  }

  async createLine(
    data: Omit<EstimateLine, "id" | "createdAt" | "updatedAt">,
  ): Promise<EstimateLine> {
    return this.enqueue(async () => {
      const store = await this.read();
      const ln: EstimateLine = {
        ...data,
        id: randomUUID(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      store.lines.push(ln);
      await this.write(store);
      return ln;
    });
  }

  async updateLine(
    id: string,
    patch: Partial<EstimateLine>,
  ): Promise<EstimateLine | null> {
    return this.enqueue(async () => {
      const store = await this.read();
      const idx = store.lines.findIndex((l) => l.id === id);
      if (idx === -1) return null;
      const updated: EstimateLine = {
        ...store.lines[idx],
        ...patch,
        id: store.lines[idx].id,
        updatedAt: nowIso(),
      };
      store.lines[idx] = updated;
      await this.write(store);
      return updated;
    });
  }

  async deleteLine(id: string): Promise<boolean> {
    return this.enqueue(async () => {
      const store = await this.read();
      const before = store.lines.length;
      store.lines = store.lines.filter((l) => l.id !== id);
      const removed = store.lines.length !== before;
      if (removed) await this.write(store);
      return removed;
    });
  }
}

/** 앱 전역에서 쓰는 단일 저장소 인스턴스. */
export const repository: EstimateRepository = new FileRepository();
