/* global window, define */
/**
 * @package
 * @license MIT
 * @author Ayon Lee <i@hyurl.com>
 * @copyright 2020
 * @description Allow classes support magic methods in JavaScript based on ES6 Proxy.
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
                throw new TypeError(
                    `${constructor.name}.${name} must be a function`
                );
            } else if (argLength !== undefined && fn.length !== argLength) {
                throw new SyntaxError(
                    `${constructor.name}.${name} must have ` +
                    `${argLength} parameter${argLength === 1 ? "" : "s"}`
                );
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

    function proxify(target) {
        let get = target[__get] || target.__get,
            set = target[__set] || target.__set,
            has = target[__has] || target.__has,
            _delete = target[__delete] || target.__delete;

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

    /**
     * @param {Function|object} target
     * @returns {Function|object}
     */
    function applyMagic(target, proxyOnly = false) {
        if (typeof target == "function") {
            if (proxyOnly) {
                return proxify(target);
            }

            function PseudoClass(...args) {
                if (typeof this == "undefined") { // function call
                    let proto = target.prototype,
                        invoke = proto[__invoke] || proto.__invoke;

                    checkType(target, invoke, "__invoke");

                    return invoke ? invoke(...args) : target(...args);
                } else {
                    Object.assign(this, new target(...args));
                    return proxify(this);
                }
            }

            Object.setPrototypeOf(PseudoClass, target);
            Object.setPrototypeOf(PseudoClass.prototype, target.prototype);

            setProp(PseudoClass, "name", target.name);
            setProp(PseudoClass, "length", target.length);
            setProp(PseudoClass, "toString", function toString() {
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