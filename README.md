# Houlio Duo

Premium crypto-escrow marketplace — Phase 1 front end (brand, 3D homepage, marketplace browsing, sign-up flow, owner console preview).

## Status

| Area | State |
|---|---|
| Brand, 3D homepage, marketplace browsing | Implemented (static, sample listings) |
| Sign-up wizard (buyer / seller / business) | Front end only — nothing is sent or stored |
| List an item: photos (compressed to 1600px JPEG) and videos (MP4/MOV/WebM, max 60 s, 200 MB), moderation queue | Front end only — files stay in the browser, nothing is uploaded |
| Partner stores (`/#partners`): affiliate products grouped by region — Africa (Jumia, Konga), Europe (Amazon EU, eBay EU, Zalando Lounge, bol.com, Back Market, Allegro), North America (Amazon US/CA, eBay US), Middle East (Amazon AE/SA), Asia-Pacific (Amazon, eBay AU), Worldwide (AliExpress, Temu, Awin); console tab with join guides, affiliate IDs, link checks, click counts | Front end only — sample items link to store homepages; real links added in console are lost on reload |
| Owner console (`/#hd-console`) | Front end only — sample data, resets on reload, **no authentication** |
| Accounts, database, messaging | Not implemented (Phase 2–4) |
| XMR / USDT / USDC payments, escrow | Not implemented — checkout is disabled (Phase 5–6) |

## Fees

Configured in `index.html` (`const FEES`): $3 per sale (seller), $3 per purchase (buyer), $0.22 per withdrawal.

## Deploy

Static site. Import this repo in Vercel with framework preset **Other**, no build command, output directory `.`. Pushes to `main` deploy automatically.

## Before real launch

- Move the owner console behind server-side auth with 2FA; the hash URL is not security.
- Audit the EVM escrow contracts; keep escrow keys in a hardware or multisig wallet.
- Legal review of crypto custody (SEC Nigeria and each target country) and of the poker card category.
