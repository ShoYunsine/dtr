import 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
import { fetchProfile, generateUniqueSyntax, addClass, removeClass, generateClassCode, joinClassByCode, leaveClass, getCurrentUser } from './firebase.js';
import { basicNotif } from './notif.js';

const video = document.getElementById('camera');
const canvas = document.createElement('canvas');
const canvasContext = canvas.getContext('2d');

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            video.srcObject = stream;
            video.setAttribute('playsinline', true);
            video.play();
            requestAnimationFrame(scanQRCode);
        })
        .catch(err => {
            console.error('Error accessing camera:', err);
        });
}

function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            console.log("Getting Location");
            navigator.geolocation.getCurrentPosition(
                position => resolve(position.coords),
                error => reject(alert('Unable to retrieve location: ' + error.message)),
                {
                    enableHighAccuracy: true, // Set to false for quicker, less accurate location
                    timeout: 15000, // Set a timeout (e.g., 5000 ms) for the location request
                    maximumAge: 0 // Don't use cached location data
                }
            );
        } else {
            reject(new Error('Geolocation is not supported by this browser.'));
        }
    });
}
function scanQRCode() {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);

        if (code) {
            const userid = code.data
            const user = fetchProfile(userid)
        } else {
        }
    }
    requestAnimationFrame(scanQRCode);
}

document.getElementById('getLocation').addEventListener('click', async function (event) {
    event.preventDefault();
    let location = await getLocation();
    const lat = document.getElementById('lat');
    const long = document.getElementById('long');
    console.log(location)
    lat.value = location.latitude
    long.value = location.longitude
});

document.getElementById('classjoinForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    var classCode = document.getElementById('classCode').value;
    const user = await getCurrentUser();
    await joinClassByCode(classCode, user);
});

document.getElementById('classaddForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    var className = document.getElementById('className').value;
    var school = document.getElementById('school').value;
    var timeIn = document.getElementById('timeIn').value;
    var lat = parseFloat(document.getElementById('lat').value);
    var long = parseFloat(document.getElementById('long').value);
    var rad = document.getElementById('radius').value;
    const timezoneInput = document.getElementById('timezone');
    const timezone = timezoneInput.value;
    const timezoneList = document.getElementById('timezone-list');
    const timezoneOptions = Array.from(timezoneList.options).map(option => option.value);


    // Check if the input value matches any of the options
    if (!timezoneOptions.includes(timezone)) {
        basicNotif("Invalid timezone",`${timezone} is not valid timezone.`,5000);
        return; // Prevent further execution if the time zone is invalid
    }

    try {
        // Generate a unique syntax
        const uid = await generateUniqueSyntax();
        const classcode = await generateClassCode();
        var classList = document.getElementById('classList');
        var listItem = document.createElement('li');

        // Add the class to Firestore (or your database)
        await addClass(className, school, uid, classcode, timeIn, lat, long, rad, timezone);

        // Add the new class to the DOM
        listItem.classList.add('list-item');
        listItem.innerHTML = `
            <div>
                <h3>${className}</h3>
                <p>School: ${school}</p>
                <p id="uid">${uid}</p>
            </div>
            <button class="remove-btn">Remove</button>
        `;
        classList.appendChild(listItem);

        // Clear the input fields and reset dropdown
        document.getElementById('classaddForm').reset();
    } catch (error) {
        console.error('Error generating unique syntax or adding class:', error);
    }
});

document.addEventListener('DOMContentLoaded', async (event) => {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('classCode');
    const user = await getCurrentUser();
    if (classCode) {
        const classCodeElement = document.getElementById('classCode');
        const joinTab = document.getElementById('joinTab');
        joinTab.click();
        if (classCodeElement) {
            classCodeElement.value = classCode;
            console.log('Class Code set to:', classCode);
            await joinClassByCode(classCode, user);
        } else {
            console.error('Element with ID "classCode" not found');
        }
    }
});


