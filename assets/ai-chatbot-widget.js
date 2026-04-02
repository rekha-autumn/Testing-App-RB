document.addEventListener("DOMContentLoaded", () => {
  console.log("Chatbot JS: DOMContentLoaded fired");

  // Select DOM elements
  const container = document.getElementById("ai-chatbot-container");
  const toggleBtn = document.getElementById("ai-chatbot-toggle");
  const closeBtn = document.getElementById("ai-chatbot-close");
  const chatBody = document.getElementById("ai-chatbot-body");
  const inputField = document.getElementById("ai-chatbot-input");
  const sendBtn = document.getElementById("ai-chatbot-send");

  if (!container || !toggleBtn || !chatBody) return;

  const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbytmX89iP87yEnR9VyuIdI11PH0yTqo-TPNHkoWa3EqNHYW3RSBAJw8Bo9d3ngyAJi4/exec";
  const typingDelayMin = 600;
  const typingDelayMax = 1200;

  let isChatbotOpen = false;
  let hasGreeted = false;
  let selectedProduct = null;

  // --- Toggle Chatbot ---
  const toggleChatbot = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    isChatbotOpen = !isChatbotOpen;
    if (isChatbotOpen) {
      container.classList.add("is-open");
      if (!hasGreeted) {
        sendBotReply("hello");
        hasGreeted = true;
      }
      if (inputField) setTimeout(() => inputField.focus(), 300);
    } else {
      container.classList.remove("is-open");
    }
  };

  toggleBtn.addEventListener("click", toggleChatbot);
  if (closeBtn) closeBtn.addEventListener("click", toggleChatbot);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isChatbotOpen) {
      toggleChatbot();
    }
  });

  // --- Predefined Q&A Database ---
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
    },
    "restart chat": {
      type: "reset"
    },
    "view products again": {
      type: "products",
      text: "Sure! Here is the collection again:"
    },
    "need help": {
      text: "I'm here! What else can I help you with?",
      actions: ["Show products", "Pricing", "Contact support"]
    },
    "cart": {
      text: "What would you like to do now?",
      actions: ["View Cart", "Checkout Now", "Continue Shopping"]
    }
  };

  function getBotResponse(userText) {
    const formattedInput = userText.toLowerCase().trim();
    if (formattedInput.includes("restart")) return chatbotDatabase["restart chat"];
    if (formattedInput.includes("view products again")) return chatbotDatabase["view products again"];
    if (formattedInput.includes("need help")) return chatbotDatabase["need help"];
    if (formattedInput.includes("continue shopping")) return chatbotDatabase["show products"];
    
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
    bubbleEl.innerHTML = '<div class="ai-chatbot-dot"></div><div class="ai-chatbot-dot"></div><div class="ai-chatbot-dot"></div>';
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
        if (actionText === "View Cart") window.location.href = "/cart";
        else if (actionText === "Checkout Now") window.location.href = "/checkout";
        else handleUserSubmit(actionText);
      });
      actionContainer.appendChild(btn);
    });
    chatBody.appendChild(actionContainer);
    scrollToBottom();
  }

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // --- Flow Controllers ---
  function renderQuickOptions() {
    setTimeout(() => {
      appendMessage("bot", "What would you like to do next?");
      appendActions(["Restart Chat", "View Products Again", "Need Help"]);
    }, 1000);
  }

  function resetChat() {
    chatBody.innerHTML = "";
    hasGreeted = false;
    selectedProduct = null;
    sendBotReply("hello");
    hasGreeted = true;
  }

  // --- Purchase Logic (Shopify AJAX API) ---
  function handleAddToCart(variantId, productTitle, isBuyNow = false) {
    appendMessage("user", `${isBuyNow ? 'Buying' : 'Adding to cart'}: ${productTitle}`);
    const indicator = appendTypingIndicator();
    
    // Theme-specific sections to update
    const cartItemsComponents = document.querySelectorAll('cart-items-component');
    const sectionsToUpdate = [];
    cartItemsComponents.forEach(ext => {
       if (ext.dataset.sectionId) sectionsToUpdate.push(ext.dataset.sectionId);
    });
    // Fallback/Common sections
    if (!sectionsToUpdate.includes('header')) sectionsToUpdate.push('header');
    
    const formData = { 
      'items': [{ 'id': variantId, 'quantity': 1 }],
      'sections': sectionsToUpdate.join(',')
    };

    fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(async response => {
      if (!response.ok) throw new Error('Out of stock or error');
      return response.json();
    })
    .then(async data => {
      if (indicator && indicator.parentNode) indicator.parentNode.removeChild(indicator);
      
      // Update Shopify Cart UI using custom event system
      // We also fetch /cart.js to get the full cart object if needed for the event
      fetch(window.Shopify.routes.root + 'cart.js')
        .then(res => res.json())
        .then(cart => {
          document.dispatchEvent(new CustomEvent('cart:update', {
            bubbles: true,
            detail: {
              resource: cart,
              sourceId: 'ai-chatbot',
              data: {
                sections: data.sections,
                itemCount: cart.item_count,
                variantId: variantId
              }
            }
          }));
        });

      if (isBuyNow) {
        appendMessage("bot", "Redirecting you to checkout...");
        window.location.href = "/checkout";
      } else {
        appendMessage("bot", `✅ Success! "${productTitle}" has been added to your cart.`);
        appendActions(["View Cart", "Checkout Now", "Continue Shopping"]);
      }
    })
    .catch((error) => {
      if (indicator && indicator.parentNode) indicator.parentNode.removeChild(indicator);
      appendMessage("bot", "Oops! This item might be out of stock or there was an error adding it to the cart.");
      renderQuickOptions();
    });
  }

  // --- Product Interaction Logic ---

  function appendProducts() {
    const products = window.chatbotProductsData || [];
    if (products.length === 0) {
      appendMessage("bot", "Sorry, no products are currently available.");
      return;
    }

    const interfaceEl = document.createElement("div");
    interfaceEl.className = "ai-chatbot-message bot";
    interfaceEl.innerHTML = `
      <div class="ai-chatbot-product-search-wrapper">
        <input type="text" class="ai-chatbot-product-search" placeholder="Search products..." autocomplete="off">
      </div>
      <div class="ai-chatbot-product-list"></div>
    `;
    chatBody.appendChild(interfaceEl);

    const searchInput = interfaceEl.querySelector(".ai-chatbot-product-search");
    const listWrapper = interfaceEl.querySelector(".ai-chatbot-product-list");

    const renderList = (filter = "") => {
      listWrapper.innerHTML = "";
      const query = filter.toLowerCase().trim();
      
      const filtered = products.filter(p => {
        const titleMatch = p.title.toLowerCase().includes(query);
        const typeMatch = (p.type || "").toLowerCase().includes(query);
        const tagMatch = (p.tags || []).some(tag => tag.toLowerCase().includes(query));
        const collectionMatch = (p.collections || []).some(col => col.toLowerCase().includes(query));
        
        return titleMatch || typeMatch || tagMatch || collectionMatch;
      });

      const itemsToShow = filtered.slice(0, query ? 15 : 10);

      if (itemsToShow.length === 0) {
        listWrapper.innerHTML = `
          <div style="font-size: 13px; color: #666; padding: 20px; text-align: center; background: #f9f9f9; border-radius: 8px;">
            <div style="font-size: 20px; margin-bottom: 8px;">🔍</div>
            No products found matching "<strong>${filter}</strong>".<br>
            <small>Try searching for categories like "Office", "Decor", or product tags.</small>
          </div>
        `;
        return;
      }

      itemsToShow.forEach((p) => {
        const isOutOfStock = !p.available;
        const card = document.createElement("div");
        card.className = "ai-chatbot-product-card";
        
        // Simple highlighting for the title if there's a query
        let displayTitle = p.title;
        if (query) {
           const regex = new RegExp(`(${query})`, 'gi');
           displayTitle = p.title.replace(regex, '<mark class="ai-chatbot-highlight">$1</mark>');
        }

        card.innerHTML = `
          <img src="${p.image || ''}" class="ai-chatbot-product-image" alt="${p.title}" onerror="this.style.display='none'">
          <div class="ai-chatbot-product-info">
            <h4 class="ai-chatbot-product-title">${displayTitle}</h4>
            <div class="ai-chatbot-product-price">${isOutOfStock ? 'Out of Stock' : p.price}</div>
            <div class="ai-chatbot-product-actions">
              <button class="ai-chatbot-btn-buynow ${isOutOfStock ? 'ai-chatbot-btn-disabled' : ''}" data-index="${products.indexOf(p)}" ${isOutOfStock ? 'disabled' : ''}>Buy Now</button>
              <button class="ai-chatbot-btn-atc ${isOutOfStock ? 'ai-chatbot-btn-disabled' : ''}" data-index="${products.indexOf(p)}" ${isOutOfStock ? 'disabled' : ''}>Add to Cart</button>
              <button class="ai-chatbot-btn-secondary btn-show-details" data-index="${products.indexOf(p)}">Details</button>
              <button class="ai-chatbot-btn-secondary btn-enquire" data-index="${products.indexOf(p)}">Enquire</button>
            </div>
          </div>
        `;
        listWrapper.appendChild(card);
      });

      listWrapper.querySelectorAll('.ai-chatbot-btn-buynow').forEach(btn => {
        btn.addEventListener('click', () => handleAddToCart(products[btn.dataset.index].variant_id, products[btn.dataset.index].title, true));
      });
      listWrapper.querySelectorAll('.ai-chatbot-btn-atc').forEach(btn => {
        btn.addEventListener('click', () => handleAddToCart(products[btn.dataset.index].variant_id, products[btn.dataset.index].title, false));
      });
      listWrapper.querySelectorAll('.btn-show-details').forEach(btn => {
        btn.addEventListener('click', () => renderProductDetails(products[btn.dataset.index]));
      });
      listWrapper.querySelectorAll('.btn-enquire').forEach(btn => {
        btn.addEventListener('click', () => { selectedProduct = products[btn.dataset.index]; startEnquiryFlow(); });
      });
    };

    renderList();
    const debouncedSearch = debounce((q) => renderList(q), 300);
    searchInput.addEventListener("input", (e) => debouncedSearch(e.target.value));
    scrollToBottom();
  }

  function renderProductDetails(product) {
    appendMessage("user", `Details for ${product.title}`);
    const indicator = appendTypingIndicator();
    
    setTimeout(() => {
      if (indicator && indicator.parentNode) indicator.parentNode.removeChild(indicator);
      const isOutOfStock = !product.available;
      const detailsCard = document.createElement("div");
      detailsCard.className = "ai-chatbot-message bot";
      detailsCard.innerHTML = `
        <div class="ai-product-details-card">
          <img src="${product.image}" class="ai-product-details-image">
          <h3 class="ai-product-details-title">${product.title}</h3>
          <div class="ai-product-details-price">${isOutOfStock ? 'Out of Stock' : product.price}</div>
          <div class="ai-product-details-desc">${product.description || 'No description available.'}</div>
          <div class="ai-chatbot-product-actions">
            <button class="ai-chatbot-btn-buynow btn-buy-detail ${isOutOfStock ? 'ai-chatbot-btn-disabled' : ''}" ${isOutOfStock ? 'disabled' : ''}>Buy Now</button>
            <button class="ai-chatbot-btn-atc btn-atc-detail ${isOutOfStock ? 'ai-chatbot-btn-disabled' : ''}" ${isOutOfStock ? 'disabled' : ''}>Add to Cart</button>
            <button class="ai-chatbot-btn-secondary btn-enquire-detail">Enquire</button>
          </div>
          <a href="${product.url}" target="_blank" class="ai-product-details-link">View in Store →</a>
        </div>
      `;
      chatBody.appendChild(detailsCard);
      
      detailsCard.querySelector('.btn-buy-detail').addEventListener('click', () => handleAddToCart(product.variant_id, product.title, true));
      detailsCard.querySelector('.btn-atc-detail').addEventListener('click', () => handleAddToCart(product.variant_id, product.title, false));
      detailsCard.querySelector('.btn-enquire-detail').addEventListener('click', () => { selectedProduct = product; startEnquiryFlow(); });
      
      scrollToBottom();
      renderQuickOptions();
    }, 800);
  }

  // --- Enquiry Flow ---
  function startEnquiryFlow() {
    if (!selectedProduct) return;
    appendMessage("user", `Enquiry for: ${selectedProduct.title}`);
    const indicator = appendTypingIndicator();
    setTimeout(() => {
      if (indicator && indicator.parentNode) indicator.parentNode.removeChild(indicator);
      appendMessage("bot", `Please fill out this form for "${selectedProduct.title}":`);
      appendForm();
    }, 800);
  }

  function appendForm() {
    const container = document.createElement("div");
    container.className = "ai-chatbot-message bot";
    container.innerHTML = `
      <div class="ai-chatbot-form">
        <div class="ai-chatbot-form-title">Enquiry Details</div>
        <input type="text" id="ai-name" placeholder="Full Name" required>
        <input type="email" id="ai-email" placeholder="Email/Phone" required>
        <textarea id="ai-msg" placeholder="Message..."></textarea>
        <button id="ai-submit">Submit Enquiry</button>
      </div>
    `;
    chatBody.appendChild(container);
    scrollToBottom();

    const btn = container.querySelector("#ai-submit");
    btn.addEventListener("click", () => {
      const name = container.querySelector("#ai-name").value.trim();
      const email = container.querySelector("#ai-email").value.trim();
      const msg = container.querySelector("#ai-msg").value.trim();
      if (!name || !email) { alert("Please complete name and email."); return; }
      btn.disabled = true; btn.textContent = "Submitting...";
      submitToGoogleSheets(name, email, msg, container);
    });
  }

  async function submitToGoogleSheets(name, email, msg, node) {
    const payload = { product_name: selectedProduct.title, product_handle: selectedProduct.handle, name, email, message: msg, price: selectedProduct.price };
    try {
      await fetch(GOOGLE_SHEET_URL, { method: "POST", headers: { "Content-Type": "application/json" }, mode: "no-cors", body: JSON.stringify(payload) });
      appendMessage("bot", `✅ Success! Enquiry for "${selectedProduct.title}" sent.`);
      if (node) { node.style.opacity = '0.5'; node.style.pointerEvents = 'none'; }
      renderQuickOptions();
    } catch (e) {
      appendMessage("bot", "Error submitting enquiry.");
    }
  }

  // --- Core Message Handler ---
  function sendBotReply(query) {
    const indicator = appendTypingIndicator();
    setTimeout(() => {
      if (indicator && indicator.parentNode) indicator.parentNode.removeChild(indicator);
      const res = getBotResponse(query);
      if (res.type === "reset") { resetChat(); return; }
      if (res.text) appendMessage("bot", res.text);
      if (res.type === "products") appendProducts();
      if (res.actions) appendActions(res.actions);
      if (res.type !== "products" && !res.actions) renderQuickOptions();
    }, 800);
  }

  function handleUserSubmit(text) {
    if (!text && inputField) text = inputField.value.trim();
    if (!text) return;
    const suggestions = chatBody.querySelectorAll(".ai-chatbot-suggestions");
    suggestions.forEach(s => s.remove());
    appendMessage("user", text);
    if (inputField) inputField.value = "";
    sendBotReply(text);
  }

  if (sendBtn) sendBtn.addEventListener("click", () => handleUserSubmit());
  if (inputField) inputField.addEventListener("keydown", (e) => { if (e.key === "Enter") handleUserSubmit(); });
});
