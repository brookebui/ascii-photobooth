import { startCamera, takePhoto, getVideoElement } from './camera.js';
import { initAsciiRenderer, updateAsciiLoop } from './ascii.js';
import { initUI } from './ui.js';
import { initLandingPage } from './landing.js';

let isInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Show landing page first
    initLandingPage(async (selectedMode) => {
        console.log(`Starting app in ${selectedMode} mode...`);

        try {
            if (!isInitialized) {
                const video = await startCamera();

                // Initialize ASCII renderer with the video feed
                initAsciiRenderer(video);

                // Start the rendering loop
                updateAsciiLoop();

                // Initialize UI controls
                initUI();

                isInitialized = true;
            }

            if (selectedMode === 'strip') {
                const btnStrip = document.getElementById('btn-mode-strip');
                if (btnStrip) btnStrip.click();
            } else {
                const btnSingle = document.getElementById('btn-mode-single');
                if (btnSingle) btnSingle.click();
            }

            // Immediate Start
            setTimeout(() => {
                const btnCapture = document.getElementById('btn-capture');
                if (btnCapture) btnCapture.click();
            }, 500); // Short delay to allow UI to settle

        } catch (error) {
            console.error('Failed to initialize photobooth:', error);
            alert('Could not access camera. Please allow camera permissions.');
        }
    });
});
