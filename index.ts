export const __get = Symbol("__get");
export const __set = Symbol("__set");
export const __has = Symbol("__has");
export const __delete = Symbol("__delete");
export const __invoke = Symbol("__invoke");

export interface MagicalClass {
    __get?(prop: string | symbol): any;
    __set?(prop: string | symbol, value: any): void;
    __has?(prop: string | symbol): boolean;
    __delete?(prop: string | symbol): void;
    /** @deprecated */
    __invoke?(...args: any[]): any;
}

let warnedInvokeDeprecation = false;

export function applyMagic<T extends new (...args: any[]) => any>(ctor: T, ctx?: object): T;
export function applyMagic<T extends (...args: any[]) => any>(fn: T, proxyOnly: boolean): T;
export function applyMagic<T extends object>(obj: T): T;
export function applyMagic(target: any, ctx: boolean | object = false) {
    if (typeof target === "function") {
        if (ctx === true) {
            return proxify(target);
        }

        const PseudoClass = function PseudoClass(this: any, ...args: any[]) {
            // Must use `new.target` instead of `this`, otherwise it won't work
            // in Bun (may be a bug).
            if (typeof new.target === "undefined") { // function call
                let invoke = target[__invoke] || target["__invoke"];

                if (invoke) { // use static __invoke
                    checkType(target, invoke, "__invoke");

                    return invoke
                        ? invoke.apply(target, args)
                        : target(...args);
                }

                let proto = target.prototype;
                invoke = proto[__invoke] || proto.__invoke;

                if (invoke && !warnedInvokeDeprecation) {
                    warnedInvokeDeprecation = true;
                    console.warn(
                        "applyMagic: using __invoke without 'static' modifier is deprecated");
                }

                checkType(target, invoke, "__invoke");

                return invoke ? invoke(...args) : target(...args);
            } else {
                Object.assign(this, new (<any>target)(...args));
                return proxify(this);
            }
        };

        Object.setPrototypeOf(PseudoClass, target);
        Object.setPrototypeOf(PseudoClass.prototype, target.prototype);

        setProp(PseudoClass, "name", target.name);
        setProp(PseudoClass, "length", target.length);
        setProp(PseudoClass, "toString", function toString(this: any) {
            let obj = this === PseudoClass ? target : this;
            return Function.prototype.toString.call(obj);
        }, true);

        return PseudoClass;
    } else if (typeof target === "object") {
        return proxify(target);
    } else {
        throw new TypeError("'target' must be a function or an object");
    }
}

function checkType(
    ctor: Function,
    fn: Function,
    name: string,
    argLength: number | undefined = void 0
) {
    if (fn !== undefined) {
        if (typeof fn != "function") {
            throw new TypeError(
                `${ctor.name}.${name} must be a function`
            );
        } else if (argLength !== undefined && fn.length !== argLength) {
            throw new SyntaxError(
                `${ctor.name}.${name} must have ` +
                `${argLength} parameter${argLength === 1 ? "" : "s"}`
            );
        }
    }
}

function setProp(target: Function, prop: string, value: any, writable = false) {
    Object.defineProperty(target, prop, {
        configurable: true,
        enumerable: false,
        writable,
        value
    });
}

function proxify(target: any) {
    let get = target[__get] || target.__get;
    let set = target[__set] || target.__set;
    let has = target[__has] || target.__has;
    let _delete = target[__delete] || target.__delete;

    checkType(new.target, get, "__get", 1);
    checkType(new.target, set, "__set", 2);
    checkType(new.target, has, "__has", 1);
    checkType(new.target, _delete, "__delete", 1);

    return new Proxy(target, {
        get: (target, prop) => {
            return get ? get.call(target, prop) : target[prop];
        },
        set: (target, prop, value) => {
            set ? set.call(target, prop, value) : (target[prop] = value);
            return true;
        },
        has: (target, prop) => {
            return has ? has.call(target, prop) : (prop in target);
        },
        deleteProperty: (target, prop) => {
            _delete ? _delete.call(target, prop) : (delete target[prop]);
            return true;
        }
    });
}
