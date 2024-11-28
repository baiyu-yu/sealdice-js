import { Backpack } from "./backpack"
import { PropInfo } from "./prop"

export interface varsMap {
    [key: string]: boolean | string | number | Backpack
}

export interface varsInfo {
    [key: string]:
        ['boolean', boolean] |
        ['string', string] |
        ['number', number] |
        ['backpack', {
            [key: string]: PropInfo
        }]
}

export class varsManager {
    static checkType(data: any): boolean {
        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            return false;
        }

        for (let key of Object.keys(data)) {
            if (
                (data[key][0] == 'boolean' && typeof data[key][1] == 'boolean') ||
                (data[key][0] == 'string' && typeof data[key][1] == 'string') ||
                (data[key][0] == 'number' && typeof data[key][1] == 'number') ||
                data[key][0] == 'backpack' && Backpack.checkType(data[key][1])
            ) {
                continue;
            }

            return false;
        }

        return true;
    }

    static parse(data: any, v: varsInfo): varsMap {
        const result: varsMap = {};

        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            data = {};
        }

        for (let key of Object.keys(v)) {
            if (
                v[key][0] == 'boolean' ||
                v[key][0] == 'string' ||
                v[key][0] == 'number'
            ) {
                if (data.hasOwnProperty(key) && typeof data[key] == v[key][0]) {
                    result[key] = data[key];
                } else {
                    result[key] = v[key][1];
                }
            }

            if (v[key][0] == 'backpack') {
                if (data.hasOwnProperty(key)) {
                    result[key] = new Backpack(data[key], v[key][1]);
                } else {
                    result[key] = new Backpack(null, v[key][1]);
                }
            }
        }

        return result;
    }
}