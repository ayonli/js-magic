declare namespace magic {
    const __get: symbol;
    const __set: symbol;
    const __has: symbol;
    const __delete: symbol;
    const __invoke: symbol;
    
    function applyMagic<T extends Function>(Class: T): T;

    interface MagicalClass {
        protected __get?(prop: string | symbol): any;
        protected __set?(prop: string | symbol, value: any): void;
        protected __has?(prop: string | symbol): boolean;
        protected __delete?(prop: string | symbol): void;
        protected __invoke?(...args: any[]): any;
    }
}

export = magic;