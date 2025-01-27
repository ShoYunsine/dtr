import * as faceapi from 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/dist/face-api.esm.js';
import { basicNotif, confirmNotif } from './notif.js';
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
                basicNotif("Loading models...", "Please wait...", 5000);
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
    const uidToDisplayNameMap = {}; // Map to store UID to displayName mapping

    for (const memberProfile of profiles) {
        // Ensure the profile has face descriptors
        if (memberProfile && Array.isArray(memberProfile.faceDescriptors)) {
            // Check if the whole faceDescriptors array has a length of 128
            if (memberProfile.faceDescriptors.length === 128) {
                knownDescriptorsArray.push(
                    new faceapi.LabeledFaceDescriptors(
                        String(memberProfile.uid), // Member's UID as label
                        [new Float32Array(memberProfile.faceDescriptors)] // Wrap it in an array
                    )
                );

                // Store UID to displayName mapping
                uidToDisplayNameMap[memberProfile.uid] = memberProfile.displayName;
            } else {
                console.log(`Invalid face descriptor length for member: ${memberProfile.displayName}. Expected 128, got ${memberProfile.faceDescriptors.length}.`);
            }
        } else {
            console.log(`No face descriptors found for member: ${memberProfile.displayName}`);
        }
    }

    if (!videoElement || !knownDescriptorsArray || knownDescriptorsArray.length === 0) {
        console.error('Video element or known descriptors array missing or empty.');
        return [];
    }

    // Load face detection models
    await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('./models');

    // Create FaceMatcher for matching detected faces against known descriptors
    const faceMatcher = new faceapi.FaceMatcher(knownDescriptorsArray, 0.75); // Adjusted threshold

    return new Promise((resolve) => {
        // Wait until video metadata is loaded to get video dimensions
        videoElement.addEventListener('loadedmetadata', () => {
            const displaySize = { width: videoElement.videoWidth, height: videoElement.videoHeight };
            faceapi.matchDimensions(videoElement, displaySize);

            // Start continuous detection loop
            const detectionInterval = 1000; // 1 second interval
            const intervalId = setInterval(async () => {
                let matches = [];
                try {
                    const detections = await faceapi.detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({
                        inputSize: 32, // Increase this value for better accuracy
                        scoreThreshold: 0.1 // Lower this threshold if needed
                    })).withFaceLandmarks().withFaceDescriptors();
            

                    if (detections.length > 0) {
                        console.log(`Detected ${detections.length} face(s).`);

                        // Resize detections for better matching
                        const resizedDetections = faceapi.resizeResults(detections, displaySize);

                        resizedDetections.forEach((detection) => {
                            // Find best match for each detected face
                            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                            const uid = bestMatch.label;

                            // Map UID to displayName, fallback to 'Unknown' if no match
                            const displayName = uid !== 'unknown' ? uidToDisplayNameMap[uid] || 'Unknown' : 'No match found';

                            console.log(`Matched with: ${displayName}`);

                            // Collect match results
                            matches.push(displayName);

                            // Optionally display match results on the video (can be customized)
                            displayMatchOnVideo(videoElement, displayName);
                        });
                    } else {
                        console.log('No faces detected.');
                    }

                } catch (error) {
                    console.error('Error detecting faces:', error);
                }

                // Resolve with matches after detection
                if (matches.length > 0) {
                    console.log('Matches found:', matches);
                    resolve(matches);
                }
            }, detectionInterval);

            // Start playing the video
            videoElement.play().catch(err => {
                console.error('Error playing video:', err);
                clearInterval(intervalId); // Clear the interval on error
                resolve([]); // Resolve with an empty array on error
            });
        });
    });
}

// Example function to display match on the video or UI
function displayMatchOnVideo(videoElement, displayName) {
    const matchText = displayName !== 'Unknown' ? `Matched: ${displayName}` : 'No match found';

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
    }, 1000);
}