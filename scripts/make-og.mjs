import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const imageB64 = (await readFile('apps/platform/public/images/motor.webp')).toString('base64');
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #06111b; }
  .og { position: relative; width: 1200px; height: 630px; overflow: hidden; font-family: Arial, Helvetica, sans-serif; color: #f4ebdd; }
  .bg { position: absolute; inset: 0; background: url('data:image/webp;base64,${imageB64}') center 56% / cover; filter: saturate(.9) contrast(1.05); transform: scale(1.02); }
  .shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(6,17,27,.96) 0%, rgba(6,17,27,.78) 46%, rgba(6,17,27,.24) 100%), linear-gradient(180deg, rgba(6,17,27,.1), rgba(6,17,27,.72)); }
  .grain { position: absolute; inset: 0; opacity: .18; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E"); mix-blend-mode: soft-light; }
  .content { position: relative; z-index: 2; padding: 56px 64px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
  .kicker { font-size: 13px; letter-spacing: .18em; text-transform: uppercase; color: #ffb347; font-weight: 700; }
  .kicker span { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ffb347; margin-right: 10px; box-shadow: 0 0 14px #ffb347; }
  .series { display: inline-block; margin-top: 18px; padding: 6px 10px; color: #06111b; background: #f7e45a; font-size: 13px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; transform: rotate(-1.2deg); border: 1px solid rgba(6,17,27,.5); box-shadow: 3px 3px 0 rgba(0,0,0,.3); }
  h1 { margin: 18px 0 0; font-size: 82px; line-height: .8; letter-spacing: -.065em; font-weight: 900; max-width: 680px; text-shadow: 0 10px 50px rgba(0,0,0,.3); }
  h1 em { color: #ffb347; font-style: normal; }
  h1 .besok { display: inline-block; margin-top: 10px; padding: 1px 9px 3px; color: #06111b; background: #ff5a4e; font-size: 34px; line-height: 1; letter-spacing: -.02em; transform: rotate(-1.5deg); border: 1px solid rgba(6,17,27,.5); }
  .lede { max-width: 570px; color: rgba(244,235,221,.78); font-size: 19px; line-height: 1.45; margin-top: 18px; }
  .bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
  .badge { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: rgba(244,235,221,.5); border: 1px solid rgba(244,235,221,.24); padding: 9px 12px; border-radius: 999px; }
  .brand { font-size: 14px; font-weight: 700; letter-spacing: -.02em; }
  .brand small { display: block; font-size: 10px; letter-spacing: .18em; color: rgba(244,235,221,.4); margin-top: 2px; font-weight: 400; }
  .route { display: flex; gap: 10px; align-items: center; font-size: 12px; letter-spacing: .12em; color: rgba(244,235,221,.5); }
  .route i { display: inline-block; width: 38px; height: 1px; background: linear-gradient(90deg, #ffb347, rgba(244,235,221,.2)); }
</style></head><body>
<div class="og">
  <div class="bg"></div><div class="shade"></div><div class="grain"></div>
  <div class="content">
    <div>
      <div class="kicker"><span></span>WNI SERIES #1 · PRE-ALPHA</div>
      <div class="series">Susahnya nyata. Lucunya gratis.</div>
      <h1>BERANGKAT.<br>BERJUANG.<br><em>SAMPAI.</em><br><span class="besok">BESOK LAGI.</span></h1>
      <p class="lede">Game satu tangan tentang perjalanan pagi di Jabodetabek.<br>Motor, KRL, atau keduanya — dari Bintaro sampai Sudirman.</p>
    </div>
    <div class="bottom">
      <div class="brand">Pejuang Nafkah<small>WNI SERIES · JAKARTA</small></div>
      <div class="route">JMU <i></i> SUD <span style="margin-left:10px">58 MNT</span></div>
      <div class="badge">Pre-alpha · belum bisa dimainkan</div>
    </div>
  </div>
</div>
</body></html>`);
await page.waitForTimeout(800);
await page.screenshot({ path: 'apps/platform/public/images/og.jpg', type: 'jpeg', quality: 88 });
await browser.close();
