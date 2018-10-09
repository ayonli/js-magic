/**
 * @package
 * @license MIT
 * @author Ayon Lee <i@hyurl.com>
 * @copyright 2018
 * @description Lets classes support magic methods in JavaScript based on ES6 Proxy.
 * @namespace magic
 */
"use strict";

(function () {
    const __get = Symbol("__get");
    const __set = Symbol("__set");
    const __has = Symbol("__has");
    const __delete = Symbol("__delete");
    const __invoke = Symbol("__invoke");

    /**
     * @param {Function} constructor 
     * @param {Function} fn 
     * @param {string} name 
     * @param {number} argLength
     * @returns {void}
     */
    function checkType(constructor, fn, name, argLength) {
        if (fn !== undefined) {
            if (typeof fn != "function") {
                throw new TypeError(`Magic method ${constructor.name}.${name} must be defined as a function`);
            } else if (argLength !== undefined && fn.length !== argLength) {
                throw new SyntaxError(`Magic method ${constructor.name}.${name} must have ${argLength} parameter${argLength === 1 ? "" : "s"}`);
            }
        }
    }

    /**
     * @param {Function} target 
     * @param {string} prop 
     * @param {any} value 
     * @param {boolean} writable 
     */
    function setProp(target, prop, value, writable) {
        Object.defineProperty(target, prop, {
            configurable: true,
            enumerable: false,
            writable: !!writable,
            value: value
        });
    }

    /**
     * @param {Function} constructor
     * @returns {Function}
     */
    function applyMagic(constructor) {
        function PsudoClass(...args) {
            if (typeof this == "undefined") { // function call
                let proto = constructor.prototype,
                    invoke = proto[__invoke] || proto.__invoke;

                checkType(constructor, invoke, "__invoke");

                return invoke ? invoke(...args) : constructor(...args);
            } else {
                Object.assign(this, new constructor(...args));

                let get = this[__get] || this.__get,
                    set = this[__set] || this.__set,
                    has = this[__has] || this.__has,
                    _delete = this[__delete] || this.__delete;

                checkType(new.target, get, "__get", 1);
                checkType(new.target, set, "__set", 2);
                checkType(new.target, has, "__has", 1);
                checkType(new.target, _delete, "__delete", 1);

                return new Proxy(this, {
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
        }

        Object.setPrototypeOf(PsudoClass, constructor);
        Object.setPrototypeOf(PsudoClass.prototype, constructor.prototype);

        setProp(PsudoClass, "name", constructor.name);
        setProp(PsudoClass, "length", constructor.length);
        setProp(PsudoClass, "toString", function toString() {
            let target = this === PsudoClass ? constructor : this;
            return Function.prototype.toString.call(target);
        }, true);

        return PsudoClass;
    }

    const magic = {
        __get,
        __set,
        __has,
        __delete,
        __invoke,
        applyMagic
    };

    if (typeof exports == "object") {
        Object.assign(exports, magic);
    } else if (typeof define == "function" && define.amd) {
        define(["require", "exports"], function (require, exports) {
            Object.assign(exports, magic);
        });
    } else if (typeof window == "object") {
        window.magic = magic;
    }
}());