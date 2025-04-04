import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

const luxonScript = document.createElement('script');
luxonScript.src = 'https://cdn.jsdelivr.net/npm/luxon@3.2.0/build/global/luxon.min.js';
document.head.appendChild(luxonScript);

let DateTime;

luxonScript.onload = function () {
    DateTime = window.luxon.DateTime;
}

import {
    getAuth,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    setPersistence,
    browserSessionPersistence,
    inMemoryPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    setDoc as setSubDoc,
    deleteDoc,
    onSnapshot,
    orderBy,
    updateDoc,
    deleteField,
    increment,
    addDoc,
    limit,
    arrayUnion,
    arrayRemove,
    initializeFirestore,
    persistentLocalCache,
    persistentSingleTabManager,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { basicNotif, confirmNotif } from "./notif.js";

import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

import * as facerecognition from "./facerecog.js";

const firebaseConfig = {
    apiKey: "AIzaSyD2njL-ut8J-eEtp-1Pr6XzF8uEccBEngc",
    authDomain: "date-time-record.firebaseapp.com",
    projectId: "date-time-record",
    storageBucket: "date-time-record.appspot.com",
    messagingSenderId: "624915234552",
    appId: "1:624915234552:web:fd98814a56a2d434ce450d",
    measurementId: "G-EV3TFLDQ7E"
};

const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();
const auth = getAuth(app);
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
});

let currentUser;


export { db }

setPersistence(auth, browserLocalPersistence)
    .then(() => {
        return signInWithEmailAndPassword(auth, email, password), signInWithPopup(auth, provider);
    })
    .catch((error) => {
    });

let alreadyFetched = [];
let isFetchingPosts = false; // Flag to prevent multiple requests

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user
        if (typeof on_index != 'undefined') {
            const currentUser = await getCurrentUser(); // Fetch the current user's email
            const userClasses = await getUserClasses(); // Fetch the user's classes
            console.log(userClasses)
            if (userClasses != "None") {
                for (const classData of userClasses) {
                    const syntax = classData.syntax;  // Assuming `syntax` is a property of each class

                    const classPosts = await fetchClassPosts(syntax, alreadyFetched, 2);

                    console.log(alreadyFetched);
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

                        // Wrap #hashtags with <span> tags
                        description = description.replace(/(#[\w_\.]+)/g, function (match) {
                            return `<span class="tag">${match.replace(/_/g, ' ')}</span>`;
                        });

                        // Make text between * bold
                        description = description.replace(/\*(.*?)\*/g, function (match, content) {
                            return `<strong>${content}</strong>`;
                        });

                        // Make text between *^ very bold
                        description = description.replace(/\+\+(.*?)\+\+/g, function (match, content) {
                            return `<b style="font-weight: bold; font-size: 1.1em;">${content}</b>`; // Using <b> for very bold
                        });
                        // Italicize text between //
                        description = description.replace(/\/\/(.*?)\/\//g, function (match, content) {
                            return `<i>${content}</i>`;
                        });

                        // Change font size using ^n (e.g., ^2(text))
                        description = description.replace(/\^(\d+)\((.*?)\)/g, function (match, size, content) {
                            return `<span style="font-size: ${size}em;">${content}</span>`;
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
                        
                        <input type="checkbox" id="toggle">
                        <p id="desc">${description}</p>
                        <label for="toggle" id="toggleText">... Read More</label>
                        <label for="toggle" id="toggleTextShow">... Show Less</label>
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
                            <img class="img" src="${user.photoURL}"><textarea maxlength="150" id="commentInput${postId}" placeholder="Comment here"></textarea><i id="postComment${postId}" class="fa-solid fa-paper-plane"></i><a>Send</a>
                        </div>
                        </div>
                        <div class="comments" id="commentSection${postId}">
                        <label for="commentSectionToggle${postId}" id="commentsToggleLabel${postId}">
                        Comments</label>
                            <div id="commentsContainer${postId}">
                            </div>
                        </div>
                    `;

                        posts.appendChild(template);
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
                        imgElement.addEventListener('click', () => {
                            window.location.href = `post.html?postId=${encodeURIComponent(postId)}&syntax=${encodeURIComponent(syntax)}`;
                        });

                        const likeCheckbox = template.querySelector(`#like${postId}`);

                        const desc = template.querySelector('#desc');
                        const toggleText = template.querySelector('#toggleText');
                        const toggleTextShow = template.querySelector('#toggleTextShow');
                        console.log(desc.scrollHeight > 110);
                        if (desc.scrollHeight > 110) {
                            desc.style.height = '110px';
                            toggleText.style.display = 'inline';
                            toggleTextShow.style.display = 'none'; // Hide "Show Less" by default
                        } else {
                            // Hide the toggle buttons if content doesn't overflow
                            toggleText.style.display = 'none';
                            toggleTextShow.style.display = 'none';
                        }
                        template.querySelector('#toggle').addEventListener('change', function () {
                            if (this.checked) {
                                desc.style.height = `${desc.scrollHeight}px`;
                                toggleText.style.display = 'none';
                                toggleTextShow.style.display = 'inline';
                            } else {
                                desc.style.height = '110px';
                                toggleText.style.display = 'inline';
                                toggleTextShow.style.display = 'none';
                            }
                        });

                        // Check if the post is liked by the current user on page load
                        const postRef = doc(db, 'posts', postId);
                        const postSnapshot = await getDoc(postRef);

                        if (postSnapshot.exists()) {
                            const postData = postSnapshot.data();
                            const postLikes = postData.userlikes || []; // Get the 'likes' array or an empty array if it doesn't exist

                            if (postLikes.includes(user.uid)) {
                                likeCheckbox.checked = true; // Check the checkbox if user has liked the post
                            }
                        }

                        // Toggle like status on checkbox change
                        likeCheckbox.addEventListener('change', async () => {
                            const likestxt = template.querySelector('#likes');

                            if (likeCheckbox.checked) {
                                likestxt.innerHTML = `${likes + 1} likes`;
                                likes = likes + 1;
                                await addToLikedPosts(user.uid, postId); // Add user ID to the post's likes array
                            } else {
                                likestxt.innerHTML = `${likes - 1} likes`;
                                likes = likes - 1;
                                await removeFromLikedPosts(user.uid, postId); // Remove user ID from the post's likes array
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
                            refreshMessage.style.color = 'var(--text-color-main)';
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
                                await deletePost(postId, syntax); // Add deletePost function to remove the post
                                cancelFunction(template);
                            });
                        };
                        await displayComments(postId);
                    }
                    function cancelFunction(template) {
                        // Remove the template from the DOM
                        template.remove();
                    }
                    // Loop through each post and render it
                    classPosts.forEach(post => {
                        const { email, image, dateTime, description } = post;

                        // Call the createPostItem function for each post
                        createPostItem(email, image, dateTime, description, currentUser.email, post.id, post.userid, post.likes);
                        alreadyFetched.push(post.id);
                    });
                    function isNearBottom() {
                        const scrollTop = window.scrollY || document.documentElement.scrollTop;
                        const scrollHeight = document.documentElement.scrollHeight;
                        const clientHeight = document.documentElement.clientHeight;

                        // Check if the user is within 300px of the bottom of the page
                        return scrollTop + clientHeight >= scrollHeight - 300;
                    }

                    // Function to fetch and render posts when scrolling near the bottom
                    async function fetchPostsOnScroll() {
                        if (isNearBottom() && !isFetchingPosts) {
                            isFetchingPosts = true; // Set the flag to prevent multiple fetches

                            // Fetch new posts (e.g., 3 posts at a time)
                            for (const classData of userClasses) {
                                const syntax = classData.syntax;
                                const newPosts = await fetchClassPosts(syntax, alreadyFetched, 1);

                                if (newPosts.length > 0) {
                                    newPosts.forEach(post => {
                                        const { email, image, dateTime, description, userid, likes } = post;
                                        createPostItem(email, image, dateTime, description, currentUser.email, post.id, userid, likes);
                                        alreadyFetched.push(post.id); // Mark the post as fetched
                                    });
                                }
                            }

                            isFetchingPosts = false; // Reset the flag after fetching
                        }
                    }

                    // Listen for scroll events
                    window.addEventListener('scroll', fetchPostsOnScroll);
                }
                displayUserClasses();
                document.getElementById('classList').addEventListener('click', async function (event) {
                    if (event.target.classList.contains('remove-btn')) {
                        var listItem = event.target.closest('li');

                        var syntax = listItem.querySelector('#uid').textContent;
                        let classData = await fetchClass(syntax);
                        if (await confirmNotif(`Are you sure you want to remove ${classData.name}`)) {
                            try {
                                await removeClass(syntax);
                                basicNotif("Removed class succesfully", `Removed ${classData.name}`, 5000);
                                console.log("Class removed successfully:", syntax);

                                listItem.remove();
                            } catch (error) {

                                console.error("Error removing class:", error);
                            }
                        } else {
                            basicNotif("Class removal canceled", `canceled reomiving ${classData.name}`, 5000);
                            console.log("Class removal canceled.");
                        }
                    } else if (event.target.classList.contains('leave-btn')) {
                        var listItem = event.target.closest('li');

                        var syntax = listItem.querySelector('#uid').textContent;
                        let classData = await fetchClass(syntax);

                        if (await confirmNotif(`Are you sure you want to leave ${classData.name}?`)) {

                            try {
                                await leaveClass(syntax);
                                console.log("Class removed successfully:", syntax);
                                basicNotif("Left class succesfully", `Left ${classData.name}`, 5000);
                                listItem.remove();
                            } catch (error) {
                                console.error("Error leaving class:", error);
                            }
                        } else {
                            basicNotif("Class leave canceled", `canceled leaving ${classData.name}`, 5000);
                            console.log("Class leave canceled.");
                        }
                    } else {
                        var listItem = event.target.closest('li');

                        var syntax = listItem.querySelector('#uid').textContent;

                        window.location.href = `class.html?syntax=${syntax}`;
                    }
                });

            };

        }
        if (typeof on_login == 'undefined') {
            console.log(user)
            //updateProfile(user.displayName, user.email, user.uid, user.photoURL);
            const qrcode = `${user.uid}`
            const parts = qrcode.split('/');
            console.log(parts);
            console.log(qrcode);
            generateQRCode(qrcode);
            document.getElementById('signout').addEventListener('click', async function (event) {
                signOutAccount();
            });

            const qab = document.getElementById('startQA');
            const atD = document.getElementById('atD');

            qab.addEventListener('click', async () => {
                basicNotif("Starting", "Please wait...", 5000);
                const code = await generateAttendanceCode();
                await createqA(code);
                if (await confirmNotif(`Quick Attendance Code is ${code}`, "would you like to get results")) {
                    await emailresults(currentUser.email, code);
                    await deleteAttendanceDoc(code);
                } else {
                    await deleteAttendanceDoc(code);
                }
            });
            atD.addEventListener('click', async () => {
                basicNotif("Checking", "Please wait...", 5000);
                const code = document.getElementById('attendance-code').value;
                await addUserToAttendance(code, currentUser.displayName);
            });

            // Handle face image upload and form submission
            const imageUpload = document.getElementById('imageUpload');
            const updateFaceBtn = document.getElementById('updateFaceBtn');
            const faceForm = document.getElementById('faceForm');

            updateFaceBtn.addEventListener('click', () => {
                // Trigger the file input click when "Update Face" is clicked
                imageUpload.click();
            });

            // Automatically submit form after image selection
            const facePreviewContainer = document.getElementById('face-preview-container');
            const previewImage = document.getElementById('preview-image');
            const confirmButton = document.getElementById('confirm-button');
            const cancelButton = document.getElementById('cancel-button');

            imageUpload.addEventListener('change', (e) => {
                e.preventDefault(); // Stop the default action for file change

                if (imageUpload.files.length > 0) {
                    // Trigger the submit event handler manually
                    faceForm.dispatchEvent(new Event('submit'));
                }
            });

            faceForm.addEventListener('submit', async (e) => {
                e.preventDefault(); // Prevent form submission

                try {
                    const file = imageUpload.files[0];

                    if (!file) {
                        console.log('No file selected.');
                        return;
                    }

                    console.log('File selected:', file);

                    // Simulate face detection (replace with your faceDetect function)
                    const detections = await facerecognition.faceDetect(file);
                    const descriptors = detections.map(detection => Array.from(detection.descriptor));

                    if (detections.length !== 1) {
                        console.log('Invalid number of faces detected.');
                        basicNotif("No faces", "Please provide a clear picture.", 5000);
                        return;
                    }

                    // Display the selected image in the modal
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        previewImage.src = e.target.result;
                        facePreviewContainer.style.display = 'flex'; // Show the modal
                    };
                    reader.readAsDataURL(file);

                    // Confirm button logic
                    confirmButton.onclick = () => {
                        console.log('Face confirmed:', descriptors);
                        resetImageUpload();
                        saveDescriptorsToFirebase(descriptors); // Save to Firebase
                        facePreviewContainer.style.display = 'none'; // Hide the modal
                        basicNotif("Face saved", "Face for user has been saved", 5000);
                    };

                    // Cancel button logic
                    cancelButton.onclick = () => {
                        console.log('Cancel clicked.');
                        resetImageUpload();
                        facePreviewContainer.style.display = 'none'; // Hide the modal
                    };

                } catch (error) {
                    resetImageUpload();
                    console.error('Error during image upload and processing:', error);
                }
                function resetImageUpload() {
                    imageUpload.value = ''; // Clear the file input's value
                }
            });


            // Handle RFID registration and NFC scanning
            const registerWithLink = document.getElementById('registerWithLink');

            registerWithLink.addEventListener('click', async () => {
                console.log("Copying plain text...");
                const textToCopy = `${window.location.origin}/dtr/index.html?registerNfcRFID=${currentUser.uid}`;
                try {
                    basicNotif("Copied to clipboard", "", 5000)
                    await navigator.clipboard.writeText(textToCopy);
                } catch (err) {
                }
            });
            const urlParams = new URLSearchParams(window.location.search);
            const registeringuid = urlParams.get('registerNfcRFID');

            if (registeringuid) {
                try {
                    if ('NDEFReader' in window) {
                        const ndef = new NDEFReader();
                        await ndef.scan();
                        const fetchedUser = await fetchProfile(registeringuid);
                        console.log('NFC scanning started...');
                        basicNotif("NFC scanning started...", "Please place RFID to scan", 5500);
                        ndef.onreading = (event) => {
                            const { serialNumber } = event; // This is the RFID UID
                            console.log('Scanned NFC tag with UID:', serialNumber);
                            basicNotif("Scan complete", `${serialNumber} for user ${fetchedUser.displayName} has been saved`, 5500);
                            updateRFID(registeringuid, serialNumber); // Call the function to update RFID
                            ndef.onreading = null;
                            ndef.onerror = null;
                            console.log('NFC scan stopped.');
                        };

                    } else {
                        console.log('NFC is not supported in this browser.');
                        basicNotif('NFC is not supported in this browser.', '', 5500);
                    }
                } catch (error) {
                    console.error('Error during NFC scanning:', error);
                }
            }

            const registerRFIDBtn = document.getElementById('registerRFIDBtn');

            registerRFIDBtn.addEventListener('click', async () => {
                try {
                    if ('NDEFReader' in window) {
                        const ndef = new NDEFReader();
                        await ndef.scan();
                        console.log('NFC scanning started...');
                        basicNotif("NFC scanning started...", "Please place RFID to scan", 5500);
                        ndef.onreading = (event) => {
                            const { serialNumber } = event; // This is the RFID UID
                            console.log('Scanned NFC tag with UID:', serialNumber);
                            basicNotif("Scan complete", `${serialNumber} for user ${user.displayName} has been saved`, 5500);
                            updateRFID(user.uid, serialNumber); // Call the function to update RFID
                            ndef.onreading = null;
                            ndef.onerror = null;
                            console.log('NFC scan stopped.');
                        };

                    } else {
                        console.log('NFC is not supported in this browser.');
                        basicNotif('NFC is not supported in this browser.', '', 5500);
                    }
                } catch (error) {
                    console.error('Error during NFC scanning:', error);
                }
            });

        }
        const account = document.getElementById('account');
        if (account) {
            account.innerHTML = `<img id="accountImg" src="${user.photoURL || "Images/gear.png"}"></img>`;
        }

        if (typeof on_post !== 'undefined') {
            const getUrlParams = (param) => {
                const urlParams = new URLSearchParams(window.location.search);
                return urlParams.get(param);
            };

            // Get the postId from the URL
            const postId = getUrlParams('postId');
            const syntax = getUrlParams('syntax');
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

                // Wrap #hashtags with <span> tags
                description = description.replace(/(#[\w_\.]+)/g, function (match) {
                    return `<span class="tag">${match.replace(/_/g, ' ')}</span>`;
                });

                // Make text between * bold
                description = description.replace(/\*(.*?)\*/g, function (match, content) {
                    return `<strong>${content}</strong>`;
                });

                // Make text between *^ very bold
                description = description.replace(/\+\+(.*?)\+\+/g, function (match, content) {
                    return `<b style="font-weight: bold; font-size: 1.1em;">${content}</b>`; // Using <b> for very bold
                });
                // Italicize text between //
                description = description.replace(/\/\/(.*?)\/\//g, function (match, content) {
                    return `<i>${content}</i>`;
                });

                // Change font size using ^n (e.g., ^2(text))
                description = description.replace(/\^(\d+)\((.*?)\)/g, function (match, size, content) {
                    return `<span style="font-size: ${size}em;">${content}</span>`;
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
                    <input type="checkbox" id="toggle">
                        <p id="desc">${description}</p>
                        <label for="toggle" id="toggleText">... Read More</label>
                        <label for="toggle" id="toggleTextShow">... Show Less</label>
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
                        <img class="img" src="${user.photoURL}"><textarea maxlength="150" id="commentInput${postId}" placeholder="Comment here"></textarea><i id="postComment${postId}" class="fa-solid fa-paper-plane"></i><a>Send</a>
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

                const desc = template.querySelector('#desc');
                const toggleText = template.querySelector('#toggleText');
                const toggleTextShow = template.querySelector('#toggleTextShow');
                console.log(desc.scrollHeight > 110);
                if (desc.scrollHeight > 110) {
                    desc.style.height = '110px';
                    toggleText.style.display = 'inline';
                    toggleTextShow.style.display = 'none'; // Hide "Show Less" by default
                } else {
                    // Hide the toggle buttons if content doesn't overflow
                    toggleText.style.display = 'none';
                    toggleTextShow.style.display = 'none';
                }
                template.querySelector('#toggle').addEventListener('change', function () {
                    if (this.checked) {
                        desc.style.height = `${desc.scrollHeight}px`;
                        toggleText.style.display = 'none';
                        toggleTextShow.style.display = 'inline';
                    } else {
                        desc.style.height = '110px';
                        toggleText.style.display = 'inline';
                        toggleTextShow.style.display = 'none';
                    }
                });

                // Toggle like status on checkbox change
                const postRef = doc(db, 'posts', postId);
                const postSnapshot = await getDoc(postRef);

                if (postSnapshot.exists()) {
                    const postData = postSnapshot.data();
                    const postLikes = postData.userlikes || []; // Get the 'likes' array or an empty array if it doesn't exist

                    if (postLikes.includes(user.uid)) {
                        likeCheckbox.checked = true; // Check the checkbox if user has liked the post
                    }
                }

                // Toggle like status on checkbox change
                likeCheckbox.addEventListener('change', async () => {
                    const likestxt = template.querySelector('#likes');

                    if (likeCheckbox.checked) {
                        likestxt.innerHTML = `${likes + 1} likes`;
                        likes = likes + 1;
                        await addToLikedPosts(user.uid, postId); // Add user ID to the post's likes array
                    } else {
                        likestxt.innerHTML = `${likes - 1} likes`;
                        likes = likes - 1;
                        await removeFromLikedPosts(user.uid, postId); // Remove user ID from the post's likes array
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
                    refreshMessage.style.color = 'var(--text-color-main)';
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
                        await deletePost(postId, syntax); // Add deletePost function to remove the post
                        cancelFunction(template);
                    });
                };
                await displayComments(postId);
            }
            // Fetch the post data using postId
            if (postId) {
                await getPostById(postId).then(postData => {
                    // Assuming postData contains the required fields
                    const { email, image, dateTime, description, currentUserEmail, userid, likes } = postData;

                    // Create the post item and append it to the container
                    createPostItem(email, image, dateTime, description, currentUserEmail, postId, userid, likes);
                }).catch(error => {
                    console.error('Error fetching post:', error);
                    // Handle error (e.g., show an error message to the user)
                });
            } else {
                console.error('No postId found in the URL');
                // Handle case where no postId is provided
            }
        }

    } else {
        if (typeof on_login == 'undefined') {
            window.location.href = `login.html`;
        }
    }
});

// Add a post to the user's liked posts

export const getPostById = async (postId) => {
    try {
        const postRef = doc(db, 'posts', postId); // Reference to the post document
        const postSnap = await getDoc(postRef); // Get the document snapshot

        if (postSnap.exists()) {
            return postSnap.data(); // Return the post data if it exists
        } else {
            throw new Error('No such post exists!');
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        throw error; // Propagate the error
    }
};

// Add a user's ID to the 'likes' array in the post document
export async function addToLikedPosts(userId, postId) {
    const postRef = doc(db, 'posts', postId);

    await updateDoc(postRef, {
        userlikes: arrayUnion(userId) // Add the userId to the 'likes' array
    });

    await updateDoc(postRef, {
        likes: increment(1) // Increment the likes count by 1
    });
}

// Remove a user's ID from the 'likes' array in the post document
export async function removeFromLikedPosts(userId, postId) {
    const postRef = doc(db, 'posts', postId);

    await updateDoc(postRef, {
        userlikes: arrayRemove(userId) // Remove the userId from the 'likes' array
    });
    await updateDoc(postRef, {
        likes: increment(-1) // Increment the likes count by 1
    });
}
export async function addToLikedComment(userId, commentId, postId) {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);

    await updateDoc(commentRef, {
        userlikes: arrayUnion(userId) // Add userId to the 'likes' array of the comment
    });
    await updateDoc(commentRef, {
        likes: increment(1) // Increment the likes count by 1
    });
}
export async function removeFromLikedComment(userId, commentId, postId) {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);

    await updateDoc(commentRef, {
        userlikes: arrayRemove(userId) // Remove userId from the 'likes' array of the comment
    });
    await updateDoc(commentRef, {
        likes: increment(-1) // Increment the likes count by 1
    });
}


function checkpasswordlength(password) {
    if (password.length >= 8) {
        return true
    }
}

async function updateRFID(uid, rfidUid) {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
        rfidUid: rfidUid || null // Save only RFID UID (null if not provided)
    }, { merge: true })
        .then(() => {
            console.log('RFID UID updated successfully');
        })
        .catch((error) => {
            console.error('Error updating RFID UID:', error);
        });
}


async function updateProfile(displayName, email, uid, photoUrl) {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
        displayName: displayName || 'Anonymous',
        email: email,
        uid: uid,
        photoUrl: photoUrl || '../Images/gear.png'
    }, { merge: true })
        .then(() => {
            console.log('Profile updated successfully with RFID UID');
        })
        .catch((error) => {
            console.error('Error updating profile:', error);
        });
}

export async function updateClass(syntax, data) {
    const classRef = doc(db, 'classes', syntax); // Reference to the document in Firestore
    await setDoc(classRef, data, { merge: true }) // Merge the provided data
        .then(() => {
            console.log('Class updated successfully');
        })
        .catch((error) => {
            console.error('Error updating class:', error);
        });
}



export async function saveDescriptorsToFirebase(descriptors) {
    const uid = currentUser.uid;
    try {
        const userDocRef = doc(db, 'users', uid);

        const flatDescriptors = descriptors.flat();
        await setDoc(userDocRef, { faceDescriptors: flatDescriptors }, { merge: true });

        console.log('Descriptors saved successfully.');
    } catch (error) {
        console.error('Error saving descriptors:', error);
    }
}

export async function signUpWithEmail() {
    const displayName = document.getElementById('signUpUsername').value;
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    const confirmpassword = document.getElementById('signUpPasswordConfirm').value;

    console.log(displayName, email, password, confirmpassword);

    // Validate password length (for example, minimum 6 characters)
    if (checkpasswordlength(password)) {
        if (confirmpassword === password) {
            try {
                // Create user with email and password
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log(user)
                // Update user profile with display name
                await updateProfile(
                    displayName,
                    email,
                    user.uid,
                );
                window.location.href = `index.html`;

                console.log('User created successfully:', user);
                // Handle further logic, like redirecting or showing a success message
            } catch (error) {
                // Handle errors from Firebase Auth
                console.error('Error signing up:', error.message);
                basicNotif('Sign Up Error', error.message, 5000);
            }
        } else {
            basicNotif("Passwords don't match.", "Please try again", 5000);
        }
    } else {
        basicNotif('Password is too short.', 'Your password must be at least 6 characters long.', 5000);
    }
}


export async function loginWithEmail() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            window.location.href = `index.html`;
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
        });
}

export async function loginWithGoogle() {
    signInWithPopup(auth, provider)
        .then(async (result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
            await updateProfile(user.displayName, user.email, user.uid, user.photoURL);
            window.location.href = `index.html`;
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.customData.email;
            const credential = GoogleAuthProvider.credentialFromError(error);
        });
}

export async function signOutAccount() {
    signOut(auth).then(() => {
    }).catch((error) => {
    });
}

export async function fetchProfile(userid, bruteForce = false) {
    try {
        // Check if the 'profiles' array exists in localStorage
        let profiles = JSON.parse(localStorage.getItem('profilesv1')) || [];

        // Look for the profile in localStorage
        const cachedProfile = profiles.find(profile => profile.userid === userid);

        // If brute force flag is set or no profile found in localStorage, fetch from Firestore
        if (bruteForce || !cachedProfile) {
            console.log(bruteForce ? 'Brute forcing update from Firestore.' : 'Profile not found in localStorage, fetching from Firestore.');

            // Fetch from Firestore
            const userDocRef = doc(db, 'users', userid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const user = docSnap.data();

                // Add the fetched profile to the localStorage array
                if (!cachedProfile) {
                    profiles.push({ userid, ...user });
                } else {
                    // Update existing profile
                    profiles = profiles.map(profile =>
                        profile.userid === userid ? { userid, ...user } : profile
                    );
                }
                localStorage.setItem('profilesv1', JSON.stringify(profiles));

                return user;
            } else {
                console.log('No profile found for user ID:', userid);
                return null;
            }
        }

        // If brute force is not set and profile is found in localStorage
        console.log('Profile found in localStorage:', cachedProfile);
        return cachedProfile;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}



export function getAverageAndSecondColor(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;

        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0, img.width, img.height);

            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const data = imageData.data;

            let colorMap = new Map();
            for (let i = 0; i < data.length; i += 4) {
                const rgb = `${data[i]},${data[i + 1]},${data[i + 2]}`;
                if (colorMap.has(rgb)) {
                    colorMap.set(rgb, colorMap.get(rgb) + 1);
                } else {
                    colorMap.set(rgb, 1);
                }
            }
            const sortedColors = [...colorMap.entries()].sort((a, b) => b[1] - a[1]);
            let secondColorRgb = [255, 255, 255];
            for (let i = 1; i < sortedColors.length; i++) {
                const rgb = sortedColors[i][0].split(',').map(Number);
                if (!isBlackOrWhite(rgb)) {
                    secondColorRgb = rgb;
                    break;
                }
            }
            const averageColor = {
                r: Math.floor(data.reduce((acc, val, idx) => idx % 4 === 0 ? acc + val : acc, 0) / (data.length / 4)),
                g: Math.floor(data.reduce((acc, val, idx) => idx % 4 === 1 ? acc + val : acc, 0) / (data.length / 4)),
                b: Math.floor(data.reduce((acc, val, idx) => idx % 4 === 2 ? acc + val : acc, 0) / (data.length / 4))
            };
            resolve({ averageColor, secondColor: { r: secondColorRgb[0], g: secondColorRgb[1], b: secondColorRgb[2] } });
        };
        img.onerror = function () {
            reject('Failed to load image');
        };
    });
}

function isBlackOrWhite(rgb) {
    const threshold = 30;
    return rgb.every(val => val < threshold) || rgb.every(val => val > 255 - threshold);
}

function generateQRCode(userId, callback) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';
    script.onload = () => {
        QRCode.toCanvas(document.getElementById('qrcode'), userId, function (error) {
            if (error) {
                console.error('Error generating QR code:', error);
            } else {
                console.log('QR code successfully generated!');
            }
            if (callback) callback();
        });
    };
    document.head.appendChild(script);
}

function addLogoToQRCode() {
    const canvas = document.getElementById('qrcode');
    const ctx = canvas.getContext('2d');
    const logo = new Image();

    logo.src = 'Images/logo.png';

    logo.onload = function () {
        const logoSize = 50;
        const x = (canvas.width / 2) - (logoSize / 2);
        const y = (canvas.height / 2) - (logoSize / 2);

        ctx.drawImage(logo, x, y, logoSize, logoSize);
    };
}

async function checkIfSyntaxExists(syntax) {
    const docRef = doc(db, 'classes', syntax);
    try {
        const docSnap = await getDoc(docRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking document existence:", error);
        return false;
    }
}

export async function generateUniqueSyntax() {
    let syntax;
    let exists = true;

    while (exists) {
        syntax = generateRandomSyntax();
        exists = await checkIfSyntaxExists(syntax);
        console.log(`Generated syntax: ${syntax}, Exists: ${exists}`);
    }
    return syntax;
}

async function checkIfPostSyntaxExists(classId, syntax) {
    const docRef = doc(db, 'classes', classId, 'posts', syntax);
    try {
        const docSnap = await getDoc(docRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking document existence:", error);
        return false;
    }
}

export async function generateUniquePostSyntax(classId) {
    let syntax;
    let exists = true;

    while (exists) {
        syntax = generateRandomSyntax();
        exists = await checkIfPostSyntaxExists(classId, syntax);
        console.log(`Generated syntax: ${syntax}, Exists: ${exists}`);
    }
    return syntax;
}

function generateRandomSyntax() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i % 4 === 3 && i < 15) {
            result += '-';
        }
    }

    return result;
}

export async function addClass(className, syntax, classcode, lat, long, rad, timezone) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        console.error('No user is authenticated.');
        return;
    }
    function getRandomBrightColor() {
        const hue = Math.floor(Math.random() * 360); // Random hue between 0 and 360
        const saturation = 80 + Math.random() * 20; // Saturation between 80% and 100%
        const lightness = 50 + Math.random() * 10; // Lightness between 50% and 60%
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    const classColor = getRandomBrightColor(); // Get random color

    try {
        const classRef = doc(db, 'classes', syntax);

        await setDoc(classRef, {
            name: className,
            syntax: syntax,
            code: classcode,
            lat: lat,
            long: long,
            rad: rad,
            timezone: timezone,
            color: classColor // Assign the random bright color to the class
        });

        const membersRef = collection(classRef, 'members');

        await setDoc(doc(membersRef, user.uid), {
            role: 'owner',
        });

        const userClassesRef = collection(db, 'users', user.uid, 'classes');

        await setDoc(doc(userClassesRef, syntax), {
            syntax: syntax

        });
        window.location.href = `class.html?syntax=${syntax}`;
        console.log("Class added successfully with admin:", user.uid);
    } catch (error) {
        console.error("Error adding class:", error);
    }
}

async function deleteCollection(collectionPath) {
    const collectionRef = collection(db, collectionPath);
    const querySnapshot = await getDocs(collectionRef);

    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
}

export async function removeClass(syntax) {
    const auth = getAuth();
    const user = auth.currentUser;
    const classDocRef = doc(db, 'classes', syntax);
    const subcollectionNames = ['members'];
    const members = await fetchMembers(syntax);
    for (const member of members) {
        try {
            const userRef = doc(db, 'users', member.id, 'classes', syntax);
            try {
                // Check if the class exists before trying to delete
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    console.log("Document path:", userRef.path);
                    await deleteDoc(userRef);
                    console.log("Class removed from Firestore:", syntax);
                } else {
                    console.error("Class not found in Firestore:", syntax);
                }
            } catch (error) {
                console.error("Error deleting document from Firestore:", error);
            }
        } catch (error) {
            console.error(`Failed to fetch profile for member with ID ${member.id}:`, error);
        }
    }
    // Delete each subcollection
    for (const subcollection of subcollectionNames) {
        const subcollectionPath = `classes/${syntax}/${subcollection}`;
        await deleteCollection(subcollectionPath);
    }
    try {
        // Delete the document
        await deleteDoc(classDocRef);
        console.log("Class removed successfully:", syntax);
        const urlParams = new URLSearchParams(window.location.search);
        const pagesyntax = urlParams.get('syntax');
        console.log(pagesyntax === syntax)
        if (pagesyntax) {
            if (pagesyntax === syntax) {
                window.location.href = `classes.html`;
            }
        }
    } catch (error) {
        console.error("Error removing class:", error);
    }
}

export async function kickfromClass(syntax, id) {
    const classRef = doc(db, 'classes', syntax);
    const memberRef = doc(db, 'users', id, 'classes', syntax);
    const memberClassRef = doc(classRef, 'members', id); // Corrected line
    try {
        const docSnap = await getDoc(memberRef);
        if (docSnap.exists()) {
            console.log("Document path:", memberRef.path);
            await deleteDoc(memberRef);
            console.log("User removed from class:", syntax);
        } else {
            console.error("User not found in class:", syntax);
        }
    } catch (error) {
        console.error("Error deleting user from class:", error);
    }
    try {
        const docSnap = await getDoc(memberClassRef);
        if (docSnap.exists()) {
            console.log("Document path:", memberClassRef.path);
            await deleteDoc(memberClassRef);
            console.log("User removed from class:", syntax);
        } else {
            console.error("User not found in class:", syntax);
        }
    } catch (error) {
        console.error("Error deleting user from class:", error);
    }
};

export async function leaveClass(syntax) {
    const auth = getAuth();
    const user = auth.currentUser;

    // User's class reference
    const userRef = doc(db, 'users', user.uid, 'classes', syntax);

    try {
        // Check if the class exists before trying to delete
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            console.log("Document path:", userRef.path);
            await deleteDoc(userRef);
            console.log("Class removed from Firestore:", syntax);
        } else {
            console.error("Class not found in Firestore:", syntax);
        }
    } catch (error) {
        console.error("Error deleting document from Firestore:", error);
    }

    // Class reference and member reference
    const classRef = doc(db, 'classes', syntax);
    const memberRef = doc(classRef, 'members', user.uid);

    try {
        // Check if the member document exists
        const docSnap = await getDoc(memberRef);
        if (docSnap.exists()) {
            console.log("Document path:", memberRef.path);
            console.log(docSnap)
            // Handle ownership transfer if the user is the owner
            if (docSnap.data().role === 'owner') {
                // Fetch all members of the class
                const members = await fetchMembers(syntax);

                // Filter admins from members
                const admins = members.filter(member => member.role === 'admin');

                if (admins.length === 0) {
                    // No admins available, assign a random member as the new owner
                    const randomIndex = Math.floor(Math.random() * members.length);
                    const newOwner = members[randomIndex];
                    await changeMemberRole(syntax, newOwner.id, 'owner');
                    console.log(`New owner assigned: ${newOwner.id}`);
                } else if (admins.length != 0) {
                    // Randomly assign an admin as the new owner
                    const randomIndex = Math.floor(Math.random() * admins.length);
                    const newOwner = admins[randomIndex];
                    await changeMemberRole(syntax, newOwner.id, 'owner');
                    console.log(`New owner assigned: ${newOwner.id}`);
                }
                else if (members.length === 1) {
                    // Randomly assign an admin as the new owner
                    await removeClass(syntax);
                }
            }

            // Remove the user from the class members collection
            await deleteDoc(memberRef);
            console.log("Member removed from class:", syntax);

            // Redirect if the user is leaving the currently viewed class
            const urlParams = new URLSearchParams(window.location.search);
            const pageSyntax = urlParams.get('syntax');
            if (pageSyntax === syntax) {
                window.location.href = `classes.html`;
            }
        } else {
            console.error("Member document not found in Firestore:", syntax);
        }
    } catch (error) {
        console.error("Error processing class membership:", error);
    }
}


export async function getUserClasses() {
    const user = await auth.currentUser;

    if (!user) {
        console.error('No user is currently signed in.');
        return [];
    }

    // Check if the data is already in sessionStorage
    const cachedClasses = sessionStorage.getItem(`userClasses-${user.uid}`);
    if (cachedClasses) {
        console.log('Returning user classes from sessionStorage');
        return JSON.parse(cachedClasses); // Return cached data if it exists
    }

    try {
        // Reference to the user's classes subcollection
        const userClassesRef = collection(db, 'users', user.uid, 'classes');
        const userClassesSnapshot = await getDocs(userClassesRef);

        // Log the snapshot size
        console.log(`User classes snapshot size: ${userClassesSnapshot.size}`);

        const classList = [];
        for (const docu of userClassesSnapshot.docs) {
            const classSyntax = docu.id;

            // Get class details
            const classRef = doc(db, 'classes', classSyntax);
            const classDoc = await getDoc(classRef);

            if (classDoc.exists()) {
                classList.push({
                    id: classSyntax,
                    ...classDoc.data()
                });
            } else {
                console.warn(`Class document does not exist for: ${classSyntax}`);
            }
        }

        if (classList.length === 0) {
            console.warn('No valid classes found.');
            sessionStorage.setItem(`userClasses-${user.uid}`, JSON.stringify("None")); // Store "None" in sessionStorage
            return "None";
        }

        // Store the class list in sessionStorage for future use
        sessionStorage.setItem(`userClasses-${user.uid}`, JSON.stringify(classList));

        return classList;
    } catch (error) {
        console.error('Error fetching user classes:', error);
        return [];
    }
}


export async function fetchClassPosts(syntax, alreadyFetchedPostIds = [], limitNumber) {
    const classPostsRef = collection(db, 'classes', syntax, 'posts'); // Reference to class posts subcollection
    const postsCollectionRef = collection(db, 'posts'); // Reference to the global posts collection

    try {
        // Step 1: Fetch the posts subcollection under the class to get the post IDs
        const classPostsQuery = query(classPostsRef, limit(limitNumber)); // Limit the number of posts to fetch
        const classPostsSnapshot = await getDocs(classPostsQuery);

        const postIds = [];

        // Filter out already fetched post IDs
        classPostsSnapshot.forEach((doc) => {
            if (!alreadyFetchedPostIds.includes(doc.id)) {
                postIds.push(doc.id);  // Collect only the post IDs that have not been fetched
            }
        });

        // Check if no new post IDs were found
        if (postIds.length === 0 && classPostsSnapshot.size >= limitNumber) {
            console.log('No new posts found for this class.', classPostsSnapshot.size >= limitNumber);
            return await fetchClassPosts(syntax, alreadyFetchedPostIds, limitNumber + 1);
        }

        // Step 2: Fetch the actual posts from the global 'posts' collection using the post IDs
        const posts = await Promise.all(postIds.map(async (postId) => {
            const postRef = doc(postsCollectionRef, postId);  // Reference to the post in the 'posts' collection
            const postDocSnapshot = await getDoc(postRef);
            if (postDocSnapshot.exists()) {
                return { id: postId, ...postDocSnapshot.data() }; // Return the post data if it exists
            } else {
                console.error(`Post with ID ${postId} does not exist in 'posts' collection`);
                return null; // Return null for nonexistent posts
            }
        }));

        // Filter out any null values (nonexistent posts)
        const validPosts = posts.filter(post => post !== null);

        // Sort posts by dateTime in ascending order (oldest to newest)
        validPosts.sort((a, b) => {
            // Convert dateTime strings to Date objects
            const dateA = new Date(a.dateTime);
            const dateB = new Date(b.dateTime);
            return dateA - dateB; // Sort in ascending order
        });

        console.log('Fetched new posts:', validPosts);

        // Update alreadyFetchedPostIds to include the IDs of newly fetched posts
        alreadyFetchedPostIds.push(...validPosts.map(post => post.id));

        return validPosts;
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

export async function displayUserClasses() {
    const user = auth.currentUser;
    const classListElement = document.getElementById('classList');

    if (!classListElement) {
        console.error('Element with ID "classList" not found.');
        return;
    }

    try {
        const userClasses = await getUserClasses();
        const currentDate = DateTime.now().toISODate();

        const priorityGroups = {
            available: [],
            grayedOut: [],
            noSchedule: []
        };

        const getDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Earth's radius in km
            const toRad = angle => (angle * Math.PI) / 180;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const updateDistance = (pfpElement, cls) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;
                    const classLat = cls.lat;
                    const classLon = cls.long;
                    
                    if (classLat && classLon) {
                        const distance = getDistance(userLat, userLon, classLat, classLon);
                        const distanceElement = pfpElement.querySelector('.distance-badge');
                        distanceElement.textContent = `${distance.toFixed(2)} km`;
                    }
                });
            }
        };

        for (const cls of userClasses) {
            try {
                const currentTime = DateTime.now().setZone(cls.timezone);
                const dayOfWeek = currentTime.toFormat('cccc');

                const startTimeKey = `timeIn${dayOfWeek}first`;
                const endTimeKey = `timeIn${dayOfWeek}last`;
                const hasSchedule = cls[startTimeKey] && cls[endTimeKey];

                let attendanceTaken = false;
                let timePassed = false;
                let isAvailable = false;
                let startTimeText = '';

                if (hasSchedule) {
                    const startTime = DateTime.fromFormat(cls[startTimeKey], 'HH:mm', { zone: cls.timezone });
                    const endTime = DateTime.fromFormat(cls[endTimeKey], 'HH:mm', { zone: cls.timezone });
                
                    const diffMinutes = startTime.diff(currentTime, 'minutes').minutes;
                
                    // Keep available if within 10 minutes before start or class is ongoing
                    isAvailable = (diffMinutes <= 10 && diffMinutes > 0) || (currentTime >= startTime && currentTime <= endTime);
                
                    startTimeText = `Starts at ${startTime.toFormat('HH:mm')}`;
                
                    if (currentTime > endTime) {
                        timePassed = true;
                    }
                
                    const attendanceDoc = await getDoc(doc(db, 'classes', cls.syntax, 'members', user.uid), { source: "cache" })
    .catch(() => getDoc(doc(db, 'classes', cls.syntax, 'members', user.uid), { source: "server" }));

const attendanceData = attendanceDoc.exists() && attendanceDoc.data().attendance ? attendanceDoc.data().attendance : {};

attendanceTaken = !!attendanceData[currentDate];

                }
                

                const listItem = document.createElement('li');
                listItem.classList.add('list-item');

                listItem.innerHTML = `
                    <div>
                        <div class="classPfp" style="background-color: ${cls.color};">
                            <span class="distance-badge">...</span>
                            ${cls.name[0]}
                        </div>
                        <p>${cls.name}</p>
                        <p id="uid">${cls.syntax}</p>
                        ${!hasSchedule ? '<p class="pp no-schedule"><i>Closed</i></p>' : ''}
                        ${attendanceTaken ? '<p class="pp attendance-taken"><i>Checked</i></p>' : ''}
                        ${timePassed ? '<p class="pp time-passed"><i>Closed</i></p>' : ''}
                        ${startTimeText ? `<p class="pp start-time">${startTimeText}</p>` : ''}
                    </div>
                `;

                if (!hasSchedule) {
                    listItem.classList.add('grayed-out');
                    priorityGroups.noSchedule.push(listItem);
                } else if (timePassed || attendanceTaken) {
                    listItem.classList.add('grayed-out');
                    priorityGroups.grayedOut.push(listItem);
                } else if (!isAvailable) {
                    listItem.classList.add('grayed-out');
                    priorityGroups.grayedOut.push(listItem);
                } else {
                    priorityGroups.available.push(listItem);
                }

                const pfpElement = listItem.querySelector('.classPfp');
                updateDistance(pfpElement, cls);
                setInterval(() => updateDistance(pfpElement, cls), 10000); // Update distance every 10 seconds

            } catch (error) {
                console.error(`Error processing class ${cls.syntax}:`, error);
            }
        }

        // Append items in priority order with animation
        const orderedClasses = [
            ...priorityGroups.available,
            ...priorityGroups.grayedOut,
            ...priorityGroups.noSchedule
        ];

        orderedClasses.forEach((listItem, index) => {
            setTimeout(() => classListElement.appendChild(listItem), 100 * index);
        });

    } catch (error) {
        console.error('Error fetching user classes:', error);
    }
}


export async function generateClassCode(syntax) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let isUnique = false;

    while (!isUnique) {
        // Generate a random 5-character code
        code = '';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check if the code is unique
        isUnique = await checkIfClassCodeUnique(code);
    }

    return code;
}

// Function to check if the class code is unique
async function checkIfClassCodeUnique(code) {
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, where('code', '==', code)); // Replace 'code' with the field name used for class codes

    try {
        const querySnapshot = await getDocs(q);
        // If any document is returned, the code is not unique
        return querySnapshot.empty;
    } catch (error) {
        console.error("Error checking class code uniqueness:", error);
        return false;
    }
}

export async function fetchClass(syntax, forceFetch = false) {
    try {
        // If brute force is enabled, skip sessionStorage and fetch from Firestore directly
        if (forceFetch) {
            console.log('Force fetching class from Firestore...');
            const classRef = doc(db, 'classes', syntax);
            const docSnap = await getDoc(classRef);
            if (docSnap.exists()) {
                const classdata = docSnap.data();
                console.log('Fetched classdata from Firestore:', classdata);
                return classdata;
            } else {
                console.log('No class found for syntax:', syntax);
                return null;
            }
        }

        // Check if the 'classes' array exists in sessionStorage
        let classes = JSON.parse(sessionStorage.getItem('classes')) || [];

        // Look for the class in sessionStorage
        const cachedClass = classes.find(classData => classData.syntax === syntax);
        if (cachedClass) {
            console.log('Class found in sessionStorage:', cachedClass);
            return cachedClass;
        }

        // If not found in sessionStorage, fetch it from Firestore
        const classRef = doc(db, 'classes', syntax);
        const docSnap = await getDoc(classRef);
        if (docSnap.exists()) {
            const classdata = docSnap.data();

            // Add the fetched class to the sessionStorage array
            classes.push({ syntax, ...classdata });
            sessionStorage.setItem('classes', JSON.stringify(classes));

            console.log('Fetched classdata from Firestore:', classdata);
            return classdata;
        } else {
            console.log('No class found for syntax:', syntax);
            return null;
        }
    } catch (error) {
        console.error('Error fetching class:', error);
        return null;
    }
}



export async function fetchMembers(syntax) {
    const classRef = doc(db, 'classes', syntax);
    const membersRef = collection(classRef, 'members');

    try {
        const querySnapshot = await getDocs(membersRef);
        const members = [];
        querySnapshot.forEach((doc) => {
            members.push({ id: doc.id, ...doc.data() });
        });

        // Sort members by role, admins first
        members.sort((a, b) => {
            // Define role priorities
            const rolePriority = {
                'owner': 1,
                'admin': 2,
                'member': 3 // Adjust as necessary for other roles
            };

            // Get the priority for each role
            const priorityA = rolePriority[a.role] || Infinity; // Default to Infinity if role is unknown
            const priorityB = rolePriority[b.role] || Infinity; // Default to Infinity if role is unknown

            // Sort based on priority
            return priorityA - priorityB;
        });


        //console.log('Fetched members:', members);
        return members;
    } catch (error) {
        console.error('Error fetching members:', error);
        return [];
    }
}

export async function fetchMember(syntax, id) {
    const classRef = doc(db, 'classes', syntax);
    const memberRef = doc(classRef, 'members', id); // Corrected line

    try {
        const docSnap = await getDoc(memberRef);
        if (docSnap.exists()) {
            const memberData = docSnap.data();
            //console.log('Fetched member data:', memberData);
            return memberData; // Return the member data
        } else {
            console.log('No member found for syntax:', syntax);
            return null; // Return null if no document is found
        }
    } catch (error) {
        console.error('Error fetching member:', error);
        return null; // Return null if there's an error
    }
}

export async function changeMemberRole(syntax, id, newRole) {
    const classRef = doc(db, 'classes', syntax);
    const memberRef = doc(classRef, 'members', id); // Reference to the member's document

    try {
        // Update the role in the member's document
        await updateDoc(memberRef, {
            role: newRole
        });
        console.log(`Member role updated to ${newRole} for user ID: ${id}`);
        return true; // Return true if the update was successful
    } catch (error) {
        console.error('Error updating member role:', error);
        return false; // Return false if there's an error
    }
}

export async function getCurrentUser() {
    const user = currentUser;
    return user;
}

async function findClassByCode(classCode) {
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, where('code', '==', classCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null; // No class found with the given code
    }

    return querySnapshot.docs[0].data(); // Return the first matching class
}

export async function joinClassByCode(classCode, user) {
    try {
        const classData = await findClassByCode(classCode);

        if (!classData) {
            basicNotif("Class code invalid", `${classCode} is not a valid code please try again`, 5000);
            return;
        }

        const syntax = classData.syntax; // Assuming class ID is stored in classData
        const classRef = doc(db, 'classes', syntax)
        // Add user to class members
        const userClassesRef = collection(db, 'users', user.uid, 'classes');
        const memberDocRef = collection(classRef, 'members');
        const memberdata = await fetchMember(syntax, user.uid)
        if (memberdata) {
            await setDoc(doc(userClassesRef, syntax), {
                syntax: syntax
            });
            window.location.href = `class.html?syntax=${syntax}`;
            // Optionally, update the list of member IDs in the class document
            await setDoc(doc(memberDocRef, user.uid), {
                role: memberdata.role,
            });
        } else {
            await setDoc(doc(userClassesRef, syntax), {
                syntax: syntax
            });
            window.location.href = `class.html?syntax=${syntax}`;
            // Optionally, update the list of member IDs in the class document
            await setDoc(doc(memberDocRef, user.uid), {
                role: 'student',
            });
        }
        // Adds class to members classes


    } catch (error) {
        console.error('Error joining class:', error);
    }

}

export async function getAttendance(syntax, timezone, id) {
    try {
        // Fetch the class data
        const classdata = await fetchClass(syntax);
        const currentDate = DateTime.now().toISODate(); // 'YYYY-MM-DD' format
        const currentTime = DateTime.now().setZone(timezone); // Get current time in the specified timezone

        // Define the document path for the attendance record
        const attendanceDoc = doc(db, 'classes', syntax, 'members', id || currentUser.uid);

        const docSnapshot = await getDoc(attendanceDoc);
        const existingAttendance = docSnapshot.exists() ? docSnapshot.data().attendance || {} : {};

        // Check if there's attendance data for today
        if (existingAttendance[currentDate]) {
            const status = existingAttendance[currentDate].status || "Absent"; // Default to "Absent" if no status
            const timeChecked = existingAttendance[currentDate].timeChecked || null;

            return {
                status,
                time: timeChecked
            };
        } else {
            return { status: "Absent", time: null }; // No attendance data for today
        }

    } catch (error) {
        console.error('Error checking attendance:', error);
        throw error;
    }
}

export async function showNotification(title, body) {
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            registration.showNotification(title, {
                body: body,
                icon: '../Images/logo.png', // Replace with your actual icon path
                vibrate: [200, 100, 200],
                tag: 'attendance-notification'
            });
        } else {
            console.warn('No service worker registration found.');
        }
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}


export async function checkAttendance(syntax, timezone, id) {
    try {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                }
            });
        }
        
        const classdata = await fetchClass(syntax);
        console.log('Class Data:', classdata); // Debugging log

        const currentDate = DateTime.now().toISODate();
        const attendanceDoc = doc(db, 'classes', syntax, 'members', id || currentUser.uid);

        const currentTime = DateTime.now().setZone(timezone);
        const dayOfWeek = currentTime.toFormat('cccc'); // Get the full name of the day (e.g., Monday)

        // Construct field names dynamically based on the day
        const startTimeKey = `timeIn${dayOfWeek}first`;
        const endTimeKey = `timeIn${dayOfWeek}last`;

        const startTimeStr = classdata[startTimeKey]; // e.g., "08:00"
        const endTimeStr = classdata[endTimeKey]; // e.g., "14:00"

        // Validate if times are set for the current day
        if (!startTimeStr || !endTimeStr) {
            console.warn(`No class times set for ${dayOfWeek}`);
            return { error: `No class times set for ${dayOfWeek}` };
        }

        // Convert class times to DateTime objects
        const startTime = DateTime.fromFormat(startTimeStr, 'HH:mm', { zone: timezone });
        const endTime = DateTime.fromFormat(endTimeStr, 'HH:mm', { zone: timezone });

        // Fetch existing attendance document
        const docSnapshot = await getDoc(attendanceDoc);
        const existingAttendance = docSnapshot.exists() ? docSnapshot.data().attendance || {} : {};
        if (existingAttendance[currentDate] && existingAttendance[currentDate].status !== 'absent') {
            console.warn(`Attendance already marked as ${existingAttendance[currentDate].status} at ${existingAttendance[currentDate].timeChecked}`);
            return {
                status: existingAttendance[currentDate].status,
                time: existingAttendance[currentDate].timeChecked,
                message: 'Attendance already marked for today.'
            };
        }
        // Prepare updated attendance object
        const updatedAttendance = {
            ...existingAttendance,
            [currentDate]: existingAttendance[currentDate] || { status: 'absent', timeChecked: null }
        };

        // Check attendance based on the current time
        if (currentTime >= startTime.minus({ minutes: 10 }) && currentTime <= endTime) {
            if (currentTime < startTime) {
                updatedAttendance[currentDate].status = 'present';
                showNotification('Attendance Marked', `You are marked present. Class starts at ${startTime.toFormat('HH:mm')}`);
            } else if (currentTime >= startTime.plus({ minutes: 1 })) {
                updatedAttendance[currentDate].status = 'late';
                showNotification('Attendance Marked', `You are marked late. Class started at ${startTime.toFormat('HH:mm')}`);
            } else {
                updatedAttendance[currentDate].status = 'present';
                showNotification('Attendance Marked', `You are marked present right on time!`);
            }
            updatedAttendance[currentDate].timeChecked = currentTime.toFormat('HH:mm');
        } else {
            // If current time is outside the acceptable window
            console.warn(`Current time is outside the scheduled class time for ${dayOfWeek}`);
        }


        // Save the updated attendance
        await setDoc(attendanceDoc, { attendance: updatedAttendance }, { merge: true });

        return {
            status: updatedAttendance[currentDate].status,
            time: updatedAttendance[currentDate].timeChecked
        };
    } catch (error) {
        console.error("Error checking attendance:", error);
        throw error;
    }
}

export async function markAbsent(syntax, id) {
    try {
        const attendanceDoc = doc(db, 'classes', syntax, 'members', id || currentUser.uid);

        const currentDate = DateTime.now().toISODate(); // Get current date in 'YYYY-MM-DD' format
        const docSnapshot = await getDoc(attendanceDoc);
        const existingAttendance = docSnapshot.exists() ? docSnapshot.data().attendance || {} : {};

        const currentAttendance = existingAttendance[currentDate] || {};

        // If attendance for today already exists and is not "absent," retain it
        const status = currentAttendance.status && currentAttendance.status !== 'absent'
            ? currentAttendance.status
            : 'absent';

        const timeChecked = status === 'absent' ? null : currentAttendance.timeChecked || null;

        const updatedAttendance = {
            ...existingAttendance,
            [currentDate]: {
                status,
                timeChecked
            }
        };

        // Save the updated attendance
        await setDoc(attendanceDoc, { attendance: updatedAttendance }, { merge: true });

        return updatedAttendance[currentDate];
    } catch (error) {
        console.error('Error marking attendance as absent:', error);
        throw error;
    }
}


export async function deleteAllAttendanceRecords(classTimezone, classId) {
    try {
        let ownerEmail;
        const currentDateTime = DateTime.now().setZone(classTimezone);
        const today = currentDateTime.weekday;

        const emailFlagDoc = doc(db, 'weeklyEmailSent', classId);
        const emailFlagSnapshot = await getDoc(emailFlagDoc);

        if (today !== 7) {
            deleteDoc(emailFlagDoc);
            return;
        }

        if (emailFlagSnapshot.exists() && emailFlagSnapshot.data().lastSentDate === currentDateTime.toISODate()) {
            return;
        }

        const deletedData = [];

        const membersSnapshot = await getDocs(collection(db, 'classes', classId, 'members'));
        for (const memberDoc of membersSnapshot.docs) {
            const memberData = memberDoc.data();
            const memberProfile = await fetchProfile(memberDoc.id);
            const attendance = memberData.attendance || {};
            if (memberData.role === "owner") {
                ownerEmail = memberProfile.email;
            }

            const memberName = memberProfile.displayName || 'Unknown';
            deletedData.push({ classId, memberName, attendance });

            await updateDoc(memberDoc.ref, { attendance: deleteField() });
        }

        if (deletedData.length > 0 && ownerEmail) {
            const weekdays = Array.from({ length: 7 }, (_, index) => {
                const date = currentDateTime.startOf('week').plus({ days: index });
                return `${date.toFormat('EEEE, MMMM dd')}`;
            });
            const classdata = await fetchClass(classId);

            const members = deletedData.map(data => {
                const { memberName, attendance } = data;
                return {
                    name: memberName,
                    days: weekdays.map((day, index) => {
                        const date = DateTime.now().setZone(classTimezone).startOf('week').plus({ days: index }).toISODate(); // Get the date for the specific day
                        const status = attendance[date]?.status || 'absent';
                        const timeChecked = attendance[date]?.timeChecked || '';
                        const color = status === 'present' ? 'green' : status === 'late' ? 'purple' : 'red';
                        return { status, timeChecked, color };
                    })
                };
            });

            const emailParams = {
                owner_email: ownerEmail,
                className: classdata.name,
                weekdays: weekdays,
                members: members
            };

            console.log(emailParams);

            await emailjs.send("service_p3ddhzv", "template_3n5ewnh", emailParams)
                .then(() => {
                    return setDoc(emailFlagDoc, { lastSentDate: currentDateTime.toISODate() });
                })
                .catch(error => {

                });
        }

    } catch (error) {

    }
}

const emailjsScript = document.createElement('script');
emailjsScript.src = 'https://cdn.emailjs.com/dist/email.min.js';
document.head.appendChild(emailjsScript);

let emailjsInitialized = false;

emailjsScript.onload = function () {
    emailjs.init('BYrDpkwjPv2ZItQov');
    emailjsInitialized = true;
};

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
};

export async function emailTagged(taggedemail, classroomname, user, desc, href) {

    const emailParams = {
        tagged_email: taggedemail,
        classroomName: classroomname,
        poster: user,
        desc: desc,
        href: href
    };

    console.log(emailParams);

    await emailjs.send("service_p3ddhzv", "template_0zh42va", emailParams)
};

export async function postPost(email, img, currentDate, currentTime, description, syntax, postSyntax, userid) {
    // Generate a unique post syntax or ID


    // Create a reference to the document
    const postDocRef = doc(db, 'posts', postSyntax);
    if (syntax) {
        const postDocRefClass = doc(db, 'classes', syntax, 'posts', postSyntax);
        await setDoc(postDocRefClass, {
            userid: userid,
        }, { merge: true })
    }

    // Create a timestamp combining date and time
    const dateTime = `${currentDate} ${currentTime}`;

    const imgUrl = await uploadImageToStorage(img, syntax, postSyntax)

    try {
        // Save the data to Firestore
        await setDoc(postDocRef, {
            email: email,
            image: imgUrl, // Image URL or base64 encoded image
            description: description, // The description entered by the user
            dateTime: dateTime,
            userid: userid,
            syntax: syntax || 'None',
            likes: 0
        }, { merge: true })
        console.log('Post successfully saved!');
    } catch (error) {
        console.error('Error saving post:', error);
    }
}

export async function deletePost(postId, syntax) {
    try {
        const postDocRef = doc(db, 'posts', postId);
        const postSnapshot = await getDoc(postDocRef);

        // Check if the post exists
        if (!postSnapshot.exists()) {
            console.error(`Post with ID ${postId} does not exist.`);
            return;
        }

        // Retrieve the syntax from the post document data
        const postData = postSnapshot.data();
        const syntax = postData.syntax; // Assuming 'syntax' is a field in your post document

        const commentsCollectionRef = collection(postDocRef, 'comments'); // Reference to comments subcollection

        // Fetch all comments for the post
        const commentsSnapshot = await getDocs(commentsCollectionRef);
        const deletePromises = [];

        // Loop through and delete each comment
        commentsSnapshot.forEach((commentDoc) => {
            const commentDocRef = doc(db, 'posts', postId, 'comments', commentDoc.id);
            deletePromises.push(deleteDoc(commentDocRef));
        });

        // Wait for all comments to be deleted
        await Promise.all(deletePromises);
        console.log('Comments deleted successfully from Firestore');

        // Delete the post document after deleting comments
        await deleteDoc(postDocRef);
        console.log('Post document deleted successfully from Firestore');

        // Now delete the post from the class's posts subcollection
        const classPostRef = doc(db, 'classes', syntax, 'posts', postId); // Reference to the specific post in the class's subcollection
        await deleteDoc(classPostRef);
        console.log(`Post document deleted successfully from class ${syntax}`);
        const storage = getStorage();
        const imgRef = ref(storage, 'images/posts/' + postId); // Unique path
        await deleteObject(imgRef);
        console.log('Image deleted successfully from Firebase Storage');
        // Optionally, remove the post item from the DOM
        const postItem = document.getElementById(postId);
        if (postItem) {
            postItem.remove();
        }
    } catch (error) {
        console.error('Error deleting post and comments:', error);
    }
}

async function uploadImageToStorage(base64Image, syntax, postSyntax) {
    const storage = getStorage();
    const storageRef = ref(storage, 'images/posts/' + postSyntax); // Unique path
    await uploadString(storageRef, base64Image, 'data_url'); // Upload base64 string
    const downloadURL = await getDownloadURL(storageRef); // Get URL
    return downloadURL;
}

export async function sendCommentToPost(postId, userId, comment) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const commentRef = collection(db, 'posts', postId, 'comments');
    const currentDate = new Date().toLocaleDateString('en-US', options);
    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // Ensures AM/PM format
    });
    await addDoc(commentRef, {
        userId: userId,
        comment: comment,
        timestamp: `${currentDate} ${currentTime}`,
    });
    displayComments(postId);
}

export async function fetchComments(postId) {
    try {
        // Reference to the comments subcollection of the specified post
        const commentsRef = collection(db, 'posts', postId, 'comments');

        // Get the comments documents
        const commentSnapshot = await getDocs(commentsRef);

        // Extract comments from the snapshot
        const comments = commentSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(), // Spread the document data
        }));

        return comments;
    } catch (error) {
        console.error('Error fetching comments:', error);
        return []; // Return an empty array in case of an error
    }
};

export async function displayComments(postId) {
    const commentsContainer = document.getElementById(`commentsContainer${postId}`);
    commentsContainer.innerHTML = ''; // Clear previous comments

    try {
        const comments = await fetchComments(postId); // Fetch comments from the database

        for (const comment of comments) {
            const user = await fetchProfile(comment.userId); // Fetch user profile using userId
            const currentUser = await getCurrentUser();
            const commentElement = document.createElement('div');
            commentElement.classList.add('commentBlock');

            // Format the timestamp using your existing function
            const timeDisplay = formatTimeDifference(comment.timestamp); // Use existing formatTimeDifference function

            // Check if the current user has liked the comment
            const hasLiked = comment.userlikes && comment.userlikes.includes(currentUser.uid);

            // Create the structure for displaying comment
            commentElement.innerHTML = `
            <input style="display:none;" class="like" type="checkbox" id="like${comment.id}" ${hasLiked ? 'checked' : ''}>
            <div>
                <img class="commentPfp" src="${user.photoUrl}" alt="User Photo">
                <div>
                    <p>${user.displayName}</p>
                    <p class="commentBody">${comment.comment}</p>
                    <p class="timestamp">${timeDisplay} <label for="postOptionstoggle${comment.id}"><i class="fa-solid fa-ellipsis"></i></label></p>
                </div>
            </div>
            <label id="heartUncheck" for="like${comment.id}"><i class="fa-regular fa-heart"></i></label>
            <label id="heartCheck" for="like${comment.id}"><i class="fa-solid fa-heart"></i></label>
            <input class="option" type="checkbox" id="postOptionstoggle${comment.id}">
            <div id="postOptions">
            ${comment.userId === currentUser.uid ?
                    `<button class="postOptionButton" id="deleteComment" data-comment-id="${comment.id}">Delete Comment <i class="fa-solid fa-trash"></i></button>` :
                    ''}
            </div>
            `;

            commentsContainer.appendChild(commentElement);

            // Add event listener for like toggle
            const likeCheckbox = commentElement.querySelector(`#like${comment.id}`);
            const heartUncheck = commentElement.querySelector('#heartUncheck');
            const heartCheck = commentElement.querySelector('#heartCheck');
            const likestxt = commentElement.querySelector('.like-count'); // If you want to display like count

            likeCheckbox.addEventListener('change', async () => {
                if (likeCheckbox.checked) {
                    // Update like count UI
                    heartUncheck.style.display = 'none';
                    heartCheck.style.display = 'inline-block';
                    await addToLikedComment(currentUser.uid, comment.id, postId); // Add like to comment
                } else {
                    heartUncheck.style.display = 'inline-block';
                    heartCheck.style.display = 'none';
                    await removeFromLikedComment(currentUser.uid, comment.id, postId); // Remove like from comment
                }
            });
        }

        // Add event listeners for comment deletion
        const deleteButtons = commentsContainer.querySelectorAll('#deleteComment');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const commentId = button.dataset.commentId;
                await deleteComment(commentId, postId);
                await displayComments(postId); // Refresh comments after deletion
            });
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
    }
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

async function deleteComment(commentId, postId) {
    try {
        // Your logic to delete the comment from the database
        const commentRef = doc(db, 'posts', postId, 'comments', commentId); // Reference to the specific comment
        await deleteDoc(commentRef);// Implement this function to handle the deletion
        console.log(`Comment ${commentId} deleted successfully.`);
    } catch (error) {
        console.error('Error deleting comment:', error);
    }
}

export async function generateAttendanceCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let isUnique = false;

    while (!isUnique) {
        // Generate a random 5-character code
        code = '';
        for (let i = 0; i < 3; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check if the code is unique
        isUnique = await checkIfAttendanceCodeUnique(code);
    }

    return code;
}

// Function to check if the class code is unique
async function checkIfAttendanceCodeUnique(code) {
    const attref = collection(db, 'quickAttendance');
    const q = query(attref, where('code', '==', code)); // Replace 'code' with the field name used for class codes

    try {
        const querySnapshot = await getDocs(q);
        // If any document is returned, the code is not unique
        return querySnapshot.empty;
    } catch (error) {
        console.error("Error checking class code uniqueness:", error);
        return false;
    }
}

async function createqA(code) {
    try {
        basicNotif("Created Quick Attendance", "", 5000);

        const docRef = doc(db, 'quickAttendance', code); // Create a reference with the desired ID
        await setDoc(docRef, {
            code: code,
            attendees: [] // Empty array to hold attendee IDs
        });

        console.log(`Quick Attendance created with code: ${code}`);
        return { success: true, message: `Quick Attendance created successfully.` };
    } catch (error) {
        console.error("Error creating Quick Attendance:", error);
        return { success: false, message: 'Failed to create Quick Attendance.' };
    }
}

async function deleteAttendanceDoc(code) {
    try {
        const docRef = doc(db, 'quickAttendance', code); // Reference to the document
        await deleteDoc(docRef); // Deletes the document
        console.log(`Document with ID: ${code} deleted successfully.`);
        return { success: true, message: `Document with ID: ${code} deleted successfully.` };
    } catch (error) {
        console.error("Error deleting document:", error);
        return { success: false, message: 'Failed to delete the document.' };
    }
}

async function addUserToAttendance(code, user) {
    try {
        const docRef = doc(db, 'quickAttendance', code); // Reference to the attendance document
        const docSnap = await getDoc(docRef); // Fetch the document

        if (!docSnap.exists()) {
            basicNotif("Code doesn't exist", "Please check again", 5000);
            return { success: false, message: 'Attendance code does not exist.' };
        }

        const attendanceData = docSnap.data(); // Get the document data
        const attendees = attendanceData.attendees || []; // Get the attendees array

        // Check if the user is already in the attendees list
        if (attendees.includes(user)) {
            basicNotif("User already added", "This user is already in the attendees list.", 5000);
            return { success: false, message: 'User already added to attendees.' };
        }

        // If the user is not in the list, add them to the attendees array
        basicNotif("User added", "This user added in the attendees list.", 5000);
        await updateDoc(docRef, {
            attendees: arrayUnion(user) // Adds the userId to the attendees array
        });
        console.log(`User ${user} added to attendees for document ID: ${code}`);
        return { success: true, message: 'User added successfully.' };
    } catch (error) {
        console.error("Error adding user to attendees:", error);
        return { success: false, message: 'Failed to add user to attendees.' };
    }
}


// Function to send an email with the list of attendees
export async function emailresults(email, code) {
    try {
        // Reference to the quickAttendance document based on the provided code
        const attRef = doc(db, 'quickAttendance', code);
        const docSnap = await getDoc(attRef);

        if (!docSnap.exists()) {
            console.error(`No attendance found for code: ${code}`);
            return;
        }

        // Get the list of attendees from the document
        const attendees = docSnap.data().attendees;

        if (attendees && attendees.length > 0) {
            // Format the list of attendees into a string (e.g., names separated by commas)

            // Email parameters
            const emailParams = {
                owner_email: email,
                attendees: attendees,
            };

            console.log("Sending email with the following parameters:", emailParams);

            // Send email using EmailJS
            const result = await emailjs.send("service_p3ddhzv", "template_3n5ewnh", emailParams);
            basicNotif("Email sent", "Attendance was taken", 5000)
            console.log("Email sent successfully:", result);
        } else {
            basicNotif("No attendees", "0 attendance was taken", 5000);
            console.log("No attendees found for this code.");
        }
    } catch (error) {
        console.error("Error fetching attendees or sending email:", error);
    }
}
