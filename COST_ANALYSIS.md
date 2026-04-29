# PARA Production Cost Analysis

> **Hardware already owned:** AMD Ryzen 9 5950X, 128GB RAM, local SSDs  
> **Target:** 300k concurrent users at launch (1M subscriber drop)  
> **Constraint:** Zero cloud services. Full privacy.

---

## 1. Infrastructure (Monthly Recurring)

| Item | Spec | Cost (USD/mo) | Notes |
|------|------|---------------|-------|
| **VPS Proxy** | 2 vCPU, 4GB RAM, unmetered bandwidth | **$5–$7** | Hetzner CX21 ($5.35) or DigitalOcean Droplet ($6). Pure reverse proxy + WireGuard endpoint. |
| **Domain (1 year)** | `para.social` or similar | **~$12/yr** | Namecheap, Porkbun, or Njalla (privacy-focused). ~$1/mo amortized. |
| **Subdomains** | `pds.*`, `appview.*`, `web.*`, `analytics.*` | **$0** | Included with domain. |
| **SSL Certificates** | Let's Encrypt | **$0** | Auto-renew via certbot. |
| **Internet Upgrade** | Residential → Business/Static IP | **$0–$50** | Depends on ISP. Some ISPs charge ~$15/mo for static IP. If using VPS proxy, dynamic IP is fine. |
| **Backup Storage** | External NAS or USB drives | **$0** | One-time cost. See CapEx below. |
| **Electricity** | 5950X at ~200W load, 24/7 | **~$25–$40** | At $0.15/kWh: 0.2kW × 24h × 30d × $0.15 = **$21.60/mo**. Higher in Europe (~$0.30/kWh = $43/mo). |
| | | | |
| **Total Monthly** | | **~$32–$55** | Lower end: cheap ISP, US electricity. Upper end: business ISP, EU electricity. |

### VPS Proxy Comparison

| Provider | Plan | RAM | Transfer | Price/mo | Privacy Notes |
|----------|------|-----|----------|----------|---------------|
| **Hetzner** | CX21 | 4GB | 20TB | **$5.35** | German, GDPR-compliant, no KYC for crypto pay |
| **Hetzner** | CPX11 | 2GB | 20TB | **$4.51** | Shared vCPU, enough for pure proxy |
| **DigitalOcean** | Basic Droplet | 512MB | 500GB | **$4.00** | US company, more bandwidth limits |
| **Vultr** | Cloud VM | 1GB | 1TB | **$5.00** | US company |
| **Njalla** ( domains only) | — | — | — | — | Privacy-focused domain registrar, accepts crypto |

**Recommendation:** Hetzner CX21 ($5.35) or CPX11 ($4.51). 20TB bandwidth is absurd headroom for a proxy. German jurisdiction, no-nonsense pricing.

---

## 2. One-Time Costs (CapEx)

| Item | Cost (USD) | Notes |
|------|------------|-------|
| **5950X Machine** | **Already owned** | $0 additional |
| **SSD Storage** (if expanding) | **$80–$150** | 2TB NVMe for PostgreSQL + blob storage. One-time. |
| **UPS Battery Backup** | **$80–$150** | Essential. Power outage = downtime. APC 600VA ~$80. |
| **External Backup Drive** | **$60–$100** | 4TB USB HDD for daily `pg_dump` snapshots. |
| **Network Switch** (if needed) | **$20–$40** | Managed switch for VLAN isolation. Optional. |
| | | |
| **Total CapEx** | **~$240–$440** | If you need drives, UPS, and backup. Can be spread over months. |

---

## 3. App Store / Distribution Costs

| Item | Cost (USD) | Frequency | Notes |
|------|------------|-----------|-------|
| **Apple Developer Program** | **$99/yr** | Annual | Required for TestFlight and App Store. No way around this. |
| **Google Play Console** | **$25** | One-time | One-time fee, lifetime access. |
| **EAS Build Credits** | **$0–$29/mo** | Monthly | Expo provides free build minutes. For 2 platforms × ~20 builds/mo = well within free tier. Only pay if you exceed quotas. |
| **OTA Updates (Expo)** | **$0** | — | Self-hosted OTA = $0. If using EAS Update cloud, it's metered. But you already have self-hosted planned. |
| | | | |
| **Total App Costs** | **~$10–$13/mo** | | Amortized Apple fee ($8.25/mo) + Google (one-time). |

---

## 4. Optional / Future Costs

| Item | Cost | When | Notes |
|------|------|------|-------|
| **Second 5950X (failover)** | Hardware cost | If needed | Active-passive failover for true HA. Not needed for launch. |
| **Secondary VPS** (multi-region) | $5/mo | Post-launch | EU proxy for international users. |
| **Monitoring (Uptime Kuma)** | $0 | Anytime | Self-hosted on same machine. Replaces Pingdom/DataDog. |
| **Log aggregation (Grafana Loki)** | $0 | Post-launch | Self-hosted log aggregation. |
| | | | |
| **Total Optional** | **$0–$5/mo** | | Only if you expand. |

---

## 5. Cost Scenarios

### Scenario A: Minimal (US, cheap electricity, no extras)

| Category | Monthly |
|----------|---------|
| VPS (Hetzner CPX11) | $4.51 |
| Domain (amortized) | $1.00 |
| Electricity | $22.00 |
| Apple Developer | $8.25 |
| **Total** | **~$36/mo** |

**CapEx:** $0 (use existing drives, skip UPS for now, backup to existing external drive).

---

### Scenario B: Recommended (EU, UPS, backup drive, business internet)

| Category | Monthly |
|----------|---------|
| VPS (Hetzner CX21) | $5.35 |
| Domain + privacy | $1.50 |
| Business internet (static IP not needed with VPS) | $15.00 |
| Electricity (€0.30/kWh) | $43.00 |
| Apple Developer | $8.25 |
| **Total** | **~$73/mo** |

**CapEx:** $240 (UPS $80 + 2TB NVMe $100 + 4TB backup $60).

---

### Scenario C: Worst Case (EU, full redundancy, second VPS)

| Category | Monthly |
|----------|---------|
| Primary VPS | $5.35 |
| Secondary VPS (EU) | $5.35 |
| Domain + privacy | $1.50 |
| Business internet | $25.00 |
| Electricity | $43.00 |
| Apple Developer | $8.25 |
| EAS paid tier (if needed) | $29.00 |
| **Total** | **~$117/mo** |

**CapEx:** $440 (UPS, drives, backup, switch).

---

## 6. What You Do NOT Pay For

Because of bare-metal + self-hosted philosophy, you avoid:

| Cloud Service | What You'd Pay (cloud) | What You Pay (bare metal) |
|---------------|------------------------|---------------------------|
| AWS EC2 (16c, 128GB) | **~$1,200/mo** | **$0** (owned) |
| RDS PostgreSQL (db.r6g.2xlarge) | **~$350/mo** | **$0** (local) |
| ElastiCache Redis | **~$100/mo** | **$0** (local) |
| ALB Load Balancer | **~$20/mo** | **$0** (nginx) |
| S3 (5TB storage) | **~$115/mo** | **$0** (local disk) |
| Cloudflare Pro | **$20/mo** | **$0** (Let's Encrypt) |
| Data transfer (300k users) | **$500–$2,000/mo** | **$0** (unmetered residential) |
| Sentry (crash reporting) | **$26/mo** | **$0** (stripped) |
| Mixpanel / Amplitude | **$500+/mo** | **$0** (Umami self-hosted) |
| **Total Cloud Avoided** | **~$2,800+/mo** | **~$0** |

**You save ~$33,600/year** by owning the hardware vs renting cloud.

---

## 7. Bandwidth Reality Check

Your 1M subscriber associate drops → how much bandwidth?

| Metric | Estimate |
|--------|----------|
| 300k DAU | ~10k concurrent at peak |
| Average request | ~50KB (JSON feed) |
| Peak RPS | ~1,000 requests/sec |
| Bandwidth needed | ~50 MB/s = **400 Mbps** |
| Hetzner VPS proxy | 20TB/mo = ~60 Mbps sustained |
| Residential upload (fiber) | Usually 100–500 Mbps |

**The VPS is NOT the bottleneck.** It's just a proxy. The 5950X serves the data. Your home upload speed is what matters.

**Action item:** Verify your ISP upload speed. If it's < 500 Mbps, you may need a business plan upgrade or a CDN partnership for static assets.

---

## 8. Year 1 Summary

| Scenario | Month 1–12 | CapEx | Year 1 Total |
|----------|------------|-------|--------------|
| **Minimal** | $36 × 12 = $432 | $0 | **$432** |
| **Recommended** | $73 × 12 = $876 | $240 | **$1,116** |
| **Worst Case** | $117 × 12 = $1,404 | $440 | **$1,844** |

Compare to cloud: **$33,600+/year**.

Your bare-metal approach saves **$31,000–$33,000 in year 1 alone**.

---

*Last updated: Day 7 closeout. Recalculate after ISP speed test.*
