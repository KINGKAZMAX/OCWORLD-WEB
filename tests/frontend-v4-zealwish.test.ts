import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const rootIndexPath = join(root, "index.html");
const indexPath = join(root, "frontend-v4", "index.html");
const webPath = join(root, "frontend-v4", "web.html");
const landingPath = join(root, "frontend-v4", "src", "v5", "zealwish-landing.jsx");
const webAppPath = join(root, "frontend-v4", "src", "v6", "zealwish-web-app.jsx");
const walletPath = join(root, "frontend-v4", "src", "v4", "wallet-service.jsx");
const walletRuntimePath = join(root, "frontend-v4", "src", "v4", "wallet-service.js");
const webBundleScriptPath = join(root, "scripts", "build-zealwish-web-app.mjs");
const topbarPath = join(root, "frontend-v4", "src", "v4", "topbar.jsx");
const architecturePath = join(root, "docs", "architecture", "web-architecture.md");
const webServerPath = join(root, "ocworld-web", "server.js");
const chinesePattern = /[\u4e00-\u9fff]/;
const expectedMainCharacterHash = "c8b5166f56b2fbb5e58999cea670732a5e6516f8b9a4b2f07aa1ae6ffe11cf4c";

describe("frontend-v4 ZEALWISH Web3 landing", () => {
  it("keeps the Vite/root entry branded as ZEALWISH English-only", () => {
    const rootIndex = readFileSync(rootIndexPath, "utf8");

    expect(rootIndex).toContain('lang="en"');
    expect(rootIndex).toContain("ZEALWISH");
    expect(rootIndex).not.toContain("OC World");
    expect(rootIndex).not.toContain("OCWORLD");
    expect(rootIndex).not.toContain("EcomCanvas");
    expect(rootIndex).not.toMatch(chinesePattern);
  });

  it("routes the active preview to the ZEALWISH v5 landing entry", () => {
    const index = readFileSync(indexPath, "utf8");

    expect(index).toContain("ZEALWISH");
    expect(index).toContain("src/v5/zealwish-landing.jsx");
    expect(index).toContain("ZEALWISH web-only preview components");
    expect(index).toContain('src="src/v4/wallet-service.jsx"');
    expect(index).not.toContain('src="src/v4/wallet-service.js"');
    expect(index).not.toContain('src="src/v4/app.jsx"');
    expect(index).not.toContain('src="src/v4/ocworld-bridge.jsx"');
    expect(index).not.toContain('src="tweaks-panel.jsx"');
    expect(index).not.toMatch(/ocworld/i);
    expect(index).not.toMatch(/app shell/i);
    expect(index).not.toMatch(chinesePattern);
  });

  it("ships the approved English free-will and Web3 ownership positioning", () => {
    expect(existsSync(landingPath)).toBe(true);
    const landing = readFileSync(landingPath, "utf8");

    expect(landing).toContain("Create. Grow. Own your AI character.");
    expect(landing).toContain("Free will for your digital self.");
    expect(landing).toContain("NFT is not the product. Ownership is.");
    expect(landing).toContain("Wallet-owned AI character");
    expect(landing).toContain("Character Passport NFT");
    expect(landing).toContain("Blockchain Anchor");
    expect(landing).toContain("Built for ownership, not speculation");
    expect(landing).toContain("Create Character Passport");
    expect(landing).not.toContain("OCWORLD");
    expect(landing).not.toMatch(chinesePattern);
  });

  it("keeps the landing page as product display and routes CTAs to the Web workspace", () => {
    const landing = readFileSync(landingPath, "utf8");

    expect(landing).toContain("Create. Grow. Own your AI character.");
    expect(landing).toContain("Open ZEALWISH Web");
    expect(landing).toContain("web.html#/create");
    expect(landing).toContain("web.html#/home");
    expect(landing).not.toContain("Open Web Console");
    expect(landing).not.toContain("function WebConsoleSection");
    expect(landing).not.toContain("data-zealwish-web-console");
    expect(landing).not.toContain("setActiveModule");
    expect(landing).not.toContain("ZEALWISH_MOUNT_APP");
    expect(landing).not.toContain("data-zealwish-app-shell");
    expect(landing).not.toContain("function AppPortalSection");
    expect(landing).not.toContain("Launch App");
    expect(landing).not.toMatch(/app shell/i);

    const index = readFileSync(indexPath, "utf8");
    expect(index).not.toContain(".web-console-shell");
    expect(index).not.toContain(".web-console-nav button");
  });

  it("ships a separate standard ZEALWISH Web workspace with hash navigation", () => {
    expect(existsSync(webPath)).toBe(true);
    expect(existsSync(webAppPath)).toBe(true);
    const web = readFileSync(webPath, "utf8");
    const webApp = readFileSync(webAppPath, "utf8");

    expect(web).toContain("ZEALWISH Web");
    expect(web).toContain('src="src/v4/wallet-service.jsx"');
    expect(web).toContain("src/v6/zealwish-web-app.js?v=20260611-api");
    expect(web).not.toContain("src/v5/zealwish-landing.jsx");
    expect(web).not.toMatch(/ocworld/i);
    expect(web).not.toMatch(chinesePattern);

    expect(webApp).toContain("data-zealwish-web-app");
    expect(webApp).toContain("const WEB_APP_MODULES");
    for (const moduleId of ["home", "create", "talk", "memory", "world", "rewind", "settings"]) {
      expect(webApp).toContain(`id: '${moduleId}'`);
      expect(webApp).toContain(`'#/${moduleId}'`);
    }
    expect(webApp).toContain("hashchange");
    expect(webApp).toContain("handleSavePassport");
    expect(webApp).toContain("handleSendWebChat");
    expect(webApp).toContain("handleAddMemory");
    expect(webApp).toContain("handleExportPassport");
    expect(webApp).not.toMatch(/ocworld/i);
    expect(webApp).not.toMatch(chinesePattern);
  });

  it("presents the Web workspace as an operational dashboard rather than a marketing page", () => {
    const webApp = readFileSync(webAppPath, "utf8");
    const web = readFileSync(webPath, "utf8");

    expect(web).toContain("app-inspector");
    expect(web).toContain("dashboard-grid");
    expect(web).toContain("operating-queue");
    expect(web).toContain("overflow-x: hidden");
    expect(web).toContain(":focus-visible");
    expect(web).toContain("prefers-reduced-motion");
    expect(web).toContain(".page-title h1 { margin: 10px 0 0; font-family: Teko, Inter, sans-serif; font-size: clamp(48px, 6vw, 88px);");
    expect(web).toContain(".chat-panel { min-height: 420px;");
    expect(web).toContain(".chat-log { display: grid; gap: 12px; align-content: start; overflow: auto; max-height: 240px;");
    expect(webApp).toContain("data-zealwish-web-dashboard");
    expect(webApp).toContain("Passport integrity");
    expect(webApp).toContain("Daily operating queue");
    expect(webApp).toContain("Start character creation");
    expect(webApp).toContain("Continue companion chat");
    expect(webApp).toContain("Export ownership record");
    expect(webApp).not.toContain("Web Console");
    expect(webApp).not.toMatch(chinesePattern);
  });

  it("treats Settings as a Web data ownership control center", () => {
    const webApp = readFileSync(webAppPath, "utf8");
    const web = readFileSync(webPath, "utf8");

    expect(web).toContain("settings-grid");
    expect(web).toContain("storage-ledger");
    expect(web).toContain("copy-status");
    expect(webApp).toContain("data-zealwish-settings-panel");
    expect(webApp).toContain("Data ownership center");
    expect(webApp).toContain("Connection status");
    expect(webApp).toContain("Local browser storage");
    expect(webApp).toContain("Runtime API");
    expect(webApp).toContain("API connected.");
    expect(webApp).toContain("API unavailable — browser fallback active.");
    expect(webApp).toContain("Copy export JSON");
    expect(webApp).toContain("navigator.clipboard.writeText");
    expect(webApp).not.toMatch(chinesePattern);
  });

  it("ships the Web workspace with production-ready browser scripts", () => {
    const web = readFileSync(webPath, "utf8");
    const compiledWebAppPath = join(root, "frontend-v4", "src", "v6", "zealwish-web-app.js");
    const compiledWebApp = readFileSync(compiledWebAppPath, "utf8");
    const webBundleScript = readFileSync(webBundleScriptPath, "utf8");

    expect(existsSync(compiledWebAppPath)).toBe(true);
    expect(existsSync(webBundleScriptPath)).toBe(true);
    expect(web).toContain("react.production.min.js");
    expect(web).toContain("react-dom.production.min.js");
    expect(web).toContain('src="src/v6/zealwish-web-app.js?v=20260611-api"');
    expect(compiledWebApp).not.toContain("require(");
    expect(compiledWebApp).not.toContain("react/jsx-runtime");
    expect(webBundleScript).toContain('jsxFactory: "React.createElement"');
    expect(webBundleScript).toContain("tsconfigRaw");
    expect(web).not.toContain("react.development.js");
    expect(web).not.toContain("@babel/standalone");
    expect(web).not.toContain('type="text/babel"');
  });

  it("keeps the mobile Web workspace compact enough for first-screen operation", () => {
    const web = readFileSync(webPath, "utf8");

    expect(web).toContain("@media (max-width: 820px)");
    expect(web).toContain(".module-nav { display: flex; overflow-x: auto;");
    expect(web).toContain(".web-app-shell, .app-sidebar, .app-main, .app-topbar, .workspace { width: 100%; max-width: 100vw; }");
    expect(web).toContain(".module-nav a { flex: 0 0 136px;");
    expect(web).toContain(".sidebar-footer { display: none; }");
    expect(web).toContain(".app-inspector { display: none; }");
    expect(web).toContain(".page-title h1 { font-size: clamp(44px, 15vw, 72px); }");

    const webApp = readFileSync(webAppPath, "utf8");
    expect(webApp).toContain("data-module-id");
    expect(webApp).toContain("scrollIntoView");
  });

  it("keeps desktop Talk and Create primary actions above the 900px first-screen fold", () => {
    const web = readFileSync(webPath, "utf8");

    expect(web).toContain(".workspace { padding: clamp(18px, 3vw, 34px); }");
    expect(web).toContain(".page-title { max-width: 860px; margin-bottom: 18px; }");
    expect(web).toContain(".page-title h1 { margin: 10px 0 0; font-family: Teko, Inter, sans-serif; font-size: clamp(48px, 6vw, 88px);");
    expect(web).toContain(".page-title p { margin: 10px 0 0; max-width: 620px; color: var(--muted); font-size: 15px; line-height: 1.5; }");
    expect(web).toContain(".panel {");
    expect(web).toContain("padding: clamp(18px, 2vw, 24px);");
    expect(web).toContain(".panel h2 { margin: 10px 0 12px; font-family: Teko, Inter, sans-serif; font-size: clamp(32px, 4vw, 52px);");
    expect(web).toContain(".field-label { display: block; margin: 12px 0 8px;");
    expect(web).toContain("textarea.field { min-height: 104px;");
    expect(web).toContain(".chat-panel { min-height: 420px;");
    expect(web).toContain(".chat-log { display: grid; gap: 12px; align-content: start; overflow: auto; max-height: 240px;");
    expect(web).not.toContain(".chat-panel { min-height: 620px;");
  });

  it("gives key Web workspace actions visible state feedback and a real export download path", () => {
    const webApp = readFileSync(webAppPath, "utf8");

    expect(webApp).toContain("saveStatus");
    expect(webApp).toContain("Passport saved locally.");
    expect(webApp).toContain("memoryStatus");
    expect(webApp).toContain("Memory added to vault.");
    expect(webApp).toContain("Download export JSON");
    expect(webApp).toContain("URL.createObjectURL");
    expect(webApp).not.toMatch(chinesePattern);
  });

  it("keeps production Web pages operational instead of placeholder-only", () => {
    const webApp = readFileSync(webAppPath, "utf8");
    const web = readFileSync(webPath, "utf8");

    expect(webApp).toContain("worldStatus");
    expect(webApp).toContain("World route activated:");
    expect(webApp).toContain("Open route");
    expect(webApp).toContain("timelineStatus");
    expect(webApp).toContain("Timeline checkpoint opened:");
    expect(webApp).toContain("Export full timeline");
    expect(web).toContain(".route-card button");
    expect(web).toContain(".timeline-row button");
  });

  it("keeps the mobile Settings primary export action near the top of the workflow", () => {
    const web = readFileSync(webPath, "utf8");

    expect(web).toContain("settings-export");
    expect(web).toContain(".settings-export { order: -1; }");
    expect(web).toContain(".dashboard-metric strong {");
    expect(web).toContain("overflow-wrap: break-word;");
  });

  it("does not ship a hard-coded chat API key in the deployable Web server", () => {
    const server = readFileSync(webServerPath, "utf8");

    expect(server).not.toMatch(/sk-[A-Za-z0-9_-]{20,}/);
    expect(server).toContain("CHAT_API_KEY not configured");
    expect(server).toContain("server-fallback");
  });

  it("uses the ZEALWISH HTTP API first and keeps browser fallback when the API is unavailable", () => {
    const webApp = readFileSync(webAppPath, "utf8");

    expect(webApp).toContain("WEB_CHAT_FALLBACKS");
    expect(webApp).toContain("ZEALWISH_BROWSER_AVATAR_FALLBACK");
    expect(webApp).toContain("refreshApiStatus");
    expect(webApp).toContain("window.ZEALWISH_API?.health");
    expect(webApp).toContain("window.ZEALWISH_API?.chat");
    expect(webApp).toContain("apiStatus");
    expect(webApp).toContain("source: result?.source || 'http-api'");
    expect(webApp).toContain("source: 'browser-fallback'");
    expect(webApp).toContain("localStorage.setItem('zealwish.web.passport'");
    expect(webApp).toContain("localStorage.setItem('zealwish.web.memories'");
    expect(webApp).not.toContain("Image generation is only available inside the oc-world Electron runtime.");
    expect(webApp).not.toMatch(/ocworld/i);
    expect(webApp).not.toMatch(/oc-world/i);
  });

  it("loads an OKX-compatible wallet service and exposes wallet-owned UI actions", () => {
    expect(existsSync(walletPath)).toBe(true);
    const index = readFileSync(indexPath, "utf8");
    const landing = readFileSync(landingPath, "utf8");
    const web = readFileSync(webPath, "utf8");
    const topbar = readFileSync(topbarPath, "utf8");
    const wallet = readFileSync(walletPath, "utf8");
    const walletRuntime = readFileSync(walletRuntimePath, "utf8");

    expect(index).toContain('src="src/v4/wallet-service.jsx"');
    expect(web).toContain('src="src/v4/wallet-service.jsx"');
    expect(index).not.toContain('src="src/v4/wallet-service.js"');
    expect(index).not.toContain('src="src/v4/topbar.jsx"');
    expect(wallet).toContain("window.ZEALWISH_WALLET");
    expect(walletRuntime).toContain("window.ZEALWISH_API");
    expect(walletRuntime).toContain("ZEALWISH_DEFAULT_LOCAL_API_BASE");
    expect(wallet).toContain("window.okxwallet");
    expect(wallet).toContain("eip6963:requestProvider");
    expect(wallet).toContain("eth_requestAccounts");
    expect(wallet).toContain("eth_chainId");
    expect(landing).toContain("Connect OKX Wallet");
    expect(landing).toContain("handleConnectWallet");
    expect(landing).toContain("Connect OKX Wallet");
    expect(wallet).not.toMatch(chinesePattern);
  });

  it("documents the preview and architecture contract in English", () => {
    expect(existsSync(architecturePath)).toBe(true);
    const architecture = readFileSync(architecturePath, "utf8");

    expect(architecture).toContain("Current Preview Contract");
    expect(architecture).toContain("Frontend / Backend Separation");
    expect(architecture).toContain("Target Monorepo Shape");
    expect(architecture).toContain("All user-facing product copy must be English.");
    expect(architecture).not.toMatch(chinesePattern);
  });

  it("main visual uses the transparent character PNG", () => {
    const landing = readFileSync(landingPath, "utf8");
    const assetPath = join(root, "frontend-v4", "assets", "zealwish-main-character.png");
    const png = readFileSync(assetPath);

    expect(landing).toContain("assets/zealwish-main-character.png");
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(png[25]).toBe(6);
    expect(createHash("sha256").update(png).digest("hex")).toBe(expectedMainCharacterHash);
  });
});
