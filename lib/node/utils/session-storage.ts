import fs from "fs";
import path from "path";

export class SessionStorage {
  private storage: { [key: string]: string };
  private limit: number;
  private persist: boolean;
  private filePath: string;
  private directory: string = ".session-storage";

  constructor({ persist = false, filePath = "./sessionData.json" }: { persist?: boolean; filePath?: string } = {}) {
    this.storage = {};
    this.limit = 5 * 1024 * 1024; // 5MB storage limit
    this.persist = persist;
    this.filePath = path.resolve(this.directory, filePath);

    if (this.persist) {
      if (!fs.existsSync(this.directory)) {
        fs.mkdirSync(this.directory, { recursive: true });
      }

      // Load data from file if persistence is enabled
      this.loadFromFile();
    }
  }

  // Calculate total size in bytes of stored data
  private getStorageSize(): number {
    return new TextEncoder().encode(JSON.stringify(this.storage)).length;
  }

  // Check if storage limit is exceeded
  private checkSizeLimit(): void {
    const size = this.getStorageSize();
    if (size > this.limit) {
      throw new DOMException("Storage limit exceeded", "QuotaExceededError");
    }
  }

  // Store value under the specified key
  setItem(key: string | null | undefined, value: string | null | undefined): void {
    if (key === null || key === undefined) {
      throw new TypeError("Failed to execute 'setItem' on 'Storage': 1 argument required, but only 0 present.");
    }

    if (value === null) {
      value = "null"; // Convert null to "null"
    } else if (value === undefined) {
      value = "undefined"; // Convert undefined to "undefined"
    }

    this.loadFromFile();
    this.storage[key] = String(value); // Store as string
    this.checkSizeLimit(); // Check storage limit
    this.saveToFile(); // Save to file if persistence is enabled
  }

  // Retrieve value stored under the specified key
  getItem(key: string | null | undefined): string | null {
    if (key === null || key === undefined) {
      throw new TypeError("Failed to execute 'getItem' on 'Storage': 1 argument required, but only 0 present.");
    }

    this.loadFromFile();
    return this.storage[key] || null; // Return null if key doesn't exist
  }

  // Remove the value under the specified key
  removeItem(key: string | null | undefined): void {
    if (key === null || key === undefined) {
      throw new TypeError("Failed to execute 'removeItem' on 'Storage': 1 argument required, but only 0 present.");
    }
    this.loadFromFile();
    Reflect.deleteProperty(this.storage, key); // Remove key from storage
    this.saveToFile(); // Save to file if persistence is enabled
  }

  // Clear all stored values
  clear(): void {
    this.storage = {};
    this.saveToFile(); // Save to file if persistence is enabled
  }

  // Return the number of stored items
  get length(): number {
    return Object.keys(this.storage).length;
  }

  // Return the key at the specified index
  key(index: number): string | null {
    this.loadFromFile();
    const keys = Object.keys(this.storage);
    return keys[index] || null;
  }

  // Save data to a file (only if persistence is enabled)
  private saveToFile(): void {
    if (this.persist) {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify(this.storage), "utf-8");
      } catch (error) {
        throw new Error(`Error saving data to file: ${(error as any).message}`);
      }
    }
  }

  // Load data from a file (only if persistence is enabled)
  private loadFromFile(): void {
    if (this.persist) {
      try {
        if (fs.existsSync(this.filePath)) {
          const data = fs.readFileSync(this.filePath, "utf-8");
          this.storage = JSON.parse(data || "{}");
        }
      } catch (error) {
        throw new Error(`Error loading data from file: ${(error as any).message}`);
      }
    }
  }
}
