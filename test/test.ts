import {
    alternatives,
    arrayOf,
    boolean, defaultValue, exact,
    float,
    int, nullable,
    object,
    oneOf,
    optional,
    string, strToBoolean,
    strToFloat,
    strToInt, transform,
} from '../src';

describe('validation functions', () => {
    it('should validate bool correctly', () => {
        expect(() => {
            boolean()('true', 'test');
        }).toThrow('[test] should be a boolean');

        expect(boolean()(true, 'test')).toEqual(true);

        expect(strToBoolean()('1', 'test')).toEqual(true);
        expect(strToBoolean()('0', 'test')).toEqual(false);
        expect(() => {
            strToBoolean()('asd', 'test');
        }).toThrow('[test] should be a boolean');
    });

    it('should validate int correctly', () => {
        expect(() => {
            int()('123', 'test');
        }).toThrow('[test] should be an integer');

        expect(() => {
            int({min: 5})(4, 'test');
        }).toThrow('[test] is smaller (4) than the allowed minimum (5)');

        expect(() => {
            int({max: 10})(12, 'test');
        }).toThrow('[test] is larger (12) than the allowed maximum (10)');

        expect(() => {
            int()(0.5, 'test');
        }).toThrow('[test] should be an integer');

        expect(() => {
            int()(NaN, 'test');
        }).toThrow('[test] should be an integer');

        expect(() => {
            int()(Infinity, 'test');
        }).toThrow('[test] should be an integer');

        expect(() => {
            int()(null, 'test');
        }).toThrow('[test] should be an integer');

        expect(() => {
            int()(undefined, 'test');
        }).toThrow('[test] should be an integer');

        expect(
            int()(5, 'test')
        ).toEqual(5);

        expect(
            strToInt()('123', 'test')
        ).toEqual(123);

        expect(() => {
            strToInt()('a123', 'test');
        }).toThrow('[test] should be an integer');
    });

    it('should validate float correctly', () => {
        expect(() => {
            float()('a123', 'test');
        }).toThrow('[test] should be a float');

        expect(() => {
            float({min: 5})(4, 'test');
        }).toThrow('[test] is smaller (4) than the allowed minimum (5)');

        expect(() => {
            float({max: 10})(12, 'test');
        }).toThrow('[test] is larger (12) than the allowed maximum (10)');

        expect(float()(0.5, 'test')).toEqual(0.5);

        expect(() => {
            float()(NaN, 'test');
        }).toThrow('[test] should be a float');

        expect(() => {
            float()(Infinity, 'test');
        }).toThrow('[test] should be a float');

        expect(() => {
            float()(null, 'test');
        }).toThrow('[test] should be a float');

        expect(() => {
            float()(undefined, 'test');
        }).toThrow('[test] should be a float');

        expect(
            float()(5, 'test')
        ).toEqual(5);

        expect(
            strToFloat()('123.5', 'test')
        ).toEqual(123.5);

        expect(() => {
            strToFloat()('a123.5', 'test');
        }).toThrow('[test] should be a float');
    });

    it('should validate string correctly', () => {
        expect(() => {
            string()(123, 'test');
        }).toThrow('[test] should be a string');

        expect(string()('abc', 'test')).toEqual('abc');

        expect(() => {
            string({min: 2, max: 4})('value', 'test');
        }).toThrow('[test] has more characters (5) than the allowed maximum (4)');

        expect(() => {
            string({min: 2, max: 4})('', 'test');
        }).toThrow('[test] has fewer characters (0) than the allowed minimum (2)');

        expect(() => {
            string({pattern: /^[a-z]{3}$/i})('aaaa', 'test');
        }).toThrow('[test] doesn\'t match the pattern');

        expect(string({min: 2, max: 4})('abc', 'test')).toEqual('abc');

        expect(() => {
            string()(null, 'test');
        }).toThrow('[test] should be a string');

        expect(() => {
            string()(undefined, 'test');
        }).toThrow('[test] should be a string');
    });

    it('should validate object correctly', () => {
        expect(() => {
            object({})(['a'], 'test');
        }).toThrow('[test] should be an object');

        expect(() => {
            object({})(null, 'test');
        }).toThrow('[test] should be an object');

        expect(() => {
            object({})(123, 'test');
        }).toThrow('[test] should be an object');

        expect(() => {
            object({})({a: 5}, 'test');
        }).toThrow('Property [test.a] is unknown');

        expect(object({}, {
            ignoreUnknown: true,
        })({a: 5}, 'test')).toEqual({a: 5});

        expect(() => {
            object({}, {
                ignoreUnknown: true,
                min: 2,
                max: 3,
            })({a: 5}, 'test');
        }).toThrow('[test] has fewer keys (1) than the allowed minimum (2)');

        expect(() => {
            object({}, {
                ignoreUnknown: true,
                min: 2,
                max: 3,
            })({a: 5, b: 5, c: 5, d: 5}, 'test');
        }).toThrow('[test] has more keys (4) than the allowed maximum (3)');

        expect(object({}, {
            ignoreUnknown: true,
            min: 2,
            max: 3,
        })({a: 5, b: 5, c: 5}, 'test')).toEqual({a: 5, b: 5, c: 5});

        expect(object({a: v => v})({a: 5}, 'test')).toEqual({a: 5});

        expect(() => {
            object({a: (v, path) => {throw new Error(`oops in [${path}]`)}})({a: 5}, 'test');
        }).toThrow('oops in [test.a]');

        expect(object({a: v => v})({}, 'test')).toEqual({a: undefined});

        expect(object({})({}, 'test')).toEqual({});


    });

    it('should validate arrayOf correctly', () => {
        expect(() => {
            arrayOf(int())({a: 2}, 'test');
        }).toThrow('[test] should be an array');

        expect(() => {
            arrayOf(int())(null, 'test');
        }).toThrow('[test] should be an array');

        expect(() => {
            arrayOf(int())([1, 2, '3'], 'test');
        }).toThrow('[test[2]] should be an integer');

        expect(() => {
            arrayOf(int(), {max: 2})([1, 2, 3, 'abc'], 'test');
        }).toThrow('[test] has more items (4) than the allowed maximum (2)');

        expect(arrayOf(optional(string()))(['1', '2', '3'], 'test')).toEqual(['1', '2', '3']);

        expect(arrayOf(object({a: string()}))([{a: 'aa'}], 'test')).toEqual([{a: 'aa'}]);

        expect(() => {
            arrayOf(object({a: string()}))([{a: 2}], 'test');
        }).toThrow('[test[0].a] should be a string');
    });

    it('should validate exact correctly', () => {
        expect(exact(1)(1, 'test')).toEqual(1);
        expect(() => {
            exact(1)(2, 'test');
        }).toThrow('[test] isn\'t equal to value (1)');
    });

    it('should validate oneOf correctly', () => {
        expect(oneOf([1, 2, '3'] as const)('3', 'test')).toEqual('3');

        expect(() => {
            oneOf([1, 2, '3'])(3, 'test');
        }).toThrow('[test] isn\'t equal to any of the enumerated values (1 | 2 | "3")');

        expect(() => {
            oneOf([1, 2, '3'])(undefined, 'test');
        }).toThrow('[test] isn\'t equal to any of the enumerated values (1 | 2 | "3")');

        expect(() => {
            oneOf([1, 2, {a: 1}])({a: 1}, 'test');
        }).toThrow('[test] isn\'t equal to any of the enumerated values (1 | 2 | {"a":1})');
    });

    it('should validate alternatives correctly', () => {
        expect(alternatives([string(), int()])(3, 'test')).toEqual(3);

        expect(() => {
            alternatives([string(), int()])(undefined, 'test');
        }).toThrow('Input did not match any allowed options for [test]:\n\t[*] should be a string\tOR\n\t[*] should be an integer');

        expect(alternatives([string(), object({a: string()})])({a: '5'}, 'test')).toEqual({a: '5'});

        expect(() => {
            alternatives([string(), object({a: string()})])({a: 5}, 'test');
        }).toThrow('Input did not match any allowed options for [test]:\n\t[*] should be a string\tOR\n\t[*.a] should be a string');
    });

    it('should validate optional correctly', () => {
        expect(optional(string())(undefined, 'test')).toEqual(undefined);

        expect(optional(string())('123', 'test')).toEqual('123');

        expect(() => {
            optional(string())(null, 'test')
        }).toThrow('[test] should be a string');

        expect(object({a: optional(string())})({}, 'test')).toEqual({a: undefined});

        expect(object({a: optional(string())})({a: '123'}, 'test')).toEqual({a: '123'});

        expect(() => {
            object({a: optional(string())})({a: 456}, 'test')
        }).toThrow('[test.a] should be a string');
    });

    it('should validate nullable correctly', () => {
        expect(nullable(string())(null, 'test')).toEqual(null);

        expect(nullable(string())('123', 'test')).toEqual('123');

        expect(() => {
            nullable(string())(undefined, 'test')
        }).toThrow('[test] should be a string');

        expect(object({a: nullable(string())})({a: null}, 'test')).toEqual({a: null});

        expect(object({a: nullable(string())})({a: '123'}, 'test')).toEqual({a: '123'});

        expect(() => {
            object({a: nullable(string())})({a: 456}, 'test')
        }).toThrow('[test.a] should be a string');
    });

    it('should validate defaultValue correctly', () => {
        expect(defaultValue('123', string())(undefined, 'test')).toEqual('123');
        expect(defaultValue('123', string())('345', 'test')).toEqual('345');
        expect(defaultValue('123', string())('', 'test')).toEqual('');
        expect(() => {
            defaultValue('123', string())(null, 'test');
        }).toThrow('[test] should be a string');

        expect(object({a: defaultValue('123', string())})({}, 'test')).toEqual({a: '123'});
        expect(object({a: defaultValue('123', string())})({a: 'uuu'}, 'test')).toEqual({a: 'uuu'});
        expect(object({a: defaultValue('123', string())})({a: ''}, 'test')).toEqual({a: ''});
        expect(() => {
            object({a: defaultValue('123', string())})({a: null}, 'test');
        }).toThrow('[test.a] should be a string');

        expect(defaultValue({a: 'a'}, object({
            a: string(),
        }))(undefined, 'test')).toEqual({a: 'a'});
        expect(defaultValue({a: 'a'}, object({
            a: string(),
        }))({a: 'uuu'}, 'test')).toEqual({a: 'uuu'});
        expect(() => {
            defaultValue({a: 'a'}, object({
                a: string(),
            }))({a: 456}, 'test');
        }).toThrow('[test.a] should be a string');
    });

    it('should make transform', () => {
        const validator = alternatives([
            string({pattern: /^[a-z0-9]+\:[a-z0-9]+$/}),
            transform(
                object({
                    id: string({min: 1}),
                    type: string({min: 1}),
                }),
                obj => `${obj.type}:${obj.id}`,
            ),
        ]);
        expect(validator('user:1', 'myValue')).toEqual('user:1');
        expect(validator({type: 'user', id: '1'}, 'myValue')).toEqual('user:1');
        expect(() => {
            validator({type: 'user'}, 'myValue');
        }).toThrow('Input did not match any allowed options for [myValue]:\n\t[*] should be a string\tOR\n\t[*.id] should be a string');
        expect(() => {
            validator('asd', 'myValue');
        }).toThrow('Input did not match any allowed options for [myValue]:\n\t[*] doesn\'t match the pattern\tOR\n\t[*] should be an object');
    });
});
