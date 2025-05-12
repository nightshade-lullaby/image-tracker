# Cloudflare Image Tracker Worker  
**클라우드플레어 이미지 추적기 워커**

> A stealthy image redirector + telemetry logger using Cloudflare Workers.  
> Cloudflare Workers를 이용한 이미지 리디렉션 및 정보 로깅 추적기입니다.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

---

## Features / 기능

- Logs IP, user agent, ASN, location, referrer, and more  
  IP, 사용자 정보, ASN, 위치, 리퍼러 등 로깅  
- Supports 3 independent webhook/image routes (`alpha`, `beta`, `gamma`)  
  3개의 독립적인 추적 카테고리 지원  
- Dynamic map preview via Geoapify  
  Geoapify 정적 지도 미리보기  
- Threat detection: bots, VPNs, RU/CN origin, etc.  
  위협 탐지: 봇, VPN, 러시아/중국 IP 등  
- Automatic decoy image redirect for suspicious sources  
  의심 사용자에 대해 미끼 이미지로 리디렉션  
- Zero logging latency (via `ctx.waitUntil`)  
  리디렉션 지연 없는 즉시 로깅  

---

## Setup / 설치

1. Clone this repo  
   이 저장소를 클론하세요  

2. Deploy via Cloudflare Dashboard  
   [https://dash.cloudflare.com/](https://dash.cloudflare.com/) 에서 배포하세요  

3. Bind route to `*.workers.dev`  
   `*.workers.dev`에 라우팅 설정  

4. Update values in `src/worker.js`:  
   아래 값을 수정하세요:

```js
const WEBHOOKS = {
  alpha: "https://discord.com/api/webhooks/your_alpha_webhook",
  beta: "https://discord.com/api/webhooks/your_beta_webhook",
  gamma: "https://discord.com/api/webhooks/your_gamma_webhook",
};

const IMAGE_URLS = {
  alpha: "https://example.com/image-a.jpg",
  beta: "https://example.com/image-b.gif",
  gamma: "https://example.com/image-c.png",
};

// Replace with your own Geoapify key
const GEOAPIFY_KEY = "your_geoapify_api_key";
```

---

## Usage / 사용법

**Basic usage**  
기본 사용:

```
https://your-worker.workers.dev/alpha  
https://your-worker.workers.dev/beta  
https://your-worker.workers.dev/gamma
```

**Optional query params / 선택 쿼리 파라미터**:

- `?z=NoteLabel` → Shows note in Discord log  
  디스코드 로그에 노트 표시  
- `?r=https://example.com/img.jpg` → Override image URL  
  리디렉션할 이미지 직접 지정  
- `?dl=1` → Force image download  
  이미지 다운로드 강제화  

---

## Preview / 예시

**Discord webhook will show:**  
디스코드에서는 다음과 같이 표시됩니다:

- Location + flag (국가 및 국기)  
- ASN (AS 번호)  
- Browser / OS / Device  
- Map preview  
- Notes (if passed)  

---

## License / 라이선스

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.  
이 프로젝트는 **GPLv3 라이선스** 하에 배포됩니다.  
See [LICENSE](https://www.gnu.org/licenses/gpl-3.0.txt) for more info.
