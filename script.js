
// ================= API URLS =================

const API_URL = "https://foodie-cafe-backend-1.onrender.com/api/menu";
const ORDER_API = "https://foodie-cafe-backend-1.onrender.com/api/orders";
const AUTH_API = "https://foodie-cafe-backend-1.onrender.com/api/auth";

// ================= GLOBAL VARIABLES =================

let menuItems = [];
let cart = [];
let activeCategory = "all";

const grid = document.getElementById("menuGrid");

const rupees = amount =>
  "₹" + Number(amount).toLocaleString("en-IN");

// ================= LOAD MENU =================

async function loadMenu() {
  grid.innerHTML = "<p>Loading menu...</p>";

  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Unable to load menu");
    }

    menuItems = result.data;
    renderMenu();

  } catch (error) {
    console.error(error);
    grid.innerHTML = "<p>Menu could not load. Please refresh.</p>";
  }
}

// ================= DISPLAY MENU =================

function renderMenu() {
  const query = document.getElementById("searchInput")
    .value.trim().toLowerCase();

  const filtered = menuItems.filter(item =>
    (activeCategory === "all" ||
      item.category === activeCategory) &&
    (
      item.name.toLowerCase().includes(query) ||
      (item.desc || "").toLowerCase().includes(query)
    )
  );

  grid.innerHTML = filtered.length
    ? filtered.map(item => `
      <article class="menu-card">
        <div class="food-photo">
          <img
            src="${item.image}"
            alt="${item.name}"
            loading="lazy"
            onerror="this.style.display='none'"
          >
          <span class="food-tag">${item.tag || ""}</span>
        </div>

        <div class="menu-info">
          <h3>${item.name}</h3>
          <p>${item.desc || ""}</p>
          <div class="menu-meta">
            <strong>${rupees(item.price)}</strong>
            <button class="add-button" data-add="${item.id}">+</button>
          </div>
        </div>
      </article>
    `).join("")
    : "<p>No menu items found.</p>";
}

// ================= ADD TO CART =================

grid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (!button) return;

  const item = menuItems.find(
    x => Number(x.id) === Number(button.dataset.add)
  );

  if (!item) return;

  const existing = cart.find(x => x.id === item.id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      ...item,
      qty: 1
    });
  }

  updateCart();
  toast(item.name + " added to cart");
});

// ================= CATEGORY FILTER =================

document.getElementById("filters").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  activeCategory = button.dataset.category;

  document.querySelectorAll(".filter").forEach(btn => {
    btn.classList.toggle("active", btn === button);
  });

  renderMenu();
});

// ================= SEARCH =================

document.getElementById("searchInput")
  .addEventListener("input", renderMenu);

// ================= UPDATE CART =================

function updateCart() {
  document.getElementById("cartCount").textContent =
    cart.reduce((sum, item) => sum + item.qty, 0);

  document.getElementById("cartTotal").textContent =
    rupees(cart.reduce(
      (sum, item) => sum + item.price * item.qty, 0
    ));

  const cartBox = document.getElementById("cartItems");

  cartBox.innerHTML = cart.length
    ? cart.map(item => `
      <div class="cart-row">
        <div>
          <strong>${item.name}</strong>
          <small>${rupees(item.price)} each</small>
        </div>

        <div class="quantity">
          <button data-change="${item.id}" data-delta="-1">−</button>
          <span>${item.qty}</span>
          <button data-change="${item.id}" data-delta="1">+</button>
        </div>
      </div>
    `).join("")
    : "<p class='empty-cart'>Your basket is empty.</p>";
}

// ================= CART QUANTITY =================

document.getElementById("cartItems").addEventListener("click", event => {
  const button = event.target.closest("[data-change]");
  if (!button) return;

  const item = cart.find(
    x => x.id === Number(button.dataset.change)
  );

  if (!item) return;

  item.qty += Number(button.dataset.delta);

  if (item.qty <= 0) {
    cart = cart.filter(x => x.id !== item.id);
  }

  updateCart();
});

// ================= TOAST MESSAGE =================

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => el.classList.remove("show"), 1900);
}

// ================= CART OPEN / CLOSE =================

const drawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("cartOverlay");

function openCart() {
  drawer.classList.add("open");
  overlay.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  drawer.classList.remove("open");
  overlay.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

document.getElementById("cartOpen").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

// ================= CHECKOUT =================

document.getElementById("checkout").addEventListener("click", async () => {
  if (!cart.length) {
    toast("Please add items to your cart.");
    return;
  }

  const customerName = prompt("Enter your full name:");

  if (customerName === null || !customerName.trim()) {
    toast("Please enter your name.");
    return;
  }

  const mobile = prompt("Enter your 10-digit mobile number:");

  if (mobile === null || !/^[0-9]{10}$/.test(mobile.trim())) {
    toast("Please enter a valid 10-digit mobile number.");
    return;
  }

  const orderData = {
    customerName: customerName.trim(),
    mobile: mobile.trim(),
    items: cart.map(item => ({
      id: item.id,
      quantity: item.qty
    }))
  };

  const checkoutButton = document.getElementById("checkout");
  checkoutButton.disabled = true;

  try {
    const response = await fetch(ORDER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Order failed");
    }

    toast("Your order has been saved successfully!");

    cart = [];
    updateCart();
    closeCart();

  } catch (error) {
    console.error("Checkout error:", error);
    toast(error.message || "Unable to place order.");
  } finally {
    checkoutButton.disabled = false;
  }
});

// ==================================================
//                 AUTHENTICATION
// ==================================================

const authOverlay = document.getElementById("authOverlay");
const authClose = document.getElementById("authClose");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const profileBtn = document.getElementById("profileBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const profilePanel = document.getElementById("profilePanel");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authMessage = document.getElementById("authMessage");

// Get saved user

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("foodieUser"));
  } catch {
    return null;
  }
}

// Save login data

function saveLogin(data) {
  localStorage.setItem("foodieToken", data.token);
  localStorage.setItem("foodieUser", JSON.stringify(data.user));
  updateAuthUI();
}

// Open authentication popup

function openAuth(mode = "login") {
  authOverlay.classList.add("active");
  authOverlay.setAttribute("aria-hidden", "false");
  showAuthForm(mode);
}

// Close authentication popup

function closeAuth() {
  authOverlay.classList.remove("active");
  authOverlay.setAttribute("aria-hidden", "true");
  authMessage.textContent = "";
}

// Show login or signup

function showAuthForm(mode) {
  loginForm.style.display = mode === "login" ? "block" : "none";
  signupForm.style.display = mode === "signup" ? "block" : "none";
  profilePanel.style.display = "none";

  authTitle.textContent =
    mode === "login" ? "Welcome back." : "Create your account.";

  authSubtitle.textContent =
    mode === "login"
      ? "Login to enjoy your favourite moments."
      : "Join the Foodie Cafe family.";

  authMessage.textContent = "";
}

// Show profile

function showProfile(user) {
  loginForm.style.display = "none";
  signupForm.style.display = "none";
  profilePanel.style.display = "block";

  authTitle.textContent = "My Profile";
  authSubtitle.textContent = "Welcome to Foodie Cafe.";

  document.getElementById("profileName").textContent =
    user.name || "Foodie Customer";

  document.getElementById("profileEmail").textContent =
    user.email || "";
}

// Update navigation

function updateAuthUI() {
  const user = getLoggedInUser();

  loginBtn.style.display = user ? "none" : "inline-block";
  signupBtn.style.display = user ? "none" : "inline-block";
  profileBtn.style.display = user ? "inline-block" : "none";
  logoutBtn.style.display = user ? "inline-block" : "none";
}

// ================= SIGNUP =================

signupForm.addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  const submitButton = signupForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Creating account...";

  try {
    const response = await fetch(`${AUTH_API}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Signup failed");
    }

    saveLogin(data);
    signupForm.reset();

    toast("Account created successfully!");
    closeAuth();

  } catch (error) {
    authMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create my account →";
  }
});

// ================= LOGIN =================

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const submitButton = loginForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Logging in...";

  try {
    const response = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Login failed");
    }

    saveLogin(data);
    loginForm.reset();

    toast("Login successful!");
    closeAuth();

  } catch (error) {
    authMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Login to your account →";
  }
});

// ================= PROFILE =================

async function loadUserProfile() {
  const token = localStorage.getItem("foodieToken");

  if (!token) {
    toast("Please login first.");
    openAuth("login");
    return;
  }

  try {
    const response = await fetch(`${AUTH_API}/me`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Session expired");
    }

    localStorage.setItem("foodieUser", JSON.stringify(data.user));
    showProfile(data.user);
    authOverlay.classList.add("active");
    authOverlay.setAttribute("aria-hidden", "false");

  } catch (error) {
    localStorage.removeItem("foodieToken");
    localStorage.removeItem("foodieUser");
    updateAuthUI();
    toast("Please login again.");
    openAuth("login");
  }
}

// ================= LOGOUT =================

function logoutUser() {
  localStorage.removeItem("foodieToken");
  localStorage.removeItem("foodieUser");

  updateAuthUI();
  closeAuth();
  toast("You have logged out.");
}

// ================= AUTH BUTTON EVENTS =================

loginBtn.addEventListener("click", () => openAuth("login"));

signupBtn.addEventListener("click", () => openAuth("signup"));

profileBtn.addEventListener("click", loadUserProfile);

logoutBtn.addEventListener("click", logoutUser);

authClose.addEventListener("click", closeAuth);

authOverlay.addEventListener("click", event => {
  if (event.target === authOverlay) {
    closeAuth();
  }
});

document.getElementById("showSignup").addEventListener("click", () => {
  showAuthForm("signup");
});

document.getElementById("showLogin").addEventListener("click", () => {
  showAuthForm("login");
});

document.getElementById("profileLogout").addEventListener("click", logoutUser);

// ================= MOBILE NAVIGATION =================

const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");

toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.textContent = isOpen ? "×" : "☰";
});

nav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☰";
  });
});

// Close mobile menu after clicking auth buttons

[loginBtn, signupBtn, profileBtn, logoutBtn].forEach(button => {
  button.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☰";
  });
});

// ================= WEBSITE YEAR =================

document.getElementById("year").textContent =
  new Date().getFullYear();

// ================= START WEBSITE =================

updateCart();
updateAuthUI();
loadMenu();
