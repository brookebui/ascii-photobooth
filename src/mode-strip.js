import { captureFrame } from './camera.js';

export async function startStripSequence(onProgress) {
    const images = [];

    for (let i = 1; i <= 4; i++) {
        // Countdown
        for (let count = 3; count > 0; count--) {
            onProgress({ step: 'countdown', count, photoNum: i });
            await wait(1000);
        }

        // Capture at 0
        const frame = captureFrame();

        // Flash / Sound
        onProgress({ step: 'flash', photoNum: i }); // UI handles Sound + Flash
        await wait(150); // increased flash duration slightly for impact
        images.push(frame);

        // Preview briefly (freeze effect)
        onProgress({ step: 'preview', photoNum: i, image: frame });
        await wait(1000);
    }

    return images;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function composeStrip(images) {
    // Config
    const padding = 20;
    const spacing = 15;
    const headerHeight = 0; // or 40 if we want text
    const footerHeight = 60;

    if (images.length === 0) return null;

    const imgW = images[0].width;
    const imgH = images[0].height;

    // Create new canvas
    const canvas = document.createElement('canvas');
    canvas.width = imgW + (padding * 2);
    canvas.height = (imgH * 4) + (spacing * 3) + (padding * 2) + footerHeight;

    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f0f0f0'; // Off-white photo paper
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw images
    let y = padding;
    images.forEach((img, index) => {
        // Shadow for each photo? Maybe simple border is cleaner
        // Draw photo
        ctx.save();
        // Rounded corners for inner photos
        // rect(padding, y, imgW, imgH)
        // clip
        // draw
        ctx.drawImage(img, padding, y, imgW, imgH);
        ctx.restore();

        y += imgH + spacing;
    });

    // Footer Text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const date = new Date().toLocaleDateString();
    ctx.fillText(`${date}`, canvas.width / 2, canvas.height - (footerHeight / 2) - padding / 2);

    return canvas;
}
