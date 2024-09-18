import { fetchClass, fetchMembers, 
    changeMemberRole, fetchProfile, 
    getCurrentUser, fetchMember, kickfromClass, db, checkAttendance, getAttendance, postPost, fetchClassPosts, deletePost, generateUniquePostSyntax, getUserClasses } from './firebase.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { basicNotif, confirmNotif } from './notif.js';
import 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';


let syntax;

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

function capitalizeFirstLetter(str) {
    if (!str) return str; // Handle empty strings
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


document.addEventListener('DOMContentLoaded', async () => {
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

            // Call the createPostItem function for each post
            createPostItem(email, image, dateTime, description, currentUser.email, post.id, post.userid);
        });
    }
});


async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.error('No file provided.');
        return;
    }

    const img = new Image();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = function (e) {
            img.src = e.target.result;
        };

        reader.onerror = function (error) {
            console.error('Error reading file:', error);
            reject('Error reading file.');
        };

        img.onload = function () {
            // Create or update the post template
            addPostTemplate(img.src);
            console.log(img.src)
            resolve();
        };

        reader.readAsDataURL(file);
    });
}


async function addPostTemplate(img) {
    const posts = document.getElementById('posts');
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const currentDate = new Date().toLocaleDateString('en-US', options);
    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // Ensures AM/PM format
    });
    // Check if a template with the class 'template' already exists
    const existingTemplate = document.querySelector('.template');

    if (!existingTemplate) {
        // Create the template
        const user = await getCurrentUser();
        const userdata = await fetchProfile(user.uid);
        const template = document.createElement('li');
        template.className = 'template';
        template.id = 'post';
        template.innerHTML = `
        <div id="postHeader">
        <img class="img" src="${userdata.photoUrl}">
            <p>${user.displayName}</p>
        </div>
            <img src="${img}" alt="Post Image">
            <textarea id="desc" placeholder="Enter description here..."></textarea>
            <p>${currentDate} ${currentTime}</p>
            <div id="post-buttons">
            <button class="post-button" id="postPost">Post</button>
            <button class="post-button" id="cancelPost">Cancel</button>
            </div>
        `;
        posts.insertBefore(template, posts.firstChild);
        const targetElement = template.querySelector('#postHeader');
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        template.querySelector('#postPost').addEventListener('click', async () => {
            const description = template.querySelector('#desc').value;
            const postSyntax = await generateUniquePostSyntax(syntax);
            postPost(user.email, img, currentDate, currentTime, description, syntax, postSyntax,user.uid);
            createPostItem(user.email, img, `${currentDate} ${currentTime}`, description, user.email, postSyntax,user.uid);
            cancelFunction(template);
        });

        template.querySelector('#cancelPost').addEventListener('click', () => {
            cancelFunction(template);
        });
    } else {
        console.log('Post template already exists.');
    }
}

function cancelFunction(template) {
    // Remove the template from the DOM
    template.remove();
}

// Event listener to handle the file input change
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

    
        template.querySelector('#deletePost').addEventListener('click', async () => {
            const postId = event.target.getAttribute('data-post-id');
            await deletePost(syntax, postId); // Add deletePost function to remove the post
            cancelFunction(template);
        });
    
}
