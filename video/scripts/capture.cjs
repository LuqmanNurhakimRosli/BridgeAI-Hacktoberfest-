// Records the BridgeAI demo flow as one continuous mobile session plus a short
// desktop session, logging scene boundaries to public/footage/marks.json.
// Usage: PW_CORE=<path to playwright-core> node scripts/capture.cjs [baseUrl]
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');

const url = process.argv[2] || 'http://localhost:3012';
const outDir = path.join(__dirname, '..', 'public', 'footage', 'raw');
fs.mkdirSync(outDir, { recursive: true });

// Tap ripple + hidden scrollbars so the recording reads like a phone.
const INIT = `
  window.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style');
    s.textContent = '::-webkit-scrollbar{display:none} .tap-dot{position:fixed;z-index:99999;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(18,184,134,.35);border:2px solid rgba(18,184,134,.9);pointer-events:none;animation:tapdot .55s ease-out forwards}@keyframes tapdot{from{transform:scale(.4);opacity:1}to{transform:scale(1.6);opacity:0}}';
    document.head.appendChild(s);
    window.addEventListener('pointerdown', (e) => {
      const d = document.createElement('div');
      d.className = 'tap-dot';
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 600);
    }, true);
  });
`;

async function session(viewport, scale, name, run) {
  const browser = await chromium.launch({ args: [`--force-device-scale-factor=${scale}`] });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: scale,
    isMobile: viewport.width < 600,
    hasTouch: viewport.width < 600,
  });
  await context.addInitScript(INIT);
  const page = await context.newPage();

  // CDP screencast captures at device pixels (Playwright's recordVideo ignores deviceScaleFactor).
  const frameDir = path.join(outDir, name);
  fs.rmSync(frameDir, { recursive: true, force: true });
  fs.mkdirSync(frameDir, { recursive: true });
  const frames = [];
  const cdp = await context.newCDPSession(page);
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = path.join(frameDir, `f${String(frames.length).padStart(5, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, ts: metadata.timestamp });
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: viewport.width * scale,
    maxHeight: viewport.height * scale,
  });
  const t0 = Date.now();
  const marks = {};
  const mark = (id) => {
    marks[id] = (Date.now() - t0) / 1000;
    console.log(`${name}:${id} @ ${marks[id].toFixed(2)}s`);
  };
  const wait = (ms) => page.waitForTimeout(ms);
  const scrollTo = async (y, ms = 900) => {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), y);
    await wait(ms);
  };
  const tap = async (selector, pause = 700) => {
    await page.locator(selector).first().scrollIntoViewIfNeeded();
    await wait(250);
    await page.locator(selector).first().click();
    await wait(pause);
  };

  await run({ page, mark, wait, scrollTo, tap });
  mark('end');
  await cdp.send('Page.stopScreencast');
  await context.close();
  await browser.close();

  // Assemble a constant-30fps MP4 from timestamped frames; marks are re-based to the first frame.
  const first = frames[0].ts;
  const endTs = t0 / 1000 + marks.end;
  const posix = (p) => p.split(path.sep).join('/');
  const lines = [];
  frames.forEach((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].ts : endTs;
    lines.push(`file '${posix(f.file)}'`, `duration ${Math.max(0.001, next - f.ts).toFixed(4)}`);
  });
  lines.push(`file '${posix(frames[frames.length - 1].file)}'`);
  const listFile = path.join(frameDir, 'list.txt');
  fs.writeFileSync(listFile, lines.join('\n') + '\n');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-vf', 'fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', path.join(outDir, '..', `${name}.mp4`)]);
  const offset = first - t0 / 1000;
  return Object.fromEntries(Object.entries(marks).map(([k, v]) => [k, Math.max(0, v - offset)]));
}

(async () => {
  const mobile = await session({ width: 390, height: 844 }, 2, 'mobile', async ({ page, mark, wait, scrollTo, tap }) => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await wait(800);

    mark('home');
    await wait(3500);
    await scrollTo(520, 1500);
    await scrollTo(0, 1200);

    // Profile: describe, AI fill, confirm
    mark('profile');
    await tap('[data-testid="mobile-nav-profile"]', 900);
    const box = page.locator('#passport-description');
    await box.fill('');
    await box.pressSequentially(
      'We are AgriSmart, a seed-stage Malaysian startup with a phone app that spots crop disease. We want a field pilot with a farming company in Indonesia.',
      { delay: 22 }
    );
    await wait(500);
    await tap('[data-testid="extract-gemma-btn"]', 300);
    await page.waitForSelector('[role="status"]', { timeout: 30000 }).catch(() => {});
    await wait(1200);
    await scrollTo(700, 1600);
    await scrollTo(1400, 1500);
    const confirmItem = page.locator('[data-testid^="resolve-missing-"]');
    if (await confirmItem.count()) await tap('[data-testid^="resolve-missing-"]', 900);
    await tap('[data-testid="confirm-passport-btn"]', 1500);

    // Discover: ranked list, filters
    mark('discover');
    await wait(1500);
    await scrollTo(450, 1600);
    await scrollTo(1100, 1800);
    await scrollTo(0, 1200);
    await tap('button:has(svg.lucide-sliders-horizontal)', 1200);
    await tap('role=dialog >> button:has-text("Indonesia")', 700);
    await tap('role=dialog >> button:has-text("AgriTech")', 1200);
    await tap('role=dialog >> button:has-text("Show")', 1800);
    await tap('button:has-text("Clear all")', 1200);

    // Match detail
    mark('match');
    await tap('[data-testid="view-match-intelligence-DEMO-CH-001"]', 2200);
    await scrollTo(500, 1800);
    await scrollTo(1000, 1500);
    await tap('summary:has-text("How the score is worked out")', 1200);
    await scrollTo(1500, 2400);

    // Pilot plan
    mark('pilot');
    await tap('[data-testid="detail-create-poc-plan-btn"]', 2200);
    await scrollTo(600, 1800);
    await scrollTo(1300, 1800);
    await scrollTo(0, 900);
    await tap('role=tab[name="Success"]', 1800);
    await tap('role=tab[name="Questions"]', 900);
    await tap('label:has-text("cross-border data")', 1200);
    await tap('role=tab[name="Message"]', 1500);
    await tap('[data-testid="outreach-lang-Bahasa Indonesia"]', 1500);
    await scrollTo(450, 2200);

    // Deals: save, attention list, record a stage
    mark('deals');
    await tap('[data-testid="save-deal-with-poc-btn"]', 1500);
    await tap('role=dialog >> button:has-text("Save plan")', 2600);
    await tap('[data-testid^="toggle-workspace-"]', 1500);
    await scrollTo(520, 1200);
    await tap('button[aria-pressed]:has-text("Intro Requested")', 800);
    await page.locator('input[aria-label="What happened"]').pressSequentially('Intro email sent to innovation lead', { delay: 30 });
    await wait(400);
    await tap('[data-testid^="confirm-transition-btn-"]', 2200);

    // Outcomes + readiness
    mark('outcomes');
    await scrollTo(0, 500);
    await tap('role=tab[name="Outcomes"]', 2000);
    await scrollTo(500, 1600);
    await tap('[data-testid="mobile-nav-profile"]', 600);
    await tap('role=tab[name="Investor readiness"]', 2200);
    await scrollTo(400, 1800);
  });

  const desktop = await session({ width: 1440, height: 900 }, 1, 'desktop', async ({ page, mark, wait, scrollTo, tap }) => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await wait(800);
    mark('home');
    await wait(2500);
    await tap('[data-testid="sidebar-nav-discover"]', 2500);
    await scrollTo(400, 1800);
    await tap('[data-testid="view-match-intelligence-DEMO-CH-001"]', 2500);
    await scrollTo(450, 2500);
  });

  fs.writeFileSync(path.join(outDir, '..', 'marks.json'), JSON.stringify({ mobile, desktop }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
