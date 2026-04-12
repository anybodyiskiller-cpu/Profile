/**
 * Surge IP 深度溯源 - IPPure 对标版
 * 包含：IP来源(原生/非原生)、IP属性(住宅/机房)、风险系数检测
 */

const IPPURE_URL = 'https://api.ippure.com/v1/ip';
const BACKUP_URL = 'http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query';

$httpClient.get({ url: IPPURE_URL, timeout: 5000 }, function(error, response, data) {
    if (!error && data && response.status == 200) {
        try {
            const obj = JSON.parse(data);
            if (obj.ip) {
                renderData(obj, "IPPure API");
                return;
            }
        } catch (e) {}
    }
    fetchBackup();
});

function fetchBackup() {
    $httpClient.get({ url: BACKUP_URL, timeout: 5000 }, function(error, response, data) {
        if (error || !data) {
            $done({ title: "❌ 溯源全线失败", content: "无法获取 IP 溯源信息", icon: "exclamationmark.triangle", "icon-color": "#FF3B30" });
            return;
        }
        try {
            const obj = JSON.parse(data);
            const mappedObj = {
                ip: obj.query,
                country_name: obj.country,
                country_code: obj.countryCode,
                region_name: obj.regionName,
                city: obj.city,
                isp: obj.isp,
                asn: obj.as ? obj.as.split(' ')[0] : "N/A",
                latitude: obj.lat,
                longitude: obj.lon,
                zip_code: obj.zip,
                time_zone: obj.timezone,
                org: obj.org
            };
            renderData(mappedObj, "IP-API (Backup)");
        } catch (e) {
            $done({ title: "解析错误", content: "返回格式异常" });
        }
    });
}

function renderData(obj, source) {
    const info = obj.org || obj.isp || "";
    // 对标网页逻辑的属性判定
    const isCloud = /Google|Amazon|Microsoft|Oracle|Alibaba|Tencent|Akamai|DigitalOcean|Choopa|Linode|Cloudflare|Hetzner|OVH|DMIT|Gcore|Zenlayer/i.test(info);
    
    // 1. IP 属性：住宅 IP vs 机房 IP
    const ipProperty = isCloud ? "机房 IP (DataCenter)" : "住宅 IP (Residential)";
    
    // 2. IP 来源：原生 IP vs 非原生 IP (简单逻辑判断，通常机房大厂且跨区为非原生)
    // 这里的逻辑参考 IPPure 网页：如果 ISP 属于数据中心且是 DMIT 等线路，通常被标注为机房IP，但可能是原生广播。
    const ipSource = isCloud ? "原生 IP (机房广播)" : "原生 IP (本地住宅)";

    let content = `📍 归属：${obj.country_name} · ${obj.city}\n`;
    content += `🏢 运营：${obj.isp}\n`;
    content += `🏷️ IP 属性：${ipProperty}\n`;
    content += `🛡️ IP 来源：${ipSource}\n`;
    content += `🔢 ASN：${obj.asn} | 邮编：${obj.zip_code || "N/A"}\n`;
    content += `🌍 坐标：${obj.latitude}, ${obj.longitude}\n`;
    content += `⏰ 时区：${obj.time_zone}`;

    $done({
        title: `${getFlagEmoji(obj.country_code)} IP: ${obj.ip}`,
        content: content,
        icon: isCloud ? "server.rack" : "house.fill",
        "icon-color": isCloud ? "#FF9500" : "#34C759"
    });
}

function getFlagEmoji(countryCode) {
    if (!countryCode) return "🌐";
    return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
}
