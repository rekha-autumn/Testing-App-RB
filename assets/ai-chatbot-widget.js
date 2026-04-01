document.addEventListener("DOMContentLoaded", () => {
  console.log("Chatbot JS: DOMContentLoaded fired");

  // Select DOM elements
  const container = document.getElementById("ai-chatbot-container");
  const toggleBtn = document.getElementById("ai-chatbot-toggle");
  const closeBtn = document.getElementById("ai-chatbot-close");
  const chatBody = document.getElementById("ai-chatbot-body");
  const inputField = document.getElementById("ai-chatbot-input");
  const sendBtn = document.getElementById("ai-chatbot-send");

  // Debugging selectors
  console.log("Chatbot Elements Check:", {
    container: !!container,
    toggleBtn: !!toggleBtn,
    chatBody: !!chatBody,
    inputField: !!inputField
  });

  if (!container || !toggleBtn || !chatBody) {
    console.error("Chatbot: One or more critical elements not found. Initialization aborted.");
    return;
  }

  const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbytmX89iP87yEnR9VyuIdI11PH0yTqo-TPNHkoWa3EqNHYW3RSBAJw8Bo9d3ngyAJi4/exec";
  const typingDelayMin = 600;
  const typingDelayMax = 1200;

  let isChatbotOpen = false;
  let hasGreeted = false;
  let selectedProduct = null;

  // Toggle Chatbot
  const toggleChatbot = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("Chatbot clicked"); // Task 3 Requirement

    isChatbotOpen = !isChatbotOpen;
    if (isChatbotOpen) {
      container.classList.add("is-open");
      console.log("Chatbot: Opened");

      if (!hasGreeted) {
        sendBotReply("hello");
        hasGreeted = true;
      }
      if (inputField) setTimeout(() => inputField.focus(), 300);
    } else {
      container.classList.remove("is-open");
      console.log("Chatbot: Closed");
    }
  };

  // Attach Event Listeners
  toggleBtn.addEventListener("click", toggleChatbot);
  if (closeBtn) closeBtn.addEventListener("click", toggleChatbot);

  console.log("Chatbot: Event listeners attached successfully.");

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
      text: "Explore our collection! You can search or browse below:",
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
    if (formattedInput.includes("product") || formattedInput.includes("show") || formattedInput.includes("buy") || formattedInput.includes("item")) {
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

  // --- UI Helpers ---
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

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // --- Product Search & Display Logic ---
  function appendProducts() {
    const products = window.chatbotProductsData || [];
    if (products.length === 0) {
      appendMessage("bot", "Sorry, no products are currently available in the selected collection.");
      return;
    }

    const productInterfaceEl = document.createElement("div");
    productInterfaceEl.className = "ai-chatbot-message bot";

    const searchWrapper = document.createElement("div");
    searchWrapper.className = "ai-chatbot-product-search-wrapper";
    searchWrapper.innerHTML = `
      <input type="text" class="ai-chatbot-product-search" placeholder="Search products..." autocomplete="off">
    `;

    const listWrapper = document.createElement("div");
    listWrapper.className = "ai-chatbot-product-list";

    productInterfaceEl.appendChild(searchWrapper);
    productInterfaceEl.appendChild(listWrapper);
    chatBody.appendChild(productInterfaceEl);

    const searchInput = searchWrapper.querySelector(".ai-chatbot-product-search");

    const renderList = (filter = "") => {
      listWrapper.innerHTML = "";
      const query = filter.toLowerCase().trim();
      const filtered = products.filter(p => p.title.toLowerCase().includes(query));
      const limit = query ? filtered.length : 20;
      const itemsToShow = filtered.slice(0, limit);

      if (itemsToShow.length === 0) {
        listWrapper.innerHTML = `<div style="font-size: 13px; color: #666; padding: 10px; text-align: center;">No products found for "${filter}"</div>`;
        return;
      }

      itemsToShow.forEach(product => {
        const card = document.createElement("div");
        card.className = "ai-chatbot-product-card";
        card.innerHTML = `
          <img src="${product.image || ''}" class="ai-chatbot-product-image" alt="${product.title}" onerror="this.style.display='none'">
          <div class="ai-chatbot-product-info">
            <h4 class="ai-chatbot-product-title">${product.title}</h4>
            <div class="ai-chatbot-product-price">${product.price || ''}</div>
            <button class="ai-chatbot-btn-enquire" 
                    data-title="${product.title.replace(/"/g, '&quot;')}"
                    data-handle="${product.handle || ''}"
                    data-price="${product.price || ''}">Enquire</button>
          </div>
        `;
        listWrapper.appendChild(card);
      });

      listWrapper.querySelectorAll('.ai-chatbot-btn-enquire').forEach(btn => {
        btn.addEventListener('click', (e) => {
          selectedProduct = {
            title: e.currentTarget.getAttribute('data-title'),
            handle: e.currentTarget.getAttribute('data-handle'),
            price: e.currentTarget.getAttribute('data-price')
          };
          startEnquiryFlow();
        });
      });
    };

    renderList();

    const debouncedSearch = debounce((query) => {
      renderList(query);
      scrollToBottom();
    }, 300);

    searchInput.addEventListener("input", (e) => {
      debouncedSearch(e.target.value);
    });

    scrollToBottom();
  }

  // --- Enquiry Flow Logic ---
  function startEnquiryFlow() {
    if (!selectedProduct) return;
    const { title } = selectedProduct;
    appendMessage("user", `I'd like to enquire about: ${title}`);
    const typingIndicator = appendTypingIndicator();

    setTimeout(() => {
      if (typingIndicator && typingIndicator.parentNode) typingIndicator.parentNode.removeChild(typingIndicator);
      appendMessage("bot", `Great choice! Please fill out this quick form for "${title}" so our team can get in touch.`);
      appendForm();
    }, 800);
  }

  function appendForm() {
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
      const uName = formEl.querySelector("#ai-enquiry-name").value.trim();
      const uEmail = formEl.querySelector("#ai-enquiry-email").value.trim();
      const uMessage = formEl.querySelector("#ai-enquiry-message").value.trim();

      if (!uName || !uEmail) {
        alert("Please provide both your name and email.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
      formEl.querySelectorAll('input, textarea').forEach(el => el.disabled = true);
      submitToGoogleSheets(uName, uEmail, uMessage, formContainer);
    });
  }

  async function submitToGoogleSheets(userName, userEmail, userMessage, formContainerNode) {
    if (!selectedProduct) return;
    const typingIndicator = appendTypingIndicator();

    const payload = {
      product_name: selectedProduct.title,
      product_handle: selectedProduct.handle,
      name: userName,
      email: userEmail,
      message: userMessage,
      price: selectedProduct.price
    };

    try {
      await fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify(payload)
      });

      onSubmissionSuccess(userName, selectedProduct.title);
      if (formContainerNode) {
        formContainerNode.style.opacity = '0.5';
        formContainerNode.style.pointerEvents = 'none';
      }
      if (typingIndicator && typingIndicator.parentNode) typingIndicator.parentNode.removeChild(typingIndicator);
    } catch (error) {
      console.error("Chatbot: Enquiry submission error:", error);
      if (typingIndicator && typingIndicator.parentNode) typingIndicator.parentNode.removeChild(typingIndicator);
      appendMessage("bot", "Sorry, there was an error submitting your enquiry. 😔");
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

  function onSubmissionSuccess(name, productTitle) {
    appendMessage("bot", `✅ Thank you, ${name}! Your enquiry for "${productTitle}" has been successfully submitted.`);
    appendActions(["Show products", "Contact support"]);
  }

  // --- Core Message Event ---
  function sendBotReply(inputQuery) {
    const typingIndicator = appendTypingIndicator();
    const delay = Math.random() * (typingDelayMax - typingDelayMin) + typingDelayMin;

    setTimeout(() => {
      if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }
      const responseData = getBotResponse(inputQuery);
      if (responseData.text) appendMessage("bot", responseData.text);
      if (responseData.type === "products") appendProducts();
      if (responseData.actions) appendActions(responseData.actions);
    }, delay);
  }

  function handleUserSubmit(userText) {
    const text = userText || inputField.value.trim();
    if (!text) return;
    const existingActions = chatBody.querySelectorAll(".ai-chatbot-suggestions");
    existingActions.forEach(el => el.remove());
    appendMessage("user", text);
    inputField.value = "";
    sendBotReply(text);
  }

  // Event Listeners for Input
  if (sendBtn) sendBtn.addEventListener("click", () => handleUserSubmit());
  if (inputField) {
    inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleUserSubmit();
      }
    });
  }
});
