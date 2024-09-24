import {
    fetchClass, fetchMembers,
    changeMemberRole, fetchProfile,
    getCurrentUser, fetchMember, kickfromClass, db, checkAttendance, getAttendance, postPost, fetchClassPosts, deletePost, generateUniquePostSyntax,
    addToLikedPosts,
    removeFromLikedPosts,
    fetchUserLikes,
    displayComments,
    sendCommentToPost,
    emailTagged
} from './firebase.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { basicNotif, confirmNotif } from './notif.js';
import 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
import { faceDetect } from './facerecog.js';
import * as faceapi from 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/dist/face-api.esm.js';
// Debounce function
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
const qrreader = document.getElementById('qrscanner-container');
const video = document.getElementById('camera');
const canvas = document.createElement('canvas');
const canvasContext = canvas.getContext('2d', { willReadFrequently: true });

let currentStream = null; // Variable to hold the current video stream

export function startCamera() {
    console.log(currentStream)
    qrreader.style.display = "block"
    if (currentStream) {
        console.log('Using existing camera stream.');
        video.srcObject = currentStream; // Use the current stream
        video.setAttribute('playsinline', true);
        video.play();
        setTimeout(scanQRCode, 500); // Start scanning for QR codes after a short delay
        return; // Exit the function
    }

    // Request access to the front-facing camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            // Assign the video stream to the video element and to the currentStream variable
            currentStream = stream;
            video.srcObject = stream;
            video.setAttribute('playsinline', true);
            video.play();

            // Start scanning for QR codes after a short delay
            setTimeout(scanQRCode, 500);
        })
        .catch(err => {
            qrreader.style.display = "none"
            handleCameraError(err); // Handle camera errors
        });
}

export function stopCamera() {
    qrreader.style.display = "none"
    if (currentStream) {
        const tracks = currentStream.getTracks();
        tracks.forEach(track => track.stop()); // Stop all tracks (video and/or audio)
        currentStream = null; // Clear the current stream
        video.srcObject = null; // Clear the video element's source
    } else {
        console.warn('No stream to stop. Video source is null.');
    }
}

// Event listener for starting the camera when the QR code reader button is clicked
document.getElementById('qr-code-reader').addEventListener('click', function (event) {
    if (currentStream) {
        stopCamera();
    } else {
    startCamera();
    };
});

function handleCameraError(err) {
    switch (err.name) {
        case 'NotReadableError':
            console.error('Camera is already in use:', err);
            basicNotif('Camera is already in use. Please close other applications using the camera.', "", 5000);
            break;
        case 'NotAllowedError':
            console.error('Permission to access the camera was denied:', err);
            basicNotif('Permission to access the camera was denied. Please allow camera access in your settings.', "", 5000);
            break;
        case 'NotFoundError':
            console.error('No camera was found on this device:', err);
            basicNotif('No camera found. Please ensure your device has a camera.', "", 5000);
            break;
        default:
            console.error('Error accessing camera:', err);
            basicNotif('Error accessing camera: ' + err.message, "", 5000);
            break;
    }
}


async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => resolve(position.coords),
                error => reject(console.log('Unable to retrieve location: ' + error.message)),
                {
                    enableHighAccuracy: true, // Set to false for quicker, less accurate location
                    maximumAge: 150000 // Don't use cached location data
                }
            );
        } else {
            reject("Geolocation is not supported by this browser.");
        }
    });
}


async function scanQRCode() {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);

        if (code) {
            stopCamera();
            basicNotif('QR code detected', "", 5000)
            qrreader.style.display = "none"
            const mememberData = await fetchMember(syntax, code.data)
            const mememberProfile = await fetchProfile(code.data)
            if (await confirmNotif('Is this the correct account?', mememberProfile.displayName, 5000) == false) {
                basicNotif('Canceled', "", 5000)
                return;
            } else {
                basicNotif('Checking attandance...', "Please wait...", 5000)
                if (mememberData) {
                    basicNotif('Member fetched', "", 5000)
                    video.style.border = "1px solid green"; // Optional: change border color to indicate success

                    const location = await getCurrentLocation();
                    const distance = calculateDistance(
                        location.latitude,
                        location.longitude,
                        classroom.lat,
                        classroom.long
                    );
                    //basicNotif(distance,distance <= classroom.rad, 5000)
                    //basicNotif(code.data,distance <= classroom.rad, 5000)
                    if (distance <= classroom.rad) {
                        const attendance = await checkAttendance(syntax, classroom.timezone, code.data);
                        basicNotif(`Attandance checked ${attendance.status}  ${attendance.timeChecked} `, code.data, 5000);
                    };
                } else {
                    basicNotif('Not a member', code.data, 5000);
                };
            }

        } else {
            video.style.border = "1px solid red"; // Optional: change border color to indicate failure
            console.log('No QR code detected.');
        }
    }
    requestAnimationFrame(scanQRCode);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

const debouncedUpdateList = debounce(updatememberList, 300);
const debouncedUpdateattList = debounce(updateattendanceList, 300);

let classroom;
let members;
const memberProfiles = [];
const className = document.getElementById('className');
const classCode = document.getElementById('code');
//const timeIn = document.getElementById('timeIn');
//const lat = document.getElementById('latitude');
//const long = document.getElementById('longitude');
//const rad = document.getElementById('radius');
let syntax;

function convertTo12Hour(militaryTime) {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!regex.test(militaryTime)) {
        return 'Invalid military time format';
    }

    let [hours, minutes] = militaryTime.split(':').map(Number);
    let period = hours >= 12 ? 'PM' : 'AM';
    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;

    return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function capitalizeFirstLetter(str) {
    if (!str) return str; // Handle empty strings
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function updateattendanceList() {
    const currentUserLogged = await getCurrentUser();
    const currentMember = await fetchMember(syntax, currentUserLogged.uid);
    members = await fetchMembers(syntax);
    const attendanceList = document.getElementById('attendance-List');

    if (!currentMember) {
        window.location.href = `classes.html`;
        return;
    }
    if (!attendanceList) {
        console.error('Element with ID "attendanceList" not found');
        return;
    }
    attendanceList.innerHTML = '';

    for (const member of members) {
        try {
            const memberData = await fetchProfile(member.id);
            var { status, time } = await getAttendance(syntax, classroom.timezone, member.id);
            if (!time) {
                time = "Not Available";
            } else {
                time = convertTo12Hour(time);
            }

            // Determine the color class based on status
            let statusClass = '';
            switch (status.toLowerCase()) {
                case 'present':
                    statusClass = 'status-present'; // Green
                    break;
                case 'late':
                    statusClass = 'status-late'; // Purple
                    break;
                case 'absent':
                    statusClass = 'status-absent'; // Red
                    break;
                default:
                    statusClass = ''; // Default class or leave it empty
            }

            const listItem = document.createElement('li');
            listItem.classList.add('list-item');
            listItem.innerHTML = `
                <div class="${statusClass}">
                    <h3>${memberData.displayName}</h3>
                    <p>${capitalizeFirstLetter(status)}<br>${time}</p>
                </div>`;
            attendanceList.appendChild(listItem);
        } catch (error) {
            console.error(`Failed to fetch profile for member with ID ${member.id}:`, error);
        }
    }
}

async function updatememberList() {
    const currentUserlogged = await getCurrentUser();
    const currentmember = await fetchMember(syntax, currentUserlogged.uid)
    const members = await fetchMembers(syntax);

    for (const member of members) {
        try {
            const profile = await fetchProfile(member.id); // Fetch profile using member.id
            if (profile) {
                memberProfiles.push(profile); // Add profile to the array
            } else {
                console.log(`Profile not found for member ID: ${member.id}`);
            }
        } catch (error) {
            console.error(`Error fetching profile for member ID ${member.id}:`, error);
        }
    }

    const memberList = document.getElementById('memberList');
    if (!currentmember) {
        window.location.href = `classes.html`;
    }
    if (!memberList) {
        console.error('Element with ID "memberList" not found');
        return;
    }
    memberList.innerHTML = '';

    for (const member of members) {
        try {
            const memberData = await fetchProfile(member.id);
            console.log(memberData);

            const listItem = document.createElement('li');
            listItem.classList.add('list-item');
            listItem.innerHTML = `
<div>
<h3>${memberData.displayName}</h3>
<p><b>Role: ${capitalizeFirstLetter(member.role)}</b></p>
</div>
${(currentmember.role === 'admin' || currentmember.role === 'owner')
                    && member.role !== 'owner'
                    && member.id !== currentUserlogged.uid ? `<input style="display:none;" type="checkbox" id="userOptionsToggle${member.id}">` : ''}
    ${(currentmember.role === 'admin' || currentmember.role === 'owner')
                    && member.role !== 'owner'
                    && member.id !== currentUserlogged.uid ? `<label for="userOptionsToggle${member.id}" class="userOptionsToggle"><i id="i" class="fa-solid fa-gear"></i> Options</label>` : ''}
<div class="userOptions">
${(currentmember.role === 'admin' || currentmember.role === 'owner')
                    && member.role !== 'owner'
                    && member.id !== currentUserlogged.uid ? `<button data-typeId="${memberData.uid}" data-syntax="${syntax}"  class="remove-btn"><i id="i" class="fa-solid fa-user-minus"></i> Kick</button>` : ''}
${(currentmember.role === 'admin' || currentmember.role === 'owner')
                    && member.role !== 'owner'
                    && member.role !== 'admin'
                    && member.id !== currentUserlogged.uid ? `<button data-typeId="${memberData.uid}" data-syntax="${syntax}"  class="set-admin">Give Admin</button>` : ''}
${(currentmember.role === 'admin' || currentmember.role === 'owner')
                    && member.role !== 'owner'
                    && member.role === 'admin'
                    && member.id !== currentUserlogged.uid ? `<button data-typeId="${memberData.uid}" data-syntax="${syntax}"  class="remove-admin">Revoke Admin</button>` : ''}
        ${(currentmember.role === 'owner' && member.id !== currentUserlogged.uid) ? `<button data-typeId="${memberData.uid}" data-syntax="${syntax}"  class="give-owner"><i id="i" class="fa-solid fa-arrow-right-arrow-left"></i> Transfer Ownership</button>` : ''}
            </div>`;
            memberList.appendChild(listItem);
        } catch (error) {
            console.error(`Failed to fetch profile for member with ID ${member.id}:`, error);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    syntax = urlParams.get('syntax');
    console.log(syntax);
    let isInitialLoad = true;

    const classPosts = await fetchClassPosts(syntax);
    const currentUser = await getCurrentUser(); // Fetch the current user's email

    classPosts.forEach(post => {
        // Destructure the post object
        const { email, image, dateTime, description } = post;

        // Call the createPostItem function for each post
        createPostItem(email, image, dateTime, description, currentUser.email, post.id, post.userid, post.likes);
    })
    debouncedUpdateattList();
    debouncedUpdateList();

    if (syntax) {
        classroom = await fetchClass(syntax);
        if (classroom) {
            className.innerHTML = classroom.name;
            classCode.innerHTML = `<i>${classroom.code}</i> <i role="button" id="clipboard" class="fa-regular fa-clipboard"></i>`;
            document.getElementById('clipboard').addEventListener('click', async () => {
                console.log("Copying plain text...");
                const textToCopy = `Join *${classroom.name}* today to get your attendance checked.\n${window.location.origin}/dtr/classes.html?classCode=${classroom.code}`;
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    //console.log('Copied plain text to clipboard');
                } catch (err) {
                    //console.error('Failed to copy text:', err);
                }
            });
        } else {
            //console.error('Failed to fetch classroom');
            window.location.href = `classes.html`;
        }
    } else {
        console.error('No syntax provided in URL');
    }
});

document.getElementById('memberList').addEventListener('click', async function (event) {
    if (event.target.classList.contains('remove-btn')) {
        var listItem = event.target.closest('li');
        var btn = event.target;
        let id = btn.getAttribute('data-typeId');

        try {
            await kickfromClass(syntax, id);
            console.log("Class removed successfully:", syntax);
        } catch (error) {
            console.error("Error removing class:", syntax, id, error);
        }
        listItem.remove();
    } else if (event.target.classList.contains('set-admin')) {
        var btn = event.target;
        let id = btn.getAttribute('data-typeId');
        changeMemberRole(syntax, id, "admin");
    } else if (event.target.classList.contains('remove-admin')) {
        var btn = event.target;
        let id = btn.getAttribute('data-typeId');
        changeMemberRole(syntax, id, "student");
    } else if (event.target.classList.contains('give-owner')) {
        var btn = event.target;
        let id = btn.getAttribute('data-typeId');
        const currentUserlogged = await getCurrentUser();
        changeMemberRole(syntax, currentUserlogged.uid, "admin");
        changeMemberRole(syntax, id, "owner");
    }
});


const classSearchInput = document.getElementById('memberSearch');
const classList = document.getElementById('memberList');
let items = Array.from(classList.getElementsByClassName('list-item'));

const filterClasses = () => {
    const searchTerm = classSearchInput.value.toLowerCase();
    items.forEach(item => {
        const h3Text = item.querySelector('h3').textContent.toLowerCase();
        if (h3Text.includes(searchTerm)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
};

classSearchInput.addEventListener('keyup', () => {
    filterClasses();
});

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
            items = Array.from(classList.getElementsByClassName('list-item'));
            filterClasses();
        }
    });
});

observer.observe(classList, { childList: true });

filterClasses();

const attendanceSearchInput = document.getElementById('attendanceSearch');
const attendanceList = document.getElementById('attendance-List');

// Get initial list of items
let items2 = Array.from(attendanceList.getElementsByClassName('list-item'));

const filterClasses2 = () => {
    const searchTerm = attendanceSearchInput.value.toLowerCase();
    console.log('Search term:', searchTerm);
    items2.forEach(item => {
        const h3Text = item.querySelector('h3').textContent.toLowerCase();
        if (h3Text.includes(searchTerm)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
};

// Event listener for search input
attendanceSearchInput.addEventListener('keyup', filterClasses2);

// Mutation Observer to watch for changes in the attendanceList
const observer2 = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.addedNodes.length || mutation.removedNodes.length) {
            // Update items array and reapply filter
            items2 = Array.from(attendanceList.getElementsByClassName('list-item'));
            filterClasses2();
        }
    });
});

// Start observing the attendanceList for changes
observer2.observe(attendanceList, { childList: true });

// Initial filter
filterClasses2();

async function handleImageUpload(event) {
    const loadingBar = document.getElementById('loading-bar');
    loadingBar.style.transform = 'translateX(-100%)';
    const file = event.target.files[0];
    if (!file) {
        console.error('No file provided.');
        return;
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
            loadingBar.style.transform = 'translateX(-98%)';
            const canvass = document.getElementById('canvass');
            //canvass.style.display = 'flex';
            const faces = await faceDetect(file);
            const labeledDescriptors = [];
            const matchResults = [];
            let index = 0;
            for (const memberProfile of memberProfiles) {

                index = index + 1
                const totalMember = members.length;
                console.log(`translateX(${-98 + (50 / (totalMember / index))}%)`)
                console.log(90 / (totalMember / index))

                loadingBar.style.transform = `translateX(${-98 + (50 / (totalMember / index))}%)`;
                // Ensure the profile has face descriptors
                if (memberProfile && Array.isArray(memberProfile.faceDescriptors)) {
                    console.log(`Descriptors for ${memberProfile.displayName}:`, memberProfile.faceDescriptors);

                    // Check if the whole faceDescriptors array has a length of 128
                    if (memberProfile.faceDescriptors.length === 128) {
                        labeledDescriptors.push(
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

            // Only create the FaceMatcher if there are labeled descriptors
            if (labeledDescriptors.length > 0) {

                const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
                const facesCanvas = document.getElementById('faces'); // Ensure this canvas exists in your HTML
                const facesCtx = facesCanvas.getContext('2d');

                const croppedFaces = []; // Array to hold cropped face images
                const faceWidth = 50; // Set a width for the cropped face
                const faceHeight = 50; // Set a height for the cropped face

                let xOffset = 0; // Position to start drawing faces on the new canvas
                facesCtx.clearRect(0, 0, facesCanvas.width, facesCanvas.height);
                for (const [index, face] of faces.entries()) {
                    const bestMatch = faceMatcher.findBestMatch(face.descriptor);
                    const label = bestMatch.label !== 'unknown' ? bestMatch.label : 'Unknown';
                    const box = face.detection.box;
                    const totalfaces = faces.length;
                    console.log(`translateX(${-48 + (42 / (totalfaces / index))}%)`)
                    console.log(90 / (totalfaces / index))
                    loadingBar.style.transform = `translateX(${-48 + (42 / (totalfaces / index))}%)`;
                    // Create a temporary canvas for the cropped face
                    const temp = document.getElementById('temp');
                    temp.width = canvas.width;
                    temp.height = canvas.height;
                    const tempCtx = temp.getContext('2d');
                    const croppedFaceCanvas = document.createElement('canvas');
                    croppedFaceCanvas.width = faceWidth;
                    croppedFaceCanvas.height = faceHeight;
                    const croppedFaceCtx = croppedFaceCanvas.getContext('2d');
                    tempCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    // Draw the cropped face onto the temporary canvas
                    croppedFaceCtx.drawImage(
                        temp, // Main canvas
                        box.x, box.y, box.width, box.height, // Source rectangle from the main canvas
                        0, 0, faceWidth, faceHeight // Destination rectangle on the temporary canvas
                    );


                    // Store the cropped face image
                    croppedFaces.push(croppedFaceCanvas);

                    // Draw the cropped face on the facesCanvas
                    facesCtx.drawImage(croppedFaceCanvas, xOffset, 0, faceWidth, faceHeight);
                    xOffset += faceWidth; // Move the xOffset for the next face

                    // Draw label on original canvas
                    if (bestMatch.label !== 'unknown') {
                        console.log(`Face ${index + 1} matches with ${bestMatch.label}`);
                        matchResults.push(bestMatch.label); // Store the UID of the best match

                        // Fetch display name

                        ctx.fillStyle = 'white'; // Text color
                        ctx.fillText(label, box.x, box.y - 20); // Draw label
                    } else {
                        console.log(`Face ${index + 1} did not match any member.`);
                        ctx.fillStyle = 'white'; // Text color
                        ctx.fillText(label, box.x, box.y - 20); // Draw label
                    }
                    canvass.style.display = 'none'
                }
            } else {
                console.log("No valid labeled descriptors found; FaceMatcher cannot be created.");
            }


            addPostTemplate(img.src, matchResults);
            resolve();
        };

        reader.readAsDataURL(file);
    });
}


async function addPostTemplate(img, matches) {
    const loadingBar = document.getElementById('loading-bar');
    loadingBar.style.transform = 'translateX(100%)'
    const posts = document.getElementById('posts');
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const currentDate = new Date().toLocaleDateString('en-US', options);
    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // Ensures AM/PM format
    });
    // Check if a template with the class 'template' already exists
    const existingTemplate = document.querySelector('.template');

    let pretags = [];
    let preemails = [];

    // Loop through matches to create tags
    for (const match of matches) {
        const memberProfile = await fetchProfile(match);
        if (memberProfile && memberProfile.displayName) {
            // Replace spaces with underscores and prepend @

            const tag = '@' + memberProfile.displayName.replace(/\s+/g, '_'); // Display only the username
            pretags.push(tag);
            preemails.push(memberProfile.email);
        }
    }

    // Join the tags into a string
    const tagsString = pretags.join(' ');


    if (!existingTemplate) {
        // Create the template
        const user = await getCurrentUser();
        const userdata = await fetchProfile(user.uid);
        const template = document.createElement('li');
        template.className = 'template';
        template.id = 'post';
        template.innerHTML = `
        <div id="postHeader">
        <img class="img" src="${userdata.photoUrl}">
            <p>${user.displayName}</p>
        </div>
            <img id="postImg" src="${img}" alt="Post Image">
            <textarea maxlength="1500" id="desc" placeholder="Enter description here...">${tagsString}</textarea>
            <p>${currentDate} ${currentTime}</p>
            <div id="post-buttons">
            <button class="post-button" id="postPost">Post</button>
            <button class="post-button" id="cancelPost">Cancel</button>
            </div>
        `;
        posts.insertBefore(template, posts.firstChild);
        const targetElement = template.querySelector('#postHeader');
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

        let tags = [];
        let emails = [];

        tags = pretags;
        emails = preemails;

        template.querySelector('#desc').addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';

            const textarea = this;
            const value = textarea.value;

            // Regular expression to find all strings starting with '@'
            const atMentions = value.match(/@(\w[\w_]*)/g) || [];

            let newtags = [...pretags]; // Start with pre-loaded tags
            let newemails = [...preemails]; // Start with pre-loaded emails

            // Check for each mention
            for (const mention of atMentions) {
                const searchTerm = mention.slice(1); // Remove '@' to get the search term
                const closestMatch = findClosestMember(searchTerm);

                if (closestMatch) {
                    // Add to tags if not already present
                    if (!newtags.includes(mention)) {
                        newtags.push(mention); // Add the mention to tags
                        newemails.push(closestMatch.email); // Add the member's email to emails
                    }
                }
            }

            // Keep tags that are currently in the textarea mentions
            const updatedTags = newtags.filter(tag => atMentions.includes(tag));

            // Create a new Set to ensure unique emails
            const uniqueEmailsSet = new Set();

            // Filter emails based on the updated tags and also keep preemails that still have a tag
            updatedTags.forEach(tag => {
                const index = newtags.indexOf(tag);
                if (index !== -1) {
                    uniqueEmailsSet.add(newemails[index]); // Keep the email for this tag
                }
            });

            // Now add emails for any remaining preloaded tags that still exist
            pretags.forEach((tag, index) => {
                if (updatedTags.includes(tag)) {
                    uniqueEmailsSet.add(preemails[index]); // Keep corresponding email if tag still exists
                }
            });

            // Convert the Set back to an array for unique emails
            newemails = Array.from(uniqueEmailsSet);

            // Update the global tags and emails
            tags = updatedTags;
            emails = newemails;

            textarea.value = value;

            // Optional: Do something with tags and emails, like updating other elements or logging them
            console.log('Tags:', tags);
            console.log('Emails:', emails);

            function findClosestMember(searchTerm) {
                // Filter members based on the search term
                const matches = memberProfiles.filter(member =>
                    member.displayName.replace(/\s+/g, '_').toLowerCase().includes(searchTerm.toLowerCase())
                );

                // Return the first match, or null if no match is found
                return matches.length > 0 ? matches[0] : null;
            }
        });




        template.querySelector('#postPost').addEventListener('click', async () => {
            const description = template.querySelector('#desc').value;
            const postSyntax = await generateUniquePostSyntax(syntax);
            const buttons =  template.querySelector('#post-buttons');
            buttons.innerHTML = "<p>Posting...<p>"

            loadingBar.style.transform = 'translateX(-100%)'
            await postPost(user.email, img, currentDate, currentTime, description, syntax, postSyntax, user.uid);

            const location = await getCurrentLocation();
            const distance = calculateDistance(
                location.latitude,
                location.longitude,
                classroom.lat,
                classroom.long
            );
            if (emails) {
                for (const email of emails) {
                    await emailTagged(email, classroom.name, user.displayName, description)
                }
            }

            //basicNotif(distance,distance <= classroom.rad, 5000)
            //basicNotif(code.data,distance <= classroom.rad, 5000)
            if (distance <= classroom.rad) {
                // Loop through matches array and check attendance for each match
                if (matches) {
                    for (const match of matches) {
                        console.log(match)
                        const attendance = await checkAttendance(syntax, classroom.timezone, match);
                        updateattendanceList();
                    }
                }

            }

           
            await createPostItem(user.email, img, `${currentDate} ${currentTime}`, description, user.email, postSyntax, user.uid, 0, matches);
            loadingBar.style.transform = 'translateX(100%)'
            cancelFunction(template);
            // Hide loading bar when done
        });

        template.querySelector('#cancelPost').addEventListener('click', () => {// Hide loading bar when done
            cancelFunction(template);
        });
    } else {
        console.log('Post template already exists.');
    }
}

function cancelFunction(template) {
    // Remove the template from the DOM
    template.remove();
}

function postFunction(email, img, currentDate, currentTime, description, syntax, userid) {
    postToClass(email, img, currentDate, currentTime, description, syntax, userid);
    console.log('Post button clicked.');
}


document.getElementById('camera-button').addEventListener('click', () => {
    document.getElementById('camera-input').click();
});

// Event listener to handle the file input change
document.getElementById('camera-input').addEventListener('change', handleImageUpload);
async function createPostItem(email, img, dateTime, description, currentUserEmail, postId, userid, likes) {
    const user = await getCurrentUser();
    const currentMemberData = await fetchMember(syntax, user.uid);
    const userdata = await fetchProfile(userid);
    const posts = document.getElementById('posts');
    const template = document.createElement('li');
    template.id = 'post';

    description = description.replace(/(@[\w_\.]+)/g, function (match) {
        return `<span class="tag">${match.replace(/_/g, ' ')}</span>`;
    });

    // Wrap #words (allow periods within the word)
    description = description.replace(/(#[\w_\.]+)/g, function (match) {
        return `<span class="tag">${match.replace(/_/g, ' ')}</span>`;
    });



    const timeDisplay = formatTimeDifference(dateTime);

    template.innerHTML = `
        <div id="postHeader">
            <div>
                <img class="img" src="${userdata.photoUrl}">
                <div>
                <p>${userdata.displayName}</p>
                </div>
            </div>
            <label for="postOptionstoggle${postId}"><i class="fa-solid fa-ellipsis-vertical"></i></label>
        </div>
        <input style="display:none;" class="like" type="checkbox" id="like${postId}">
        <div class="loader">
            <div class="circle top"></div>
            <div class="circle top"></div>
            <div class="circle bottom"></div>
            <div class="circle bottom"></div>
        </div>
        <img id="postImg" src="${img}" alt="Post Image">
        <div id="postButtons">
            <label id="heartUncheck" for="like${postId}"><i class="fa-regular fa-heart"></i></label>
            <label id="heartCheck" for="like${postId}"><i class="fa-solid fa-heart"></i></label>
            <label for="comments${postId}"><i class="fa-regular fa-message"></i></label>
        </div>
        <a id="likes">${likes} likes</a>
        <p id="desc">${description}</p>
        <label for="commentSectionToggle${postId}" style="display:none;" id="commentsToggleLabel${postId}">
        Show Comments</label>
        <p>${timeDisplay}</p>
        <input class="option" type="checkbox" id="postOptionstoggle${postId}">
        <input style="display:none;" class="comment" type="checkbox" id="comments${postId}">
        <input style="display:none;" class="commentToggle" type="checkbox" id="commentSectionToggle${postId}">
        <div id="postOptions">
            ${email === currentUserEmail || currentMemberData.role === 'owner' || currentMemberData.role === 'admin' ?
            `<button class="postOptionButton" id="deletePost" data-post-id="${postId}">Delete Post <i class="fa-solid fa-trash"></i></button>` :
            ''}
        </div>
        <div id="commentSection">
        <div id="commentArea">
            <img class="img" src="${user.photoURL}"><textarea maxlength="150" id="commentInput${postId}" placeholder="Comment here"></textarea><i id="postComment${postId}" class="fa-solid fa-paper-plane"></i>
        </div>
        </div>
        <div class="comments" id="commentSection${postId}">
        <label for="commentSectionToggle${postId}" id="commentsToggleLabel${postId}">
        Comments</label>
            <div id="commentsContainer${postId}">
            </div>
        </div>
    `;

    posts.insertBefore(template, posts.firstChild);
    const imgElement = template.querySelector('#postImg');
    const loader = template.querySelector('.loader');

    // Load the image
    imgElement.src = img;
    imgElement.style.display = 'none';
    // Show loader until the image loads
    imgElement.onload = () => {
        loader.style.display = 'none'; // Hide loader
        imgElement.style.display = 'block'; // Show image
    };
    const likeCheckbox = template.querySelector(`#like${postId}`);

    // Check if the post is liked by the current user on page load
    const userLikes = await fetchUserLikes(user.uid);
    if (userLikes.includes(postId)) {
        likeCheckbox.checked = true;
    }
    // Toggle like status on checkbox change
    likeCheckbox.addEventListener('change', async () => {
        const likestxt = template.querySelector('#likes')
        if (likeCheckbox.checked) {
            likestxt.innerHTML = `${likes + 1} likes`
            likes = likes + 1
            await addToLikedPosts(user.uid, postId); // Add post to user's liked posts
        } else {
            likestxt.innerHTML = `${likes - 1} likes`
            likes = likes - 1
            await removeFromLikedPosts(user.uid, postId); // Remove post from user's liked posts
        }
    });

    function makeCommentSectionDraggable(postId) {
        const commentSection = document.getElementById(`commentSection${postId}`);
        const commentToggle = document.getElementById(`commentSectionToggle${postId}`);

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        const dragThreshold = 50;
        const initialBottomPercent = -1; // Adjust as needed
        const dragScaleFactor = 0.3;

        // Create the "Refresh Comments" message
        const refreshMessage = document.createElement('div');
        refreshMessage.textContent = 'Refresh Comments';
        refreshMessage.style.position = 'absolute';
        refreshMessage.style.bottom = '100%'; // Position above the comment section
        refreshMessage.style.left = '50%';
        refreshMessage.style.transform = 'translateX(-50%)';
        refreshMessage.style.fontSize = '12px';
        refreshMessage.style.padding = '5px 10px';
        refreshMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        refreshMessage.style.color = 'white';
        refreshMessage.style.borderRadius = '15px';
        refreshMessage.style.display = 'none'; // Hidden by default
        commentSection.appendChild(refreshMessage);

        // Function to handle the start of the drag
        function startDrag(event) {
            if (event.target === commentSection) {
                isDragging = true;
                startY = event.touches ? event.touches[0].clientY : event.clientY;
                commentSection.style.transition = 'none'; // Disable smooth transition during drag
            }
        }

        // Function to handle dragging
        function drag(event) {
            if (!isDragging) return;

            currentY = event.touches ? event.touches[0].clientY : event.clientY;
            let dragDistance = currentY - startY;

            // Show refresh message when dragging upwards
            if (dragDistance < -10) {
                refreshMessage.style.display = 'block';
            } else {
                refreshMessage.style.display = 'none';
            }

            // Adjust the bottom property based on the drag distance
            if (dragDistance > 0) {
                commentSection.style.bottom = `calc(${initialBottomPercent}% - ${dragDistance}px)`;
            }
            if (dragDistance < 0) {
                dragDistance *= dragScaleFactor;
                refreshMessage.style.bottom = `calc(${100}% - ${dragDistance / 12}px)`; // Position above the comment section
                commentSection.style.height = `calc(${50}% - ${dragDistance * 2}px)`;
                commentSection.style.bottom = `calc(${initialBottomPercent}% - ${dragDistance / 12}px)`;
            }
        }

        // Function to handle the end of the drag
        async function endDrag() {
            if (!isDragging) return;
            isDragging = false;
            commentSection.style.transition = 'bottom 0.3s ease'; // Re-enable smooth transition

            const dragDistance = currentY - startY;

            // Hide the refresh message after dragging ends
            refreshMessage.style.display = 'none';
            commentSection.style.height = ''
            if (dragDistance > dragThreshold) {

                commentSection.style.bottom = ''; // Close the comment section
                commentToggle.checked = false;
            } else if (dragDistance < -10) {
                await displayComments(postId); // Call your refresh function
                commentSection.style.bottom = `${initialBottomPercent}%`;
            } else {
                commentSection.style.bottom = `${initialBottomPercent}%`; // Reset to the original position
            }
        }

        // Attach event listeners for mouse and touch events
        commentSection.addEventListener('mousedown', startDrag);
        commentSection.addEventListener('mousemove', drag);
        commentSection.addEventListener('mouseup', endDrag);
        commentSection.addEventListener('mouseleave', endDrag);

        commentSection.addEventListener('touchstart', startDrag);
        commentSection.addEventListener('touchmove', drag);
        commentSection.addEventListener('touchend', endDrag);

        // Prevent child elements from triggering drag
        commentSection.addEventListener('mousedown', (event) => {
            if (event.target !== commentSection) {
                event.stopPropagation();
            }
        });
        commentSection.addEventListener('touchstart', (event) => {
            if (event.target !== commentSection) {
                event.stopPropagation();
            }
        });
    }

    makeCommentSectionDraggable(postId);

    template.querySelector(`#postComment${postId}`).addEventListener('click', async () => {
        const commentInput = template.querySelector(`#commentInput${postId}`);
        const commentText = commentInput.value.trim();

        if (commentText) {
            await sendCommentToPost(postId, user.uid, commentText);
            commentInput.value = ''; // Clear the input after sending
        } else {
            alert('Please enter a comment before sending.');
        }
    });

    function observeComments(postId) {
        const commentsContainer = template.querySelector(`#commentsContainer${postId}`);
        const commentsToggleLabel = template.querySelector(`#commentsToggleLabel${postId}`);

        // Function to update the visibility of the checkbox label
        function updateCommentsToggle() {
            if (commentsContainer.children.length > 0) {
                commentsToggleLabel.textContent = `View ${commentsContainer.children.length} ${commentsContainer.children.length > 1 ? 'comments' : 'comment'}`;
                commentsToggleLabel.style.display = 'block';
            } else {
                // Hide the checkbox if no comments exist
                commentsToggleLabel.style.display = 'none';
            }
        }

        updateCommentsToggle();

        const observer = new MutationObserver(() => {
            updateCommentsToggle();
        });

        observer.observe(commentsContainer, { childList: true });
    }

    observeComments(postId);
    if (email === currentUserEmail || currentMemberData.role === 'owner' || currentMemberData.role === 'admin') {
        template.querySelector('#deletePost').addEventListener('click', async (event) => {
            const postId = event.target.getAttribute('data-post-id');
            await deletePost(syntax, postId); // Add deletePost function to remove the post
            cancelFunction(template);
        });
    };

    await displayComments(postId);
}
function formatTimeDifference(dateTime) {
    const postDate = new Date(dateTime); // Parse the date string
    const currentDate = new Date(); // Get the current date/time
    const timeDiff = Math.abs(currentDate - postDate); // Difference in milliseconds

    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 60) {
        return 'Just now';
    } else if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (weeks < 4) {
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
        const options = { month: 'long', day: 'numeric' }; // Format as "Month Day"
        return postDate.toLocaleDateString(undefined, options);
    }
}
