;(function () {
  // Bubble button
  const btn = document.createElement('div')
  btn.id = 'chatbot-bubble-btn'
  btn.innerHTML = '💬'
  document.body.appendChild(btn)

  // Chat window
  const box = document.createElement('div')
  box.id = 'chatbot-bubble-box'
  box.innerHTML = `
    <iframe
      src="https://udify.app/chatbot/SR3Yl9N4PYo7Qe8i"
      allow="microphone"
    ></iframe>
  `
  document.body.appendChild(box)

  // Toggle
  btn.onclick = () => {
    box.classList.toggle('open')
  }

  // Style
  const style = document.createElement('style')
  style.innerHTML = `
    #chatbot-bubble-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #1C64F2;
      color: #fff;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
    }

    #chatbot-bubble-box {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 380px;
      height: 600px;
      display: none;
      z-index: 9999;
      box-shadow: 0 10px 30px rgba(0,0,0,.2);
      border-radius: 12px;
      overflow: hidden;
    }

    #chatbot-bubble-box.open {
      display: block;
    }

    #chatbot-bubble-box iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `
  document.head.appendChild(style)
})()
