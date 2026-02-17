let videoStream = null;
let videoElement = null;

export async function startCamera() {
    videoElement = document.getElementById('webcam-feed');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: false
        });

        videoElement.srcObject = stream;
        videoStream = stream;

        return new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                videoElement.play();
                resolve(videoElement);
            };
        });
    } catch (err) {
        throw err;
    }
}

export function getVideoElement() {
    return videoElement;
}

export function takePhoto() {
    // Legacy support or single shot
    return videoElement;
}

export function captureFrame() {
    if (!videoElement) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');

    // Check if video is mirrored (user facing) and flip if necessary
    // Usually CSS handles the visual mirror, but we want the captured image to match what the user sees
    // If we just draw, it's raw. 
    // Let's assume we want valid output.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(videoElement, 0, 0);
    return canvas;
}
