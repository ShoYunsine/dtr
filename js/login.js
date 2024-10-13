import "./firebase.js";
import { loginWithGoogle, signUpWithEmail } from "./firebase.js";

document.getElementById('signUpWithGoogle').addEventListener('click', async function (event) {
    loginWithGoogle();
});

document.getElementById('loginWithGoogle').addEventListener('click', async function (event) {
    loginWithGoogle();
});

document.getElementById('signUpForm').addEventListener('click', async function (event) {
  signUpWithEmail();
});


function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true')
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false')
    }
  }
  // Check initial preference
  const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(userPrefersDark ? 'dark' : 'light');
  
  // Listen for changes in the preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    applyTheme(event.matches ? 'dark' : 'light');
  });