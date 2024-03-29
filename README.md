# JS-Magic

**JavaScript magic methods support.**

We know that ES6 brings the capability of Proxy that allows us observing an 
object, and setters ang getters are build-in support in JavaScript, but if we 
need to build those things every time, that's just mess and pain. With this 
package, you can define setters and getters, along with other functions, right 
in the class definition itself, and when instantiating the class, the instance
will always have the the benefits of the magical calling functionalities.

This package is inspired by PHP magic methods, and currently supports these 
methods: `__get`, `__set`, `__has`, `__delete`, `__invoke`. Other methods like 
`toString` and `toJSON` are built-in support in JavaScript.

## Install

```sh
npm i js-magic
```

### In Deno

Just import this package directly:

```ts
import { applyMagic } from "https://deno.land/x/js_magic/index.ts";
```

## Example

```typescript
// This example is coded in TypeScript, be aware of the difference between TS 
// and JS. All the magic methods are optional, but here I'll show all the usage 
// of them.

import { applyMagic, MagicalClass } from "js-magic";

@applyMagic
export class Car implements MagicalClass {
    name!: string;
    wheels?: number;

    constructor(name?: string, wheels?: number) {
        if (name !== undefined) this.name = name;
        if (wheels !== undefined) this.wheels = wheels;
    }

    /**
     * If a property doesn't exist, returns `null` instead of `undefined`, and 
     * if the property is 'name', returns it according to the class name plus 
     * 'Instance'. 
     */
    __get(prop: string | symbol): any {
        return prop in this ? this[prop]
            : (prop == "name" ? this.constructor.name + " Instance" : null);
    }

    /** If the property is name, appends it with 'Instance'. */
    __set(prop: string | symbol, value: any): void {
        this[prop] = prop == "name" ? value + " Instance" : value;
    }

    /**
     * Ignores the properties starts with '__', and always returns `true` when 
     * testing 'name'.
     */
    __has(prop: string | symbol): boolean {
        return (typeof prop != "string" || prop.slice(0, 2) != "__")
            && (prop in this || prop == "name");
    }

    /** If the property starts with '__' or is 'name', DO NOT delete. */
    __delete(prop: string | symbol): void {
        if (prop.slice(0, 2) == "__" || prop == "name") return;
        delete this[prop];
    }

    /**
     * This method will be called when the class is invoked as a function. You 
     * may be a little confused since being told that ES6 class cannot be called
     * as function, AKA without `new` operator, well, when using this package, 
     * you CAN.
     * 
     * NOTE: prior to v1.2, __invoke without `static` modifier is permitted, but
     * it's now deprecated, always add `static` instead.
     */
    static __invoke(...args: any[]): any {
        return "invoking Car as a function";
    }
}
```

## How It Works?

The decorator `applyMagic` is a function that returns a highly-customized ES5 
pseudo-class, it will replace the original class, so that when instantiating,
the  magic methods will be auto-applied to the instance wrapped by a `Proxy`.
Since `applyMagic` is a function, so if you're coding in JavaScript without
decorator support, you can manually call it to generate the wrapping class and
assign to the old one. Like this:

```javascript
import { applyMagic } from "js-magic";

class Car {
    // ...
}

Car = applyMagic(Car);
```

Since the returned class is wrapped in ES5 style, so that it allows you calling 
it as a function, where the `__invoke` method will called under the hood.

## Support of Inheritance

This package also supports native inheritance, allows you inheriting the magical
calling functionalities from a super class to sub-classes. Also you can rewrite
the magic methods in the sub-class, and call the super's via `super` keyword.

NOTE: this feature DOESN'T work with `__invoke`, unless using `applyMagic` on
the sub-class as well.

## Support of Objects Other Than Class

Since v1.1, this package also supports other objects other than class, if
calling `applyMagic` on a non-function object, it will returns a proxy of the
original object that supports magic functions. Moreover, if you want this
feature be apply to a function, you can pass the second argument `proxyOnly` to
`applyMagic`, and it will not treat the function as a potential class. 

## Additional Symbols

This package also provides symbols according to the magic method names (`__get`, 
`__set`, `__has`, `__delete`, `__invoke`), you can use them if you want to hide 
the methods from IDE IntelliSense, but generally they are not common used.

## Supported Environments

Any environment that supports ES6 `Proxy` will work with this package perfectly, 
generally, NodeJS `6.0+`, Deno and modern browsers (`IE` aside) should support
`Proxy` already.

In browsers, if you're not using any module resolution, access the global 
variable `window.magic` instead.

## More Examples

For more examples, please check out the [Test](./test.js).
