document.addEventListener("DOMContentLoaded", () => {
  // Select DOM elements
  const container = document.getElementById("ai-chatbot-container");
  const toggleBtn = document.getElementById("ai-chatbot-toggle");
  const closeBtn = document.getElementById("ai-chatbot-close");
  const chatBody = document.getElementById("ai-chatbot-body");
  const inputField = document.getElementById("ai-chatbot-input");
  const sendBtn = document.getElementById("ai-chatbot-send");

  if (!container || !toggleBtn || !chatBody) return;

  const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbz7QtR0pEQ40naBJFM12FRB4k42gsZJuh4RhBxW4hG1TC8HxCrqu-TmSZHsy5sIx8nvfg/exec";
  const typingDelayMin = 600;
  const typingDelayMax = 1200;

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

  // Predefined Q&A Logic
  const chatbotDatabase = {
    "hello": {
      text: "Hi there! 👋 I'm your virtual assistant. How can I help you today?",
      actions: ["Show products", "Contact support"]
    },
    "default": {
      text: "I'm still learning! Can I assist you with an overview of our products, or help you contact support?",
      actions: ["Show products", "Pricing", "Contact"]
    },
    "show products": {
      type: "products",
      text: "Here are some of our featured products you can enquire about:",
      actions: []
    },
    "pricing": {
      text: "We have flexible plans. Selecting 'Show products' will display available items and their prices."
    },
    "contact support": {
      text: "You can reach our human support team at support@example.com."
    }
  };

  function getBotResponse(userText) {
    const formattedInput = userText.toLowerCase().trim();
    
    // Keyword match logic
    if (formattedInput.includes("product") || formattedInput.includes("show") || formattedInput.includes("buy")) {
      return chatbotDatabase["show products"];
    }
    if (formattedInput.includes("price") || formattedInput.includes("cost") || formattedInput.includes("plan")) {
      return chatbotDatabase["pricing"];
    }
    if (formattedInput.includes("support") || formattedInput.includes("human") || formattedInput.includes("contact")) {
      return chatbotDatabase["contact support"];
    }
    if (formattedInput.includes("hi") || formattedInput.includes("hey") || formattedInput.includes("hello")) {
      return chatbotDatabase["hello"];
    }

    return chatbotDatabase[formattedInput] || chatbotDatabase["default"];
  }

  // UI Helpers
  function scrollToBottom() {
    setTimeout(() => {
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    }, 50);
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

  function appendProducts() {
    const products = window.chatbotProductsData || [];
    
    if (products.length === 0) {
      appendMessage("bot", "Sorry, no products are currently available in the selected collection.");
      return;
    }

    // Container for product list
    const productListEl = document.createElement("div");
    productListEl.className = "ai-chatbot-message bot";
    
    const listWrapper = document.createElement("div");
    listWrapper.className = "ai-chatbot-product-list";

    products.forEach(product => {
      const card = document.createElement("div");
      card.className = "ai-chatbot-product-card";
      
      card.innerHTML = `
        <img src="${product.image || ''}" class="ai-chatbot-product-image" alt="${product.title}" onerror="this.style.display='none'">
        <div class="ai-chatbot-product-info">
          <h4 class="ai-chatbot-product-title">${product.title}</h4>
          <div class="ai-chatbot-product-price">${product.price || ''}</div>
          <button class="ai-chatbot-btn-enquire" data-product="${product.title.replace(/"/g, '&quot;')}">Enquire</button>
        </div>
      `;
      listWrapper.appendChild(card);
    });

    productListEl.appendChild(listWrapper);
    chatBody.appendChild(productListEl);
    
    // Attach events to enquire buttons
    const enquireBtns = productListEl.querySelectorAll('.ai-chatbot-btn-enquire');
    enquireBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productTitle = e.target.getAttribute('data-product');
        startEnquiryFlow(productTitle);
      });
    });

    scrollToBottom();
  }

  // --- Enquiry Form Logic ---
  
  function startEnquiryFlow(productTitle) {
    // Acknowledge the user's click
    appendMessage("user", `I'd like to enquire about: ${productTitle}`);
    
    const typingIndicator = appendTypingIndicator();
    
    setTimeout(() => {
      if (typingIndicator && typingIndicator.parentNode) typingIndicator.parentNode.removeChild(typingIndicator);
      
      appendMessage("bot", `Great choice! Please fill out this quick form for "${productTitle}" so our team can get in touch.`);
      
      // Append Form Node
      appendForm(productTitle);
    }, 800);
  }

  function appendForm(productTitle) {
    const formContainer = document.createElement("div");
    formContainer.className = "ai-chatbot-message bot";
    
    const formEl = document.createElement("div");
    formEl.className = "ai-chatbot-form";
    formEl.innerHTML = `
      <div class="ai-chatbot-form-title">Enquiry Details</div>
      <input type="text" id="ai-enquiry-name" placeholder="Your Name" required>
      <input type="email" id="ai-enquiry-email" placeholder="Your Email or Phone" required>
      <textarea id="ai-enquiry-message" placeholder="Optional message..."></textarea>
      <button id="ai-enquiry-submit">Submit Enquiry</button>
    `;
    
    formContainer.appendChild(formEl);
    chatBody.appendChild(formContainer);
    scrollToBottom();

    const submitBtn = formEl.querySelector("#ai-enquiry-submit");
    submitBtn.addEventListener("click", () => {
      const name = formEl.querySelector("#ai-enquiry-name").value.trim();
      const email = formEl.querySelector("#ai-enquiry-email").value.trim();
      const message = formEl.querySelector("#ai-enquiry-message").value.trim();

      if (!name || !email) {
        alert("Please provide both your name and email.");
        return;
      }

      // Disable button and form while submitting
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
      formEl.querySelectorAll('input, textarea').forEach(el => el.disabled = true);

      submitToGoogleSheets(productTitle, name, email, message, formContainer);
    });
  }

  async function submitToGoogleSheets(productTitle, name, email, message, formContainerNode) {
    const typingIndicator = appendTypingIndicator();
    
    const payload = {
      product: productTitle,
      name: name,
      email: email,
      message: message
    };

    try {
      const response = await fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors", 
        body: JSON.stringify(payload)
      });
      
      // Assuming success due to no-cors opacity
      onSubmissionSuccess(typingIndicator, name, productTitle);
      if (formContainerNode) {
        formContainerNode.style.opacity = '0.5';
        formContainerNode.style.pointerEvents = 'none';
      }

    } catch (error) {
      console.error("Enquiry submission error:", error);
      if (typingIndicator && typingIndicator.parentNode) typingIndicator.parentNode.removeChild(typingIndicator);
      appendMessage("bot", "Sorry, there was an error submitting your enquiry. Please try again later. 😔");
      
      // Reset form
      if (formContainerNode) {
        const btn = formContainerNode.querySelector('button');
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Submit Enquiry";
        }
        formContainerNode.querySelectorAll('input, textarea').forEach(el => el.disabled = false);
      }
    }
  }

  function onSubmissionSuccess(typingIndicator, name, productTitle) {
    if (typingIndicator && typingIndicator.parentNode) typingIndicator.parentNode.removeChild(typingIndicator);
    appendMessage("bot", `✅ Thank you, ${name}! Your enquiry for \n"${productTitle}" \nhas been successfully submitted. Our team will contact you shortly.`);
    appendActions(["Show products", "Contact support"]);
  }


  // --- Core Message Event ---
  function sendBotReply(inputQuery) {
    const typingIndicator = appendTypingIndicator();
    const delay = Math.random() * (typingDelayMax - typingDelayMin) + typingDelayMin;
    
    setTimeout(() => {
      // Remove typing indicator
      if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }
      
      const responseData = getBotResponse(inputQuery);
      
      // Print text message if exists
      if (responseData.text) {
        appendMessage("bot", responseData.text);
      }
      
      // If the intent type requires fetching products, call function
      if (responseData.type === "products") {
        appendProducts();
      }
      
      // Append suggested actions
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
