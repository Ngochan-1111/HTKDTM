// js/reminders.js

const WEBHOOK_URL = "https://tieunhi171.app.n8n.cloud/webhook/fbade263-0260-4a0c-9dbc-fa0b285c7cbf";
let currentUser = null;
let editingReminderId = null;

// --- HELPERS ---
const getRepeatLabel = (repeat) => {
    const labels = { none: "Không lặp", daily: "Hàng ngày", weekly: "Hàng tuần", monthly: "Hàng tháng", yearly: "Hàng năm" };
    return labels[repeat] || repeat;
};

const formatDate = (dStr) => {
    const d = new Date(dStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n);
const getStatusLabel = (s) => ({ pending: "Chờ nhắc", completed: "Đã gửi", overdue: "Quá hạn" }[s] || s);
const escapeHtml = (t) => { const div = document.createElement("div"); div.textContent = t; return div.innerHTML; };

function showMessage(msg, type) {
    const el = document.getElementById("formMessage");
    if (!el) return;
    el.textContent = msg; el.className = `form-message ${type}`; el.style.display = "block";
    setTimeout(() => el.style.display = "none", 3000);
}

// --- STORAGE ---
const getStorageKey = () => currentUser ? `smart_finance_reminders_${currentUser.uid}` : null;

function getRemindersFromLocal() {
    const key = getStorageKey();
    return key ? JSON.parse(localStorage.getItem(key) || "[]") : [];
}

function saveRemindersToLocal(reminders) {
    const key = getStorageKey();
    if (key) localStorage.setItem(key, JSON.stringify(reminders));
}

// --- EMAIL LOGIC (GIỮ NGUYÊN ID) ---
async function sendReminderEmail(reminder) {
    try {
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "send_reminder", reminder, action: "send_email" })
        });
        
        if (res.ok) {
            let data = getRemindersFromLocal();
            // Tìm đúng ID cũ để cập nhật trạng thái
            const idx = data.findIndex(r => r.id === reminder.id);
            if (idx !== -1) {
                data[idx].status = "completed";
                saveRemindersToLocal(data);
                loadRemindersUI(); 
            }
        }
    } catch (err) { console.error("Lỗi gửi mail:", err); }
}

function checkOverdueReminders() {
    if (!currentUser) return;
    const reminders = getRemindersFromLocal();
    const now = new Date();
    reminders.forEach(r => {
        if (new Date(r.reminderDate) <= now && r.status === "pending") {
            sendReminderEmail(r);
        }
    });
}

// --- EXPORTS ---
export function initReminders(user) {
    currentUser = user;
    setInterval(checkOverdueReminders, 60000);
    checkOverdueReminders();
}

export function loadRemindersUI() {
    const listEl = document.getElementById("remindersList");
    if (!listEl || !currentUser) return;
    
    const reminders = getRemindersFromLocal();
    if (reminders.length === 0) {
        listEl.innerHTML = '<div class="empty-state">Chưa có nhắc nhở nào.</div>';
        return;
    }

    reminders.sort((a, b) => new Date(a.reminderDate) - new Date(b.reminderDate));
    
    listEl.innerHTML = reminders.map(r => {
        const isOverdue = new Date(r.reminderDate) < new Date() && r.status === "pending";
        const status = isOverdue ? "overdue" : r.status;
        return `
            <div class="reminder-item" data-id="${r.id}">
                <div class="reminder-content">
                    <div class="reminder-title">${escapeHtml(r.billName)}</div>
                    <div class="reminder-details">
                        📅 ${formatDate(r.reminderDate)} | 📂 ${r.category}
                        ${r.notes ? `<br>📝 ${escapeHtml(r.notes)}` : ""}
                        ${r.repeat !== "none" ? `<br>🔄 Lặp lại: ${getRepeatLabel(r.repeat)}` : ""}
                    </div>
                    <div class="reminder-amount">${formatCurrency(r.amount)} VNĐ</div>
                    <span class="reminder-status status-${status}">${getStatusLabel(status)}</span>
                </div>
                <div class="reminder-actions">
                    <button class="btn-action btn-edit" data-id="${r.id}">Sửa</button>
                    <button class="btn-action btn-delete" data-id="${r.id}">Xóa</button>
                </div>
            </div>`;
    }).join("");

    // Gán sự kiện cho các nút
    listEl.querySelectorAll(".btn-edit").forEach(btn => btn.onclick = () => editReminder(btn.dataset.id));
    listEl.querySelectorAll(".btn-delete").forEach(btn => btn.onclick = () => deleteReminder(btn.dataset.id));
}

export async function handleReminderSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("submitBtn");
    
    // Giữ nguyên ID nếu đang sửa, tạo mới nếu thêm
    const currentId = editingReminderId || `rem_${Date.now()}`;
    
    const reminder = {
        id: currentId,
        billName: document.getElementById("billName").value.trim(),
        notes: document.getElementById("notes").value.trim(),
        category: document.getElementById("category").value,
        reminderDate: document.getElementById("reminderDate").value,
        amount: parseFloat(document.getElementById("amount").value) || 0,
        repeat: document.getElementById("repeat").value,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: "pending",
        action: editingReminderId ? "update" : "create"
    };

    submitBtn.disabled = true;
    try {
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...reminder, type: "reminder" })
        });

        let data = getRemindersFromLocal();
        if (editingReminderId) {
            data = data.map(r => r.id === editingReminderId ? reminder : r);
        } else {
            data.push(reminder);
        }
        
        saveRemindersToLocal(data);
        document.getElementById("reminderForm").reset();
        editingReminderId = null;
        submitBtn.textContent = "+ Thêm nhắc";
        loadRemindersUI();
        showMessage("✅ Thành công!", "success");
    } catch (err) { showMessage("❌ Lỗi kết nối!", "error"); }
    finally { submitBtn.disabled = false; }
}

function deleteReminder(id) {
    if (!confirm("Bạn muốn xóa?")) return;
    fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "delete", type: "reminder" })
    }).then(() => {
        const filtered = getRemindersFromLocal().filter(r => r.id !== id);
        saveRemindersToLocal(filtered);
        loadRemindersUI();
    });
}

function editReminder(id) {
    const r = getRemindersFromLocal().find(item => item.id === id);
    if (!r) return;
    editingReminderId = id;
    document.getElementById("billName").value = r.billName;
    document.getElementById("notes").value = r.notes || "";
    document.getElementById("reminderDate").value = r.reminderDate.slice(0, 16);
    document.getElementById("amount").value = r.amount;
    document.getElementById("category").value = r.category;
    document.getElementById("repeat").value = r.repeat;
    document.getElementById("submitBtn").textContent = "Cập nhật nhắc nhở";
    document.querySelector(".reminder-form-wrapper").scrollIntoView({ behavior: "smooth" });
}