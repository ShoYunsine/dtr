import * as faceapi from 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/dist/face-api.esm.js';
import { basicNotif, confirmNotif } from './notif.js';
import { fetchProfile } from './firebase.js';

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
                basicNotif("Models loaded", "Starting scan", 5000);
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

    for (let memberProfile of profiles) {
        memberProfile = await fetchProfile(memberProfile.userid, true);
        if (memberProfile && Array.isArray(memberProfile.faceDescriptors)) {

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

    basicNotif("Loading models...", "Please wait...", 5000);
    // Load face detection models
    await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('./models');
    basicNotif("Models loaded", "Starting scan", 5000);

    // Get the named canvas and its context
    const canvas = document.getElementById("faceCanvas");
    if (!canvas) {
        console.error("Canvas with id 'faceCanvas' not found.");
        return [];
    }
    const ctx = canvas.getContext('2d');
    const faceMatcher = new faceapi.FaceMatcher(knownDescriptorsArray, 0.5);

    new Promise((resolve) => {
        videoElement.addEventListener('loadedmetadata', () => {
            const displaySize = { width: videoElement.videoWidth, height: videoElement.videoHeight };
            faceapi.matchDimensions(videoElement, displaySize);
            basicNotif("Models loaded", "Starting scan", 5000);

            // Resize canvas to match video
            //canvas.width = displaySize.width;
            //canvas.height = displaySize.height;

            // Start continuous detection loop
            const detectionInterval = 1000; // 1 second interval
            const intervalId = setInterval(async () => {
                let matches = [];
                try {
                    canvas.width = videoElement.videoWidth;
                    canvas.height = videoElement.videoHeight;

                    // Draw video frame onto canvas
                    //ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                    const detections = await faceapi.detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({
                        inputSize: 128,
                        scoreThreshold: 0.5
                    })).withFaceLandmarks().withFaceDescriptors();


                    // Clear the canvas before drawing

                    if (detections.length > 0) {
                        console.log(`Detected ${detections.length} face(s).`);

                        // Resize detections for better matching
                        const resizedDetections = faceapi.resizeResults(detections, displaySize);

                        resizedDetections.forEach((detection) => {
                            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                            const uid = bestMatch.label;
                            const displayName = uid !== 'unknown' ? uidToDisplayNameMap[uid] || 'Unknown' : 'No match found';

                            console.log(`Matched with: ${displayName}`);
                            matches.push(displayName);

                            // Draw detection box
                            const { x, y, width, height } = detection.detection.box;
                            ctx.strokeStyle = 'blue';
                            ctx.lineWidth = 3;
                            ctx.strokeRect(x, y, width, height);

                            // Draw display name
                            ctx.fillStyle = 'blue';
                            ctx.font = '18px Arial';
                            ctx.fillText(displayName, x, y - 10);
                        });
                    } else {
                        //basicNotif("No faces detected", "", 1000);
                        console.log('No faces detected.');
                    }

                } catch (error) {
                    console.error('Error detecting faces:', error);
                }

                if (matches.length > 0) {
                    console.log('Matches found:', matches);
                    resolve(matches);
                    return(matches);
                }
            }, detectionInterval);

            // Start playing the video
            videoElement.play().catch(err => {
                console.error('Error playing video:', err);
                clearInterval(intervalId);
                resolve([]);
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

export async function verifyCurrentUser(videoElement, currentUserId) {
    try {
        basicNotif("Preparing verification...", "Please wait...", 3000);

        // Fetch the current user's profile and face descriptors
        const currentUserProfile = await fetchProfile(currentUserId, true);
        if (!currentUserProfile || !Array.isArray(currentUserProfile.faceDescriptors) || currentUserProfile.faceDescriptors.length !== 128) {
            console.error("Invalid or missing face descriptors for the current user.");
            return false;
        }

        // Load face detection models
        await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('./models');

        basicNotif("Models loaded", "Starting face verification...", 2000);

        // Get the front camera stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        videoElement.srcObject = stream;

        return new Promise((resolve) => {
            videoElement.onloadedmetadata = async () => {
                videoElement.play();

                const knownDescriptor = new faceapi.LabeledFaceDescriptors(
                    currentUserProfile.uid,
                    [new Float32Array(currentUserProfile.faceDescriptors)]
                );

                const faceMatcher = new faceapi.FaceMatcher([knownDescriptor], 0.5);
                const displaySize = { width: videoElement.videoWidth, height: videoElement.videoHeight };
                faceapi.matchDimensions(videoElement, displaySize);

                let verified = false;

                const detectionInterval = setInterval(async () => {
                    const detections = await faceapi.detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({
                        inputSize: 128,
                        scoreThreshold: 0.5
                    })).withFaceLandmarks().withFaceDescriptors();

                    detections.forEach(detection => {
                        const match = faceMatcher.findBestMatch(detection.descriptor);
                        if (match.label === currentUserProfile.uid) {
                            verified = true;
                        }
                    });

                    if (verified) {
                        clearInterval(detectionInterval);
                        clearTimeout(timeoutId);
                        stream.getTracks().forEach(track => track.stop());
                        basicNotif("Verification successful", "Face matched!", 2000);
                        resolve(true);
                    }
                }, 500); // Check every 500ms

                // Timeout after 5 seconds if not verified
                const timeoutId = setTimeout(() => {
                    if (!verified) {
                        clearInterval(detectionInterval);
                        stream.getTracks().forEach(track => track.stop());
                        basicNotif("Verification failed", "No matching face detected.", 2000);
                        resolve(false);
                    }
                }, 5000);
            };
        });
    } catch (error) {
        console.error("Error during face verification:", error);
        return false;
    }
}