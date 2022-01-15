// common

export type Validator<T> = (v: any, path: string) => T;

export const optional = <T>(handler: Validator<T>): Validator<T | undefined> => (v, path) => {
    if (v === undefined) {
        return undefined;
    }
    return handler(v, path);
};

export const defaultValue = <T>(def: T, handler: Validator<T>): Validator<T> => (v, path): T => {
    if (v === undefined) {
        return def;
    }
    return handler(v, path);
};

export const nullable = <T>(handler: Validator<T>): Validator<T | null> => (v, path) => {
    if (v === null) {
        return null;
    }
    return handler(v, path);
};

export const object = <Description extends Record<string, Validator<any>>>(
    desc: Description,
    {ignoreUnknown, min, max}: {
        ignoreUnknown?: boolean;
        min?: number;
        max?: number;
    } = {},
): Validator<{
    [key in keyof Description]: Description[key] extends Validator<infer T> ? T : never;
}> => (v, path) => {
    if(typeof v !== 'object' || !v || Array.isArray(v)) {
        throw new Error(`[${path}] should be an object`);
    }
    const res: any = {};
    for (const key in desc) {
        res[key] = desc[key](v[key], `${path}.${key}`);
    }
    if ((min !== undefined && Object.keys(v).length < min) || (max !== undefined && Object.keys(v).length > max)) {
        throw new Error(`[${path}] size isn\'t in allowed range`);
    }
    for (const key in v) {
        if (!desc[key]) {
            if (ignoreUnknown) {
                res[key] = v[key];
            } else {
                throw new Error(`Property [${path}.${key}] is unknown`);
            }
        }
    }
    return res;
};

export const boolean = (): Validator<boolean> => (v, path) => {
    if (typeof v !== 'boolean') {
        throw new Error(`[${path}] should be a boolean`);
    }
    return v;
};

export const strToBoolean = (): Validator<boolean> => (v, path) => {
    if (typeof v === 'string') {
        v = ({1: true, 'yes': true, 'true': true, 0: false, 'no': false, 'false': false})[v.toLowerCase()];
    }
    return boolean()(v, path);
}

export const string = ({pattern, min, max}: {
    pattern?: RegExp,
    min?: number;
    max?: number;
} = {}): Validator<string> => (v, path) => {
    if(typeof v !== 'string') {
        throw new Error(`[${path}] should be a string`);
    }
    if (pattern && !pattern.test(v)) {
        throw new Error(`[${path}] doesn't match the pattern`);
    }
    if ((min && v.length < min) || (max && v.length > max)) {
        throw new Error(`[${path}] length isn\'t in allowed range`);
    }
    return v;
}

export const int = ({min, max}: {min?: number; max?: number} = {}): Validator<number> => (v, path) => {
    if (!Number.isInteger(v)) {
        throw new Error(`[${path}] should be an integer`);
    }
    if ((min !== undefined && v < min) || (max !== undefined && v > max)) {
        throw new Error(`[${path}] isn\'t in allowed range`);
    }
    return v;
};

export const strToInt = (options?: Parameters<typeof int>[0]): Validator<number> => (v, path) => {
    if (typeof v === 'string') {
        v = parseInt(v, 10);
    }
    return int(options)(v, path);
}

export const float = ({min, max}: {min?: number, max?: number} = {}): Validator<number> => (v, path) => {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) {
        throw new Error(`[${path}] should be a float`);
    }
    if ((min !== undefined && n < min) || (max !== undefined && n > max)) {
        throw new Error(`[${path}] isn\'t in allowed range`);
    }
    return n;
};

export const strToFloat = (options?: Parameters<typeof float>[0]): Validator<number> => (v, path) => {
    if (typeof v === 'string') {
        v = parseFloat(v);
    }
    return float(options)(v, path);
}

export const alternatives = <Alts extends ReadonlyArray<Validator<any>>>(
    alts: Alts,
) => (v: any, path: string): (Alts extends ReadonlyArray<Validator<infer T>> ? T : never) => {
    const errs: string[] = [];
    for (let i = 0; i < alts.length; i++) {
        try {
            return alts[i](v, `${path}.@alternative(${i})`);
        } catch (err: any) {
            errs.push(err.message);
        }
    }
    throw new Error(`All alternatives failed for [${path}]:\n\t${errs.join('\n\t')}`);
};

export const arrayOf = <T>(itemValidator: Validator<T>, {min, max}: {
    min?: number;
    max?: number;
} = {}): Validator<T[]> => (v, path) => {
    if (!Array.isArray(v)) {
        throw new Error(`[${path}] should be an array`);
    }
    if ((min !== undefined && v.length < min) || (max !== undefined && v.length > max)) {
        throw new Error(`[${path}] length isn\'t in allowed range`);
    }
    return v.map((item, index) => itemValidator(item, `${path}[${index}]`));
};

export const UUID = () => string({
    pattern: /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/,
});

export const email = () => string({
    pattern: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
});

export const transform = <In, Out>(validator: Validator<In>, handler: (v: In, path: string) => Out): Validator<Out> => (v, path) => {
    return handler(validator(v, path), path);
};

export const oneOf = <T>(
    values: ReadonlyArray<T>,
): Validator<T> => (v, path): T => {
    if (values.indexOf(v) === -1) {
        throw new Error(`[${path}] isn't equal to any of predefined values`);
    }
    return v;
};

export const exact = <T>(
    value: T,
): Validator<T> => (v, path) => {
    if (value !== v) {
        throw new Error(`[${path}] isn't equal to predefined value`);
    }
    return v;
};
