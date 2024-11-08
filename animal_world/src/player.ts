//这里是一个玩家类，用于存储玩家的信息和行为

import { cache } from ".";
import { Animal, getAnimal } from "./animal";
import { addEntries, getEntries } from "./entry";
import { envMap } from "./env";
import { playerList, savePlayerList } from "./playerManager";
import { parseAnimal } from "./utils";

export class Player {
    public id: string;
    public name: string;
    public animal: Animal;
    public score: number;
    public entries: string[];//词条列表

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.animal = {
            species: "未知物种",
            info: "未知",
            env: "未知环境",
            evolve: "",
            age: [0, 999],
            enemy: [],
            food: [],
            events: {
                active: [],
                passive: []
            },
            attr: {
                hp: 0,
                atk: 0,
                def: 0,
                dex: 0,
                lck: 0,
            }
        };
        this.score = 0;
        this.entries = [];
    }

    public static getPlayer(ext: seal.ExtInfo, id: string, ctx: seal.MsgContext = undefined): Player {
        if (!cache.hasOwnProperty(id)) {
            let data: any;

            try {
                data = JSON.parse(ext.storageGet(`player_${id}`) || '{}');
            } catch (error) {
                console.error(`从数据库中获取player_${id}失败:`, error);
                data = {};
            }

            if (data && Object.keys(data).length > 0) {
                cache[id] = Player.parse(data);
            } else {
                cache[id] = Player.createPlayer(id, ctx.player.name || "未知玩家");
                playerList.push(id);
                savePlayerList(ext);
            }
        }

        return cache[id];
    }

    public static savePlayer(ext: seal.ExtInfo, player: Player): void {
        ext.storageSet(`player_${player.id}`, JSON.stringify(player));
    }

    public static parse(data: any): Player {
        let player: Player;

        try {
            player = new Player(data.id, data.name);

            player.animal = parseAnimal(data.animal);
            player.score = data.score;
            player.entries = data.entries;
        } catch (err) {
            console.error(`解析玩家失败:`, err);
            player = new Player('', '');
        }

        return player;
    }

    public static createPlayer(id: string, name: string): Player {
        const player = new Player(id, name);

        player.animal = getAnimal();
        const entries = getEntries(3);
        addEntries(player, entries);

        return player;
    }

    //TODO:随机ID，随机名字
    public static createRobot(species: string): Player {
        return Player.createPlayer(`Robot`, `奇怪的${species}`);
    }

    public static getRandomPlayer(species: string[]): Player {
        const players = Object.values(cache).filter(player => {
            if (species.length == 0) {
                return true;
            }

            return species.includes(player.animal.species)
        });

        if (players.length == 0) {
            return this.createRobot(species[Math.floor(Math.random() * species.length)]);
        }

        return players[Math.floor(Math.random() * players.length)];
    }

    public age(ctx: seal.MsgContext, msg: seal.Message): void {
        this.animal.age[0] += 1;

        if (this.animal.age[0] > this.animal.age[1]) {
            this.revive();

            seal.replyToSender(ctx, msg, `<${this.name}>老死了。转生成了新的动物: ${this.animal.species}`);
        }
    }

    public revive(): void {
        this.entries = [];

        this.animal = getAnimal();
        const entries = getEntries(1);
        addEntries(this, entries);
    }

    public survive(ctx: seal.MsgContext, msg: seal.Message, event: string): void {
        if (!event || !this.animal.events.active.includes(event)) {
            seal.replyToSender(ctx, msg, `可选：${this.animal.events.active.join('、')}`);
            return;
        }

        if (!envMap[this.animal.env].events.hasOwnProperty(event)) {
            seal.replyToSender(ctx, msg, `错误，这个事件可能忘记写了:${event}`);
            return;
        }

        envMap[this.animal.env].events[event].solve(ctx, msg, [this]);
        this.age(ctx, msg);
    }

    public explore(ctx: seal.MsgContext, msg: seal.Message): void {
        const events = this.animal.events.passive;

        if (events.length == 0) {
            seal.replyToSender(ctx, msg, `没有可以探索的`);
            return;
        }

        const event = events[Math.floor(Math.random() * events.length)];

        if (!envMap[this.animal.env].events.hasOwnProperty(event)) {
            seal.replyToSender(ctx, msg, `错误，这个事件可能忘记写了:${event}`);
            return;
        }

        envMap[this.animal.env].events[event].solve(ctx, msg, [this]);
        this.age(ctx, msg);
    }

    public multiply(ctx: seal.MsgContext, msg: seal.Message): void {
        if (this.animal.age[0] < this.animal.age[1] * 0.15) {
            seal.replyToSender(ctx, msg, `繁衍失败，年龄不够`);
            return;
        }

        if (Math.random() * this.animal.attr.hp * (this.animal.age[1] - this.animal.age[0]) <= 10) {
            seal.replyToSender(ctx, msg, `繁衍失败`);
            this.age(ctx, msg);
            return;
        }

        const num = Math.floor(this.animal.attr.hp / 10);
        this.score += num;
        const entry = getEntries(1);
        addEntries(this, entry);

        seal.replyToSender(ctx, msg, `<${this.name}>繁衍了${num}个后代，积分加${num}。新的词条：${entry[0].name}`);
        this.age(ctx, msg);
        return;
    }

    public evolve(ctx: seal.MsgContext, msg: seal.Message): void {
        if (!this.animal.evolve) {
            seal.replyToSender(ctx, msg, `进化失败，没有进化路线`);
            return;
        }

        if (this.entries.length < 5) {
            seal.replyToSender(ctx, msg, `进化失败，词条不足`);
            return;
        }

        this.entries.splice(0, 5);
        this.animal = getAnimal(this.animal.evolve);
        const entries = getEntries(1);
        addEntries(this, entries);
        this.score += 5;

        seal.replyToSender(ctx, msg, `<${this.name}>进化了，进化为${this.animal.species}。得5分`);
    }

    /* TODO
    //遭遇其他玩家？
    public meet(ctx: seal.MsgContext, msg: seal.Message): void {}
    */
}