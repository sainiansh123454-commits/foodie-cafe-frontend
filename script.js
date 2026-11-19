
const API_URL = "https://foodie-cafe-backend-1.onrender.com/api/menu";
const ORDER_API = "https://foodie-cafe-backend-1.onrender.com/api/orders";
const AUTH_API = "https://foodie-cafe-backend-1.onrender.com/api/auth";

let menuItems = [];
let cart = [];
let activeCategory = "all";

const grid = document.getElementById("menuGrid");
const cartOverlay = document.getElementById("cartOverlay");
const cartItemsContainer = document.getElementById("cartItems");

const rupees = amount =>
  "₹" + Number(amount || 0).toLocaleString("en-IN");

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// ================= MENU =================

async function loadMenu() {
  grid.innerHTML = "<p>Loading delicious food...</p>";

  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load menu");
    }

    menuItems = result.data || [];
    renderMenu();

  } catch (error) {
    console.error("Menu error:", error);
    grid.innerHTML =
      "<p>Menu could not be loaded. Please refresh the page.</p>";
  }
}

function getItemName(item) {
  return item.name || item.title || item.itemName || "Food Item";
}

function getItemImage(item) {
  return item.image || item.imageUrl || item.photo ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";
}

function getItemCategory(item) {
  return String(item.category || "other").toLowerCase();
}

function renderMenu() {
  const searchInput = document.getElementById("menuSearch");
  const search = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const filtered = menuItems.filter(item => {
    const name = getItemName(item).toLowerCase();
    const description = String(item.description || "").toLowerCase();
    const category = getItemCategory(item);

    const matchesCategory =
      activeCategory === "all" || category === activeCategory;

    const matchesSearch =
      name.includes(search) || description.includes(search);

    return matchesCategory && matchesSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = "<p>No food items found.</p>";
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const name = escapeHTML(getItemName(item));
    const description = escapeHTML(item.description || "Fresh and delicious.");
    const image = escapeHTML(getItemImage(item));
    const price = Number(item.price || 0);

    return `
      <article class="menu-card">
        <img
          src="${image}"
          alt="${name}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';">

        <div class="menu-info">
          <h3>${name}</h3>
          <p>${description}</p>

          <div class="menu-meta">
            <strong>${rupees(price)}</strong>
            <button
              class="add-button"
              onclick="addToCart('${escapeHTML(item._id || item.id)}')">
              + Add
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// Category buttons
document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(btn =>
      btn.classList.remove("active")
    );

    button.classList.add("active");
    activeCategory = button.dataset.category;
    renderMenu();
  });
});

// Search
document.getElementById("menuSearch").addEventListener("input", renderMenu);

// ================= CART =================

function addToCart(id) {
  const item = menuItems.find(
    food => String(food._id || food.id) === String(id)
  );

  if (!item) return;

  const existing = cart.find(
    food => String(food._id || food.id) === String(id)
  );

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  updateCart();
  showToast(getItemName(item) + " added to cart!");
}

function changeQuantity(id, change) {
  const item = cart.find(
    food => String(food._id || food.id) === String(id)
  );

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(
      food => String(food._id || food.id) !== String(id)
    );
  }

  updateCart();
}

function updateCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );

  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent = rupees(total);

  if (!cart.length) {
    cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="cart-row">
      <div>
        <strong>${escapeHTML(getItemName(item))}</strong>
        <p>${rupees(item.price)} × ${item.quantity}</p>
      </div>

      <div class="quantity">
        <button onclick="changeQuantity('${escapeHTML(item._id || item.id)}', -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="changeQuantity('${escapeHTML(item._id || item.id)}', 1)">+</button>
      </div>
    </div>
  `).join("");
}

// Open and close cart
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

// ================= CHECKOUT =================

async function checkout() {
  if (!cart.length) {
    showToast("Your cart is empty!");
    return;
  }

  const customerName = prompt("Enter your full name:");
  if (!customerName || !customerName.trim()) return;

  const phone = prompt("Enter your mobile number:");
  if (!phone || !/^[6-9]\d{9}$/.test(phone.trim())) {
    showToast("Please enter a valid 10-digit mobile number.");
    return;
  }

  const address = prompt("Enter your complete delivery address:");
  if (!address || !address.trim()) return;

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );

  const order = {
    customerName: customerName.trim(),
    phone: phone.trim(),
    address: address.trim(),
    items: cart.map(item => ({
      name: getItemName(item),
      price: Number(item.price || 0),
      quantity: item.quantity
    })),
    total
  };

  try {
    const response = await fetch(ORDER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(order)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Order could not be placed.");
    }

    showToast("Your order has been placed successfully!");
    cart = [];
    updateCart();
    cartOverlay.classList.remove("active");

  } catch (error) {
    console.error("Order error:", error);
    showToast(error.message || "Order failed. Please try again.");
  }
}

document.getElementById("checkoutButton").addEventListener("click", checkout);

// ================= AUTHENTICATION =================

function saveLogin(data) {
  const token = data.token || data.data?.token;
  const user = data.user || data.data?.user;

  if (!token) {
    throw new Error("Login token was not received from the server.");
  }

  localStorage.setItem("foodieToken", token);

  if (user) {
    localStorage.setItem("foodieUser", JSON.stringify(user));
  }

  updateAuthUI();
}

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("foodieUser"));
  } catch {
    return null;
  }
}

function openAuth(mode = "login") {
  document.getElementById("authOverlay").classList.add("active");
  showAuthForm(mode);
}

function closeAuth() {
  document.getElementById("authOverlay").classList.remove("active");
}

function showAuthForm(mode) {
  const isSignup = mode === "signup";

  document.getElementById("loginForm").hidden = isSignup;
  document.getElementById("signupForm").hidden = !isSignup;
  document.getElementById("profilePanel").hidden = true;

  document.getElementById("authTitle").textContent =
    isSignup ? "Create Account" : "Login";

  document.getElementById("authSubtitle").textContent =
    isSignup ? "Join Foodie Cafe today!" : "Welcome back! Please sign in.";

  document.getElementById("authMessage").textContent = "";
}

function updateAuthUI() {
  const user = getLoggedInUser();
  const token = localStorage.getItem("foodieToken");

  document.getElementById("loginBtn").hidden = !!token;
  document.getElementById("signupBtn").hidden = !!token;
  document.getElementById("profileBtn").hidden = !token;
  document.getElementById("logoutBtn").hidden = !token;
}

async function authRequest(endpoint, body) {
  const response = await fetch(`${AUTH_API}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Authentication failed.");
  }

  return result;
}

// Sign up
document.getElementById("signupForm").addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  const message = document.getElementById("authMessage");
  message.textContent = "Creating your account...";

  try {
    const result = await authRequest("register", {
      name,
      email,
      password
    });

    if (result.token || result.data?.token) {
      saveLogin(result);
      message.textContent = "Account created successfully!";
      closeAuth();
    } else {
      message.textContent = "Account created! Please log in.";
      document.getElementById("loginEmail").value = email;
      showAuthForm("login");
    }

  } catch (error) {
    message.textContent = error.message;
  }
});

// Login
document.getElementById("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const message = document.getElementById("authMessage");
  message.textContent = "Signing in...";

  try {
    const result = await authRequest("login", {
      email,
      password
    });

    saveLogin(result);
    closeAuth();
    showToast("Welcome to Foodie Cafe!");

  } catch (error) {
    message.textContent = error.message;
  }
});

// Profile
async function loadProfile() {
  const token = localStorage.getItem("foodieToken");

  if (!token) {
    openAuth("login");
    return;
  }

  try {
    const response = await fetch(`${AUTH_API}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Please log in again.");
    }

    const user = result.user || result.data?.user || result.data;

    localStorage.setItem("foodieUser", JSON.stringify(user));

    document.getElementById("profileName").textContent = user.name || "";
    document.getElementById("profileEmail").textContent = user.email || "";

    document.getElementById("loginForm").hidden = true;
    document.getElementById("signupForm").hidden = true;
    document.getElementById("profilePanel").hidden = false;

    document.getElementById("authTitle").textContent = "My Profile";
    document.getElementById("authSubtitle").textContent =
      "Your Foodie Cafe account";

    document.getElementById("authMessage").textContent = "";
    document.getElementById("authOverlay").classList.add("active");

  } catch (error) {
    logout();
    showToast(error.message);
  }
}

// Logout
function logout() {
  localStorage.removeItem("foodieToken");
  localStorage.removeItem("foodieUser");

  updateAuthUI();
  closeAuth();
  showToast("You have been logged out.");
}

// Auth buttons
document.getElementById("loginBtn").addEventListener("click", () => {
  openAuth("login");
});

document.getElementById("signupBtn").addEventListener("click", () => {
  openAuth("signup");
});

document.getElementById("showSignup").addEventListener("click", () => {
  showAuthForm("signup");
});

document.getElementById("showLogin").addEventListener("click", () => {
  showAuthForm("login");
});

document.getElementById("profileBtn").addEventListener("click", loadProfile);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("profileLogout").addEventListener("click", logout);

document.getElementById("authClose").addEventListener("click", closeAuth);

document.getElementById("authOverlay").addEventListener("click", event => {
  if (event.target.id === "authOverlay") {
    closeAuth();
  }
});

// ================= MOBILE NAV =================

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("nav").classList.toggle("active");
});

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("nav").classList.remove("active");
  });
});

// ================= TOAST =================

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ================= INITIALIZE =================

document.getElementById("year").textContent = new Date().getFullYear();

updateCart();
updateAuthUI();
loadMenu();
