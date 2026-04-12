/**
 * Surge IP 深度溯源 & 泄露检测
 * 包含：IP属性、来源、WebRTC 泄露模拟检测
 */

const IPPURE_URL = 'https://api.ippure.com/v1/ip';
const BACKUP_URL = 'http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query';
const LEAK_CHECK_URL = 'http://ip-api.com/json'; // 用于对比检测

async function start() {
    let proxyInfo = await getIPInfo();
    let directInfo = await getDirectIP();

    if (!proxyInfo) {
        $done({ title: "❌ 溯源失败", content: "无法获取数据，请检查网络", icon: "exclamationmark.triangle", "icon-color": "#FF3B30" });
        return;
    }

    // 属性判定逻辑
    const info = proxyInfo.org || proxyInfo.isp || "";
    const isCloud = /Google|Amazon|Microsoft|Oracle|Alibaba|Tencent|Akamai|DigitalOcean|Choopa|Linode|Cloudflare|Hetzner|OVH|DMIT|Gcore|Zenlayer/i.test(info);
    const ipProperty = isCloud ? "机房 IP (DataCenter)" : "住宅 IP (Residential)";
    const ipSource = isCloud ? "原生 IP (机房广播)" : "原生 IP (本地住宅)";

    // 泄露检测逻辑
    let leakStatus = "✅ 未发现泄露";
    if (directInfo && directInfo.query === proxyInfo.ip) {
        leakStatus = "⚠️ 发现泄露 (分流异常)";
    } else if (directInfo) {
        leakStatus = `密文: ${directInfo.query.slice(0,6)}*** (已掩盖)`;
    }

    let content = `📍 归属：${proxyInfo.country_name} · ${proxyInfo.city}\n`;
    content += `🏢 运营：${proxyInfo.isp}\n`;
    content += `🏷️ IP 属性：${ipProperty}\n`;
    content += `🛡️ IP 来源：${ipSource}\n`;
    content += `🔍 IP 泄露：${leakStatus}\n`;
    content += `🔢 ASN：${proxyInfo.asn} | 邮编：${proxyInfo.zip_code || "N/A"}\n`;
    content += `🌍 坐标：${proxyInfo.latitude}, ${proxyInfo.longitude}\n`;
    content += `⏰ 时区：${proxyInfo.time_zone}`;

    $done({
        title: `${getFlagEmoji(proxyInfo.country_code)} IP: ${proxyInfo.ip}`,
        content: content,
        icon: isCloud ? "server.rack" : "house.fill",
        "icon-color": isCloud ? "#FF9500" : "#34C759"
    });
}

// 获取代理出口 IP 信息
function getIPInfo() {
    return new Promise((resolve) => {
        $httpClient.get({ url: IPPURE_URL, timeout: 5000 }, (error, response, data) => {
            if (!error && data) {
                try {
                    const obj = JSON.parse(data);
                    if (obj.ip) return resolve(obj);
                } catch (e) {}
            }
            // 失败则走备用
            $httpClient.get({ url: BACKUP_URL, timeout: 5000 }, (error, response, data) => {
                if (!error && data) {
                    try {
                        const obj = JSON.parse(data);
                        return resolve({
                            ip: obj.query,
                            country_name: obj.country,
                            country_code: obj.countryCode,
                            city: obj.city,
                            isp: obj.isp,
                            asn: obj.as ? obj.as.split(' ')[0] : "N/A",
                            latitude: obj.lat,
                            longitude: obj.lon,
                            zip_code: obj.zip,
                            time_zone: obj.timezone,
                            org: obj.org
                        });
                    } catch (e) {}
                }
                resolve(null);
            });
        });
    });
}

// 获取直连 IP (模拟泄露检测)
function getDirectIP() {
    return new Promise((resolve) => {
        $httpClient.get({ url: LEAK_CHECK_URL, timeout: 3000, "policy-descriptor": "DIRECT" }, (error, response, data) => {
            if (!error && data) {
                try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
            } else { resolve(null); }
        });
    });
}

function getFlagEmoji(countryCode) {
    if (!countryCode) return "🌐";
    return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

start();
