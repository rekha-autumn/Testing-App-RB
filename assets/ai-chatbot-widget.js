document.addEventListener("DOMContentLoaded", () => {
  // Select DOM elements
  const container = document.getElementById("ai-chatbot-container");
  const toggleBtn = document.getElementById("ai-chatbot-toggle");
  const closeBtn = document.getElementById("ai-chatbot-close");
  const chatBody = document.getElementById("ai-chatbot-body");
  const inputField = document.getElementById("ai-chatbot-input");
  const sendBtn = document.getElementById("ai-chatbot-send");

  if (!container || !toggleBtn || !chatBody) return;

  // Configuration
  const typingDelayMin = 600;
  const typingDelayMax = 1200;

  // Initial State
  let isChatbotOpen = false;
  let hasGreeted = false;

  // Toggle Chatbot
  const toggleChatbot = () => {
    isChatbotOpen = !isChatbotOpen;
    if (isChatbotOpen) {
      container.classList.add("is-open");
      if (!hasGreeted) {
        sendBotReply("hello");
        hasGreeted = true;
      }
      setTimeout(() => inputField.focus(), 300);
    } else {
      container.classList.remove("is-open");
    }
  };

  toggleBtn.addEventListener("click", toggleChatbot);
  if (closeBtn) closeBtn.addEventListener("click", toggleChatbot);

  // Focus out on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isChatbotOpen) {
      toggleChatbot();
    }
  });

  // Predefined Q&A Logic (Structured for easy API migration later)
  // FUTURE READINESS: You can replace this local logic with an API call like:
  /*
    async function fetchBotResponse(userText) {
      const response = await fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      const data = await response.json();
      return { text: data.reply, actions: data.actions || [] };
    }
  */
  const chatbotDatabase = {
    "hello": {
      text: "Hi there! 👋 I'm your virtual assistant. How can I help you today?",
      actions: ["What is your product?", "Pricing details", "Contact support"]
    },
    "default": {
      text: "I'm still learning! For now, can I assist you with an overview of our product, features, or pricing?",
      actions: ["What is your product?", "Features", "Pricing"]
    },
    "what is your product?": {
      text: "We provide state-of-the-art chatbot solutions for Shopify stores to engage customers 24/7. 🚀"
    },
    "features": {
      text: "Our key features include instant AI responses, custom workflows, smooth animations, and API hook readiness.",
      actions: ["Pricing", "Contact support"]
    },
    "pricing": {
      text: "We have flexible plans starting from a free tier up to enterprise packages. Let us know if you want a custom quote!"
    },
    "contact support": {
      text: "You can reach our human support team at support@example.com."
    }
  };

  function getBotResponse(userText) {
    const formattedInput = userText.toLowerCase().trim();
    
    // Exact match
    if (chatbotDatabase[formattedInput]) {
      return chatbotDatabase[formattedInput];
    }
    
    // Keyword match logic (basic rule-based)
    if (formattedInput.includes("product") || formattedInput.includes("what is")) {
      return chatbotDatabase["what is your product?"];
    }
    if (formattedInput.includes("price") || formattedInput.includes("cost") || formattedInput.includes("plan")) {
      return chatbotDatabase["pricing"];
    }
    if (formattedInput.includes("feature")) {
      return chatbotDatabase["features"];
    }
    if (formattedInput.includes("support") || formattedInput.includes("human") || formattedInput.includes("contact")) {
      return chatbotDatabase["contact support"];
    }
    if (formattedInput.includes("hi") || formattedInput.includes("hey") || formattedInput.includes("hello")) {
      return chatbotDatabase["hello"];
    }

    return chatbotDatabase["default"];
  }

  // UI Helpers
  function scrollToBottom() {
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
  }

  function appendMessage(sender, text) {
    const messageEl = document.createElement("div");
    messageEl.className = `ai-chatbot-message ${sender}`;
    
    const bubbleEl = document.createElement("div");
    bubbleEl.className = "ai-chatbot-bubble";
    bubbleEl.textContent = text;
    
    messageEl.appendChild(bubbleEl);
    chatBody.appendChild(messageEl);
    scrollToBottom();
  }

  function appendTypingIndicator() {
    const messageEl = document.createElement("div");
    messageEl.className = "ai-chatbot-message bot ai-chatbot-typing-indicator";
    
    const bubbleEl = document.createElement("div");
    bubbleEl.className = "ai-chatbot-bubble ai-chatbot-typing";
    
    bubbleEl.innerHTML = `
      <div class="ai-chatbot-dot"></div>
      <div class="ai-chatbot-dot"></div>
      <div class="ai-chatbot-dot"></div>
    `;
    
    messageEl.appendChild(bubbleEl);
    chatBody.appendChild(messageEl);
    scrollToBottom();
    return messageEl;
  }

  function appendActions(actions) {
    if (!actions || actions.length === 0) return;

    const actionContainer = document.createElement("div");
    actionContainer.className = "ai-chatbot-suggestions";

    actions.forEach(actionText => {
      const btn = document.createElement("button");
      btn.className = "ai-chatbot-suggestion-btn";
      btn.textContent = actionText;
      btn.addEventListener("click", () => {
        handleUserSubmit(actionText);
      });
      actionContainer.appendChild(btn);
    });

    chatBody.appendChild(actionContainer);
    scrollToBottom();
  }

  // Handle Response logic
  function sendBotReply(inputQuery) {
    const typingIndicator = appendTypingIndicator();
    
    // Simulate network/typing delay
    const delay = Math.random() * (typingDelayMax - typingDelayMin) + typingDelayMin;
    
    setTimeout(() => {
      // Remove typing indicator
      if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }
      
      const responseData = getBotResponse(inputQuery);
      appendMessage("bot", responseData.text);
      
      if (responseData.actions) {
        appendActions(responseData.actions);
      }
      
    }, delay);
  }

  function handleUserSubmit(userText) {
    const text = userText || inputField.value.trim();
    if (!text) return;
    
    // Remove previous action buttons if any
    const existingActions = chatBody.querySelectorAll(".ai-chatbot-suggestions");
    existingActions.forEach(el => el.remove());

    appendMessage("user", text);
    inputField.value = "";
    
    sendBotReply(text);
  }

  // Event Listeners for Input
  sendBtn.addEventListener("click", () => handleUserSubmit());
  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUserSubmit();
    }
  });

});
