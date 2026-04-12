/**
 * Surge IP 深度溯源面板 V2
 * 修复了 Unknown 显示问题，并增加了请求头模拟
 */

const requestInfo = {
    url: 'https://api.ippure.com/v1/ip',
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    },
    timeout: 5000
};

$httpClient.get(requestInfo, function(error, response, data) {
    if (error || !data) {
        renderPanel("❌ 溯源请求超时", "请检查当前节点是否能访问 ippure.com\n或尝试手动刷新面板。", "#FF3B30", "exclamationmark.icloud");
        return;
    }

    try {
        const obj = JSON.parse(data);
        
        // 关键修复：确保即使字段缺失也不显示 Unknown
        const ip = obj.ip || "获取中...";
        const country = obj.country_name || "未知国家";
        const region = obj.region_name || "";
        const city = obj.city || "";
        const isp = obj.isp || "未知运营商";
        const asn = obj.asn || "N/A";
        const lat = obj.latitude || "N/A";
        const lon = obj.longitude || "N/A";
        const zip = obj.zip_code || "未知";
        const currency = obj.currency_name ? `${obj.currency_name} (${obj.currency_code})` : "N/A";
        const callCode = obj.calling_code ? `+${obj.calling_code}` : "N/A";
        const tz = obj.time_zone || "N/A";
        const flag = getFlagEmoji(obj.country_code);

        // 智能类型识别
        const isCloud = /Google|Amazon|Microsoft|Oracle|Alibaba|Tencent|Akamai|DigitalOcean|Choopa|Linode|Cloudflare|Hetzner|OVH/i.test(isp);
        const typeTag = isCloud ? "☁️ DataCenter (数据中心)" : "🏠 Residential (住宅/原生)";

        let content = `📍 归属: ${country} ${region} ${city}\n`;
        content += `🏢 运营: ${isp}\n`;
        content += `🏷️ 类型: ${typeTag}\n`;
        content += `🔢 ASN: ${asn} | 邮编: ${zip}\n`;
        content += `🌍 坐标: ${lat}, ${lon} | 📞 ${callCode}\n`;
        content += `💴 货币: ${currency} | ⏰ 时区: ${tz}`;

        renderPanel(`${flag} IP: ${ip}`, content, isCloud ? "#FF9500" : "#34C759", "target");

    } catch (e) {
        renderPanel("⚠️ 解析异常", "API 返回了非标准 JSON 格式数据", "#FF9500", "doc.text.magnifyingglass");
    }
});

function renderPanel(title, content, color, icon) {
    $done({
        title: title,
        content: content,
        icon: icon,
        "icon-color": color
    });
}

function getFlagEmoji(countryCode) {
    if (!countryCode) return "🌐";
    return countryCode.toUpperCase().replace(/./g, char => 
        String.fromCodePoint(char.charCodeAt(0) + 127397)
    );
}
