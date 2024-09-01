export async function basicNotif(title, body, timeout) {
    const notifs = document.getElementById('notifs');
    if (!notifs) {
        console.error('Element with ID "notifs" not found.');
        return;
    }

    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.innerHTML = `
        <h3 class="notiftitle">${title || ""}</h3>
        <p class="notifbody">${body || ""}</p>
    `;

    notifs.appendChild(notification);

    // Add a class to trigger a CSS transition or animation for the notification
    setTimeout(() => {
        notification.classList.add('death');
    }, timeout);

    // Remove the notification after the specified time plus an additional buffer time
    setTimeout(() => {
        notification.remove();
    }, timeout + 500);
}

export function confirmNotif(title, body) {
    return new Promise((resolve) => {
        const notifs = document.getElementById('notifs');
        if (!notifs) {
            console.error('Element with ID "notifs" not found.');
            resolve(false); // Resolve with default value if `#notifs` is not found
            return;
        }

        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.innerHTML = `
            <h3 class="notiftitle">${title || ""}</h3>
            <p class="notifbody">${body || ""}</p>
            <div id="buttons">
                <button class="true">Confirm</button>
                <button class="false">Cancel</button>
            </div>
        `;

        notifs.appendChild(notification);

        // Event listener to handle button clicks
        function handleClick(event) {
            if (event.target.classList.contains('true')) {
                resolve(true);
            } else if (event.target.classList.contains('false')) {
                resolve(false);
            }

            // Trigger animation and removal
            notification.classList.add('death');
            setTimeout(() => {
                notification.remove();
            }, 500);

            // Remove event listener after handling
            notification.removeEventListener('click', handleClick);
        }

        notification.addEventListener('click', handleClick);
    });
}
