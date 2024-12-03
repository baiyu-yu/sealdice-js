import { Backpack } from "../backpack/backpack";
import { VarsInfo, VarsMap } from "../vars/varsManager";

export class Player {
    uid: string;
    name: string;
    backpack: Backpack;
    varsMap: VarsMap;

    constructor(uid: string, vi: VarsInfo) {
        this.uid = uid;
        this.name = '';
        this.backpack = new Backpack();
        this.varsMap = globalThis.varsManager.parse(null, vi);
    }

    static parse(data: any, uid: string, vi: VarsInfo): Player {
        if (data === null || typeof data!== 'object' || Array.isArray(data)) {
            data = {};
        }

        const player = new Player(uid, vi);

        if (data.hasOwnProperty('name')) {
            player.name = data.name;
        }

        if (data.hasOwnProperty('backpack')) {
            player.backpack = Backpack.parse(data.backpack, null);
        }

        if (data.hasOwnProperty('varsMap')) {
            player.varsMap = globalThis.varsManager.parse(data.varsMap, vi);
        }

        return player;
    }
}