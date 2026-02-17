let videoStream = null;
let videoElement = null;

export async function startCamera() {
    videoElement = document.getElementById('webcam-feed');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
    }

    try {
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: false
        });
        console.log('Camera access granted. Stream:', stream);

        videoElement.srcObject = stream;
        videoStream = stream;

        return new Promise((resolve, reject) => {
            videoElement.onloadedmetadata = () => {
                console.log('Video metadata loaded. Attempting to play...');
                videoElement.play().then(() => {
                    console.log('Video playing successfully.');
                    resolve(videoElement);
                }).catch(e => {
                    console.error('Error playing video:', e);
                    reject(e);
                });
            };
        });
    } catch (err) {
        console.error('Error in startCamera:', err.name, err.message);
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
