
import { AsyncLocalStorage } from "async_hooks";
import { THREAD_ID, USER_ID } from "../constants/appConstant";

export type ContextStore = {
    userId?: string;
    threadId?: string;
    [key: string]: any;
}

export class AsyncContextService {

    private static als = new AsyncLocalStorage<ContextStore>();

    static runWithNewContext<T>(fn: () => T) {
        const initialStore: ContextStore = {};
        this.als.run(initialStore, fn);
    }

    static getStore(): ContextStore | undefined {
        return this.als.getStore();
    }
    static get<T = any>(key: string): T | undefined {
        const store = this.getStore();
        return store ? (store[key] as T) : undefined;
    }

    static set(key: string, value: any): void {
        let store = this.getStore();
        if (!store) {
            store = {};
            this.als.enterWith(store);
        }
        store[key] = value;
    }

    static setUserId(userId: string | undefined) {
        if (!userId) return;
        this.set(USER_ID, userId);
    }

    static getUserId(): string | undefined {
        return this.get<string>(USER_ID);
    }

    static setThreadId(threadId: string) {
        this.set(THREAD_ID, threadId);
    }

    static getThreadId(): string | undefined {
        return this.get<string>(THREAD_ID);
    }
}