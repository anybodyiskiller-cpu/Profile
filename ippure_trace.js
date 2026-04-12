/**
 * Surge IP 深度溯源 - 属性增强版
 * 策略：多 API 容错 + 深度线路属性识别
 */

const IPPURE_URL = 'https://api.ippure.com/v1/ip';
const BACKUP_URL = 'http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query';

$httpClient.get({ url: IPPURE_URL, timeout: 4000 }, function(error, response, data) {
    if (!error && data) {
        try {
            const obj = JSON.parse(data);
            if (obj.ip) {
                renderData(obj, "IPPure.com");
                return;
            }
        } catch (e) {}
    }
    fetchBackup();
});

function fetchBackup() {
    $httpClient.get({ url: BACKUP_URL, timeout: 4000 }, function(error, response, data) {
        if (error || !data) {
            $done({ title: "❌ 溯源全线失败", content: "无法获取 IP 溯源信息", icon: "exclamationmark.triangle", "icon-color": "#FF3B30" });
            return;
        }
        try {
            const obj = JSON.parse(data);
            // 统一字段名以便渲染
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
                org: obj.org // 增加组织信息，用于判断 IP 来源/属性
            };
            renderData(mappedObj, "IP-API (Backup)");
        } catch (e) {
            $done({ title: "解析错误", content: "返回数据格式异常", icon: "warn" });
        }
    });
}

function renderData(obj, source) {
    // 深度识别 IP 属性 (根据 ISP 或 ORG 判断)
    const lineInfo = obj.org || obj.isp || "";
    const isCloud = /Google|Amazon|Microsoft|Oracle|Alibaba|Tencent|Akamai|DigitalOcean|Choopa|Linode|Cloudflare|Hetzner|OVH|DMIT|Gcore/i.test(lineInfo);
    
    // 模拟网站的“IP 属性”逻辑
    const ipProperty = isCloud ? "数据中心/机房 (Hosting)" : "家庭宽带/住宅 (Residential)";
    
    let content = `📍 归属: ${obj.country_name} · ${obj.city}\n`;
    content += `🏢 运营: ${obj.isp}\n`;
    content += `🏷️ 属性: ${ipProperty}\n`;
    content += `📡 来源: ${lineInfo}\n`; // 这里的来源即网站上的线路溯源
    content += `🔢 ASN: ${obj.asn} | 邮编: ${obj.zip_code || "N/A"}\n`;
    content += `🌍 坐标: ${obj.latitude}, ${obj.longitude}\n`;
    content += `🛠️ 接口: ${source}`; // 显示当前是哪个数据库提供的数据

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
