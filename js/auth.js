import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ĐĂNG KÝ */
window.register = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Đăng ký thành công");
      // 👉 Sau khi đăng ký, chuyển về màn đăng nhập
      location.href = "login.html";
    })
    .catch(err => {
      console.error("Lỗi đăng ký:", err);
      alert("Đăng ký thất bại: " + err.message);
    });
};

/* ĐĂNG NHẬP */
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // ✅ LƯU USER ID CHO CHATBOT + TOÀN SITE
      localStorage.setItem("finance_user_id", user.uid);
      localStorage.setItem("finance_user_email", user.email);

      // 👉 Sau khi đăng nhập, chuyển về màn chính
      location.href = "index.html";
    })
    .catch(err => {
      console.error("Lỗi đăng nhập:", err);
      alert("Sai email hoặc mật khẩu");
    });
};

window.logout = function () {
  signOut(auth).then(() => {
    
    // ✅ XOÁ USER KHI ĐĂNG XUẤT
    localStorage.removeItem("finance_user_id");
    localStorage.removeItem("finance_user_email");

    location.href = "login.html";
  }).catch(err => {
    console.error("Lỗi đăng xuất:", err);
    alert("Đăng xuất thất bại: " + err.message);
  });
};

/* HIỂN THỊ EMAIL */
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    const emailEl = document.getElementById("userEmail");
    if (user && emailEl) {
      emailEl.textContent = user.email;
    }
  });
});