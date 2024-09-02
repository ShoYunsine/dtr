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
        .then(registration => {

            if ('sync' in registration) {

                function startTracking() {
                    if (navigator.geolocation) {
                        navigator.geolocation.watchPosition(async position => {
                            const location = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                            };
                            const classes = await getUserClasses();
                            for (const cls of classes) {
                                const distance = calculateDistance(
                                    location.latitude,
                                    location.longitude,
                                    cls.lat,
                                    cls.long
                                );
                                const attendance = await getAttendance(cls.syntax, cls.timezone);
                                 
                                basicNotif(`${cls.name} ${attendance.status} ${distance}`, "", 5000);
                                if (distance <= cls.rad) {
                                    const { status } = await checkAttendance(cls.syntax, cls.timezone);
                                    basicNotif(`${cls.name} inRadius`, "", 5000);
                                } else {
                                    const attendance = await getAttendance(cls.syntax, cls.timezone);
                                    if (attendance.status === "Absent") {
                                        await markAbsent(cls.syntax);
                                    }
                                }
                                await deleteAllAttendanceRecords(cls.timezone, cls.syntax);
                            }
                
                        }, error => {
                            console.error(`Error getting location: ${error.message}`);
                        });
                    } else {
                        console.error("Geolocation is not supported by this browser.");
                    }
                }

                // Start tracking
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

// Function to handle toggle switch change
function handleToggleChange(event) {
    const isChecked = event.target.checked;
    localStorage.setItem('darkMode', isChecked); // Save preference to localStorage
    applyDarkMode(isChecked);
}

// Load user preference on page load
function loadUserPreference() {
    const darkMode = localStorage.getItem('darkMode') === 'true'; // Get user preference from localStorage
    applyDarkMode(darkMode);
    document.getElementById('darkModeToggle').checked = darkMode; // Set switch position based on user preference
}

// Add event listener to the switch
document.getElementById('darkModeToggle').addEventListener('change', handleToggleChange);

// Load user preference when page loads
window.addEventListener('load', loadUserPreference);

