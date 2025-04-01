import { confirmNotif } from "./notif.js";
import Shepherd from 'https://cdn.jsdelivr.net/npm/shepherd.js@latest/dist/shepherd.esm.min.js';
window.Shepherd = Shepherd;


document.addEventListener("DOMContentLoaded", async () => {
    const currentPage = window.location.pathname.split("/").pop();

    if (!localStorage.getItem("seenTutorial") && currentPage == "index.html") {
        //const wantsTutorial = await confirmNotif("Welcome to Logbook", "Would you like a walkthrough?");
        //if (wantsTutorial) {
          //  startTutorial();
       // }
    }

    if (localStorage.getItem("tutorialStep") === "1" && currentPage === "classes.html") {
       // resumeTutorial();
    }

    if (localStorage.getItem("tutorialStep") === "2" && currentPage === "class.html") {
        console.log("Pluh")
        //resumeClassTutorial();
    }
});

function startTutorial() {
    const tour = new Shepherd.Tour({
        defaultStepOptions: {
            classes: "bg-blue-600 text-white p-2 rounded",
            scrollTo: true,
            popperOptions: {
                modifiers: [{ name: "zIndex", enabled: true, options: { zIndex: 10000 } }]
            }
        }
    });

    // Step 1: Click "Add Class"
    tour.addStep({
        title: "Create or Join a Class",
        text: "Click this button to create or join a class.",
        attachTo: { element: "#classPfp", on: "bottom" },
        buttons: [
            {
                text: "Next",
                action: () => {
                    localStorage.setItem("tutorialStep", "1"); // Save progress
                    window.location.href = "classes.html"; // Redirect to the class page
                }
            }
        ]
    });

    tour.start();
}

function resumeTutorial() {
    const tour = new Shepherd.Tour({
        defaultStepOptions: {
            classes: "bg-blue-600 text-white p-2 rounded",
            scrollTo: true,
            popperOptions: {
                modifiers: [{ name: "zIndex", enabled: true, options: { zIndex: 10000 } }]
            }
        }
    });
    tour.addStep({
        title: "Join a Class",
        text: "Click this button to switch to joining an existing class.",
        attachTo: { element: "#joinBtn", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 2: Enter Class Code
    tour.addStep({
        title: "Enter Class Code",
        text: "Enter the class code given by your instructor to join.",
        attachTo: { element: "#classCode", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 3: Join the Class
    tour.addStep({
        title: "Join",
        text: "Click this button to join the class.",
        attachTo: { element: "#joinclass-btn", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });
    // **Start from the form and go to the end**
    
    // Step 1: Toggle between Add/Join
    tour.addStep({
        title: "Create a Class",
        text: "Use these buttons to switch between creating a new class or joining an existing one.",
        attachTo: { element: "#addBtn", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 2: Enter Class Name
    tour.addStep({
        title: "Class Name",
        text: "Enter the name of your class here.",
        attachTo: { element: "#className", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 3: Select Time Zone
    tour.addStep({
        title: "Select Time Zone",
        text: "Choose the correct time zone for your class.",
        attachTo: { element: "#timezone", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 5: Get Current Location
    tour.addStep({
        title: "Get Current Location",
        text: "Click this button to auto-fill the latitude and longitude based on your current location.",
        attachTo: { element: "#getLocation", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 6: Set Radius
    tour.addStep({
        title: "Set Radius",
        text: "Define the area (in meters) within which attendance can be marked.",
        attachTo: { element: "#radius", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 7: Add Class
    tour.addStep({
        title: "Add Class",
        text: "Once everything is set, click this button to create your class.",
        attachTo: { element: "#addclass-btn", on: "bottom" },
        buttons: [
            {
                text: "Finish",
                action: () => {
                    localStorage.setItem("tutorialStep", "2"); // Save progress
                    tour.complete();
                }
            }
        ]
    });

    tour.start();
}
function resumeClassTutorial() {
    if (localStorage.getItem("tutorialStep") !== "2") return; // Only continue if step 2 was reached

    const tour = new Shepherd.Tour({
        defaultStepOptions: {
            classes: "bg-blue-600 text-white p-2 rounded",
            scrollTo: true,
            popperOptions: {
                modifiers: [{ name: "zIndex", enabled: true, options: { zIndex: 10000 } }]
            }
        }
    });

    // Step 1: Register NFC ID
    tour.addStep({
        title: "Register Your NFC ID",
        text: "Click this to register your NFC ID for future logins.",
        attachTo: { element: "#registerRFIDBtn", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 2: Update Face for Recognition
    tour.addStep({
        title: "Update Face for Recognition",
        text: "Click this to upload a clear image of your face for attendance.",
        attachTo: { element: "#updateFaceBtn", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 3: Mark Attendance with "Raise Hand"
    tour.addStep({
        title: "Mark Attendance",
        text: "Click this button to raise your hand and record your attendance.",
        attachTo: { element: "#attendButton", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 4: Scan NFC for Attendance (if available)
    tour.addStep({
        title: "Scan NFC (Optional)",
        text: "If your class allows NFC attendance, tap your NFC ID here.",
        attachTo: { element: "#facescan-button", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 5: Scan QR Code for Attendance (if available)
    tour.addStep({
        title: "Scan QR Code (Optional)",
        text: "You can also scan a QR code for attendance verification.",
        attachTo: { element: "#qr-code-reader", on: "bottom" },
        buttons: [{ text: "Next", action: tour.next }]
    });

    // Step 6: Make a Post
    tour.addStep({
        title: "Post an Update",
        text: "Click this button to create a post in your class.",
        attachTo: { element: "#camera-button", on: "bottom" },
        buttons: [
            {
                text: "Finish",
                action: () => {
                    localStorage.removeItem("tutorialStep"); // Clear tutorial progress
                    localStorage.setItem("seenTutorial", "true"); // Mark tutorial as done
                    tour.complete();
                }
            }
        ]
    });

    tour.start();
}
