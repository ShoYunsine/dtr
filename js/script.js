
import './firebase.js';

import { checkAttendance, deleteAllAttendanceRecords, getAttendance, getCurrentUser, getUserClasses, markAbsent } from './firebase.js';

import { basicNotif, confirmNotif, sendNotification } from './notif.js';

const luxonScript = document.createElement('script');
luxonScript.src = 'https://cdn.jsdelivr.net/npm/luxon@3.2.0/build/global/luxon.min.js';
document.head.appendChild(luxonScript);

let DateTime;

luxonScript.onload = function () {
    DateTime = window.luxon.DateTime;
}

if ('serviceWorker' in navigator) {

    const swPath = location.hostname === 'localhost' ? '/js/sw.js' : '/dtr/js/sw.js';

    navigator.serviceWorker.register(swPath)



        .then(async registration => {
            console.log('Service Worker registered with scope:', registration.scope);

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
                                const confirmed = await confirmNotif("Confirm Attendance", `Do you want to check attendance for ${cls.name}?`);
                                if (confirmed) {
                                    const att = await checkAttendance(cls.syntax, cls.timezone);
                                }
                            } else {
                                console.log(`Scheduling task later today.`);
                                setTimeout(async () => {
                                    console.log('Running scheduled attendance task...');
                                    const state = await getAttendance(cls.syntax, cls.timezone);
                                    if (state.status === "absent" || state.status === "Absent") {
                                        const confirmed = await confirmNotif("Confirm Attendance", `Do you want to check attendance for ${cls.name}?`);
                                        if (confirmed) {
                                            const att = await checkAttendance(cls.syntax, cls.timezone);
                                        }
                                    }
                                }, 300000);
                            }
                        }
                    } else {
                        if (currentTime >= startTime.minus({ minutes: 10 }) && currentTime <= endTime) {
                            console.log(startTime);
                            const delay = startTime.minus({ minutes: 10 }).diff(currentTime, 'milliseconds').toObject().milliseconds;

                            console.log('Calculated delay:', delay);

                            if (delay > 0) {
                                sendNotification(`Attendance will be rechecked for ${cls.name} for ${delay / 1000} seconds later today.`);
                                console.log(`Scheduling task for ${delay / 1000} seconds later today.`);
                                setTimeout(async () => {
                                    console.log('Running scheduled attendance task...');
                                    const state = await getAttendance(cls.syntax, cls.timezone);
                                    if (state.status === "absent" || state.status === "Absent") {
                                        const confirmed = await confirmNotif("Confirm Attendance", `Do you want to check attendance for ${cls.name}?`);
                                        if (confirmed) {
                                            const att = await checkAttendance(cls.syntax, cls.timezone);
                                        }
                                    }
                                }, delay);
                            } else {
                                console.log('No need to schedule task: the time has already passed.');
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
        if (!navigator.geolocation) {
            return reject(new Error("Geolocation is not supported by this browser."));
        }

        console.log("Getting quick location...");

        // First, get a quick low-accuracy location
        navigator.geolocation.getCurrentPosition(
            (quickPosition) => {
                console.log("Quick location found:", quickPosition.coords);
                
                // Immediately return quick position while requesting an accurate one
                resolve(quickPosition.coords);

                // Now request a more accurate position
                navigator.geolocation.getCurrentPosition(
                    (accuratePosition) => {
                        console.log("More accurate location found:", accuratePosition.coords);
                        resolve(accuratePosition.coords); // Update with accurate data
                    },
                    (error) => console.warn("Accurate location failed:", error.message),
                    {
                        enableHighAccuracy: true, // More accurate but slower
                        timeout: 5000, // Wait max 5 sec for GPS lock
                        maximumAge: 0 // Do not use cached results
                    }
                );
            },
            (error) => reject(new Error("Unable to retrieve location: " + error.message)),
            {
                enableHighAccuracy: false, // Faster but less precise
                timeout: 2000, // Quick timeout for fast retrieval
                maximumAge: 10000 // Allow using a cached location up to 10 sec old
            }
        );
    });
}

if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log("Permission granted for notifications!");
        }
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
