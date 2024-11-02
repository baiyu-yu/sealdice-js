// 这里是不同动物的各种属性

import { Player } from "./player";

export interface Animal {
    species: string;
    info: string;
    env: string;
    enemy: string[];//敌人和食物，用于在遭遇的时候判断
    food: string[];
    events: string[];//这是被动事件，探索时可能触发
    attr: {
        hp: number;
        atk: number;
        def: number;
        dex: number;
        lck: number;
    }
}

export function parseAnimal(data: any): Animal {
    if (!data) {
        return {
            species: "未知物种",
            info: "未知",
            env: "未知环境",
            enemy: [],
            food: [],
            events: [],
            attr: {
                hp: 0,
                atk: 0,
                def: 0,
                dex: 0,
                lck: 0,
            }
        }
    }
    return {
        species: data.species || "未知物种",
        info: data.info || "未知",
        env: data.env || "未知环境",
        enemy: data.enemy || [],
        food: data.food || [],
        events: data.events || [],
        attr: {
            hp: data.attr.hp || 0,
            atk: data.attr.atk || 0,
            def: data.attr.def || 0,
            dex: data.attr.dex || 0,
            lck: data.attr.lck || 0,
        }
    }
}

export function getAnimal(player: Player): void {
    const animals = Object.keys(animalMap);
    const animal = animalMap[animals[Math.floor(Math.random() * animals.length)]];

    player.animal = animal;
}

const animalMap: { [key: string]: Animal } = {};

animalMap["黑鱼"] = {
    species: "黑鱼",
    info: "可怕的黑鱼",
    env: "池塘",
    enemy: ["白鱼"],
    food: ["黑鱼", "乌龟", "水草"],
    events: [],
    attr: {
        hp: 10,
        atk: 100,
        def: 10,
        dex: 100,
        lck: 1,
    }
}

animalMap["白鱼"] = {
    species: "白鱼",
    info: "可怕的白鱼",
    env: "池塘",
    enemy: ["黑鱼"],
    food: ["黑鱼", "乌龟", "水草"],
    events: [],
    attr: {
        hp: 100,
        atk: 50,
        def: 10,
        dex: 60,
        lck: 50,
    }
}

animalMap["乌龟"] = {
    species: "乌龟",
    info: "可怕的乌龟",
    env: "池塘",
    enemy: ["黑鱼", "白鱼"],
    food: ["水草"],
    events: [],
    attr: {
        hp: 100,
        atk: 1,
        def: 100,
        dex: 1,
        lck: 1,
    }
}

export { animalMap };