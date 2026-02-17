const chars = {
    standard: 'Ñ@#W$9876543210?!abc;:+=-,._ ',
    minimal: '█▓▒░ ',
    blocks: '█▇▆▅▄▃▂  ',
    matrix: 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ1234567890:・.=*+-<>'
};

// State
let currentCharsetName = 'standard';
let density = 50;
let isMonochrome = true;
let isRetro = false;
let isFrozen = false;
let frozenFrameData = null; // Store image data when frozen

// Elements
let canvas, ctx;
let sourceVideo;
let animationId;
let offscreenCanvas, offscreenCtx;

function getCharset() {
    return chars[currentCharsetName] || chars.standard;
}

let currentSource = null;

export function initAsciiRenderer(video) {
    sourceVideo = video;
    currentSource = video; // Default to video

    canvas = document.getElementById('ascii-canvas');
    ctx = canvas.getContext('2d', { alpha: false });

    // Offscreen canvas for reading pixel data
    offscreenCanvas = document.createElement('canvas');
    offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

    // Initial sizing
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Add ResizeObserver to handle layout changes (e.g. drawer toggle)
    const container = canvas.parentElement;
    const resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
    });
    resizeObserver.observe(container);
}

export function setSource(source) {
    currentSource = source;
    // If source is a canvas (strip), we might need to resize our display canvas to match aspect ratio
    // or fit within the container differently.

    if (source instanceof HTMLCanvasElement) {
        // It's a static image/strip
        // We might want to force a resize to match the source aspect ratio within the container?
        resizeCanvas();
    }
}

export function playTransition(targetDensity) {
    // Animate density from 5 to targetDensity
    const startDensity = 5;
    const duration = 1000;
    const startTime = performance.now();

    function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out quad
        const ease = 1 - (1 - progress) * (1 - progress);

        density = Math.floor(startDensity + (targetDensity - startDensity) * ease);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

function resizeCanvas() {
    if (!currentSource || !canvas) return;

    if (currentSource instanceof HTMLCanvasElement) {
        // MATCH SOURCE EXACTLY for layout consistency in strip mode
        canvas.width = Math.floor(currentSource.width);
        canvas.height = Math.floor(currentSource.height);
    } else {
        // Video/Live Mode: Fit to container
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
    }

    // Match offscreen canvas to visual canvas
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
}

export function updateAsciiLoop() {
    if (!isFrozen) {
        renderAsciiFrame();
        animationId = requestAnimationFrame(updateAsciiLoop);
    }
}

function renderAsciiFrame() {
    if (!ctx || !currentSource) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw source to offscreen canvas
    offscreenCtx.fillStyle = '#000';
    offscreenCtx.fillRect(0, 0, w, h);

    const srcW = currentSource.videoWidth || currentSource.width;
    const srcH = currentSource.videoHeight || currentSource.height;

    // Aspect ratio logic (Contain)
    const srcAspect = srcW / srcH;
    const canvasAspect = w / h;

    let drawW, drawH, drawX, drawY;

    if (srcAspect > canvasAspect) {
        drawW = w;
        drawH = w / srcAspect;
        drawX = 0;
        drawY = (h - drawH) / 2;
    } else {
        drawH = h;
        drawW = h * srcAspect;
        drawX = (w - drawW) / 2;
        drawY = 0;
    }

    offscreenCtx.drawImage(currentSource, 0, 0, srcW, srcH, drawX, drawY, drawW, drawH);

    // 2. Get pixel data
    const imageData = offscreenCtx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    // 3. Determine Theme
    // Always use the computed style (dark mode)
    const bgColor = getComputedStyle(document.body).getPropertyValue('--bg-color').trim();
    let textColor = getComputedStyle(document.body).getPropertyValue('--text-color').trim();

    // Clear main canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // 4. Grid setup
    // 4. Grid setup
    const minCell = 6;
    const maxCell = 20;
    // Ensure cellSize is at least 6 and integer
    const cellSize = Math.max(minCell, Math.floor(maxCell - (density / 100) * (maxCell - minCell)));

    ctx.font = `${cellSize}px 'IBM Plex Mono', monospace`;
    ctx.textBaseline = 'top';

    const charset = getCharset();
    const charLen = charset.length;

    // 5. Loop & Draw
    for (let y = 0; y < h; y += cellSize) {
        for (let x = 0; x < w; x += cellSize) {
            // Use integers for indexing
            const ix = Math.floor(x);
            const iy = Math.floor(y);

            const pixelIndex = (iy * w + ix) * 4;
            if (pixelIndex >= pixels.length - 4) continue; // Safety buffer

            const r = pixels[pixelIndex];
            const g = pixels[pixelIndex + 1];
            const b = pixels[pixelIndex + 2];
            // alpha? skip transparent?
            if (pixels[pixelIndex + 3] < 10) continue;

            const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

            // Tone Mapping: Bright -> Dense (Standard for Dark Mode)
            // (1 - brightness / 255) * maxIndex
            const charIndex = Math.floor((1 - (brightness / 255)) * (charLen - 1));

            const char = charset[charIndex];
            if (!char || char === ' ') continue; // Skip empty

            if (isMonochrome) {
                ctx.fillStyle = textColor;
            } else {
                ctx.fillStyle = `rgb(${r},${g},${b})`;
            }

            ctx.fillText(char, x, y);
        }
    }
}

export function setDensity(val) {
    density = parseInt(val, 10);
}

export function setCharset(name) {
    currentCharsetName = name;
}

export function toggleColor(enabled) {
    isMonochrome = enabled;
}

export function freezeFrame() {
    isFrozen = true;
    cancelAnimationFrame(animationId);
}

export function unfreezeFrame() {
    isFrozen = false;
    updateAsciiLoop();
}

export function getAsciiText() {
    if (!canvas || !offscreenCtx) return '';

    const w = canvas.width;
    const h = canvas.height;

    // Determine grid size (replicate logic from renderAsciiFrame)
    const minCell = 6;
    const maxCell = 20;
    const cellSize = Math.floor(maxCell - (density / 100) * (maxCell - minCell));

    let output = '';

    // We can use the current offscreen canvas content which should be up to date if frozen
    const imageData = offscreenCtx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    const charset = getCharset();
    const charLen = charset.length;

    for (let y = 0; y < h; y += cellSize) {
        for (let x = 0; x < w; x += cellSize) {
            const pixelIndex = (y * w + x) * 4;
            const r = pixels[pixelIndex];
            const g = pixels[pixelIndex + 1];
            const b = pixels[pixelIndex + 2];
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
            const charIndex = Math.floor((brightness / 255) * (charLen - 1));
            const char = charset[charIndex];
            output += char;
        }
        output += '\n';
    }

    return output;
}

export function getCanvas() {
    return canvas;
}
