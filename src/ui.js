import { setDensity, setCharset, toggleColor, freezeFrame, unfreezeFrame, getAsciiText, getCanvas, setSource, playTransition } from './ascii.js';
import { captureFrame, takePhoto, getVideoElement } from './camera.js';
import { startStripSequence, composeStrip } from './mode-strip.js';
import { resetToModeSelection } from './landing.js';

export function initUI() {
    let currentMode = 'single'; // 'single' | 'strip';
    const videoElement = getVideoElement();

    // === CONTROLS ===

    // Density Slider
    const densitySlider = document.getElementById('density-slider');
    densitySlider.addEventListener('input', (e) => {
        setDensity(e.target.value);
    });

    // Charset Toggles
    const charsetBtns = document.querySelectorAll('#charset-toggles .toggle-btn');
    charsetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            charsetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setCharset(btn.dataset.set);
        });
    });

    // Color Toggle
    const colorBtn = document.getElementById('btn-toggle-color');
    colorBtn.addEventListener('click', () => {
        colorBtn.classList.toggle('active');
        toggleColor(colorBtn.classList.contains('active'));
    });

    // Retro Theme Toggle
    const retroBtn = document.getElementById('btn-toggle-retro');
    retroBtn.addEventListener('click', () => {
        retroBtn.classList.toggle('active');
        document.body.classList.toggle('retro-mode');
    });

    // === DRAWER ===
    const drawerToggle = document.getElementById('drawer-toggle');
    const controlsPanel = document.querySelector('.controls-panel');

    drawerToggle.addEventListener('click', () => {
        controlsPanel.classList.toggle('collapsed');
        // The CSS transition on height handled flex flow update automatically?
        // Yes, because camera-section is flex:1, it will grow/shrink as controls-panel changes height options.
    });

    // === MODE SELECTION ===
    const btnSingle = document.getElementById('btn-mode-single');
    const btnStrip = document.getElementById('btn-mode-strip');

    btnSingle.addEventListener('click', () => setMode('single'));
    btnStrip.addEventListener('click', () => setMode('strip'));

    function setMode(mode) {
        currentMode = mode;
        if (mode === 'single') {
            btnSingle.classList.add('active');
            btnStrip.classList.remove('active');
        } else {
            btnStrip.classList.add('active');
            btnSingle.classList.remove('active');
        }
    }

    // === CAPTURE FLOW ===
    const captureBtn = document.getElementById('btn-capture');
    const captureActions = document.getElementById('capture-actions');
    const retakeBtn = document.getElementById('btn-retake');
    const dlPngBtn = document.getElementById('btn-dl-png');
    const dlTxtBtn = document.getElementById('btn-dl-txt');
    const copyBtn = document.getElementById('btn-copy');
    const viewToggleBtn = document.getElementById('btn-view-toggle');

    const countdownOverlay = document.getElementById('countdown-overlay');
    const flashOverlay = document.getElementById('flash-overlay');
    const progressOverlay = document.getElementById('progress-overlay');
    const resultDisplay = document.getElementById('result-display');
    const asciiCanvas = document.getElementById('ascii-canvas');

    captureBtn.addEventListener('click', () => {
        if (currentMode === 'single') {
            startSingleCapture();
        } else {
            startStripCapture();
        }
    });

    retakeBtn.addEventListener('click', () => {
        resetUI();
        // Return to Mode Selection, then Auto-Start
        resetToModeSelection();
    });

    dlPngBtn.addEventListener('click', downloadPNG);
    dlTxtBtn.addEventListener('click', downloadTXT);
    copyBtn.addEventListener('click', copyToClipboard);

    viewToggleBtn.addEventListener('click', () => {
        // Toggle opacity/visibility of overlay vs canvas
        const isShowingOriginal = !resultDisplay.classList.contains('hidden');

        if (isShowingOriginal) {
            // Switch to ASCII
            resultDisplay.classList.add('hidden');
            asciiCanvas.classList.remove('hidden');
            asciiCanvas.classList.add('visible');
            viewToggleBtn.textContent = 'SHOW ORIGINAL';
        } else {
            // Switch to Original
            resultDisplay.classList.remove('hidden');
            asciiCanvas.classList.remove('visible'); // Fade out ASCII
            // asciiCanvas.classList.add('hidden'); // Optional, but opacity 0 is enough
            viewToggleBtn.textContent = 'SHOW ASCII';
        }
    });

    function startSingleCapture() {
        captureBtn.classList.add('hidden');

        // Hide sidebar during capture
        document.querySelector('.controls-panel').classList.add('hidden-panel');

        let count = 3;
        countdownOverlay.textContent = count;
        countdownOverlay.classList.remove('hidden');

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownOverlay.textContent = count;
            } else {
                clearInterval(timer);
                countdownOverlay.classList.add('hidden');

                // Capture frame first
                const frame = captureFrame();
                resultDisplay.src = frame.toDataURL();
                resultDisplay.classList.remove('hidden'); // Show original result

                // Hide live feed/canvas temporarily
                videoElement.classList.add('hidden-feed');
                asciiCanvas.classList.add('hidden'); // Ensure ASCII canvas is hidden initially

                // Flash
                flashOverlay.classList.add('flash-active');
                freezeFrame(); // Stop ASCII Loop (saves resources)

                setTimeout(() => flashOverlay.classList.remove('flash-active'), 150);

                // Show Actions
                showActions();

                // Auto-transition to ASCII after 1.5s
                setTimeout(() => {
                    convertToAsciiView(frame); // Pass frame as source
                    // Show sidebar after transition
                    setTimeout(() => {
                        document.querySelector('.controls-panel').classList.remove('hidden-panel');
                    }, 500);
                }, 1500);
            }
        }, 1000);
    }

    async function startStripCapture() {
        captureBtn.classList.add('hidden');
        progressOverlay.classList.remove('hidden');

        // Hide sidebar during capture
        document.querySelector('.controls-panel').classList.add('hidden-panel');

        const images = await startStripSequence((status) => {
            if (status.step === 'countdown') {
                countdownOverlay.textContent = status.count;
                countdownOverlay.classList.remove('hidden');
                progressOverlay.textContent = `PHOTO ${status.photoNum} OF 4`;
            }
            else if (status.step === 'flash') {
                countdownOverlay.classList.add('hidden');
                flashOverlay.classList.add('flash-active');
                setTimeout(() => flashOverlay.classList.remove('flash-active'), 100);
            }
        });

        // Done
        progressOverlay.classList.add('hidden');

        // Compose & Show Original Strip
        const stripCanvas = composeStrip(images);
        resultDisplay.src = stripCanvas.toDataURL();

        // Enter Split View
        const monitorFrame = document.querySelector('.monitor-frame');
        monitorFrame.classList.remove('reveal-ascii'); // Reset
        monitorFrame.classList.add('split-view');

        // Show Original
        resultDisplay.classList.remove('hidden');

        // Show ASCII (initially hidden/behind by CSS)
        setSource(stripCanvas);

        // Ensure ASCII is rendering and visible in DOM (but behind in Z)
        unfreezeFrame();
        asciiCanvas.classList.remove('hidden');
        asciiCanvas.classList.add('visible');

        playTransition(parseInt(densitySlider.value, 10));

        showActions(true); // true = isStrip

        // Trigger "Slide Reveal" animation after slight delay to ensure render is ready
        // Increased delay slightly to 1.2s to clearer separation of "Show" then "Split"
        setTimeout(() => {
            monitorFrame.classList.add('reveal-ascii');

            // Show sidebar after split reveal starts
            setTimeout(() => {
                document.querySelector('.controls-panel').classList.remove('hidden-panel');
            }, 800); // 0.8s into the slide
        }, 1200);
    }

    // For Single Mode, we keep the transition logic but ensure visibility is handled correctly
    function convertToAsciiView(source) {
        setSource(source);
        resultDisplay.classList.add('hidden');
        asciiCanvas.classList.remove('hidden'); // Ensure no display:none
        asciiCanvas.classList.add('visible');   // Ensure opacity:1

        unfreezeFrame();
        playTransition(parseInt(densitySlider.value, 10));
        viewToggleBtn.textContent = 'SHOW ORIGINAL';
    }

    function showActions(isStrip = false) {
        captureActions.classList.remove('hidden');
        captureActions.style.display = 'flex';

        if (isStrip) {
            // In strip mode (side-by-side), the toggle button is less relevant 
            // OR it could be used to toggle fullscreen of one or the other?
            // For now, let's hide the VIEW toggle in strip mode since we show both.
            viewToggleBtn.style.display = 'none';
        } else {
            viewToggleBtn.style.display = 'inline-block';
            viewToggleBtn.textContent = 'SHOW ASCII';
        }
    }

    function resetUI() {
        captureActions.classList.add('hidden');
        captureActions.style.display = 'none';
        captureBtn.classList.remove('hidden');

        // Hide Sidebar again on reset
        document.querySelector('.controls-panel').classList.add('hidden-panel');

        // Reset Views
        const monitorFrame = document.querySelector('.monitor-frame');
        monitorFrame.classList.remove('split-view', 'reveal-ascii');

        resultDisplay.classList.add('hidden');
        videoElement.classList.remove('hidden-feed');

        asciiCanvas.classList.remove('visible');
        asciiCanvas.classList.remove('hidden'); // Reset any display overrides

        unfreezeFrame();
        setSource(videoElement);
    }

    function downloadPNG() {
        const canvas = getCanvas();
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `ascii-photo-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function downloadTXT() {
        const text = getAsciiText();
        if (!text) return;

        const blob = new Blob([text], { type: 'text/plain' });
        const link = document.createElement('a');
        link.download = `ascii-photo-${Date.now()}.txt`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }

    async function copyToClipboard() {
        const text = getAsciiText();
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'COPIED!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    }
}
