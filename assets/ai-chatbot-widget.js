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
      actions: ["Show products", "View My Orders", "Contact support"]
    },
    "show products": {
      type: "products",
      text: "Sure! Check out our collection below:"
    },
    "default": {
      text: "I'm still learning! Can I assist you with an overview of our products, or help you contact support?",
      actions: ["Show products", "View My Orders", "Pricing", "Contact"]
    },
    "view my orders": {
      type: "orders",
      text: "Let me check that for you..."
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
    
    // Remove existing suggestions to prevent duplicates
    const existingSuggestions = chatBody.querySelectorAll(".ai-chatbot-suggestions");
    existingSuggestions.forEach(s => s.remove());

    const actionContainer = document.createElement("div");
    actionContainer.className = "ai-chatbot-suggestions";
    actions.forEach(actionText => {
      const btn = document.createElement("button");
      btn.className = "ai-chatbot-suggestion-btn";
      if (actionText === "Show products" || actionText === "View All Products") {
        btn.classList.add("show-products-btn");
      }
      btn.textContent = actionText;
      actionContainer.appendChild(btn);
    });
    chatBody.appendChild(actionContainer);
    scrollToBottom();
  }

  // --- Flow Controllers ---
  function handleShowProducts() {
    console.log("Show Products triggered");
    // Trigger reset to default view if needed
    const searchInputs = document.querySelectorAll(".ai-chatbot-product-search");
    searchInputs.forEach(i => i.value = "");
    const clearBtns = document.querySelectorAll(".ai-chatbot-search-clear");
    clearBtns.forEach(b => b.classList.remove("is-visible"));

    appendProducts();
  }

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("ai-chatbot-suggestion-btn") || target.classList.contains("show-products-btn")) {
      const text = target.textContent;
      if (text === "View Cart") window.location.href = "/cart";
      else if (text === "Checkout Now") window.location.href = "/checkout";
      else if (text === "Show products" || text === "View All Products") {
        appendMessage("user", text);
        handleShowProducts();
      } else {
        handleUserSubmit(text);
      }
    }
  });

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // --- Flow Controllers ---
  function renderQuickOptions() {
    // Clear any existing suggestions first
    const existing = chatBody.querySelectorAll(".ai-chatbot-suggestions");
    existing.forEach(s => s.remove());

    const lastMsg = chatBody.lastElementChild;
    const promptText = "What would you like to do next?";
    
    // Prevent repeating the same bot message if it was just sent
    if (lastMsg && lastMsg.classList.contains('bot') && lastMsg.textContent.includes(promptText)) {
       appendActions(["Restart Chat", "View All Products", "Need Help"]);
       return;
    }

    setTimeout(() => {
      appendMessage("bot", promptText);
      appendActions(["Restart Chat", "View All Products", "Need Help"]);
    }, 600);
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
       const el = ext;
       if (el && el.dataset.sectionId) sectionsToUpdate.push(el.dataset.sectionId);
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
    const allProducts = window.chatbotProductsData || [];
    if (allProducts.length === 0) {
      appendMessage("bot", "Sorry, no products are currently available.");
      return;
    }

    const PRODUCTS_PER_LOAD = 10;
    let currentFilteredProducts = [...allProducts];
    let currentIndex = 0;

    const interfaceEl = document.createElement("div");
    interfaceEl.className = "ai-chatbot-message bot ai-chatbot-products-interface";
    interfaceEl.innerHTML = `
      <div class="ai-chatbot-product-search-wrapper">
        <div class="ai-chatbot-search-field-container">
          <input type="text" class="ai-chatbot-product-search" placeholder="Search products..." autocomplete="off">
          <span class="ai-chatbot-search-clear" title="Clear search">×</span>
        </div>
      </div>
      <div class="ai-chatbot-product-list"></div>
      <div class="ai-chatbot-load-more-container" style="display:none; text-align:center; padding: 10px 0;">
        <button class="ai-chatbot-btn-load-more">See More Products ↓</button>
      </div>
    `;
    chatBody.appendChild(interfaceEl);

    const searchInput = interfaceEl.querySelector(".ai-chatbot-product-search");
    const clearBtn = interfaceEl.querySelector(".ai-chatbot-search-clear");
    const listWrapper = interfaceEl.querySelector(".ai-chatbot-product-list");
    const loadMoreContainer = interfaceEl.querySelector(".ai-chatbot-load-more-container");
    const loadMoreBtn = interfaceEl.querySelector(".ai-chatbot-btn-load-more");

    const renderCards = (subset) => {
      if (!listWrapper) return;
      
      subset.forEach((p) => {
        const isOutOfStock = !p.available;
        const card = document.createElement("div");
        card.className = "ai-chatbot-product-card";
        
        // Use a persistent query if available for highlighting
        const query = (searchInput?.value || "").toLowerCase().trim();
        let displayTitle = p.title;
        if (query) {
           const regex = new RegExp(`(${query})`, 'gi');
           displayTitle = p.title.replace(regex, '<mark class="ai-chatbot-highlight">$1</mark>');
        }

        const productIndex = allProducts.indexOf(p);

        card.innerHTML = `
          <img src="${p.image || ''}" class="ai-chatbot-product-image" alt="${p.title}" onerror="this.style.display='none'">
          <div class="ai-chatbot-product-info">
            <h4 class="ai-chatbot-product-title">${displayTitle}</h4>
            <div class="ai-chatbot-product-price">${isOutOfStock ? 'Out of Stock' : p.price}</div>
            <div class="ai-chatbot-product-actions">
              <button class="ai-chatbot-btn-buynow ${isOutOfStock ? 'ai-chatbot-btn-disabled' : ''}" data-index="${productIndex}" ${isOutOfStock ? 'disabled' : ''}>Buy Now</button>
              <button class="ai-chatbot-btn-atc ${isOutOfStock ? 'ai-chatbot-btn-disabled' : ''}" data-index="${productIndex}" ${isOutOfStock ? 'disabled' : ''}>Add to Cart</button>
              <button class="ai-chatbot-btn-secondary btn-show-details" data-index="${productIndex}">Details</button>
              <button class="ai-chatbot-btn-secondary btn-enquire" data-index="${productIndex}">Enquire</button>
            </div>
          </div>
        `;
        listWrapper.appendChild(card);
      });

      // Attach events to the newly added cards
      const newCards = listWrapper.querySelectorAll('.ai-chatbot-product-card:nth-last-child(-n+' + subset.length + ')');
      newCards.forEach(card => {
        card.querySelectorAll('.ai-chatbot-btn-buynow').forEach(btn => {
          const el = btn;
          btn.addEventListener('click', () => handleAddToCart(allProducts[el.dataset.index].variant_id, allProducts[el.dataset.index].title, true));
        });
        card.querySelectorAll('.ai-chatbot-btn-atc').forEach(btn => {
          const el = btn;
          btn.addEventListener('click', () => handleAddToCart(allProducts[el.dataset.index].variant_id, allProducts[el.dataset.index].title, false));
        });
        card.querySelectorAll('.btn-show-details').forEach(btn => {
          const el = btn;
          btn.addEventListener('click', () => renderProductDetails(allProducts[el.dataset.index]));
        });
        card.querySelectorAll('.btn-enquire').forEach(btn => {
          const el = btn;
          btn.addEventListener('click', () => { selectedProduct = allProducts[el.dataset.index]; startEnquiryFlow(); });
        });
      });
    };

    const updateDisplay = (isNewSearch = false) => {
      if (isNewSearch) {
        listWrapper.innerHTML = "";
        currentIndex = 0;
      }
      
      const nextSet = currentFilteredProducts.slice(currentIndex, currentIndex + PRODUCTS_PER_LOAD);
      
      if (nextSet.length === 0 && currentIndex === 0) {
        listWrapper.innerHTML = `
          <div style="font-size: 13px; color: #666; padding: 20px; text-align: center; background: #f9f9f9; border-radius: 8px;">
            <div style="font-size: 20px; margin-bottom: 8px;">🔍</div>
            No products found matching "<strong>${searchInput?.value}</strong>".<br>
            <small>Try searching for categories like "Office", "Decor", or product tags.</small>
          </div>
        `;
        loadMoreContainer.style.display = "none";
        renderQuickOptions();
        return;
      }

      renderCards(nextSet);
      currentIndex += nextSet.length;

      // Show/Hide See More button
      if (currentIndex < currentFilteredProducts.length) {
        loadMoreContainer.style.display = "block";
      } else {
        loadMoreContainer.style.display = "none";
        renderQuickOptions(); // Show options when all products are loaded
      }
      
      scrollToBottom();
    };

    const handleSearch = (query) => {
      const q = query.toLowerCase().trim();
      currentFilteredProducts = allProducts.filter(p => {
        const titleMatch = p.title.toLowerCase().includes(q);
        const typeMatch = (p.type || "").toLowerCase().includes(q);
        const tagMatch = (p.tags || []).some(tag => tag.toLowerCase().includes(q));
        const collectionMatch = (p.collections || []).some(col => col.toLowerCase().includes(q));
        return titleMatch || typeMatch || tagMatch || collectionMatch;
      });
      updateDisplay(true);
    };

    // Initial load
    updateDisplay();

    const debouncedSearch = debounce((q) => handleSearch(q), 300);
    const debouncedShowOptions = debounce(() => {
      if (searchInput && searchInput.value.trim().length > 0) {
        renderQuickOptions();
      }
    }, 3000);

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const value = e.target.value;
        if (value.length > 0) {
          clearBtn?.classList.add("is-visible");
        } else {
          clearBtn?.classList.remove("is-visible");
        }
        debouncedSearch(value);
        debouncedShowOptions();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = "";
          searchInput.focus();
        }
        clearBtn.classList.remove("is-visible");
        handleSearch("");
        renderQuickOptions();
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => updateDisplay());
    }
    
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
      if (res.type === "products") {
        appendProducts();
        renderQuickOptions();
      }
      if (res.type === "orders") {
        appendOrderHistory();
      }
      if (res.actions) appendActions(res.actions);
      if (res.type !== "products" && res.type !== "orders" && !res.actions) renderQuickOptions();
    }, 800);
  }

  function handleUserSubmit(text) {
    if (!text && inputField) text = inputField.value.trim();
    if (!text) return;

    if (text === "View All Products" || text === "Show products") {
      console.log("Product request detected:", text);
      appendMessage("user", text);
      handleShowProducts();
      return;
    }

    const suggestions = chatBody.querySelectorAll(".ai-chatbot-suggestions");
    suggestions.forEach(s => s.remove());
    appendMessage("user", text);
    if (inputField) inputField.value = "";
    sendBotReply(text);
  }

  // --- Order History Logic ---
  function appendOrderHistory() {
    const isLoggedIn = window.isCustomerLoggedIn;
    const orders = window.customerOrders || [];

    console.log("Chatbot Order History Triggered. LoggedIn:", isLoggedIn, "Orders count:", orders.length);

    if (!isLoggedIn) {
      const loginMsg = document.createElement("div");
      loginMsg.className = "ai-chatbot-message bot";
      loginMsg.innerHTML = `
        <div class="ai-chatbot-bubble">
          You need to log in to view your order history.
          <div style="margin-top:10px;">
            <button class="ai-chatbot-suggestion-btn" onclick="window.location.href='/account/login'">Login / Create Account</button>
          </div>
        </div>
      `;
      chatBody.appendChild(loginMsg);
      renderQuickOptions();
      return;
    }

    if (orders.length === 0) {
      appendMessage("bot", "You haven't placed any orders yet. Looking forward to your first purchase! 😊");
      renderQuickOptions();
      return;
    }

    appendMessage("bot", "Here are your recent orders from the online store:");
    
    const listEl = document.createElement("div");
    listEl.className = "ai-chatbot-order-list";
    
    orders.forEach((order, idx) => {
      const card = document.createElement("div");
      card.className = "ai-chatbot-order-card";
      card.innerHTML = `
        <div class="ai-order-card-header">
          <strong>Order ${order.name}</strong>
          <span class="ai-order-status-badge">${order.status || 'Verified'}</span>
        </div>
        <div class="ai-order-card-body">
          <div>Date: ${order.date}</div>
          <div>Total: ${order.total}</div>
        </div>
        <div class="ai-order-card-actions">
          <button class="ai-chatbot-btn-secondary btn-order-details" data-idx="${idx}">View Details</button>
          <a href="${order.url}" target="_blank" class="ai-order-link">Track Order →</a>
        </div>
      `;
      listEl.appendChild(card);
    });
    
    chatBody.appendChild(listEl);
    
    listEl.querySelectorAll('.btn-order-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderIdx = parseInt(btn.getAttribute('data-idx') || '0');
        renderOrderDetails(orders[orderIdx]);
      });
    });

    renderQuickOptions();
    scrollToBottom();
  }

  function renderOrderDetails(order) {
    appendMessage("user", `View details for ${order.name}`);
    const indicator = appendTypingIndicator();
    
    setTimeout(() => {
      if (indicator && indicator.parentNode) indicator.parentNode.removeChild(indicator);
      
      const detailsEl = document.createElement("div");
      detailsEl.className = "ai-chatbot-message bot";
      
      let itemsHtml = order.items.map(item => `
        <div class="ai-order-item">
          <img src="${item.image}" alt="${item.title}" class="ai-order-item-img">
          <div class="ai-order-item-info">
            <div class="ai-order-item-title">${item.title}</div>
            <div class="ai-order-item-meta">Qty: ${item.quantity} | ${item.price}</div>
          </div>
        </div>
      `).join('');

      detailsEl.innerHTML = `
        <div class="ai-order-details-card">
          <div class="ai-order-details-header">Items in ${order.name}</div>
          <div class="ai-order-items-list">${itemsHtml}</div>
          <div class="ai-order-details-footer">
             <strong>TotalPaid: ${order.total}</strong>
             <br><small>Status: ${order.status}</small>
          </div>
        </div>
      `;
      chatBody.appendChild(detailsEl);
      renderQuickOptions();
      scrollToBottom();
    }, 600);
  }

  if (sendBtn) sendBtn.addEventListener("click", () => handleUserSubmit());
  if (inputField) inputField.addEventListener("keydown", (e) => { if (e.key === "Enter") handleUserSubmit(); });
});
