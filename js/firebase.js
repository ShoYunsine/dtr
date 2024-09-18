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
    deleteField
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
const db = getFirestore(app);
let currentUser;

export { db }

setPersistence(auth, browserLocalPersistence)
    .then(() => {
        return signInWithEmailAndPassword(auth, email, password), signInWithPopup(auth, provider);
    })
    .catch((error) => {
    });

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user
        if (typeof on_index != 'undefined') {
            const currentUser = await getCurrentUser(); // Fetch the current user's email
            const userClasses = await getUserClasses(); // Fetch the user's classes

            // Loop through each class
            for (const classData of userClasses) {
                const syntax = classData.syntax;  // Assuming `syntax` is a property of each class

                // Fetch posts for the current class
                const classPosts = await fetchClassPosts(syntax);

                // Loop through each post and render it
                classPosts.forEach(post => {
                    const { email, image, dateTime, description } = post;
                    async function createPostItem(email, img, dateTime, description, currentUserEmail, postId, userid) {
                        const user = await getCurrentUser();
                        const currentMemberData = await fetchMember(syntax, user.uid);
                        const userdata = await fetchProfile(userid);
                        const posts = document.getElementById('posts');
                        const template = document.createElement('li');
                        template.id = 'post';
                        template.innerHTML = `
                            <div id="postHeader">
                                <div>
                                    <img class="img" src="${userdata.photoUrl}">
                                    <p>${userdata.displayName}</p>
                                </div>
                                <label for="postOptionstoggle${postId}"><i class="fa-solid fa-ellipsis-vertical"></i></label>
                            </div>
                            <input class="like" type="checkbox" id="like${postId}">
                            <img src="${img}" alt="Post Image">
                            <div id="postButtons">
                                <label id="heartUncheck" for="like${postId}"><i class="fa-regular fa-heart"></i></label>
                                <label id="heartCheck" for="like${postId}"><i class="fa-solid fa-heart"></i></label>
                            </div>
                            <p id="desc">${description}</p>
                            <p>${dateTime}</p>
                            <input class="option" type="checkbox" id="postOptionstoggle${postId}">
                            <div id="postOptions">
                                ${email === currentUserEmail || currentMemberData.role === 'owner' || currentMemberData.role === 'admin' ?
                                `<button class="postOptionButton" id="deletePost" data-post-id="${postId}">Delete Post <i class="fa-solid fa-trash"></i></button>` :
                                ''}
                            </div>
                        `;

                        posts.appendChild(template);

                        const likeCheckbox = template.querySelector(`#like${postId}`);

                        // Check if the post is liked by the current user on page load
                        const userLikes = await fetchUserLikes(user.uid);
                        if (userLikes.includes(postId)) {
                            likeCheckbox.checked = true;
                        }

                        // Toggle like status on checkbox change
                        likeCheckbox.addEventListener('change', async () => {
                            if (likeCheckbox.checked) {
                                await addToLikedPosts(user.uid, postId); // Add post to user's liked posts
                            } else {
                                await removeFromLikedPosts(user.uid, postId); // Remove post from user's liked posts
                            }
                        });

                        template.querySelector('#deletePost').addEventListener('click', async (event) => {
                            const postId = event.target.getAttribute('data-post-id');
                            await deletePost(syntax, postId); // Add deletePost function to remove the post
                            cancelFunction(template);
                        });
                    }
                    function cancelFunction(template) {
                        // Remove the template from the DOM
                        template.remove();
                    }
                    // Call the createPostItem function for each post
                    createPostItem(email, image, dateTime, description, currentUser.email, post.id, post.userid);
                });
            }

        }

        if (typeof on_login == 'undefined') {
            basicNotif("Logged in", `Welcome ${user.displayName}`, 5000);
            displayUserClasses();
            updateProfile(user.displayName, user.email, user.uid, user.photoURL);
            const qrcode = `${user.uid}`
            const parts = qrcode.split('/');
            console.log(parts);
            console.log(qrcode);
            generateQRCode(qrcode);
            document.getElementById('signout').addEventListener('click', async function (event) {
                signOutAccount();
            });

            document.getElementById('faceForm').addEventListener('submit', async function (event) {
                event.preventDefault(); // Prevent the default form submission

                console.log('Form submitted'); // Check if form submission is captured

                try {
                    const fileInput = document.getElementById('imageUpload');
                    const file = fileInput.files[0];

                    if (!file) {
                        console.log('No file selected.');
                        return;
                    }

                    console.log('File selected:', file); // Log selected file

                    const detections = await facerecognition.handleImageUpload(file);
                    const descriptors = detections.map(detection => Array.from(detection.descriptor)); // Convert Float32Array to Array
                    saveDescriptorsToFirebase(descriptors);
                    console.log('Returned Detections:', detections);
                    console.log('Returned Descriptors:', descriptors);
                    // Do something with the detections, like processing or displaying them
                } catch (error) {
                    console.error('Error during image upload and processing:', error);
                }
            });


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

            const classSearchInput = document.getElementById('classSearch');
            const classList = document.getElementById('classList');
            let items = Array.from(classList.getElementsByClassName('list-item'));

            const filterClasses = () => {
                const searchTerm = classSearchInput.value.toLowerCase();
                console.log('Search term:', searchTerm);
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
        }
        const account = document.getElementById('account');
        account.innerHTML = `<img id="accountImg" src="${user.photoURL || 'Images/gear.png'}"></img>`;
    } else {
        if (typeof on_login == 'undefined') {
            window.location.href = `login.html`;
        }
    }
});

// Fetch the list of liked post IDs for a user
export async function fetchUserLikes(userId) {
    const userLikesRef = collection(db, 'users', userId, 'likedPosts');
    const userLikesSnapshot = await getDocs(userLikesRef);
    return userLikesSnapshot.docs.map(doc => doc.id);
}

// Add a post to the user's liked posts
export async function addToLikedPosts(userId, postId) {
    const userLikesRef = doc(db, 'users', userId, 'likedPosts', postId);
    await setDoc(userLikesRef, { postId }); // Store an empty document with the postId as a reference
}

// Remove a post from the user's liked posts
export async function removeFromLikedPosts(userId, postId) {
    const userLikesRef = doc(db, 'users', userId, 'likedPosts', postId);
    await deleteDoc(userLikesRef);
}


function downloadQRCode() {
    const canvas = document.getElementById('qrcode');
    if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'qrcode.png';
        link.click();
    } else {
        console.error('QR code canvas not found.');
    }
}

function checkpasswordlength(password) {
    if (password.length >= 8) {
        return true
    }
}

async function updateProfile(displayName, email, uid, photoUrl) {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
        displayName: displayName || 'Anonymous',
        email: email,
        uid: uid,
        photoUrl: photoUrl || 'None'
    }, { merge: true })
        .then(() => {
            console.log('Profile updated successfully');
        })
        .catch((error) => {
            console.error('Error updating profile:', error);
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
    const warning = document.getElementById('warning')
    const warningtxt = document.getElementById('warningtext')
    const displayName = document.getElementById('signUpUsername').value;
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    const confirmpassword = document.getElementById('signUpPasswordConfirm').value;
    if (checkpasswordlength(password) == true) {
        if (confirmpassword == password) {
            warning.style.display = "none";
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    updateProfile(displayName, email, user.uid, user.photoURL);
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                });
        } else {
            warning.style.display = "flex";
            warningtxt.innerHTML = "Passwords do not match"
        }
    } else {
        warning.style.display = "flex";
        warningtxt.innerHTML = "Password need to be 8 characters long"
    }
}

export async function loginWithEmail() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
        });
}

export async function loginWithGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
            updateProfile(user.displayName, user.email, user.uid);
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

export async function fetchProfile(userid) {
    const userDocRef = doc(db, 'users', userid);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const user = docSnap.data();
            console.log('Fetched profile:', user);
            return user;
        } else {
            console.log('No profile found for user ID:', userid);
        }
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

export async function addClass(className, schoolName, syntax, classcode, timeIn, lat, long, rad, timezone) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        console.error('No user is authenticated.');
        return;
    }

    try {
        const classRef = doc(db, 'classes', syntax);

        await setDoc(classRef, {
            name: className,
            school: schoolName,
            syntax: syntax,
            code: classcode,
            timeIn: timeIn,
            lat: lat,
            long: long,
            rad: rad,
            timezone: timezone
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
    const classRef = doc(db, 'classes', syntax);
    const memberRef = doc(classRef, 'members', user.uid);
    try {
        // Check if the class exists before trying to delete
        const docSnap = await getDoc(memberRef);
        if (docSnap.exists()) {
            console.log("Document path:", userRef.path);
            await deleteDoc(memberRef);
            console.log("Class removed from Firestore:", syntax);
            const urlParams = new URLSearchParams(window.location.search);
            const pagesyntax = urlParams.get('syntax');
            console.log(pagesyntax === syntax)
            if (pagesyntax) {
                if (pagesyntax === syntax) {
                    window.location.href = `classes.html`;
                }
            }
        } else {
            console.error("Class not found in Firestore:", syntax);
        }
    } catch (error) {
        console.error("Error deleting document from Firestore:", error);
    }

}

export async function getUserClasses() {
    const user = auth.currentUser;

    if (!user) {
        console.error('No user is currently signed in.');
        return [];
    }

    try {
        // Reference to the user's classes subcollection
        const userClassesRef = collection(db, 'users', user.uid, 'classes');
        const userClassesSnapshot = await getDocs(userClassesRef);

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
            }
        }

        return classList;
    } catch (error) {
        console.error('Error fetching user classes:', error);
        return [];
    }
}

export async function fetchClassPosts(syntax) {
    const classPostsRef = collection(db, 'classes', syntax, 'posts'); // Reference to class posts subcollection
    const postsCollectionRef = collection(db, 'posts'); // Reference to the global posts collection

    try {
        // Step 1: Fetch the posts subcollection under the class to get the post IDs
        const classPostsSnapshot = await getDocs(classPostsRef);
        const postIds = [];

        classPostsSnapshot.forEach((doc) => {
            postIds.push(doc.id);  // Assuming the ID of each document in the class post subcollection is the post ID
        });

        if (postIds.length === 0) {
            console.log('No posts found for this class.');
            return [];
        }

        // Step 2: Fetch the actual posts from the global 'posts' collection using the post IDs
        const posts = [];
        for (const postId of postIds) {
            const postRef = doc(postsCollectionRef, postId);  // Reference to the post in the 'posts' collection
            const postDocSnapshot = await getDoc(postRef);
            if (postDocSnapshot.exists()) {
                posts.push({ id: postId, ...postDocSnapshot.data() });
            } else {
                console.error(`Post with ID ${postId} does not exist in 'posts' collection`);
            }
        }

        // Sort posts by dateTime in descending order (newest to oldest)
        posts.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

        console.log('Fetched posts:', posts);
        return posts;
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

    // Clear existing content
    classListElement.innerHTML = '';

    // Create and append skeleton loaders
    const skeletonCount = 1; // Number of skeleton items to display
    for (let i = 0; i < skeletonCount; i++) {
        const skeletonItem = document.createElement('div');
        skeletonItem.classList.add('skeleton');
        classListElement.appendChild(skeletonItem);
    }

    try {
        const userClasses = await getUserClasses();

        // Remove skeleton loaders once the data is ready
        classListElement.innerHTML = '';

        // Add each class to the list
        for (const classItem of userClasses) {
            try {
                const currentmember = await fetchMember(classItem.syntax, user.uid);

                const listItem = document.createElement('li');
                listItem.classList.add('list-item');
                listItem.innerHTML = `
                    <div>
                        <h3>${classItem.name}</h3>
                        <p>School: ${classItem.school}</p>
                        <p id="uid">${classItem.id}</p>
                    </div>
                    ${currentmember.role === 'owner' ? '<button class="remove-btn"><i id="i" class="fa-solid fa-square-minus"></i> Remove</button>' : ''}
                    ${currentmember.role === 'admin' || currentmember.role === 'student' ? '<button class="leave-btn"><i id="i" class="fa-solid fa-arrow-right-from-bracket"></i> Leave</button>' : ''}
                `;

                // Append with a slight delay for each item for a staggered effect
                setTimeout(() => {
                    classListElement.appendChild(listItem);
                }, 100 * userClasses.indexOf(classItem));

            } catch (error) {
                console.error(`Error fetching member data for class ${classItem.syntax}:`, error);
            }
        }
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

export async function fetchClass(syntax) {
    // Correctly create a reference to the class document
    const classRef = doc(db, 'classes', syntax);
    try {
        const docSnap = await getDoc(classRef);
        if (docSnap.exists()) {
            const classdata = docSnap.data();
            console.log('Fetched classdata:', classdata);
            return classdata; // Return the class data
        } else {
            console.log('No class found for syntax:', syntax);
            return null; // Return null if no document is found
        }
    } catch (error) {
        console.error('Error fetching class:', error);
        return null; // Return null if there's an error
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


        console.log('Fetched members:', members);
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
            console.log('Fetched member data:', memberData);
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

        // Define the document path for the attendance record
        const attendanceDoc = doc(db, 'classes', syntax, 'members', id || currentUser.uid);

        const docSnapshot = await getDoc(attendanceDoc);
        const existingAttendance = docSnapshot.exists() ? docSnapshot.data().attendance || {} : {};

        if (existingAttendance[currentDate]) {
            console.log('Attendance for today has already been recorded.');
            return { status: existingAttendance[currentDate].status, time: existingAttendance[currentDate].timeChecked };
        } else {
            return { status: "Absent" };
        }

    } catch (error) {
        console.error('Error checking attendance:', error);
        throw error;
    }
}

export async function checkAttendance(syntax, timezone, id) {
    try {
        await deleteAllAttendanceRecords(timezone, syntax);

        const classdata = await fetchClass(syntax);
        const currentDate = DateTime.now().toISODate();

        const attendanceDoc = doc(db, 'classes', syntax, 'members', id || currentUser.uid);

        const classTimezone = classdata.timezone;
        const classTimeIn = classdata.timeIn;

        const currentTime = DateTime.now().setZone(timezone);
        const classTime = DateTime.fromFormat(classTimeIn, 'HH:mm', { zone: classTimezone });
        const classDateTime = classTime.set({ year: currentTime.year, month: currentTime.month, day: currentTime.day });

        let status;
        if (currentTime <= classDateTime) {
            status = 'present';
        } else {
            status = 'late';
        }

        const timeChecked = currentTime.toFormat('HH:mm');

        const docSnapshot = await getDoc(attendanceDoc);
        const existingAttendance = docSnapshot.exists() ? docSnapshot.data().attendance || {} : {};

        // Update if there's no record for today or if the status was "absent"
        if (!existingAttendance[currentDate] || existingAttendance[currentDate].status === 'absent') {
            const updatedAttendance = {
                ...existingAttendance,
                [currentDate]: { status: status, timeChecked: timeChecked }
            };

            await setDoc(attendanceDoc, { attendance: updatedAttendance }, { merge: true });

            return { status: status, time: timeChecked };
        } else {
            // If the record already exists and was not "absent", return existing status and time
            return { status: existingAttendance[currentDate].status, time: existingAttendance[currentDate].timeChecked };
        }
    } catch (error) {
        throw error;
    }
}

export async function markAbsent(syntax, id) {
    try {
        const attendanceDoc = doc(db, 'classes', syntax, 'members', id || currentUser.uid);

        const currentDate = DateTime.now().toISODate();
        const docSnapshot = await getDoc(attendanceDoc);
        const existingAttendance = docSnapshot.exists() ? docSnapshot.data().attendance || {} : {};

        // If attendance is already marked as 'present' or 'late', don't overwrite it with 'absent'
        if (existingAttendance[currentDate] && existingAttendance[currentDate].status !== 'absent') {
            return { status: existingAttendance[currentDate].status, time: existingAttendance[currentDate].timeChecked };
        }

        const updatedAttendance = {
            ...existingAttendance,
            [currentDate]: { status: 'absent' }
        };

        basicNotif(updatedAttendance, "", 5000);
        await setDoc(attendanceDoc, { attendance: updatedAttendance }, { merge: true });

    } catch (error) {
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
}

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
            syntax: syntax || 'None'
        }, { merge: true })
        console.log('Post successfully saved!');
    } catch (error) {
        console.error('Error saving post:', error);
    }
}

export async function deletePost(syntax, postId) {
    try {
        const storage = getStorage();
        const imgRef = ref(storage, 'images/posts/' + postId); // Unique path
        await deleteObject(imgRef);
        console.log('Image deleted successfully from Firebase Storage');

        // Delete the post document from Firestore
        const postDocRef = doc(db, 'classes', syntax, 'posts', postId);
        await deleteDoc(postDocRef);
        console.log('Post document deleted successfully from Firestore');

        // Optionally, remove the post item from the DOM
        const postItem = document.getElementById(postId);
        if (postItem) {
            postItem.remove();
        }
    } catch (error) {
        console.error('Error deleting post:', error);
    }
}

async function uploadImageToStorage(base64Image, syntax, postSyntax) {
    const storage = getStorage();
    const storageRef = ref(storage, 'images/posts/' + postSyntax); // Unique path
    await uploadString(storageRef, base64Image, 'data_url'); // Upload base64 string
    const downloadURL = await getDownloadURL(storageRef); // Get URL
    return downloadURL;
}