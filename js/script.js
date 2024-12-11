
import './firebase.js';

import { checkAttendance, deleteAllAttendanceRecords, getAttendance, getCurrentUser, getUserClasses, markAbsent } from './firebase.js';

import { basicNotif, confirmNotif } from './notif.js';

const luxonScript = document.createElement('script');
luxonScript.src = 'https://cdn.jsdelivr.net/npm/luxon@3.2.0/build/global/luxon.min.js';
document.head.appendChild(luxonScript);

let DateTime;

luxonScript.onload = function () {
    DateTime = window.luxon.DateTime;
}

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

if ('serviceWorker' in navigator) {

    navigator.serviceWorker.register('./js/sw.js')

        .then(async registration => {

            if ('sync' in registration) {
                let classes = await getUserClasses();
                console.log("Classes", classes);
                async function refetch() {
                    classes = await getUserClasses();
                    // Check if the result is empty or invalid
                    if (classes.length === 0 && classes != "None") {
                        console.log("No classes found, retrying...");

                        // Wait for a specified time before trying again
                        await new Promise(resolve => setTimeout(resolve, 3000)); // Retry after 3 seconds (you can adjust this)

                        // Recursively call refetch, but only after a delay
                        await refetch();
                    } else {

                        console.log("Classes successfully fetched:", classes);
                        await track()
                    }
                }

                if (classes.length === 0 && classes != "None") {
                    await refetch();
                }
                async function track() {
                    const location = await getCurrentLocation();
                    console.log(location, classes)
                    for (const cls of classes) {
                        console.log(cls)
                        const currentTime = DateTime.now().setZone(cls.timezone);
                        const dayOfWeek = currentTime.toFormat('cccc'); // Get the full name of the day (e.g., Monday)

                        console.log('Day of week:', dayOfWeek); // Debugging: check the day of the week

                        // Construct field names dynamically based on the day
                        const startTimeKey = `timeIn${dayOfWeek}first`;
                        const endTimeKey = `timeIn${dayOfWeek}last`;

                        const startTimeStr = cls[startTimeKey]; // e.g., "07:30"
                        const endTimeStr = cls[endTimeKey]; // e.g., "09:30"

                        console.log('Start time key:', startTimeKey);
                        console.log('End time key:', endTimeKey);
                        console.log('Start time string:', startTimeStr);
                        console.log('End time string:', endTimeStr);
                        let startTime;
                        let endTime;
                        // Ensure that both time fields exist before processing
                        if (startTimeStr && endTimeStr) {
                            startTime = DateTime.fromFormat(startTimeStr, 'HH:mm', { zone: cls.timezone });
                            endTime = DateTime.fromFormat(endTimeStr, 'HH:mm', { zone: cls.timezone });
                            console.log('Parsed start time:', startTime);
                            console.log('Parsed end time:', endTime);
                        } else {
                            console.log(`Missing time information for ${dayOfWeek}. Skipping class:`, cls.name);
                            continue;
                        }

                        const distance = calculateDistance(
                            location.latitude,
                            location.longitude,
                            cls.lat,
                            cls.long
                        );
                        if (distance <= cls.rad) {
                            if (currentTime >= startTime.minus({ minutes: 10 }) && currentTime <= endTime) {
                                const state = await getAttendance(cls.syntax, cls.timezone);
                                if (state.status === "absent" || state.status === "Absent") {
                                    const att = await checkAttendance(cls.syntax, cls.timezone);
                                }
                            }
                        } else {

                            if (currentTime >= startTime.minus({ minutes: 10 }) && currentTime <= endTime) {
                                const delay = startTime.minus({ minutes: 10 }).diff(currentTime, 'milliseconds').toObject().milliseconds;

                                console.log('Calculated delay:', delay);

                                if (delay > 0) {
                                    console.log(`Scheduling task for ${delay / 1000} seconds later today.`);
                                    setTimeout(async () => {
                                        console.log('Running scheduled attendance task...');
                                        const state = await getAttendance(cls.syntax, cls.timezone);
                                        if (state.status === "absent" || state.status === "Absent") {
                                            const att = await checkAttendance(cls.syntax, cls.timezone);
                                        }
                                    }, delay);
                                } else {
                                    console.log('No need to schedule task: the time has already passed.');
                                }
                            }
                        }
                    }
                }
            }
        })

        .catch(error => {

            console.log('Service Worker registration failed:', error);

        });

} else {

    console.log('Service Workers not supported in this browser.');

};

const worker = new Worker('./js/worker.js');

worker.onmessage = (event) => {

    console.log('Message from worker:', event.data);

};

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

function getCurrentLocation() {
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

if (Notification.permission === 'granted') {

    navigator.serviceWorker.ready.then((registration) => {

        registration.showNotification('Hello world!', {

            body: 'This is a background notification.',

            icon: '../Image/logo.pngg'

        });

    });

}

function applyDarkMode(isDarkMode) {

    if (isDarkMode) {

        document.body.classList.add('dark-mode');

    } else {

        document.body.classList.remove('dark-mode');

    }

}

function handleToggleChange(event) {

    const isChecked = event.target.checked;

    localStorage.setItem('darkMode', isChecked); // Save preference to localStorage

    applyDarkMode(isChecked);

}

function loadUserPreference() {

    const darkMode = localStorage.getItem('darkMode') === 'true'; // Get user preference from localStorage

    applyDarkMode(darkMode);

    document.getElementById('darkModeToggle').checked = darkMode; // Set switch position based on user preference

}

document.getElementById('darkModeToggle').addEventListener('change', handleToggleChange);

window.addEventListener('load', loadUserPreference);
