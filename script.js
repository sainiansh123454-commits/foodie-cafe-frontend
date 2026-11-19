
// ==========================================
// FOODIE CAFE - COMPLETE FRONTEND SCRIPT
// ==========================================

const API_URL = "https://foodie-cafe-backend-1.onrender.com/api/menu";
const ORDER_API = "https://foodie-cafe-backend-1.onrender.com/api/orders";
const AUTH_API = "https://foodie-cafe-backend-1.onrender.com/api/auth";

let menuItems = [];
let cart = [];
let activeCategory = "all";

let token = localStorage.getItem("foodieToken") || "";
let currentUser = JSON.parse(localStorage.getItem("foodieUser") || "null");

const menuGrid = document.getElementById("menuGrid");
const menuSearch = document.getElementById("menuSearch");

const cartOverlay = document.getElementById("cartOverlay");
const cartItemsElement = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");

const authOverlay = document.getElementById("authOverlay");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const rupees = amount =>
  "₹" + Number(amount).toLocaleString("en-IN");

// ==========================================
// IMAGE FALLBACKS
// ==========================================

function getFallbackImage(category) {
  const images = {
    coffee:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=700&q=80",

    drinks:
      "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=700&q=80",

    pizza:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80",

    burger:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",

    pasta:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=700&q=80",

    dessert:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80",

    food:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80"
  };

  return images[category] || images.food;
}

function handleImageError(image, category) {
  image.onerror = null;
  image.src = getFallbackImage(category);
}

// ==========================================
// TOAST MESSAGE
// ==========================================

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.foodieToastTimer);

  window.foodieToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ==========================================
// SAFE HTML
// ==========================================

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

// ==========================================
// LOAD MENU
// ==========================================

async function loadMenu() {
  try {
    menuGrid.innerHTML = "<p>Loading delicious food...</p>";

    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load menu.");
    }

    menuItems = result.data.filter(item =>
      item.available !== false
    );

    displayMenu();

  } catch (error) {
    console.error("Menu error:", error);

    menuGrid.innerHTML =
      "<p>Unable to load menu. Please refresh the website.</p>";
  }
}

// ==========================================
// DISPLAY MENU
// ==========================================

function displayMenu() {
  const searchText = menuSearch.value.toLowerCase().trim();

  const filteredItems = menuItems.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchText) ||
      item.category.toLowerCase().includes(searchText);

    let matchesCategory = true;

    if (activeCategory === "drinks") {
      matchesCategory =
        item.category === "drinks" ||
        item.category === "coffee";
    } else if (activeCategory !== "all") {
      matchesCategory = item.category === activeCategory;
    }

    return matchesSearch && matchesCategory;
  });

  if (filteredItems.length === 0) {
    menuGrid.innerHTML = "<p>No food items found.</p>";
    return;
  }

  menuGrid.innerHTML = filteredItems.map(item => `
    <div class="menu-card">

      <img
        src="${escapeHTML(item.image || getFallbackImage(item.category))}"
        alt="${escapeHTML(item.name)}"
        loading="lazy"
        onerror="handleImageError(this, '${escapeHTML(item.category)}')">

      <div class="menu-card-content">

        <span class="menu-tag">
          ${escapeHTML(item.tag || "")}
        </span>

        <h3>${escapeHTML(item.name)}</h3>

        <p>${escapeHTML(item.desc || "")}</p>

        <div class="menu-card-bottom">

          <strong>${rupees(item.price)}</strong>

          <button
            class="button add-cart-btn"
            data-id="${Number(item.id)}">
            Add to Cart
          </button>

        </div>
      </div>
    </div>
  `).join("");
}

// ==========================================
// SEARCH AND FILTER
// ==========================================

menuSearch.addEventListener("input", displayMenu);

document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", () => {

    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    activeCategory = button.dataset.category;

    displayMenu();
  });
});

// ==========================================
// ADD TO CART
// ==========================================

menuGrid.addEventListener("click", event => {
  const button = event.target.closest(".add-cart-btn");

  if (!button) return;

  const itemId = Number(button.dataset.id);

  const product = menuItems.find(item =>
    Number(item.id) === itemId
  );

  if (!product) {
    showToast("Product not found.");
    return;
  }

  const existingItem = cart.find(item =>
    Number(item.id) === itemId
  );

  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      id: Number(product.id),
      name: product.name,
      price: Number(product.price),
      image: product.image,
      quantity: 1
    });
  }

  renderCart();
  showToast(product.name + " added to cart!");
});

// ==========================================
// CART DISPLAY
// ==========================================

function renderCart() {
  const totalQuantity = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  cartCount.textContent = totalQuantity;
  cartTotal.textContent = rupees(totalAmount);

  if (cart.length === 0) {
    cartItemsElement.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  cartItemsElement.innerHTML = cart.map(item => `
    <div class="cart-item">

      <div>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${rupees(item.price)} × ${item.quantity}</p>
        <strong>${rupees(item.price * item.quantity)}</strong>
      </div>

      <div class="cart-item-controls">

        <button data-action="decrease" data-id="${item.id}">−</button>

        <span>${item.quantity}</span>

        <button data-action="increase" data-id="${item.id}">+</button>

        <button data-action="remove" data-id="${item.id}">
          Remove
        </button>

      </div>
    </div>
  `).join("");
}

// ==========================================
// CART CONTROLS
// ==========================================

cartItemsElement.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const itemId = Number(button.dataset.id);
  const action = button.dataset.action;

  const item = cart.find(product =>
    Number(product.id) === itemId
  );

  if (!item) return;

  if (action === "increase") {
    item.quantity++;
  }

  if (action === "decrease") {
    item.quantity--;

    if (item.quantity <= 0) {
      cart = cart.filter(product =>
        Number(product.id) !== itemId
      );
    }
  }

  if (action === "remove") {
    cart = cart.filter(product =>
      Number(product.id) !== itemId
    );
  }

  renderCart();
});

// ==========================================
// OPEN AND CLOSE CART
// ==========================================

document.getElementById("cartButton").addEventListener("click", () => {
  cartOverlay.classList.add("active");
});

document.getElementById("closeCart").addEventListener("click", () => {
  cartOverlay.classList.remove("active");
});

cartOverlay.addEventListener("click", event => {
  if (event.target === cartOverlay) {
    cartOverlay.classList.remove("active");
  }
});

// ==========================================
// PLACE ORDER
// ==========================================

document.getElementById("checkoutButton").addEventListener(
  "click",
  placeOrder
);

async function placeOrder() {
  if (cart.length === 0) {
    showToast("Your cart is empty!");
    return;
  }

  if (!currentUser) {
    showToast("Please login before ordering.");
    openAuth("login");
    return;
  }

  const mobile = prompt(
    "Enter your 10-digit mobile number:"
  );

  if (mobile === null) return;

  const cleanMobile = mobile.replace(/\D/g, "");

  if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
    showToast("Enter a valid 10-digit mobile number.");
    return;
  }

  const orderButton = document.getElementById("checkoutButton");
  const originalText = orderButton.textContent;

  try {
    orderButton.disabled = true;
    orderButton.textContent = "Submitting Order...";

    const orderData = {
      customerName: currentUser.name,
      mobile: cleanMobile,

      items: cart.map(item => ({
        id: Number(item.id),
        quantity: Number(item.quantity)
      }))
    };

    console.log("Sending order:", orderData);

    const response = await fetch(ORDER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    console.log("Order response:", result);

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || result.error || "Order submission failed."
      );
    }

    cart = [];
    renderCart();

    cartOverlay.classList.remove("active");

    alert(
      "Thank you for ordering from Foodie Cafe!\n\n" +
      "Your order has been submitted successfully."
    );

    showToast("Order placed successfully!");

  } catch (error) {
    console.error("Order error:", error);

    alert("Order failed: " + error.message);
    showToast("Order submission failed.");

  } finally {
    orderButton.disabled = false;
    orderButton.textContent = originalText;
  }
}

// ==========================================
// AUTHENTICATION
// ==========================================

function saveLogin(data) {
  if (!data.token || !data.user) {
    throw new Error("Login response is missing user or token.");
  }

  token = data.token;
  currentUser = data.user;

  localStorage.setItem("foodieToken", token);
  localStorage.setItem("foodieUser", JSON.stringify(currentUser));

  updateAuthUI();
}

function updateAuthUI() {
  const loggedIn = Boolean(token && currentUser);

  document.getElementById("loginBtn").hidden = loggedIn;
  document.getElementById("signupBtn").hidden = loggedIn;
  document.getElementById("profileBtn").hidden = !loggedIn;
  document.getElementById("logoutBtn").hidden = !loggedIn;

  document.getElementById("profileName").textContent =
    currentUser?.name || "";

  document.getElementById("profileEmail").textContent =
    currentUser?.email || "";
}

// ==========================================
// LOGIN AND SIGNUP MODAL
// ==========================================

function openAuth(mode) {
  authOverlay.classList.add("active");
  showAuthMode(mode);
}

function showAuthMode(mode) {
  const isSignup = mode === "signup";
  const isProfile = mode === "profile";

  loginForm.hidden = isSignup || isProfile;
  signupForm.hidden = !isSignup;

  document.getElementById("profilePanel").hidden = !isProfile;

  document.getElementById("authTitle").textContent =
    isProfile ? "My Profile" : isSignup ? "Create Account" : "Login";

  document.getElementById("authSubtitle").textContent =
    isProfile
      ? "Your Foodie Cafe account"
      : isSignup
        ? "Join Foodie Cafe today!"
        : "Welcome back! Please sign in.";

  document.getElementById("authMessage").textContent = "";
}

document.getElementById("loginBtn").addEventListener("click", () => {
  openAuth("login");
});

document.getElementById("signupBtn").addEventListener("click", () => {
  openAuth("signup");
});

document.getElementById("profileBtn").addEventListener("click", () => {
  openAuth("profile");
});

document.getElementById("showSignup").addEventListener("click", () => {
  showAuthMode("signup");
});

document.getElementById("showLogin").addEventListener("click", () => {
  showAuthMode("login");
});

document.getElementById("authClose").addEventListener("click", () => {
  authOverlay.classList.remove("active");
});

authOverlay.addEventListener("click", event => {
  if (event.target === authOverlay) {
    authOverlay.classList.remove("active");
  }
});

// ==========================================
// SIGNUP
// ==========================================

signupForm.addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  try {
    const response = await fetch(AUTH_API + "/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Signup failed.");
    }

    saveLogin(result);

    signupForm.reset();
    authOverlay.classList.remove("active");

    showToast("Account created successfully!");

  } catch (error) {
    console.error("Signup error:", error);

    document.getElementById("authMessage").textContent =
      error.message;
  }
});

// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(AUTH_API + "/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Login failed.");
    }

    saveLogin(result);

    loginForm.reset();
    authOverlay.classList.remove("active");

    showToast("Welcome back to Foodie Cafe!");

  } catch (error) {
    console.error("Login error:", error);

    document.getElementById("authMessage").textContent =
      error.message;
  }
});

// ==========================================
// LOGOUT
// ==========================================

function logout() {
  token = "";
  currentUser = null;

  localStorage.removeItem("foodieToken");
  localStorage.removeItem("foodieUser");

  updateAuthUI();

  authOverlay.classList.remove("active");

  showToast("You have logged out.");
}

document.getElementById("logoutBtn").addEventListener("click", logout);

document.getElementById("profileLogout").addEventListener("click", logout);

// ==========================================
// CHECK LOGIN SESSION
// ==========================================

async function checkLogin() {
  if (!token) {
    updateAuthUI();
    return;
  }

  try {
    const response = await fetch(AUTH_API + "/me", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error("Session expired.");
    }

    currentUser = result.user || result.data || currentUser;

    localStorage.setItem("foodieUser", JSON.stringify(currentUser));

  } catch (error) {
    console.log("Session:", error.message);

    token = "";
    currentUser = null;

    localStorage.removeItem("foodieToken");
    localStorage.removeItem("foodieUser");
  }

  updateAuthUI();
}

// ==========================================
// MOBILE NAVIGATION
// ==========================================

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("nav").classList.toggle("active");
});

document.querySelectorAll("#nav a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("nav").classList.remove("active");
  });
});

// ==========================================
// FOOTER YEAR
// ==========================================

document.getElementById("year").textContent =
  new Date().getFullYear();

// ==========================================
// START WEBSITE
// ==========================================

renderCart();
updateAuthUI();
checkLogin();
loadMenu();
