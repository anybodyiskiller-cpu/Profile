/**
 * Surge IP 深度溯源脚本
 * 接口支持: ippure.com
 */

const url = 'https://api.ippure.com/v1/ip';

$httpClient.get(url, function(error, response, data) {
    if (error) {
        renderPanel("连接失败", "无法访问 IPPure API，请检查网络或代理设置。", "#FF3B30", "exclamationmark.shield.fill");
        return;
    }

    try {
        const obj = JSON.parse(data);
        const ip = obj.ip || "Unknown";
        const flag = getFlagEmoji(obj.country_code);
        
        // 1. 地理溯源
        const location = `${obj.country_name || ""} · ${obj.region_name || ""} · ${obj.city || ""}`;
        
        // 2. 网络归属
        const isp = obj.isp || "未知运营商";
        const asn = obj.asn || "N/A";
        
        // 3. 物理环境参数
        const coords = `经纬: ${obj.latitude || "N/A"}, ${obj.longitude || "N/A"}`;
        const zip = obj.zip_code || "未知";
        const currency = obj.currency_name ? `${obj.currency_name} (${obj.currency_code})` : "N/A";
        const callCode = obj.calling_code ? `+${obj.calling_code}` : "N/A";
        const tz = obj.time_zone || "N/A";

        // 4. 简单风险识别 (常见的云服务商关键词)
        const isCloud = /Google|Amazon|Microsoft|Oracle|Alibaba|Tencent|Akamai|DigitalOcean|Choopa/i.test(isp);
        const typeTag = isCloud ? "☁️ Datacenter (机房)" : "🏠 Residential (住宅/原生)";

        let content = `📍 归属: ${location}\n`;
        content += `🏢 运营: ${isp}\n`;
        content += `🏷️ 类型: ${typeTag}\n`;
        content += `🔢 ASN: ${asn} | 邮编: ${zip}\n`;
        content += `🌍 ${coords} | 📞 ${callCode}\n`;
        content += `💴 货币: ${currency} | ⏰ 时区: ${tz}`;

        renderPanel(`${flag} IP 溯源: ${ip}`, content, isCloud ? "#FF9500" : "#34C759", "scope");

    } catch (e) {
        renderPanel("数据异常", "API 返回数据解析失败", "#FF9500", "doc.text.magnifyingglass");
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
