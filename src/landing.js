export function initLandingPage(onStartApp) {
    const landingOverlay = document.getElementById('landing-overlay');
    const welcomeText = document.getElementById('landing-text');
    const btnContainer = document.getElementById('landing-controls');
    const btnSingle = document.getElementById('btn-start-single');
    const btnStrip = document.getElementById('btn-start-strip');

    if (!landingOverlay || !welcomeText) return;

    // 1. Decrypt Animation
    const finalMessage = "ASCII PHOTOBOOTH";
    decryptText(welcomeText, finalMessage, () => {
        // Animation Complete Callback

        // 2. Reveal Buttons after a brief pause
        setTimeout(() => {
            landingOverlay.classList.add('interaction-ready'); // Moves text up
            btnContainer.classList.remove('hidden');

            // Add slight stagger to buttons
            setTimeout(() => btnSingle.classList.add('visible'), 100);
            setTimeout(() => btnStrip.classList.add('visible'), 300);
        }, 800);
    });

    // 3. Event Listeners
    btnSingle.addEventListener('click', () => {
        transitionOut('single');
    });

    btnStrip.addEventListener('click', () => {
        transitionOut('strip');
    });

    function transitionOut(mode) {
        landingOverlay.classList.add('fade-out');

        // Wait for fade out then remove and start app
        setTimeout(() => {
            landingOverlay.style.display = 'none';
            onStartApp(mode);
        }, 800);
    }
}

function decryptText(element, finalString, callback) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?";
    const duration = 1000; // ms
    const frameRate = 30;
    const totalFrames = (duration / 1000) * frameRate;

    let frame = 0;
    // const length = finalString.length; 
    // element.innerText = ""; // Clear initially? Or start with random garbage?

    const interval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;

        // Determine how many characters should be "resolved" based on progress
        const resolvedCount = Math.floor(progress * finalString.length);

        let output = "";

        for (let i = 0; i < finalString.length; i++) {
            if (i < resolvedCount) {
                // Resolved character
                output += finalString[i];
            } else {
                // Random glitch character
                output += chars[Math.floor(Math.random() * chars.length)];
            }
        }

        element.innerText = output;

        if (frame >= totalFrames) {
            clearInterval(interval);
            element.innerText = finalString; // Ensure exact match at end
            if (callback) callback();
        }
    }, 1000 / frameRate);
}

export function resetToModeSelection() {
    const landingOverlay = document.getElementById('landing-overlay');
    const welcomeText = document.getElementById('landing-text');
    const btnContainer = document.getElementById('landing-controls');
    const btnSingle = document.getElementById('btn-start-single');
    const btnStrip = document.getElementById('btn-start-strip');

    if (!landingOverlay) return;

    // Reset Text
    if (welcomeText) welcomeText.innerText = "SELECT MODE";

    // Show Overlay
    landingOverlay.style.display = 'flex';
    landingOverlay.classList.remove('fade-out');

    // Ensure content is in "ready" position (up top)
    landingOverlay.classList.add('interaction-ready');

    // Show Buttons
    if (btnContainer) btnContainer.classList.remove('hidden');
    if (btnSingle) btnSingle.classList.add('visible');
    if (btnStrip) btnStrip.classList.add('visible');
}
