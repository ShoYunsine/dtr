import * as faceapi from 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/dist/face-api.esm.js';

export async function handleImageUpload(file) {
    if (!file) {
        console.error('No file provided.');
        return Promise.reject('No file selected.');
    }

    const img = new Image();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = function (e) {
            img.src = e.target.result;
        };

        reader.onerror = function (error) {
            console.error('Error reading file:', error);
            reject('Error reading file.');
        };

        img.onload = async function () {
            try {
                console.log('Loading models...');
                await faceapi.nets.tinyFaceDetector.loadFromUri('../models');
                await faceapi.nets.faceLandmark68Net.loadFromUri('../models');
                await faceapi.nets.faceRecognitionNet.loadFromUri('../models');
                console.log('Models loaded successfully.');

                const canvas = document.getElementById('canvas');
                if (!canvas) {
                    console.error('Canvas element not found.');
                    return reject('Canvas element not found.');
                }

                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    console.error('2D context not available.');
                    return reject('2D context not available.');
                }

                // Set the desired canvas height
                const desiredHeight = 480; // Set your desired height here
                const aspectRatio = img.width / img.height;
                const displaySize = { 
                    width: desiredHeight * aspectRatio, 
                    height: desiredHeight 
                };

                faceapi.matchDimensions(canvas, displaySize);

                canvas.width = displaySize.width;
                canvas.height = displaySize.height;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                console.log('Detecting faces...');
                const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                console.log('Faces detected:', detections);
                detections.forEach((detection, index) => {
                    console.log(`Face ${index + 1} Descriptor:`, detection.descriptor);
                });

                faceapi.draw.drawDetections(canvas, detections);
                faceapi.draw.drawFaceLandmarks(canvas, detections);

                resolve(detections);
            } catch (error) {
                console.error('Error loading models or processing image:', error);
                reject('Error processing image.');
            }
        };

        reader.readAsDataURL(file);
    });
}
