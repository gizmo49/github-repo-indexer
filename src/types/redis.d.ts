declare module 'ioredis' {
    export default class Redis {
        constructor(url: string);

        // Redis client methods
        on(event: 'error', listener: (error: Error) => void): this;
        get(key: string): Promise<string | null>;
        set(key: string, value: string, mode?: 'EX', duration?: number): Promise<'OK'>;
        del(key: string): Promise<number>;
    }
}
