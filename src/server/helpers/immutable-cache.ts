import cacher from "node-file-cache";
import { join } from "path";
import { unlinkSync } from "fs";

export class ImmutableCache {
    private cache: cacher.Cache;

    constructor(private cacheDir: string, filename: string, life: number) {
        const file = join(this.cacheDir, filename);
        const options: cacher.ICacheOptions = { file, life };
        try {
            this.cache = cacher.create(options);
        } catch (ex) {
            unlinkSync(file);
            this.cache = cacher.create(options);
        }
    }

    public clear() {
        this.cache.clear();
    }

    public set(key: string, value: any): void {
        this.cache.set(key, this.clone(value));
    }

    public get(key: string): any {
        return this.clone(this.cache.get(key));
    }

    public expire(key: string): void {
        this.cache.expire(key);
    }

    private clone(value: any): any {
        return JSON.parse(JSON.stringify(value));
    }
}
