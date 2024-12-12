// ==UserScript==
// @name         HTTP依赖
// @author       错误
// @version      1.0.0
// @description  为插件提供HTTP依赖。\n使用方法: http.getData(epId, val, data=null)
// @timestamp    1733626761
// 2024-12-08 10:59:21
// @license      MIT
// @homepageURL  https://github.com/error2913/sealdice-js/
// @updateUrl    https://mirror.ghproxy.com/https://raw.githubusercontent.com/error2913/sealdice-js/main/HTTP依赖.js
// @updateUrl    https://raw.githubusercontent.com/error2913/sealdice-js/main/HTTP依赖.js
// ==/UserScript==

let ext = seal.ext.find('HTTP依赖');
if (!ext) {
    ext = seal.ext.new('HTTP依赖', '错误', '1.0.0');
    seal.ext.register(ext);
}

seal.ext.registerTemplateConfig(ext, 'HTTP端口地址', ['http://127.0.0.1:8084'], '修改后保存并重载js');

const urlMap = {};

async function fetchData(url, data = null) {
    try {
        const response = data === null ? await fetch(url) : await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        const body = await response.json();
        const result = body.data;
        if (result === null) {
            throw new Error('数据为空');
        }
        console.log(`获取数据成功: ${JSON.stringify(result, null, 2)}`);
        return result;
    } catch (error) {
        console.error(`获取数据失败: ${error.message}`);
        return null;
    }
}

async function init() {
    const ports = seal.ext.getTemplateConfig(ext, 'HTTP端口地址');

    for (let i = 0; i < ports.length; i++) {
        const port = ports[i];
        const url = `${port}/get_login_info`;
        const data = await fetchData(url);
        if (data === null) {
            console.error(`获取登录信息失败: ${port}`);
            continue;
        }
        const epId = `QQ:${data.user_id}`;
        const eps = seal.getEndPoints();
        for (let i = 0; i < eps.length; i++) {
            if (eps[i].userId === epId) {
                urlMap[epId] = port;
                console.log(`找到${epId}端口: ${port}`);
                break;
            }
        }
    }
    console.log('初始化完成，urlMap: ', JSON.stringify(urlMap, null, 2));
}
init();

class Http {
    constructor(urlMap) {
        this.urlMap = urlMap;
    }

    async getData(epId, val, data = null) {
        if (!urlMap.hasOwnProperty(epId)) {
            console.error(`未找到端口: ${epId}`);
            return null;
        }

        const url = `${urlMap[epId]}/${val}`;
        console.log('请求地址: ', url);
        const result = await fetchData(url, data);
        return result;
    }
}

globalThis.http = new Http(urlMap);

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'http';
cmd.help = '';
cmd.solve = async (ctx, msg, cmdArgs) => {
    const epId = ctx.endPoint.userId;
    const val = cmdArgs.getArgN(1);
    if (!val) {
        seal.replyToSender(ctx, msg, '未找到参数1');
        return seal.ext.newCmdExecuteResult(true);
    }
    const data = await globalThis.http.getData(epId, val);
    seal.replyToSender(ctx, msg, JSON.stringify(data, null, 2));
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['http'] = cmd;   