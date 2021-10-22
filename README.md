checkeasy
----------

Light, expressive and type-safe data validation in typescript.

![Image of Yaktocat](docs/example.png)

As you can see, you DON'T NEED to write your schema twice (for validation and for typescript).
Just use validator functions, which return well typed results. So typescript is acknowledged about shape of your data and checks its usages on compilation stage.

Why I need one more type validator?
-----------------------------------

Because I wanted to have type validation which:

- super light and easy
- done with typescript in mind
- supports transformations (e.g. I can convert strings to numbers on the fly, if I want to do so)
- easy extensible with custom validators

Documentation
-------------

- [Validators](#validators)
    - [int](#int)
    - [strToInt](#strtoint)
    - [float](#float)
    - [strToFloat](#strtofloat)
    - [string](#string)
    - [boolean](#boolean)
    - [strToBoolean](#strtoboolean)
    - [object](#object)
    - [arrayOf](#arrayof)
    - [oneOf](#oneof)
    - [alternatives](#alternatives)
    - [optional](#optional)
    - [nullable](#nullable)
    - [defaultValue](#defaultvalue)
    - [uuid](#uuid)
    - [email](#email)
    - [any](#any)
    - [transform](#transform)
- [Custom validators](#custom-validators)
 
Validators
----------

Although, it's really easy to create your own validators, library exports few ready to go ones.

## int

Checks if value is an integer.

Possible options:

- min
- max

```ts
const validator1 = int() 
validator1(5, 'myValue'); // returns: 5 

const validator2 = int({min: 1}) // returns: 5
validator2(5, 'myValue'); // returns: 5

const validator3 = int({min: 0, max: 4});
validator3(5, 'myValue'); // throws: [myValue] isn't in allowed range
```

## strToInt

The same as [int](#int) but also tries to convert string to integer, if value is string.

It's convenient for validating/parsing url params, which initially are strings.

## float
Checks if value is a finite number.

Possible options:

- min
- max

```ts
const validator1 = int() 
validator1(5.2, 'myValue'); // returns: 5 

const validator2 = int({min: 1});
validator2(5.2, 'myValue'); // returns: 5

const validator3 = int({min: 0, max: 4});
validator3(5.2, 'myValue'); // throws: [myValue] isn't in allowed range
```

## strToFloat

The same as [float](#float) but also tries to convert string to float, if value is string.

It's convenient for validating/parsing url params, which initially are strings.

## string

Checks if value is a string.

Possible options:

- min - min length of string
- max - max length of string
- pattern - regex to test with

```ts
const validator1 = string()
validator1('aaa', 'myValue'); // returns: "aaa"

const validator2 = string()
validator2({}, 'myValue'); // throws: [myValue] should be a string

const validator3 = string({max: 3});
validator3('aaaa', 'myValue'); // throws: [myValue] length isn't in allowed range

const validator4 = string({patten: /^[a-z]{3}$/i});
validator4('aaaa', 'myValue'); // throws: [myValue] doesn't match the pattern
```

## boolean

Checks if value is a boolean.

```ts
const validator1 = boolean()
validator1(true, 'myValue'); // returns: true

const validator2 = boolean()
validator2('true', 'myValue'); // throws: [myValue] should be a boolean
```

## strToBoolean

The same as [boolean](#boolean) but also converts strings ("1", "true", "yes") to true, and ("0", "false", "no") to false.

It's convenient for validating/parsing url params, which initially are strings. 

## object

Check if a value is an object and runs validation on all of its properties by given shape.

Receives single parameter, which should be an object.
Values of this object should be validators, which will be called to check properties.

```ts
const validator = object({
    a: int(),
    b: optional(string({max: 3})),
    c: v => v,
});

validator({a: 5, c: 'anystring'}, 'myValue'); // returns: {a: 5, b: undefined, c: 'anystring'}

validator({a: 5, b: 25, c: 'anystring'}, 'myValue'); // throws: [myValue.b] should be a string

validator('something totally different', 'myValue'); // throws: [myValue] should be an object
```

## arrayOf

Checks if value is an array and checks each of its elements with given validator.

You can also pass options in second parameter:

- min - min length of array
- max - max length of array

```ts
const validator1 = arrayOf(string());
validator1(['1', '2', '3'], 'myValue').toEqual(['1', '2', '3']); // returns: ['1', '2', '3']

const validator2 = arrayOf(int());
validator2({a: 2}, 'myValue'); // throws: [myValue] should be an array

const validator3 = arrayOf(int());
validator3([1, 2, '3'], 'myValue'); // throws: [myValue.@item(3)] should be an integer

const validator4 = arrayOf(int(), {max: 2});
validator4([1, 2, 3, 'abc'], 'myValue'); // throws: [myValue] length isn't in allowed range

const validator5 = arrayOf(
    object({
        a: string(),
    }),
);
validator5([{a: 'aa'}], 'myValue'); // returns: [{a: 'aa'}]
validator5([{a: 2}], 'myValue'); // throws: [myValue.@item(0).a] should be a string
```

## oneOf

Checks if value strictly equals one of the given values.

```ts
const validator1 = oneOf([1, 2, '3'] as const);
validator1('3', 'myValue'); // returns: 3

const validator2 = oneOf([1, 2, '3'] as const)
validator2(3, 'myValue'); // throws: [myValue] isn't equal to any of predefined value

const validator3 = oneOf([1, 2, {a: 1}] as const);
validator3({a: 1}, 'myValue'); // throws: [myValue] isn't equal to any of predefined value
    // it's because it doesn't make deepEqual
```

___If you want typescript to make a type with exactly your values, add "as const" after array, to let typescript know -
your array is readonly:___

```ts
const validator1 = oneOf([1, 2, '3'] as const);
const value1 = validator1(1, 'myValue');
// here type of value1 = 1 | 2 | "3"

const validator2 = oneOf([1, 2, '3']);
const value2 = validator1(1, 'myValue');
// but here type of value2 = number | string
// as typescript recognizes type of your values array as Array<string | number> in this case
// (pls let me know, if you have a solution to avoid "as const" here)
```

## alternatives

Checks value with the help of each passed validator one by one. Returns value from first validator, which doesn't fail.

If all validators failed, throws an error.

```ts
const validator = alternatives([
    string(),
    object({
        a: string(),
    }),
]);
validator({a: '5'}, 'myValue'); // returns: {a: '5'}

validator({a: 5}, 'myValue');
//  throws: All alternatives failed for [myValue]:
//      [myValue.@alternative(0)] should be a string
//      [myValue.@alternative(1).a] should be a string
```

## optional

Add undefined as a possible value to given validator. Although, it can be used itself, it's very helpful for optional values in objects.

```ts

const validator = object({
    a: optional(string()),
});
validator({}, 'myValue'); // returns: {a: undefined}
validator({a: '123'}, 'myValue'); // returns {a: '123'}
validator({a: 456}, 'myValue'); // throws: [myValue.a] should be a string
validator({a: null}, 'myValue'); // throws: [myValue.a] should be a string
  // (null is not the same as undefined)
```

## nullable

Similar to optional. But instead of _undefined_, it allows value be null.

If you want to have optional nullable value, of course you can make a composition of `optional(nullable(...))`.

## defaultValue

If value is undefined, returns some default value passed as first parameter.

Otherwise, runs validator given in second parameter.

```ts
const validator = object({
    a: defaultValue('123', string()),
});
validator({}, 'myValue'); // returns: {a: '123'}
validator({a: 'uuu'}, 'myValue'); // retunrs: {a: 'uuu'}
validator({a: ''}, 'myValue'); // returns: {a: ''}
validator({a: null}, 'myValue'); // throws: [myValue.a] should be a string
```

## uuid

Checks if value is uuid.

## email

Checks if value is email.

## any

There isn't _"any"_ type, but you can easily emulate it using `v => v`.

```
const validator = object({
    stringProp: strint(),
    anyProp: v => v,
});
```

## transform

Sometimes you may want to transform value after some validation and pass it to next validator.

```ts
// Let's imagine we want to validate some id, which can be represented by string like "user:1" or by object
// like {type: 'user', id: '1'}
// we can make one validator for that, which returns a string for both cases

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

validator('user:1', 'myValue'); // returns: "user:1"
validator({type: 'user', id: '1'}, 'myValue'); // returns "user:1"
validator({type: 'user'}, 'myValue');
//    throws: All alternatives failed for [myValue]:
//       [myValue.@alternative(0)] should be a string
//       [myValue.@alternative(1).id] should be a string
validator('asd', 'myValue');
//    throws: All alternatives failed for [myValue]:
//       [myValue.@alternative(0)] doesn't match the pattern
//       [myValue.@alternative(1)] should be an object

``` 

Custom validators
-----------------

The power here is in the simplicity. It's so simple, that it's even hard to call it a library.

There isn't any core functionality. There are just few conventions, validators are built.

To check any type of value you should to create a validator.
Validator is a function which receives 2 parameters: value to validate and a path.
In case of validation error, validator should throw an error, using path to point at a place of shape, where validation 
failed. In case of success validatior should return a value. Validator can return the same value which was received, or
modify it if needed.

```ts
type Validator<T> = (v: any, path: string) => T;
```

E.g. to create new validator which checks, does value exactly match given example, we can write:

```ts
const exactMatch = <T>(exactValue: T): Validator<T> => (v, path) => {
    if (v !== exactValue) {
        throw new Error(`[${path}] isn't the same as allowed value`);
    }
    return v;
};

// let's check value 
exactMatch(5)(10, 'myValue'); // throws: [myValue] isn't the same as allowed value

// or let's combine it with other validators
import {object, optional} from 'checkeasy';
const validator = object({
    a: exactMatch(5),
    b: optional(exactMatch(7)),
    c: exactMatch(10),
});
validator({a: 5, c: 10}, 'myValue'); // returns: { a: 5, b: undefined, c: 10 }
validator({a: 5, c: 12}, 'myValue'); // throws: [myValue.c] isn't the same as allowed value
```

License
-------

ISC

Copyright 2021 Roman Ditchuk

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
