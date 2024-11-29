import { Backpack } from "./backpack";
import { varsInfo, varsManager, varsMap } from "./vars";

export class Player {
    uid: string;
    gameKey: string;
    playerKey: string;
    backpack: Backpack;
    varsMap: varsMap;

    constructor(uid: string, gk: string, pk: string, v: varsInfo) {
        this.uid = uid;
        this.gameKey = gk;
        this.playerKey = pk;
        this.backpack = new Backpack(gk, pk, null);
        this.varsMap = varsManager.parse(null, gk, pk, v);
    }
}

export class PlayerManager {
    ext: seal.ExtInfo;
    gameKey: string;
    map: {
        [key: string]: {
            varsInfo:varsInfo,
            cache: {
                [key: string]: Player
            }
        }
    }

    constructor(ext: seal.ExtInfo, gk: string) {
        this.ext = ext;
        this.gameKey = gk;
        this.map = {};
    }

    parse(uid: string, data: any, pk: string, v: varsInfo): Player {
        if (!data.hasOwnProperty(uid)) {
            console.log(`创建新玩家:${uid}`);
        }

        const gk = this.gameKey;
        const player = new Player(uid, gk, pk, v);

        if (data.hasOwnProperty('backpack')) {
            player.backpack = new Backpack(gk, pk, data.backpack);
        }

        if (data.hasOwnProperty('varsMap')) {
            player.varsMap = varsManager.parse(data.varsMap, gk, pk, v);
        }

        return player;
    }

    /**
     * 
     * @param pk 键
     * @param v 类型和默认值，例如
     * ```
     * {
     *              "good":['boolean',false],
     *              "nickname":['string','错误'],
     *              "coin":['number',114514],
     *              "bag":['backpack',{
     *                  "炸弹":999,
     *                  "钻石":666
     *              }]
     * }
     * ```
     * @returns 
     */
    registerPlayer(pk: string, v: any) {
        if (this.map.hasOwnProperty(pk)) {
            console.error(`注册玩家信息${pk}时出现错误:该名字已被占用`);
            return;
        }

        if (!varsManager.checkTypeVarsInfo(v)) {
            console.error(`注册玩家信息${pk}时出现错误:${v}不是合法的类型，或含有不合法类型`);
            return;
        }

        this.map[pk] = {
            varsInfo: v,
            cache: {}
        }
    }

    getPlayer(pk: string, uid: string): Player | undefined {
        if (!this.map.hasOwnProperty(pk)) {
            console.error(`获取玩家信息${pk}时出现错误:该名字未注册`);
            return undefined;
        }

        if (!this.map[pk].cache.hasOwnProperty(uid)) {
            let data = {};

            try {
                data = JSON.parse(this.ext.storageGet(`player_${pk}_${uid}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取${`player_${pk}_${uid}`}失败:`, error);
            }
    
            const v = this.map[pk].varsInfo;
            this.map[pk].cache[uid] = this.parse(uid, data, pk, v);
        }

        return this.map[pk].cache[uid];
    }

    savePlayer(pk: string, uid: string) {
        if (!this.map.hasOwnProperty(pk)) {
            console.error(`保存玩家信息${pk}时出现错误:该名字未注册`);
            return;
        }

        if (!this.map[pk].cache.hasOwnProperty(uid)) {
            this.getPlayer(pk, uid);
        }

        this.ext.storageSet(`player_${pk}_${uid}`, JSON.stringify(this.map[pk].cache[uid]));
    }
}