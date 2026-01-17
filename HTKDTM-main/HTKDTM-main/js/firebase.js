import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcPXLVmX4SBHY3ZZTJQkFOrloPhO6jt2k",
  authDomain: "qlct-60bcd.firebaseapp.com",
  projectId: "qlct-60bcd",
  storageBucket: "qlct-60bcd.firebasestorage.app",
  messagingSenderId: "737505948358",
  appId: "1:737505948358:web:a45d240bca6a1534fa5dc7",
  measurementId: "G-CJ6HP9GMNF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
