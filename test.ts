import * as assert from "assert";
import * as magic from ".";

class Car {
    name?: string;
    wheels?: number;
    windows?: number;

    constructor(wheels: number = 0) {
        if (wheels)
            this.wheels = wheels;
    }

    __get(prop: string) {
        return prop in this ? this[prop] : (prop == "name" ? this.constructor.name + " Instance" : null);
    }

    __set(prop: string, value: any) {
        this[prop] = prop == "name" ? value + " Instance" : value;
    }

    __has(prop: string) {
        return prop.slice(0, 2) != "__" && (prop in this || prop == "name");
    }

    __delete(prop: string) {
        if (prop.slice(0, 2) == "__" || prop == "wheels") return;
        delete this[prop];
    }

    __invoke() {
        return "invoking Car as a function";
    }

    test(str) {
        return str;
    }
}

class Car2 {
    static __invoke() {
        return `invoking ${this.name} as a function`;
    }
}

describe("applying magic methods to class", () => {
    it("should generate a proxy class looks exactly like the original one", () => {
        let _Car = magic.applyMagic(Car);
        assert.strictEqual(_Car.name, Car.name);
        assert.strictEqual(_Car.length, Car.length);
        assert.strictEqual(_Car.toString(), Car.toString());
        assert.strictEqual(_Car.prototype instanceof Car, true);
        var car = new _Car(4);
        assert.strictEqual(car instanceof Car, true);
        assert.strictEqual(car.wheels, 4);
        assert.strictEqual(car.test("Hello, World!"), "Hello, World!");
    });

    it("should apply __get method as expected", () => {
        let _Car = magic.applyMagic(Car);
        var car = new _Car;
        car.wheels = 4;
        assert.strictEqual(car.wheels, 4);
        assert.strictEqual(car.name, "Car Instance");
    });

    it("should apply __set method as expected", () => {
        let _Car = magic.applyMagic(Car);
        var car = new _Car;
        car.wheels = 4;
        car.name = "MyCar";
        assert.strictEqual(car.wheels, 4);
        assert.strictEqual(car.name, "MyCar Instance");
    });

    it("should apply __has method as expected", () => {
        let _Car = magic.applyMagic(Car);
        var car = new _Car;
        car.wheels = 4;
        assert.strictEqual("wheels" in car, true);
        assert.strictEqual("name" in car, true);
        assert.strictEqual("__has" in car, false);
    });

    it("should apply __delete method as expected", () => {
        let _Car = magic.applyMagic(Car);
        var car = new _Car;
        car.wheels = 4;
        delete car.wheels;
        assert.strictEqual("wheels" in car, true);
        assert.strictEqual(car.wheels, 4);
    });

    it("should apply __invoke method as expected", () => {
        let _Car = magic.applyMagic(Car);
        // @ts-ignore
        assert.strictEqual(_Car(), "invoking Car as a function");
    });

    it("should apply static __invoke method as expected", () => {
        let _Car2 = magic.applyMagic(Car2);
        // @ts-ignore
        assert.strictEqual(_Car2(), "invoking Car2 as a function");
    });
});

describe("class inheritance of magical class", () => {
    let _Car = magic.applyMagic(Car);

    it("should define an ES6 class extends the magical class as expected", () => {
        class Auto extends _Car { }

        let classStr = Auto.toString();

        assert.strictEqual(Auto.name, "Auto");
        assert.strictEqual(Auto.length, 0);
        assert.strictEqual(Auto.toString(), classStr);
        var auto = new Auto(4);
        assert.strictEqual(auto instanceof Car, true);
        assert.deepStrictEqual(auto.name, "Auto Instance");
        assert.deepStrictEqual(auto.wheels, 4);
        assert.strictEqual("name" in auto, true);
        assert.strictEqual("wheels" in auto, true);
        assert.strictEqual("windows" in auto, false);
        auto.name = "MyAuto";
        auto.windows = 4;
        assert.strictEqual(auto.name, "MyAuto Instance");
        assert.strictEqual(auto.windows, 4);
        assert.strictEqual(auto.test("Hello, World!"), "Hello, World!");
    });

    it("should define an ES5 class extends the magical class as expected", () => {
        function Auto() {
            return Reflect.construct(_Car, arguments, this.constructor);
        }

        let classStr = Auto.toString();

        Object.setPrototypeOf(Auto, _Car);
        Object.setPrototypeOf(Auto.prototype, _Car.prototype);

        assert.strictEqual(Auto.name, "Auto");
        assert.strictEqual(Auto.length, 0);
        assert.strictEqual(Auto.toString(), classStr);
        // @ts-ignore
        var auto = new Auto(4);
        assert.strictEqual(auto instanceof Car, true);
        assert.deepStrictEqual(auto.name, "Auto Instance");
        assert.deepStrictEqual(auto.wheels, 4);
        assert.strictEqual("name" in auto, true);
        assert.strictEqual("wheels" in auto, true);
        assert.strictEqual("windows" in auto, false);
        auto.name = "MyAuto";
        auto.windows = 4;
        assert.strictEqual(auto.name, "MyAuto Instance");
        assert.strictEqual(auto.windows, 4);
        assert.strictEqual(auto.test("Hello, World!"), "Hello, World!");
    });
});

describe("apply magic functions on objects other than class", () => {
    it("should apply magic functions on an object as expected", () => {
        let obj = magic.applyMagic({
            __get(prop: string) {
                return "bar";
            }
        });

        // @ts-ignore
        assert.strictEqual(obj.foo, "bar");
    });

    it("should apply magic functions on a function as expected", () => {
        let fn = new Function();
        fn["__get"] = (prop: string) => {
            return prop === "name" ? "fn" : prop in fn ? fn[prop] : void 0;
        };
        // @ts-ignore
        fn = magic.applyMagic(fn, true);

        assert.strictEqual(fn.name, "fn");
    });
});
