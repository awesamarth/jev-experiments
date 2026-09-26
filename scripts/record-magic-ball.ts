import { chromium, type Locator, type Page } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.join(process.env.HOME ?? ".", "Desktop");
const temporaryDirectory = path.join(process.cwd(), ".demo-recordings");
const outputPath = path.join(outputDirectory, "Magic-Jev-Ball-Demo.webm");

async function installDemoEffects(page: Page) {
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = `
      html, body { width: 100%; height: 100%; overflow: hidden !important; }
      main { transform-origin: 0 0; transition: transform 850ms cubic-bezier(.22,1,.36,1); }
      #demo-pointer {
        position: fixed;
        left: 1540px;
        top: 900px;
        z-index: 2147483647;
        width: 34px;
        height: 42px;
        pointer-events: none;
        filter: drop-shadow(2px 3px 2px rgba(0,0,0,.5));
        transition: left 550ms cubic-bezier(.22,1,.36,1), top 550ms cubic-bezier(.22,1,.36,1);
      }
      .demo-click-ring {
        position: fixed;
        z-index: 2147483646;
        width: 18px;
        height: 18px;
        margin: -9px 0 0 -9px;
        border: 3px solid #ed7d9b;
        border-radius: 999px;
        pointer-events: none;
        animation: demo-click 500ms ease-out forwards;
      }
      @keyframes demo-click {
        from { opacity: 1; transform: scale(.45); }
        to { opacity: 0; transform: scale(3.2); }
      }
    `;
    document.head.appendChild(style);

    const pointer = document.createElement("div");
    pointer.id = "demo-pointer";
    pointer.innerHTML = `
      <svg viewBox="0 0 34 42" width="34" height="42" aria-hidden="true">
        <path d="M3 2v31l8-8 6 14 7-3-6-14h12L3 2Z" fill="#f7f7f2" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>
    `;
    document.body.appendChild(pointer);
  });
}

async function movePointer(page: Page, target: Locator, duration = 650) {
  const box = await target.boundingBox();
  if (!box) throw new Error("Could not locate pointer target.");

  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await page.evaluate(
    ({ x, y }) => {
      const pointer = document.querySelector<HTMLElement>("#demo-pointer");
      if (pointer) {
        pointer.style.left = `${x}px`;
        pointer.style.top = `${y}px`;
      }
    },
    { x, y },
  );
  await page.mouse.move(x, y, { steps: 18 });
  await page.waitForTimeout(duration);
}

async function showClick(page: Page, target: Locator) {
  const box = await target.boundingBox();
  if (!box) throw new Error("Could not locate click target.");

  await page.evaluate(
    ({ x, y }) => {
      const ring = document.createElement("div");
      ring.className = "demo-click-ring";
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), 550);
    },
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
}

async function clickWithoutScrolling(page: Page, target: Locator) {
  const box = await target.boundingBox();
  if (!box) throw new Error("Could not locate click target.");

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

await mkdir(temporaryDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: {
    dir: temporaryDirectory,
    size: { width: 1920, height: 1080 },
  },
  deviceScaleFactor: 1,
});

const page = await context.newPage();
const baseUrl = process.env.DEMO_URL ?? "http://localhost:5555";
await page.goto(`${baseUrl}/experiments/magic-ball`, {
  waitUntil: "networkidle",
});
await installDemoEffects(page);
await page.waitForTimeout(1_200);

const question = page.getByLabel("Ask a yes-or-no question");
await movePointer(page, question);
await showClick(page, question);
await question.click();

await page.evaluate(() => {
  const main = document.querySelector<HTMLElement>("main");
  if (main) main.style.transform = "translate(-52px, -560px) scale(1.58)";
});
await page.waitForTimeout(950);
await movePointer(page, question, 300);
await question.pressSequentially("Should I break no-contact with my ex?", {
  delay: 72,
});
await page.waitForTimeout(500);

const submit = page.getByRole("button", { name: "Ask the ball →" });
await movePointer(page, submit);
const response = page.waitForResponse(
  (candidate) =>
    candidate.url().includes("/api/jev/magic-ball") &&
    candidate.request().method() === "POST",
);
await showClick(page, submit);
await clickWithoutScrolling(page, submit);
await page.waitForTimeout(200);

await page.evaluate(() => {
  const main = document.querySelector<HTMLElement>("main");
  if (main) main.style.transform = "translate(-922px, -269px) scale(1.58)";
});
await page.waitForTimeout(950);

await response;
await submit.waitFor({ state: "visible", timeout: 20_000 });
await page.waitForTimeout(2_100);

const ball = page.getByRole("button", { name: "Shake the Magic Jev Ball" });
await movePointer(page, ball);
await showClick(page, ball);
await clickWithoutScrolling(page, ball);
await page.waitForTimeout(1_250);

await page.evaluate(() => window.scrollTo(0, 0));

await page.evaluate(() => {
  const main = document.querySelector<HTMLElement>("main");
  if (main) main.style.transform = "translate(0, 0) scale(1)";
});
await page.waitForTimeout(1_300);

const video = page.video();
await context.close();

if (!video) {
  throw new Error("Playwright did not create a video.");
}

await video.saveAs(outputPath);
await browser.close();
console.log(outputPath);
