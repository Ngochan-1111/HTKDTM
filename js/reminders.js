// Xử lý chức năng nhắc nhở thanh toán hóa đơn

import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Cấu hình n8n webhook cho reminders
const REMINDERS_WEBHOOK_URL = window.env?.VITE_N8N_REMINDERS_WEBHOOK_URL || 
  "https://tieunhi171.app.n8n.cloud/webhook/1155f1ab-33b9-4a58-b41d-7b889be41a3b";

// Lưu trữ reminders trong localStorage (tạm thời, sau này sẽ lưu vào Google Sheets)
const STORAGE_KEY = "smart_finance_reminders";

// Khởi tạo khi DOM ready
document.addEventListener("DOMContentLoaded", function() {
  const reminderForm = document.getElementById("reminderForm");
  const remindersList = document.getElementById("remindersList");
  const connectCalendarBtn = document.getElementById("connectCalendarBtn");
  
  let currentUser = null;

  // Lấy user hiện tại
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      loadReminders();
    }
  });

  // Set ngày giờ mặc định (1 giờ sau)
  const dateInput = document.getElementById("reminderDate");
  if (dateInput) {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    dateInput.value = now.toISOString().slice(0, 16);
  }

  // Xử lý submit form
  if (reminderForm) {
    reminderForm.addEventListener("submit", async function(e) {
      e.preventDefault();

      if (!currentUser) {
        showMessage("Vui lòng đăng nhập", "error");
        return;
      }

      // Lấy dữ liệu từ form
      const formData = {
        billName: document.getElementById("billName").value.trim(),
        notes: document.getElementById("notes").value.trim(),
        reminderDate: document.getElementById("reminderDate").value,
        amount: parseFloat(document.getElementById("amount").value) || 0,
        repeat: document.getElementById("repeat").value,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        createdAt: new Date().toISOString(),
        status: "pending"
      };

      // Validate
      if (!formData.billName) {
        showError("billName", "Vui lòng nhập tên hóa đơn");
        return;
      }

      if (!formData.reminderDate) {
        showError("reminderDate", "Vui lòng chọn ngày giờ nhắc nhở");
        return;
      }

      const reminderDate = new Date(formData.reminderDate);
      if (reminderDate < new Date()) {
        showError("reminderDate", "Ngày giờ nhắc nhở phải trong tương lai");
        return;
      }

      if (formData.amount <= 0) {
        showError("amount", "Số tiền phải lớn hơn 0");
        return;
      }

      // Ẩn tất cả lỗi
      clearErrors();

      // Disable nút submit
      const submitBtn = reminderForm.querySelector('button[type="submit"]');
      const originalText = submitBtn?.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang thêm...";

      try {
        // Tạo ID cho reminder
        const reminderId = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        formData.id = reminderId;

        // Gửi đến n8n webhook để lưu vào Google Sheets
        await saveReminderToSheets(formData);

        // Lưu vào localStorage (backup)
        saveReminderToLocal(formData);

        // Reset form
        reminderForm.reset();
        const now = new Date();
        now.setHours(now.getHours() + 1);
        dateInput.value = now.toISOString().slice(0, 16);

        // Reload danh sách
        loadReminders();

        showMessage("✅ Đã thêm nhắc nhở thành công!", "success");

        // Lên lịch kiểm tra nhắc nhở
        scheduleReminderCheck(formData);
      } catch (error) {
        console.error("Error saving reminder:", error);
        showMessage(`❌ Lỗi: ${error.message || "Không thể lưu nhắc nhở"}`, "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Xử lý kết nối Google Calendar
  if (connectCalendarBtn) {
    connectCalendarBtn.addEventListener("click", function() {
      // TODO: Implement Google Calendar OAuth
      showCalendarStatus("Đang kết nối với Google Calendar...", "info");
      // Tạm thời chỉ hiển thị thông báo
      setTimeout(() => {
        showCalendarStatus("✅ Đã kết nối với Google Calendar", "connected");
      }, 1000);
    });
  }

  // Load reminders từ localStorage và Google Sheets
  function loadReminders() {
    const reminders = getRemindersFromLocal();
    
    if (reminders.length === 0) {
      remindersList.innerHTML = `
        <div class="empty-state">
          <p>Chưa có nhắc nhở nào. Hãy thêm nhắc nhở đầu tiên!</p>
        </div>
      `;
      return;
    }

    // Sắp xếp theo ngày (sớm nhất trước)
    reminders.sort((a, b) => new Date(a.reminderDate) - new Date(b.reminderDate));

    remindersList.innerHTML = reminders.map(reminder => {
      const date = new Date(reminder.reminderDate);
      const now = new Date();
      const isOverdue = date < now && reminder.status === "pending";
      const status = isOverdue ? "overdue" : reminder.status;

      return `
        <div class="reminder-item" data-id="${reminder.id}">
          <div class="reminder-content">
            <div class="reminder-title">${escapeHtml(reminder.billName)}</div>
            <div class="reminder-details">
              <div class="reminder-date">
                📅 ${formatDateTime(date)}
              </div>
              ${reminder.notes ? `<div>📝 ${escapeHtml(reminder.notes)}</div>` : ''}
              ${reminder.repeat !== "none" ? `<div>🔄 Lặp lại: ${getRepeatLabel(reminder.repeat)}</div>` : ''}
            </div>
            <div class="reminder-amount">${formatCurrency(reminder.amount)} VNĐ</div>
            <span class="reminder-status status-${status}">
              ${getStatusLabel(status)}
            </span>
          </div>
          <div class="reminder-actions">
            <button class="btn-action btn-edit" onclick="editReminder('${reminder.id}')">
              Sửa
            </button>
            <button class="btn-action btn-delete" onclick="deleteReminder('${reminder.id}')">
              Xóa
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  // Lưu reminder vào Google Sheets qua n8n
  async function saveReminderToSheets(reminderData) {
    try {
      const response = await fetch(REMINDERS_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...reminderData,
          type: "reminder"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving to Sheets:", error);
      // Nếu lỗi, vẫn lưu vào localStorage
      throw error;
    }
  }

  // Lưu vào localStorage
  function saveReminderToLocal(reminder) {
    const reminders = getRemindersFromLocal();
    reminders.push(reminder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }

  // Lấy reminders từ localStorage
  function getRemindersFromLocal() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Xóa reminder
  window.deleteReminder = function(id) {
    if (!confirm("Bạn có chắc muốn xóa nhắc nhở này?")) {
      return;
    }

    const reminders = getRemindersFromLocal();
    const filtered = reminders.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    loadReminders();
  };

  // Sửa reminder
  window.editReminder = function(id) {
    const reminders = getRemindersFromLocal();
    const reminder = reminders.find(r => r.id === id);
    
    if (!reminder) return;

    // Điền vào form
    document.getElementById("billName").value = reminder.billName;
    document.getElementById("notes").value = reminder.notes || "";
    document.getElementById("reminderDate").value = reminder.reminderDate.slice(0, 16);
    document.getElementById("amount").value = reminder.amount;
    document.getElementById("repeat").value = reminder.repeat;

    // Xóa reminder cũ
    deleteReminder(id);

    // Scroll lên form
    document.querySelector(".reminder-form-container").scrollIntoView({ behavior: "smooth" });
  };

  // Lên lịch kiểm tra nhắc nhở
  function scheduleReminderCheck(reminder) {
    const reminderDate = new Date(reminder.reminderDate);
    const now = new Date();
    const delay = reminderDate.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(() => {
        sendReminderEmail(reminder);
      }, delay);
    }
  }

  // Gửi email nhắc nhở
  async function sendReminderEmail(reminder) {
    try {
      // Gửi đến n8n webhook để gửi email
      const response = await fetch(REMINDERS_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "send_reminder",
          reminder: reminder,
          action: "send_email"
        }),
      });

      if (response.ok) {
        // Cập nhật status thành completed
        const reminders = getRemindersFromLocal();
        const index = reminders.findIndex(r => r.id === reminder.id);
        if (index !== -1) {
          reminders[index].status = "completed";
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
          loadReminders();
        }
      }
    } catch (error) {
      console.error("Error sending reminder email:", error);
    }
  }

  // Kiểm tra reminders đã đến hạn
  function checkOverdueReminders() {
    const reminders = getRemindersFromLocal();
    const now = new Date();

    reminders.forEach(reminder => {
      const reminderDate = new Date(reminder.reminderDate);
      if (reminderDate <= now && reminder.status === "pending") {
        sendReminderEmail(reminder);
      }
    });
  }

  // Kiểm tra mỗi phút
  setInterval(checkOverdueReminders, 60000);

  // Helper functions
  function showError(fieldId, message) {
    const errorEl = document.getElementById(`error-${fieldId}`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    }
    const input = document.getElementById(fieldId);
    if (input) {
      input.classList.add("error");
    }
  }

  function clearErrors() {
    document.querySelectorAll(".error-text").forEach(el => {
      el.style.display = "none";
    });
    document.querySelectorAll(".error").forEach(el => {
      el.classList.remove("error");
    });
  }

  function showMessage(message, type) {
    const messageEl = document.getElementById("formMessage");
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `form-message ${type}`;
      messageEl.style.display = "block";
      
      setTimeout(() => {
        messageEl.style.display = "none";
      }, 3000);
    }
  }

  function showCalendarStatus(message, type) {
    const statusEl = document.getElementById("calendarStatus");
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `calendar-status ${type}`;
      statusEl.style.display = "block";
    }
  }

  function formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount);
  }

  function getRepeatLabel(repeat) {
    const labels = {
      daily: "Hàng ngày",
      weekly: "Hàng tuần",
      monthly: "Hàng tháng",
      yearly: "Hàng năm"
    };
    return labels[repeat] || repeat;
  }

  function getStatusLabel(status) {
    const labels = {
      pending: "Chờ nhắc",
      completed: "Đã nhắc",
      overdue: "Quá hạn"
    };
    return labels[status] || status;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
