// ==UserScript==
// @name         team call
// @author       错误
// @version      2.0.3
// @description  .team 获取帮助。在其他框架看到类似的插件，找了一下发现海豹似乎没有，故自己写一个。使用.team获取帮助。非指令关键词部分请查看插件配置。
// @timestamp    1724468302
// 2024-08-24 10:58:22
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/%E8%B0%83%E6%9F%A5%E5%91%98%E9%98%9F%E4%BC%8D.js
// ==/UserScript==

// 首先检查是否已经存在
let ext = seal.ext.find('team call');
if (!ext) {
    ext = seal.ext.new('team call', '错误', '2.0.3');
    seal.ext.register(ext);
    const data = {}

    seal.ext.registerStringConfig(ext, '新建队伍回复', '新建{{队伍名字}}成功')
    seal.ext.registerStringConfig(ext, '删除队伍回复', '删除{{队伍名字}}成功')
    seal.ext.registerStringConfig(ext, '绑定队伍回复', '绑定{{队伍名字}}成功')
    seal.ext.registerStringConfig(ext, '展示队伍列表前缀', '队伍如下')
    seal.ext.registerStringConfig(ext, '添加成员回复', '成功添加{{被@的长度}}位调查员，当前队伍人数{{当前人数}}人。')
    seal.ext.registerStringConfig(ext, '删除成员回复', '成功删除{{被@的长度}}位调查员，当前队伍人数{{当前人数}}人。')
    seal.ext.registerStringConfig(ext, '呼叫队伍里所有成员前缀语', '下面的人来跑团啦！请在限定时间{{时间限制}}s内回复“到”：')
    seal.ext.registerStringConfig(ext, 'call结束前缀语', '应到{{当前人数}}人，实到{{签到人数}}人，未到{{咕咕人数}}人。未到如下：')
    seal.ext.registerIntConfig(ext, '呼叫时间限制（s）', 60)
    seal.ext.registerStringConfig(ext, '展示成员前缀语', '成员如下')
    seal.ext.registerStringConfig(ext, '展示属性前缀语', '属性如下')
    seal.ext.registerStringConfig(ext, '排序前缀语', '排序如下')

    seal.ext.registerStringConfig(ext, '队伍为空', '队伍里没有成员。')

    seal.ext.registerTemplateConfig(ext, '呼叫全队关键词', ['开团了', '集合！'])
    seal.ext.registerTemplateConfig(ext, '战斗轮排序关键词', ['（战斗轮开始）'])
    seal.ext.registerTemplateConfig(ext, '签到关键词', ['到', '到！', '1'])

    function getCtxById(epId, groupId, guildId, senderId) {
        let eps = seal.getEndPoints();
        for (let i = 0; i < eps.length; i++) {
            if (eps[i].userId === epId) {
                let msg = seal.newMessage();
                msg.messageType = "group";
                msg.groupId = groupId;
                msg.guildId = guildId;
                msg.sender.userId = senderId;
                return seal.createTempCtx(eps[i], msg);
            }
        }
        return undefined;
    }

    function getData(groupId) {
        try {
            data[groupId] = {};
            let groupData = JSON.parse(ext.storageGet(groupId) || '{}');
            data[groupId] = {
                teams: groupData.teams || { '默认队伍': [] },
                teamnow: groupData.teamnow || '默认队伍',
                call: groupData.call || []
            };
        } catch (error) {
            console.error(`Failed to initialize group data for groupId ${groupId}:`, error);
            data[groupId] = {
                teams: { '默认队伍': [] },
                teamnow: '默认队伍',
                call: []
            }
        }
    }

    const saveData = (groupId) => {
        ext.storageSet(groupId, JSON.stringify(data[groupId]));
    };

    function call(groupId, teamnow, ctx, msg) {
        const timeLimit = seal.ext.getIntConfig(ext, "呼叫时间限制（s）")
        const callPrefix = seal.ext.getStringConfig(ext, "呼叫队伍里所有成员前缀语")
        let text = callPrefix.replace('{{时间限制}}', timeLimit);

        for (let userId of data[groupId].teams[teamnow]) text += `\n[CQ:at,qq=${userId.replace(/\D+/g, "")}]`;
        seal.replyToSender(ctx, msg, text);

        data[groupId].call = data[groupId].teams[teamnow];
        setTimeout(() => {
            let text = seal.ext.getStringConfig(ext, "call结束前缀语");
            text = text
                .replace('{{当前人数}}', data[groupId].teams[teamnow].length)
                .replace('{{签到人数}}', data[groupId].teams[teamnow].length - data[groupId].call.length)
                .replace('{{咕咕人数}}', data[groupId].call.length);
            for (let userId of data[groupId].call) text += `\n[CQ:at,qq=${userId.replace(/\D+/g, "")}]`;
            seal.replyToSender(ctx, msg, text)
        }, timeLimit * 1000);
    }

    function sortAttrb(groupId, teamnow, ctx, msg, attrb) {
        const sortPrefix = seal.ext.getStringConfig(ext, "排序前缀语");

        let text = sortPrefix
        let ctxlst = data[groupId].teams[teamnow].map(userId => { return getCtxById(ctx.endPoint.userId, groupId, msg.guildId, userId); });
    
        ctxlst.sort(function (a, b) { return seal.vars.intGet(b, attrb)[0] - seal.vars.intGet(a, attrb)[0]; });
        for (let ctx of ctxlst) text += `\n${ctx.player.name} ${attrb}${seal.vars.intGet(ctx, attrb)[0]}`;
    
        seal.replyToSender(ctx, msg, text);
    }

    const cmdteam = seal.ext.newCmdItemInfo();
    cmdteam.name = 'team';
    cmdteam.help = `帮助：
【.team new 队伍名字】新建一个队伍
【.team del 队伍名字/now】删除该队伍
【.team bind 队伍名字】绑定该队伍
【.team lst】队伍列表
【.team add (me)@xx@xxx...】添加若干成员
【.team rm (me)@xx@xxx...】删除若干成员
【.team clr】删除所有成员
【.team call】调查员集结！
【.team show】成员列表
【.team st (属性名/表达式)】查看属性(修改属性)
【.team sort 属性名】对成员的该项属性排序`;
    cmdteam.allowDelegate = true;
    cmdteam.disabledInPrivate = true;
    cmdteam.solve = (ctx, msg, cmdArgs) => {
        if (ctx.isPrivate) return;

        let val = cmdArgs.getArgN(1);
        let val2 = cmdArgs.getArgN(2);
        let groupId = ctx.group.groupId
        if (!data.hasOwnProperty(groupId)) getData(groupId)
        let teamnow = data[groupId].teamnow

        //获取所有被@的人
        let atlst = []
        if (val2 == 'me') atlst.push(ctx.player.userId)
        cmdArgs.at.forEach(item => { if (item.userId != ctx.endPoint.userId) atlst.push(item.userId); });

        switch (val) {
            case 'help': {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
            case 'new': {
                if (!val2) {
                    seal.replyToSender(ctx, msg, "参数错误，【.team new 队伍名字】新建一个队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }
                data[groupId].teams[val2] = []
                data[groupId].teamnow = val2
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "新建队伍回复").replace('{{队伍名字}}', val2))
                saveData(groupId)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'del': {
                if (!val2) {
                    seal.replyToSender(ctx, msg, "参数错误，【.team del 队伍名字/now】删除该队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (val2 == 'now') {
                    if (!data[groupId].teams.hasOwnProperty(teamnow)) {
                        seal.replyToSender(ctx, msg, "未绑定队伍")
                        return seal.ext.newCmdExecuteResult(true);
                    }
                    val2 = teamnow
                }
                if (!data[groupId].teams.hasOwnProperty(val2)) {
                    seal.replyToSender(ctx, msg, "队伍不存在")
                    return seal.ext.newCmdExecuteResult(true);
                }
                delete data[groupId].teams[val2]
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "删除队伍回复").replace('{{队伍名字}}', val2))
                saveData(groupId)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'bind': {
                if (!val2) {
                    seal.replyToSender(ctx, msg, "参数错误，【.team bind 队伍名字】绑定该队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (!data[groupId].teams.hasOwnProperty(val2)) {
                    seal.replyToSender(ctx, msg, "队伍不存在")
                    return seal.ext.newCmdExecuteResult(true);
                }
                data[groupId].teamnow = val2
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "绑定队伍回复").replace('{{队伍名字}}', val2))
                saveData(groupId)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'lst': {
                let text = seal.ext.getStringConfig(ext, "展示队伍列表前缀")
                for (let key in data[groupId].teams) {
                    text += `\n${key} ${data[groupId].teams[key].length}人`;
                }
                text += `\n当前队伍：${teamnow}`

                seal.replyToSender(ctx, msg, text)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'add': {
                if (!data[groupId].teams.hasOwnProperty(teamnow)) {
                    seal.replyToSender(ctx, msg, "未绑定队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }

                //添加进去
                atlst.forEach(userId => { if (!data[groupId].teams[teamnow].includes(userId)) data[groupId].teams[teamnow].push(userId); });

                let text = seal.ext.getStringConfig(ext, "添加成员回复")
                text = text.replace('{{被@的长度}}', atlst.length)
                text = text.replace('{{当前人数}}', data[groupId].teams[teamnow].length)
                seal.replyToSender(ctx, msg, text)
                saveData(groupId)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'rm': {
                if (!data[groupId].teams.hasOwnProperty(teamnow)) {
                    seal.replyToSender(ctx, msg, "未绑定队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }

                data[groupId].teams[teamnow] = data[groupId].teams[teamnow].filter(userId => !atlst.includes(userId))

                let text = seal.ext.getStringConfig(ext, "删除成员回复")
                text = text.replace('{{被@的长度}}', atlst.length)
                text = text.replace('{{当前人数}}', data[groupId].teams[teamnow].length)
                seal.replyToSender(ctx, msg, text)
                saveData(groupId)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'clr': {
                if (!data[groupId].teams.hasOwnProperty(teamnow)) {
                    seal.replyToSender(ctx, msg, "未绑定队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }

                data[groupId].teams[teamnow] = []
                seal.replyToSender(ctx, msg, "队伍已清空")
                saveData(groupId)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'call': {
                if (!data[groupId].teams.hasOwnProperty(teamnow)) {
                    seal.replyToSender(ctx, msg, "未绑定队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (data[groupId].teams[teamnow].length == 0) {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                    return seal.ext.newCmdExecuteResult(true);
                }

                call(groupId, teamnow, ctx, msg);
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'show': {
                if (!data[groupId].teams.hasOwnProperty(teamnow)) {
                    seal.replyToSender(ctx, msg, "未绑定队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (data[groupId].teams[teamnow].length == 0) {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                    return seal.ext.newCmdExecuteResult(true);
                }

                let text = seal.ext.getStringConfig(ext, "展示成员前缀语")
                for (let userId of data[groupId].teams[teamnow]) {
                    let mctx = getCtxById(ctx.endPoint.userId, groupId, msg.guildId, userId);
                    text += `\n${mctx.player.name}`;
                }
                seal.replyToSender(ctx, msg, text)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'st': {
                if (!data[groupId].teams.hasOwnProperty(teamnow)) {
                    seal.replyToSender(ctx, msg, "未绑定队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (data[groupId].teams[teamnow].length == 0) {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                    return seal.ext.newCmdExecuteResult(true);
                }

                if (!val2) {
                    let text = seal.ext.getStringConfig(ext, "展示属性前缀语")
                    for (let userId of data[groupId].teams[teamnow]) {
                        let mctx = getCtxById(ctx.endPoint.userId, groupId, msg.guildId, userId);
                        text += `\n${mctx.player.name} hp${seal.vars.intGet(mctx, 'hp')[0]}/${Math.floor((seal.vars.intGet(mctx, 'con')[0] + seal.vars.intGet(mctx, 'siz')[0]) / 10)} san${seal.vars.intGet(mctx, 'san')[0]}/${seal.vars.intGet(mctx, 'pow')[0]} dex${seal.vars.intGet(mctx, 'dex')[0]}`;
                    }
                    seal.replyToSender(ctx, msg, text)
                    return seal.ext.newCmdExecuteResult(true);
                }

                let match = val2.match(/^(.*?)([\d+\-*\/d]+)$/)
                let text = seal.ext.getStringConfig(ext, "展示属性前缀语")

                if (!match) {
                    for (let userId of data[groupId].teams[teamnow]) {
                        let mctx = getCtxById(ctx.endPoint.userId, groupId, msg.guildId, userId);
                        text += `\n${mctx.player.name} ${val2}${seal.vars.intGet(mctx, val2)[0]}`;
                    }
                    seal.replyToSender(ctx, msg, text)
                    return seal.ext.newCmdExecuteResult(true);
                }
                let attr = match[1]
                let expression = match[2]
                let op = expression.match(/^([+\-])/)?.[1]
                let result = op ? `{${attr}=${val2}}` : `{${attr}=${expression}}`
                text += `\n操作:${val2}`
                for (let userId of data[groupId].teams[teamnow]) {
                    let mctx = getCtxById(ctx.endPoint.userId, groupId, msg.guildId, userId);
                    text += `\n${mctx.player.name} ${seal.vars.intGet(mctx, attr)[0]}=>${seal.format(mctx, result)}`
                }
                seal.replyToSender(ctx, msg, text)
                return seal.ext.newCmdExecuteResult(true);
            }
            case 'sort': {
                if (!data[groupId].teams.hasOwnProperty(teamnow)) {
                    seal.replyToSender(ctx, msg, "未绑定队伍")
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (data[groupId].teams[teamnow].length == 0) {
                    seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                    return seal.ext.newCmdExecuteResult(true);
                }
                if (!val2) {
                    seal.replyToSender(ctx, msg, "参数错误，【.team sort 属性名】对成员的该项属性排序")
                    return seal.ext.newCmdExecuteResult(true);
                }

                sortAttrb(groupId, teamnow, ctx, msg, val2);
                return seal.ext.newCmdExecuteResult(true);
            }
            default: {
                const ret = seal.ext.newCmdExecuteResult(true);
                ret.showHelp = true;
                return ret;
            }
        }
    };

    ext.onNotCommandReceived = (ctx, msg) => {
        if (ctx.isPrivate) return;
        let message = msg.message
        let groupId = ctx.group.groupId

        const callWords = seal.ext.getTemplateConfig(ext, "呼叫全队关键词")
        const sortWords = seal.ext.getTemplateConfig(ext, "战斗轮排序关键词")
        const signWords = seal.ext.getTemplateConfig(ext, "签到关键词")

        if (callWords.includes(message)) {
            if (!data.hasOwnProperty(groupId)) getData(groupId)
            let teamnow = data[groupId].teamnow

            if (!data[groupId].teams.hasOwnProperty(teamnow)) {
                seal.replyToSender(ctx, msg, "未绑定队伍")
                return seal.ext.newCmdExecuteResult(true);
            }
            if (data[groupId].teams[teamnow].length == 0) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                return seal.ext.newCmdExecuteResult(true);
            }

            call(groupId, teamnow, ctx, msg);
            return seal.ext.newCmdExecuteResult(true);
        }
        if (signWords.includes(message)) {
            if (!data.hasOwnProperty(groupId)) getData(groupId)
            if (data[groupId].call.length == 0) return;

            data[groupId].call = data[groupId].call.filter(userId => userId != ctx.player.userId)
            return;
        }
        if (sortWords.includes(message)) {
            if (!data.hasOwnProperty(groupId)) getData(groupId)
            let teamnow = data[groupId].teamnow

            if (!data[groupId].teams.hasOwnProperty(teamnow)) {
                seal.replyToSender(ctx, msg, "未绑定队伍")
                return seal.ext.newCmdExecuteResult(true);
            }
            if (data[groupId].teams[teamnow].length == 0) {
                seal.replyToSender(ctx, msg, seal.ext.getStringConfig(ext, "队伍为空"))
                return seal.ext.newCmdExecuteResult(true);
            }

            sortAttrb(groupId, teamnow, ctx, msg, 'dex');
            return seal.ext.newCmdExecuteResult(true);
        }
    }

    // 将命令注册到扩展中
    ext.cmdMap['team'] = cmdteam;
    ext.cmdMap['tm'] = cmdteam;
}