let currentPage = 1; // Center page by default (0 = Left, 1 = Center, 2 = Right)

function updatePagePosition(instant = false) {
    const container = document.querySelector('.pagecontainer');
    if (instant) {
        // Remove transition for an instant scroll
        container.style.transition = 'none';
    } else {
        // Add smooth transition
        container.style.transition = 'transform 0.3s ease';
    }
    container.style.transform = `translateX(-${currentPage * 100}vw)`;
}

// Check if on mobile
function isMobile() {
    return window.innerWidth <= 768; // Adjust the breakpoint as needed
}

// Function to reset the transform to 0
function resetTransform() {
    const container = document.querySelector('.pagecontainer');
    container.style.transition = 'none'; // Remove transition for instant effect
    container.style.transform = 'translateX(0)'; // Reset to the initial position
}

// Handle initial load
if (isMobile()) {
    updatePagePosition(true); // Instantly scroll to center
}

// Swipe functions
function swipeLeft() {
    if (currentPage < 2) {
        currentPage++;
        updatePagePosition();
    }
}

function swipeRight() {
    if (currentPage > 0) {
        currentPage--;
        updatePagePosition();
    }
}

// Optional: Add touch event listeners for mobile swiping
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX > touchEndX + 50) swipeLeft();
    if (touchStartX < touchEndX - 50) swipeRight();
});

// Optional: Add event listeners for arrow keys for desktop
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') swipeRight();
    if (e.key === 'ArrowRight') swipeLeft();
});

// Hide/show top bar on scroll
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
    const topBar = document.querySelector('.top-bar');
    if (window.scrollY > lastScrollY) {
        topBar.classList.add('hidden');
    } else {
        topBar.classList.remove('hidden');
    }
    lastScrollY = window.scrollY;
});

// Reset layout on window resize
window.addEventListener('resize', () => {
    console.log(!isMobile())
    if (!isMobile()) {
        resetTransform(); // Reset transform to 0 on desktop
        currentPage = 0; // Reset to center page
        updatePagePosition(true); // Instantly reset position
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const arrow = document.querySelector('.down-arrow');
    const dropdownMenu = document.querySelector('#dropdownMenu');

    arrow.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent click from bubbling up
        dropdownMenu.classList.toggle('show'); // Toggle the 'show' class to animate
    });

    // Close dropdown if clicking outside
    window.addEventListener('click', (event) => {
        if (!event.target.matches('.down-arrow') && !event.target.closest('#dropdownMenu')) {
            dropdownMenu.classList.remove('show'); // Hide dropdown
        }
    });


    // Sign Out Functionality (Example)
    document.getElementById('signOut').addEventListener('click', () => {
        alert('Sign Out Clicked'); // Replace with actual sign-out logic
    });

    // Dark Mode Toggle (Example)
    document.getElementById('darkModeToggle').addEventListener('change', (event) => {
        document.body.classList.toggle('dark-mode', event.target.checked);
    });
});
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
const searchBar = document.getElementById('searchBar');
const searchOverlay = document.getElementById('searchOverlay');

// Show overlay on search bar focus
searchBar.addEventListener('focus', () => {
    searchOverlay.style.display = 'block'; // Display the overlay as a flex container
});

// Close overlay when clicking outside or pressing "Esc"
document.addEventListener('click', (event) => {
    if (!searchOverlay.contains(event.target) && event.target !== searchBar) {
        searchOverlay.style.display = 'none';
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        searchOverlay.style.display = 'none';
    }
});

document.getElementById('darkModeToggle').addEventListener('change', handleToggleChange);

window.addEventListener('load', loadUserPreference);