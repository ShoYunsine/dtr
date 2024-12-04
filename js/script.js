
import './firebase.js';

import { checkAttendance, deleteAllAttendanceRecords, getAttendance, getCurrentUser, getUserClasses, markAbsent } from './firebase.js';

import { basicNotif, confirmNotif } from './notif.js';



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
            
                function startTracking() {
                    if (navigator.geolocation) {
                        let lastUpdate = 0;  // Track the last time we triggered the function
                        const throttleInterval = 10000;  // Set the throttle interval (in milliseconds, 10 seconds in this case)
            
                        const geoOptions = {
                            maximumAge: 60000, // Cache position for 1 minute (60000 ms)
                            timeout: 10000, // Timeout after 10 seconds if no position is found
                            enableHighAccuracy: true // Use high accuracy if available
                        };
            
                        navigator.geolocation.watchPosition(async (position) => {
                            const currentTime = Date.now();  // Get the current time in milliseconds
            
                            // Only process the position if the throttle interval has passed
                            if (currentTime - lastUpdate > throttleInterval) {
                                lastUpdate = currentTime;  // Update the last update time
            
                                const location = {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude
                                };
            
                                console.log("Classes", classes);
            
                                // Ensure classes is defined and an array
                                if (classes.length === 0 && classes != "None") {
                                    // Refetch the classes if empty
                                    classes = await getUserClasses();
                                } else if (classes.length >= 1 && classes != "None") {
                                    // Get today's date for storage key (formatted as YYYY-MM-DD)
                                    const today = new Date().toISOString().split('T')[0];  // YYYY-MM-DD
            
                                    for (const cls of classes) {
                                        // Generate a unique storage key for each class and date
                                        const storageKey = `class-${cls.syntax}-${today}`;
            
                                        // Check if the class status is already in localStorage for today
                                        let storedClass = JSON.parse(localStorage.getItem(storageKey));
                                        let cstatus;
                                        if (storedClass) {
                                            console.log(`Status for class ${cls.syntax} on ${today}: ${storedClass.status}`);
                                            cstatus = storedClass.status
                                        } else {
                                            cstatus = await getAttendance(cls.syntax, cls.timezone);
                                            localStorage.setItem(storageKey, JSON.stringify({ syntax: cls.syntax, status: cstatus}));
                                        }
            
                                        // Fetch the attendance status for the class if not stored in localStorage
                                        
                                        console.log("Class status:", cstatus);
            
                                        // If the class is within radius, process the attendance
                                        const distance = calculateDistance(
                                            location.latitude,
                                            location.longitude,
                                            cls.lat,
                                            cls.long
                                        );
            
                                        if (distance <= cls.rad) {
                                        
                                            if (cstatus === "Absent" || cstatus === "absent") {
                                                const att = await checkAttendance(cls.syntax, cls.timezone);
                                                localStorage.setItem(storageKey, JSON.stringify({ syntax: cls.syntax, status: att.status}));
                                            }
                                            //basicNotif(`${cls.name} inRadius`, "", 5000);
                                        } else {
                                            console.log("Toofar")
                                            if (cstatus === "Absent" || cstatus === "absent") {
                                                await markAbsent(cls.syntax);
                                            }
                                        }
                                    }
                                }
                            }
                        }, (error) => {
                            console.error("Geolocation error:", error);
                        }, geoOptions);
                    }
                }
            
                startTracking();
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

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(function (position) {

            console.log(`Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`);

        }, function (error) {

            console.error(`Error getting location: ${error.message}`);

        });

    } else {

        console.error("Geolocation is not supported by this browser.");

    }

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
