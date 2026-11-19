
const API_BASE = "https://foodie-cafe-backend-1.onrender.com/api";

const API_URL = `${API_BASE}/menu`;
const ORDER_API = `${API_BASE}/orders`;
const AUTH_API = `${API_BASE}/auth`;

// ================= ELEMENTS =================

const menuGrid = document.getElementById("menuGrid");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");

const cartOverlay = document.getElementById("cartOverlay");
const authOverlay = document.getElementById("authOverlay");

let menuItems = [];
let cart = [];
let activeCategory = "all";

let token = localStorage.getItem("foodieToken") || "";
let currentUser = JSON.parse(localStorage.getItem("foodieUser") || "null");

const rupees = amount =>
  "₹" + Number(amount).toLocaleString("en-IN");

// ================= TOAST =================

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ================= MENU =================

async function loadMenu() {
  try {
    menuGrid.innerHTML = "<p>Loading delicious food...</p>";

    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load menu");
    }

    menuItems = result.data || [];
    displayMenu();

  } catch (error) {
    console.error("Menu error:", error);
    menuGrid.innerHTML =
      "<p>Menu could not load. Please refresh the page.</p>";
  }
}

function displayMenu() {
  const search = document
    .getElementById("menuSearch")
    .value.toLowerCase()
    .trim();

  const filtered = menuItems.filter(item => {
    const categoryMatch =
      activeCategory === "all" ||
      item.category.toLowerCase() === activeCategory;

    const searchMatch =
      item.name.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search);

    return categoryMatch && searchMatch && item.available !== false;
  });

  if (!filtered.length) {
    menuGrid.innerHTML = "<p>No food items found.</p>";
    return;
  }

  menuGrid.innerHTML = filtered.map(item => `
    <div class="menu-card">
      <div class="menu-card-image">
        <img
          src="${escapeHTML(item.image || "")}"
          alt="${escapeHTML(item.name)}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://placehold.co/600x400?text=Foodie+Cafe'">
      </div>

      <div class="menu-card-content">
        <span class="menu-tag">${escapeHTML(item.tag || "")}</span>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.desc || "")}</p>

        <div class="menu-card-bottom">
          <strong>${rupees(item.price)}</strong>
          <button class="button" onclick="addToCart(${Number(item.id)})">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn")
      .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");
    activeCategory = button.dataset.category;
    displayMenu();
  });
});

document.getElementById("menuSearch")
  .addEventListener("input", displayMenu);

// ================= CART =================

function addToCart(id) {
  const item = menuItems.find(food => Number(food.id) === Number(id));

  if (!item) {
    showToast("Food item not found");
    return;
  }

  const existing = cart.find(food => Number(food.id) === Number(id));

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  updateCart();
  showToast(item.name + " added to cart");
}

function changeQuantity(id, amount) {
  const item = cart.find(food => Number(food.id) === Number(id));
  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(food => Number(food.id) !== Number(id));
  }

  updateCart();
}

function removeFromCart(id) {
  cart = cart.filter(food => Number(food.id) !== Number(id));
  updateCart();
}

function updateCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  cartCount.textContent = count;
  cartTotal.textContent = rupees(total);

  if (!cart.length) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${rupees(item.price)} × ${item.quantity}</p>
      </div>

      <div class="cart-controls">
        <button onclick="changeQuantity(${Number(item.id)},-1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="changeQuantity(${Number(item.id)},1)">+</button>
        <button onclick="removeFromCart(${Number(item.id)})">✕</button>
      </div>
    </div>
  `).join("");
}

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

// ================= AUTH MODAL =================

function openAuth(mode = "login") {
  authOverlay.classList.add("active");
  showAuthMode(mode);
}

function closeAuth() {
  authOverlay.classList.remove("active");
}

function showAuthMode(mode) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const profilePanel = document.getElementById("profilePanel");

  loginForm.hidden = mode !== "login";
  signupForm.hidden = mode !== "signup";
  profilePanel.hidden = mode !== "profile";

  document.getElementById("authTitle").textContent =
    mode === "signup" ? "Create Account" :
    mode === "profile" ? "My Profile" : "Login";

  document.getElementById("authSubtitle").textContent =
    mode === "signup" ? "Join Foodie Cafe today!" :
    mode === "profile" ? "Your account details" :
    "Welcome back! Please sign in.";

  document.getElementById("authMessage").textContent = "";

  if (mode === "profile" && currentUser) {
    document.getElementById("profileName").textContent = currentUser.name;
    document.getElementById("profileEmail").textContent = currentUser.email;
  }
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

document.getElementById("authClose").addEventListener("click", closeAuth);

authOverlay.addEventListener("click", event => {
  if (event.target === authOverlay) closeAuth();
});

document.getElementById("showSignup").addEventListener("click", () => {
  showAuthMode("signup");
});

document.getElementById("showLogin").addEventListener("click", () => {
  showAuthMode("login");
});

// ================= REGISTER =================

document.getElementById("signupForm")
  .addEventListener("submit", async event => {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    try {
      const response = await fetch(`${AUTH_API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Registration failed");
      }

      showToast("Account created successfully!");
      document.getElementById("signupForm").reset();
      showAuthMode("login");

    } catch (error) {
      document.getElementById("authMessage").textContent = error.message;
    }
  });

// ================= LOGIN =================

document.getElementById("loginForm")
  .addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Login failed");
      }

      token = result.token;
      currentUser = result.user;

      localStorage.setItem("foodieToken", token);
      localStorage.setItem("foodieUser", JSON.stringify(currentUser));

      updateAuthUI();
      closeAuth();
      document.getElementById("loginForm").reset();

      showToast("Welcome to Foodie Cafe!");

    } catch (error) {
      document.getElementById("authMessage").textContent = error.message;
    }
  });

// ================= AUTH STATUS =================

function updateAuthUI() {
  const loggedIn = Boolean(token && currentUser);

  document.getElementById("loginBtn").hidden = loggedIn;
  document.getElementById("signupBtn").hidden = loggedIn;
  document.getElementById("profileBtn").hidden = !loggedIn;
  document.getElementById("logoutBtn").hidden = !loggedIn;
}

async function checkLogin() {
  if (!token) {
    updateAuthUI();
    return;
  }

  try {
    const response = await fetch(`${AUTH_API}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Session expired");
    }

    currentUser = result.user;
    localStorage.setItem("foodieUser", JSON.stringify(currentUser));

  } catch (error) {
    logout(false);
  }

  updateAuthUI();
}

function logout(showMessage = true) {
  token = "";
  currentUser = null;

  localStorage.removeItem("foodieToken");
  localStorage.removeItem("foodieUser");

  updateAuthUI();
  closeAuth();

  if (showMessage) showToast("You have logged out");
}

document.getElementById("logoutBtn")
  .addEventListener("click", () => logout());

document.getElementById("profileLogout")
  .addEventListener("click", () => logout());

// ================= CHECKOUT =================

document.getElementById("checkoutButton")
  .addEventListener("click", async () => {

    if (!cart.length) {
      showToast("Your cart is empty");
      return;
    }

    if (!token || !currentUser) {
      cartOverlay.classList.remove("active");
      openAuth("login");
      showToast("Please login before placing your order");
      return;
    }

    const mobile = prompt("Enter your 10-digit mobile number:");

    if (mobile === null) return;

    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      showToast("Please enter a valid 10-digit mobile number");
      return;
    }

    const address = prompt(
      "Enter your complete delivery address, including village, area and PIN code:"
    );

    if (address === null) return;

    if (address.trim().length < 10) {
      showToast("Please enter your complete delivery address");
      return;
    }

    const orderData = {
      customerName: currentUser.name,
      mobile: mobile.trim(),
      address: address.trim(),
      items: cart.map(item => ({
        id: Number(item.id),
        quantity: Number(item.quantity)
      }))
    };

    const checkoutButton = document.getElementById("checkoutButton");
    checkoutButton.disabled = true;
    checkoutButton.textContent = "Placing Order...";

    try {
      const response = await fetch(ORDER_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Order could not be placed");
      }

      cart = [];
      updateCart();

      cartOverlay.classList.remove("active");

      showToast("Order placed successfully! Thank you.");

    } catch (error) {
      console.error("Order error:", error);
      showToast(error.message || "Something went wrong");
    } finally {
      checkoutButton.disabled = false;
      checkoutButton.textContent = "Place Order";
    }
  });

// ================= MOBILE MENU =================

document.getElementById("menuToggle")
  .addEventListener("click", () => {
    document.getElementById("nav").classList.toggle("active");
  });

document.querySelectorAll("#nav a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("nav").classList.remove("active");
  });
});

// ================= FOOTER YEAR =================

document.getElementById("year").textContent = new Date().getFullYear();

// ================= START WEBSITE =================

updateCart();
checkLogin();
loadMenu();
