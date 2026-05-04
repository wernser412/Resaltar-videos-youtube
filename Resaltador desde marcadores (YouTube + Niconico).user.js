// ==UserScript==
// @name         Resaltador desde marcadores (YouTube + Niconico)
// @namespace    http://tampermonkey.net/
// @version      2026.05.30
// @description  Resalta videos + velocidad + comentarios + limpiar likes + volumen 300%
// @author       wernser412
// @icon         https://github.com/wernser412/Resaltar-videos-youtube/raw/refs/heads/main/ICONO.ico
// @downloadURL  https://github.com/wernser412/Resaltar-videos-youtube/raw/refs/heads/main/YouTube%20-%20Resaltador%20desde%20marcadores%20de%20Chrome.user.js
// @match        https://www.youtube.com/*
// @match        https://www.nicovideo.jp/*
// @match        https://nico.ms/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function () {
'use strict';

/* ============================ */
let urls = [];
let idsYT = new Set();
let idsNico = new Set();
let overlay;

/* 🔊 VOLUMEN */
let ctx, source, gainNode;
let vhSlider, vhLabel;
const VOL_KEY = "vh_volume";

/* ============================ DETECCIÓN */
const isYT = () => location.hostname.includes("youtube.com");
const isNico = () => location.hostname.includes("nicovideo.jp") || location.hostname.includes("nico.ms");

/* ============================ OVERLAY */
function showOverlay(text, link = false) {
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.style.cssText = `
            position:fixed;top:50%;left:50%;
            transform:translate(-50%,-50%);
            z-index:999999;
        `;
        const box = document.createElement("div");
        box.style.cssText = `
            width:420px;background:#0b1220;color:#fff;
            border:4px solid #4fc3ff;border-radius:20px;
            padding:20px;font-size:20px;font-weight:bold;
            text-align:center;white-space:pre-line;
        `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }
    overlay.firstChild.textContent =
        link ? "ABRE ESTA PLAYLIST:\nhttps://www.youtube.com/playlist?list=LL" : text;
}

/* ============================ IDS */
function getYTid(url) {
    try {
        const u = new URL(url);
        if (u.hostname === "youtu.be") return u.pathname.slice(1);
        if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
        return u.searchParams.get("v");
    } catch { return null; }
}

function getNicoId(url) {
    try {
        const u = new URL(url);
        if (u.hostname.includes("nico.ms")) return u.pathname.slice(1);
        const m = u.pathname.match(/\/watch\/([a-z]{2}\d+)/);
        return m ? m[1] : null;
    } catch { return null; }
}

/* ============================ BUILD */
function rebuild() {
    idsYT.clear();
    idsNico.clear();

    urls.forEach(u => {
        const yt = getYTid(u);
        const ni = getNicoId(u);
        if (yt) idsYT.add(yt);
        if (ni) idsNico.add(ni);
    });
}

/* ============================ IMPORT */
function extractAll(html) {
    const yt = html.match(/https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+)/gi) || [];
    const ni = html.match(/https:\/\/(?:www\.)?(?:nicovideo\.jp\/watch\/[a-z]{2}\d+|nico\.ms\/[a-z]{2}\d+)/gi) || [];
    return [...new Set([...yt, ...ni])];
}

async function importHTML() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".html";

    input.onchange = async () => {
        const html = await input.files[0].text();
        const found = extractAll(html);

        if (!found.length) return alert("❌ No se encontraron videos");

        await GM_setValue("vh_urls", found);
        urls = found;
        rebuild();

        alert(`✅ ${found.length} videos importados`);
        refresh();
    };

    input.click();
}

/* ============================ RESALTADO */
function highlightYT() {
    document.querySelectorAll('a[href*="watch?v="], a[href*="youtu.be/"]').forEach(a => {

        if (
            a.closest('ytd-comments') ||
            a.closest('#comments') ||
            a.closest('ytd-comment-thread-renderer')
        ) return;

        const id = getYTid(a.href);

        if (id && idsYT.has(id) && !a.classList.contains("vh-h")) {
            a.classList.add("vh-h");
        }
    });

    const id = getYTid(location.href);
    if (idsYT.has(id)) {
        document.querySelector('ytd-watch-metadata h1 yt-formatted-string')
            ?.classList.add("vh-title");
    }
}

function highlightNico() {
    document.querySelectorAll('a[href*="/watch/"], a[href*="nico.ms"]').forEach(a => {
        const id = getNicoId(a.href);
        if (id && idsNico.has(id) && !a.classList.contains("vh-h")) {
            a.classList.add("vh-h");
        }
    });

    const id = getNicoId(location.href);
    if (idsNico.has(id)) {
        document.querySelector("h1")?.classList.add("vh-title");
    }
}

function refresh() {
    if (isYT()) highlightYT();
    if (isNico()) highlightNico();
}

/* ============================ VELOCIDAD */
function addSpeedBtn() {
    if (!isYT()) return;

    const controls = document.querySelector('.ytp-right-controls');
    if (!controls || document.getElementById('vh-speed')) return;

    const btn = document.createElement('button');
    btn.id = 'vh-speed';
    btn.className = 'ytp-button';
    btn.title = 'Velocidad';

    btn.style.cssText = `
        display:flex;
        align-items:center;
        justify-content:center;
        width:48px;
        height:100%;
        font-size:13px;
        font-weight:600;
        line-height:1;
    `;

    const speeds = [1, 1.5, 2];
    let index = 0;

    btn.textContent = speeds[index] + '×';

    btn.onclick = () => {
        const v = document.querySelector('video');
        if (!v) return;

        index = (index + 1) % speeds.length;
        v.playbackRate = speeds[index];
        btn.textContent = speeds[index] + '×';
    };

    controls.prepend(btn);
}

/* ============================ 🔊 VOLUMEN */
function setupAudio(video) {
    if (ctx) return;

    ctx = new AudioContext();
    source = ctx.createMediaElementSource(video);
    gainNode = ctx.createGain();

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.value = 1.0;
}

async function addVolumeSlider() {
    if (!isYT()) return;

    const controls = document.querySelector('.ytp-right-controls');
    if (!controls || document.getElementById('vh-volume')) return;

    const container = document.createElement('div');
    container.id = 'vh-volume';

    container.style.cssText = `
        display:flex;
        align-items:center;
        gap:6px;
        margin-right:10px;
    `;

    const saved = await GM_getValue(VOL_KEY, 100);

    vhLabel = document.createElement('span');
    vhLabel.textContent = saved + '%';
    vhLabel.style.fontSize = '12px';

    vhSlider = document.createElement('input');
    vhSlider.type = 'range';
    vhSlider.min = 100;
    vhSlider.max = 300;
    vhSlider.value = saved;
    vhSlider.style.width = '80px';

    vhSlider.oninput = async () => {
        const video = document.querySelector('video');
        if (!video) return;

        setupAudio(video);

        const value = vhSlider.value / 100;
        gainNode.gain.value = value;

        vhLabel.textContent = vhSlider.value + '%';
        await GM_setValue(VOL_KEY, vhSlider.value);
    };

    container.appendChild(vhLabel);
    container.appendChild(vhSlider);

    controls.prepend(container);
}

/* ============================ COMENTARIOS */
const COMMENTS_KEY = "vh_comments";

async function toggleComments() {
    const s = await GM_getValue(COMMENTS_KEY, true);
    await GM_setValue(COMMENTS_KEY, !s);
    applyComments();
}

async function applyComments() {
    if (!isYT()) return;

    const enabled = await GM_getValue(COMMENTS_KEY, true);
    const c = document.querySelector('ytd-comments');
    if (!c || !c.parentElement) return;

    document.getElementById("vh-c-msg")?.remove();

    if (enabled) {
        c.style.display = '';
        return;
    }

    c.style.display = 'none';

    const msg = document.createElement("div");
    msg.id = "vh-c-msg";
    msg.textContent = "💬 Comentarios desactivados";
    msg.style.cssText = "margin:30px auto;text-align:center;font-size:20px;color:#aaa;";
    c.parentElement.insertBefore(msg, c);
}

/* ============================ LIMPIAR LIKES (INTACTO) */
async function cleanLikes() {
    if (!location.href.includes("list=LL")) {
        showOverlay("", true);
        return;
    }

    showOverlay("❤️ Quitando likes...");
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    while (true) {
        const menus = document.querySelectorAll('ytd-playlist-video-renderer button');

        for (const btn of menus) {
            btn.scrollIntoView({ block: "center" });
            await sleep(500);
            btn.click();
            await sleep(500);

            const items = [...document.querySelectorAll('ytd-menu-service-item-renderer')];
            const remove = items.find(i =>
                i.innerText.toLowerCase().includes('me gusta')
            );

            remove?.click();
            await sleep(1000);
        }

        window.scrollBy(0, 1500);
        await sleep(2000);
    }
}

/* ============================ ESTILOS */
GM_addStyle(`
.vh-h { background:#fff3a0 !important; border-left:6px solid orange !important; padding-left:6px !important; }
.vh-title { background:linear-gradient(90deg,#fff3a0,transparent) !important; border-left:6px solid orange !important; padding:6px 10px !important; border-radius:6px !important; }
`);

/* ============================ OBSERVER */
let debounce;
new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
        refresh();
        addSpeedBtn();
        addVolumeSlider();
        applyComments();
    }, 300);
}).observe(document.body, { childList: true, subtree: true });

/* ============================ INIT */
window.addEventListener("load", async () => {
    urls = await GM_getValue("vh_urls", []);
    rebuild();

    refresh();
    addSpeedBtn();
    addVolumeSlider();
    applyComments();
});

/* ============================ MENU (TODO INTACTO) */
GM_registerMenuCommand("📥 Importar bookmarks", importHTML);
GM_registerMenuCommand("💬 ON/OFF comentarios", toggleComments);
GM_registerMenuCommand("❤️ Limpiar Me gusta", cleanLikes);

})();
