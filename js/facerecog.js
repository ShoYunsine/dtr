import * as faceapi from 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/dist/face-api.esm.js';
export async function faceDetect(file) {
    if (!file) {
        console.error('No file provided.');
        return Promise.reject('No file selected.');
    }

    const img = new Image();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = function (e) {
            img.src = e.target.result; // Load the image from file
        };

        reader.onerror = function (error) {
            console.error('Error reading file:', error);
            reject('Error reading file.');
        };

        img.onload = async function () {
            try {
                console.log('Loading models...');
                // Load face detection models
                await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
                await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
                await faceapi.nets.faceRecognitionNet.loadFromUri('./models');
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

                //canvas.width = displaySize.width;
                //canvas.height = displaySize.height;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the image on canvas

                console.log('Detecting faces...');
                // Detect faces in the image
                const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                console.log('Faces detected:', detections);
                detections.forEach((detection, index) => {
                    console.log(`Face ${index + 1} Descriptor:`, detection.descriptor);
                });

                // Draw detections and landmarks on the canvas
                faceapi.draw.drawDetections(canvas, detections);
                faceapi.draw.drawFaceLandmarks(canvas, detections);

                resolve(detections); // Return detected faces
            } catch (error) {
                console.error('Error loading models or processing image:', error);
                reject('Error processing image.');
            }
        };

        reader.readAsDataURL(file); // Start reading the file
    });
}

export async function matchFacesFromVideo(videoElement, profiles) {
    let knownDescriptorsArray = [];
    for (const memberProfile of profiles) {
        // Ensure the profile has face descriptors
        if (memberProfile && Array.isArray(memberProfile.faceDescriptors)) {
            console.log(`Descriptors for ${memberProfile.displayName}:`, memberProfile.faceDescriptors);

            // Check if the whole faceDescriptors array has a length of 128
            if (memberProfile.faceDescriptors.length === 128) {
                knownDescriptorsArray.push(
                    new faceapi.LabeledFaceDescriptors(
                        String(memberProfile.uid), // Member's name as label
                        [new Float32Array(memberProfile.faceDescriptors)] // Wrap it in an array
                    )
                );
            } else {
                console.log(`Invalid face descriptor length for member: ${memberProfile.displayName}. Expected 128, got ${memberProfile.faceDescriptors.length}.`);
            }
        } else {
            console.log(`No face descriptors found for member: ${memberProfile.displayName}`);
        }
    }
    if (!videoElement || !knownDescriptorsArray || knownDescriptorsArray.length === 0) {
        console.error('Video element or known descriptors array missing or empty.');
        return;
    }
    
    // Wait until video metadata is loaded to get video dimensions
    videoElement.addEventListener('loadedmetadata', async () => {
        const displaySize = { width: videoElement.videoWidth, height: videoElement.videoHeight };
        faceapi.matchDimensions(videoElement, displaySize);

        // Create FaceMatcher for matching detected faces against known descriptors
        const faceMatcher = new faceapi.FaceMatcher(knownDescriptorsArray, 0.6); // 0.6 is the distance threshold

        // Load face detection models
        await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('./models');

        async function detectFaces() {
            try {
                const detections = await faceapi.detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                if (detections.length > 0) {
                    console.log(`Detected ${detections.length} face(s).`);

                    // Resize detections for better matching
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);

                    // Process each detection to find the best match
                    resizedDetections.forEach((detection, index) => {
                        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                        console.log(`Face ${index + 1}: ${bestMatch.toString()}`);

                        // Optionally display match results on the video (can be customized)
                        displayMatchOnVideo(videoElement, bestMatch);
                    });
                } else {
                    console.log('No faces detected.');
                }
            } catch (error) {
                console.error('Error detecting faces:', error);
            }

            // Continue the detection loop using requestAnimationFrame for smoother execution
            requestAnimationFrame(detectFaces);
        }

        // Start detection once video starts playing
        videoElement.play().then(() => {
            detectFaces(); // Start face detection loop
        }).catch(err => {
            console.error('Error playing video:', err);
        });
    });
}
// Example function to display match on the video or UI
function displayMatchOnVideo(videoElement, bestMatch) {
    const matchText = bestMatch.label !== 'unknown' ? `Matched: ${bestMatch.label}` : 'No match found';

    // Display match result on top of the video element (can be improved as per UI needs)
    const matchLabel = document.createElement('div');
    matchLabel.innerText = matchText;
    matchLabel.style.position = 'absolute';
    matchLabel.style.color = 'white';
    matchLabel.style.top = '10px';
    matchLabel.style.left = '10px';
    matchLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    matchLabel.style.padding = '5px';

    videoElement.parentNode.appendChild(matchLabel);

    // Optionally, remove the label after a few seconds
    setTimeout(() => {
        matchLabel.remove();
    }, 3000);
}