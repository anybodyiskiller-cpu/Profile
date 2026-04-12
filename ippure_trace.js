/**
 * Surge IP 深度溯源 - 终极修复版
 * 策略：多 API 自动容错（IPPure + ip-api）
 */

const IPPURE_URL = 'https://api.ippure.com/v1/ip';
const BACKUP_URL = 'http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,as,query';

// 尝试主 API (IPPure)
$httpClient.get({ url: IPPURE_URL, timeout: 4000 }, function(error, response, data) {
    if (!error && data) {
        try {
            const obj = JSON.parse(data);
            if (obj.ip) {
                renderIPPure(obj);
                return;
            }
        } catch (e) {}
    }
    
    // 如果 IPPure 失败，自动切换到备份 API
    console.log("IPPure 接口失效，正在尝试备用接口...");
    fetchBackup();
});

function fetchBackup() {
    $httpClient.get({ url: BACKUP_URL, timeout: 4000 }, function(error, response, data) {
        if (error || !data) {
            $done({ title: "❌ 溯源全线失败", content: "所有溯源接口均无法连接，请检查节点。", icon: "exclamationmark.triangle", "icon-color": "#FF3B30" });
            return;
        }
        try {
            const obj = JSON.parse(data);
            renderBackup(obj);
        } catch (e) {
            $done({ title: "数据解析错误", content: "返回数据格式异常", icon: "warn", "icon-color": "#FF9500" });
        }
    });
}

// 处理 IPPure 数据
function renderIPPure(obj) {
    const isCloud = /Google|Amazon|Microsoft|Oracle|Alibaba|Tencent|Akamai|DigitalOcean|Choopa|Linode|Cloudflare/i.test(obj.isp);
    let content = `📍 归属: ${obj.country_name || ""} ${obj.region_name || ""} ${obj.city || ""}\n`;
    content += `🏢 运营: ${obj.isp || "未知"}\n`;
    content += `🏷️ 类型: ${isCloud ? "☁️ DataCenter" : "🏠 Residential"}\n`;
    content += `🔢 ASN: ${obj.asn || "N/A"} | 邮编: ${obj.zip_code || "未知"}\n`;
    content += `🌍 坐标: ${obj.latitude}, ${obj.longitude}\n`;
    content += `💴 货币: ${obj.currency_code || "N/A"} | ⏰ 时区: ${obj.time_zone || "N/A"}`;
    
    $done({
        title: `${getFlagEmoji(obj.country_code)} IP: ${obj.ip}`,
        content: content,
        icon: "target",
        "icon-color": isCloud ? "#FF9500" : "#34C759"
    });
}

// 处理备份接口数据
function renderBackup(obj) {
    const isCloud = /Cloud|Server|Data|Hosting|Akamai/i.test(obj.isp);
    let content = `📍 归属: ${obj.country} ${obj.regionName} ${obj.city}\n`;
    content += `🏢 运营: ${obj.isp}\n`;
    content += `🏷️ 类型: ${isCloud ? "☁️ DataCenter" : "🏠 Residential"}\n`;
    content += `🔢 ASN: ${obj.as ? obj.as.split(' ')[0] : "N/A"} | 邮编: ${obj.zip || "无"}\n`;
    content += `🌍 坐标: ${obj.lat}, ${obj.lon}\n`;
    content += `⏰ 时区: ${obj.timezone} (备用接口)`;

    $done({
        title: `${getFlagEmoji(obj.countryCode)} IP: ${obj.query}`,
        content: content,
        icon: "target",
        "icon-color": "#5AC8FA"
    });
}

function getFlagEmoji(countryCode) {
    if (!countryCode) return "🌐";
    return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
}
