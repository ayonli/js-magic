/* global describe, it */
const assert = require("assert");
const magic = require(".");

class Car {
    constructor(wheels) {
        if (wheels) this.wheels = wheels;
    }

    __get(prop) {
        return prop in this ? this[prop] : (prop == "name" ? this.constructor.name + " Instance" : null);
    }

    __set(prop, value) {
        this[prop] = prop == "name" ? value + " Instance" : value;
    }

    __has(prop) {
        return prop.slice(0, 2) != "__" && (prop in this || prop == "name");
    }

    __delete(prop) {
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

describe("applying magic methods to class", () => {
    it("should generate a proxy class looks exactly like the original one", () => {
        let _Car = magic.applyMagic(Car);
        assert.equal(_Car.name, Car.name);
        assert.equal(_Car.length, Car.length);
        assert.equal(_Car.toString(), Car.toString());
        assert.strictEqual(_Car.prototype instanceof Car, true);
        var car = new _Car(4);
        assert.strictEqual(car instanceof Car, true);
        assert.strictEqual(car.wheels, 4);
        assert.equal(car.test("Hello, World!"), "Hello, World!");
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
        assert.equal(_Car(), "invoking Car as a function");
    });
});

describe("class inheritance of magical class", () => {
    let _Car = magic.applyMagic(Car);

    it("should define an ES6 class extends the magical class as expected", () => {
        class Auto extends _Car { }

        let classStr = Auto.toString();

        assert.equal(Auto.name, "Auto");
        assert.equal(Auto.length, 0);
        assert.equal(Auto.toString(), classStr);
        var auto = new Auto(4);
        assert.strictEqual(auto instanceof Car, true);
        assert.deepEqual(auto.name, "Auto Instance");
        assert.deepEqual(auto.wheels, 4);
        assert.strictEqual("name" in auto, true);
        assert.strictEqual("wheels" in auto, true);
        assert.strictEqual("windows" in auto, false);
        auto.name = "MyAuto";
        auto.windows = 4;
        assert.equal(auto.name, "MyAuto Instance");
        assert.strictEqual(auto.windows, 4);
        assert.equal(auto.test("Hello, World!"), "Hello, World!");
    });

    it("should define an ES5 class extends the magical class as expected", () => {
        function Auto() {
            return Reflect.construct(_Car, arguments, this.constructor);
        }

        let classStr = Auto.toString();

        Object.setPrototypeOf(Auto, _Car);
        Object.setPrototypeOf(Auto.prototype, _Car.prototype);

        assert.equal(Auto.name, "Auto");
        assert.equal(Auto.length, 0);
        assert.equal(Auto.toString(), classStr);
        var auto = new Auto(4);
        assert.strictEqual(auto instanceof Car, true);
        assert.deepEqual(auto.name, "Auto Instance");
        assert.deepEqual(auto.wheels, 4);
        assert.strictEqual("name" in auto, true);
        assert.strictEqual("wheels" in auto, true);
        assert.strictEqual("windows" in auto, false);
        auto.name = "MyAuto";
        auto.windows = 4;
        assert.equal(auto.name, "MyAuto Instance");
        assert.strictEqual(auto.windows, 4);
        assert.equal(auto.test("Hello, World!"), "Hello, World!");
    });
});

describe("apply magic functions on objects other than class", () => {
    it("should apply magic functions on an object as expected", () => {
        let obj = magic.applyMagic({
            __get(prop) {
                return "bar";
            }
        });

        assert.strictEqual(obj.foo, "bar");
    });

    it("should apply magic functions on a function as expected", () => {
        let fn = new Function();
        fn["__get"] = (prop) => {
            return prop === "name" ? "fn" : prop in fn ? fn[prop] : void 0;
        };
        fn = magic.applyMagic(fn, true);

        assert.strictEqual(fn.name, "fn");
    });
});