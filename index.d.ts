declare namespace magic {
    const __get: symbol;
    const __set: symbol;
    const __has: symbol;
    const __delete: symbol;
    const __invoke: symbol;

    function applyMagic<T extends new (...args: any[]) => any>(ctor: T): T;
    function applyMagic<T extends (...args: any[]) => any>(fn: T, proxyOnly: boolean): T;
    function applyMagic<T extends object>(obj: T): T;

    interface MagicalClass {
        __get?(prop: string | symbol): any;
        __set?(prop: string | symbol, value: any): void;
        __has?(prop: string | symbol): boolean;
        __delete?(prop: string | symbol): void;
        __invoke?(...args: any[]): any;
    }
}

export = magic;