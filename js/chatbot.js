;(function () {
  const N8N_WEBHOOK_URL = "https://tieunhi171.app.n8n.cloud/webhook/anomaly-insight";

  /* ========== BUBBLE BUTTON ========== */
  const btn = document.createElement('div');
  btn.id = 'chatbot-bubble-btn';
  btn.innerHTML = '💬';
  document.body.appendChild(btn);

  /* ========== CHAT BOX ========== */
  const box = document.createElement('div');
  box.id = 'chatbot-bubble-box';
  box.innerHTML = `
    <div class="chat-header">
      🤖 Trợ lý Tài chính BI
    </div>

    <div id="chat-messages">
      <div class="msg bot">
        Chào bạn! Tôi có thể hỗ trợ phân tích tài chính cho bạn.
      </div>
    </div>

    <div class="chat-input-area">
      <input type="text" id="chat-input" placeholder="Nhập câu hỏi tài chính..." />
      <button id="chat-send">➤</button>
    </div>
  `;
  document.body.appendChild(box);

  /* ========== ADD MESSAGE ========== */
  function addMessage(text, isUser = false) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `msg ${isUser ? 'user' : 'bot'}`;
    msg.innerText = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  /* ========== SEND ========== */
  async function handleSend() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    // ✅ LẤY USER ID TỪ LOCALSTORAGE (DÙNG CHUNG MỌI PAGE)
    const userId = localStorage.getItem("finance_user_id") || "guest_user";

    if (!message) return;

    addMessage(message, true);
    input.value = '';

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: message,
          user_id: userId,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const reply = await response.text();
        addMessage(reply || "Tôi đã nhận được dữ liệu.");
      } else {
        addMessage("⚠️ Lỗi kết nối n8n.");
      }
    } catch (err) {
      addMessage("❌ Không thể kết nối server.");
    }
  }

  btn.onclick = () => box.classList.toggle('open');
  document.getElementById('chat-send').onclick = handleSend;
  document.getElementById('chat-input').onkeypress = e => {
    if (e.key === 'Enter') handleSend();
  };

  /* ========== STYLE ========== */
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      --primary: #2563eb;
      --primary-light: #3b82f6;
      --bg: #f1f5f9;
      --bot: #ffffff;
      --user: #2563eb;
      --text-dark: #0f172a;
      --text-light: #ffffff;
    }

    #chatbot-bubble-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: #fff;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 10px 25px rgba(37,99,235,.4);
      transition: transform .2s;
    }

    #chatbot-bubble-btn:hover {
      transform: scale(1.1);
    }

    #chatbot-bubble-box {
      position: fixed;
      bottom: 95px;
      right: 24px;
      width: 360px;
      height: 620px;
      background: #fff;
      border-radius: 16px;
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
      box-shadow: 0 25px 50px rgba(0,0,0,.25);
      font-family: system-ui, sans-serif;
    }

    #chatbot-bubble-box.open {
      display: flex;
    }

    .chat-header {
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: white;
      padding: 14px 16px;
      font-weight: 600;
      font-size: 15px;
    }

    #chat-messages {
      flex: 1;
      padding: 18px;
      background: var(--bg);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .msg {
      max-width: 78%;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.5;
      border-radius: 16px;
      animation: fadeIn .25s ease;
    }

    .msg.bot {
      background: var(--bot);
      color: var(--text-dark);
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,.08);
    }

    .msg.user {
      background: var(--user);
      color: var(--text-light);
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }

    .chat-input-area {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      background: #fff;
    }

    #chat-input {
      flex: 1;
      padding: 12px 16px;
      border-radius: 999px;
      border: none;
      background: #f8fafc;
      outline: none;
      font-size: 14px;
    }

    #chat-send {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: none;
      background: var(--primary);
      color: white;
      cursor: pointer;
    }

    #chat-send:hover {
      background: var(--primary-light);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
})();
