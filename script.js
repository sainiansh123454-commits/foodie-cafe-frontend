// ================= FOODIE CAFE CONFIG =================
const API_BASE = "https://foodie-cafe-backend.onrender.com/api";

// ================= STATE =================
let menuItems = [];
let cart = [];
let activeCategory = "all";
let currentUser = null;

const get = (id) => document.getElementById(id);
const token = () => localStorage.getItem("foodieToken");

const rupees = (amount) =>
  "₹" + Number(amount || 0).toLocaleString("en-IN");

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const toast = get("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token()) {
    headers.Authorization = `Bearer ${token()}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Request failed.");
  }

  return result;
}

// ================= MENU =================
async function loadMenu() {
  const grid = get("menuGrid");
  if (!grid) return;

  grid.innerHTML = "<p>Loading menu...</p>";

  try {
    const result = await apiRequest("/menu");
    menuItems = Array.isArray(result.data) ? result.data : [];
    renderMenu();
  } catch (error) {
    console.error("Menu loading error:", error);
    grid.innerHTML = "<p>Could not load menu. Please refresh the page.</p>";
  }
}

function renderMenu() {
  const grid = get("menuGrid");
  if (!grid) return;

  const searchText = (get("menuSearch")?.value || "")
    .trim()
    .toLowerCase();

  const filteredItems = menuItems.filter((item) => {
    const categoryMatches =
      activeCategory === "all" ||
      String(item.category || "").toLowerCase() === activeCategory;

    const searchMatches =
      !searchText ||
      `${item.name || ""} ${item.desc || ""} ${item.category || ""}`
        .toLowerCase()
        .includes(searchText);

    return categoryMatches && searchMatches && item.available !== false;
  });

  if (!filteredItems.length) {
    grid.innerHTML = "<p>No items found. Try another category or search.</p>";
    return;
  }

  grid.innerHTML = filteredItems.map((item) => `
    <article class="menu-card">
      <div class="menu-card-image">
        <img
          src="${escapeHTML(item.image || "")}"
          alt="${escapeHTML(item.name || "Menu item")}"
          loading="lazy"
          onerror="this.style.display='none'"
        >
        ${item.tag ? `<span class="menu-tag">${escapeHTML(item.tag)}</span>` : ""}
      </div>

      <div class="menu-card-content">
        <h3>${escapeHTML(item.name || "Menu item")}</h3>
        <p>${escapeHTML(item.desc || "")}</p>

        <div class="menu-card-bottom">
          <strong>${rupees(item.price)}</strong>
          <button
            type="button"
            class="add-to-cart"
            data-add="${escapeHTML(item.id)}"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(button.dataset.add);
    });
  });
}

// Menu category filters
document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = String(button.dataset.category || "all").toLowerCase();

    document.querySelectorAll(".filter-btn").forEach((filter) => {
      filter.classList.remove("active");
    });

    button.classList.add("active");
    renderMenu();
  });
});

get("menuSearch")?.addEventListener("input", renderMenu);

// ================= CART =================
function addToCart(itemId) {
  const item = menuItems.find(
    (menuItem) => String(menuItem.id) === String(itemId)
  );

  if (!item) {
    showToast("Item could not be found.");
    return;
  }

  const existing = cart.find(
    (cartItem) => String(cartItem.id) === String(itemId)
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: 1
    });
  }

  renderCart();
  showToast(`${item.name} added to cart.`);
}

function changeQuantity(itemId, amount) {
  const item = cart.find(
    (cartItem) => String(cartItem.id) === String(itemId)
  );

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(
      (cartItem) => String(cartItem.id) !== String(itemId)
    );
  }

  renderCart();
}

function renderCart() {
  const cartItemsElement = get("cartItems");
  const countElement = get("cartCount");
  const totalElement = get("cartTotal");

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (countElement) countElement.textContent = count;
  if (totalElement) totalElement.textContent = rupees(total);
  if (!cartItemsElement) return;

  if (!cart.length) {
    cartItemsElement.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  cartItemsElement.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div>
        <strong>${escapeHTML(item.name)}</strong>
        <p>${rupees(item.price)} × ${item.quantity}</p>
      </div>

      <div class="cart-item-controls">
        <button type="button" data-minus="${escapeHTML(item.id)}">−</button>
        <span>${item.quantity}</span>
        <button type="button" data-plus="${escapeHTML(item.id)}">+</button>
      </div>
    </div>
  `).join("");

  cartItemsElement.querySelectorAll("[data-minus]").forEach((button) => {
    button.addEventListener("click", () => {
      changeQuantity(button.dataset.minus, -1);
    });
  });

  cartItemsElement.querySelectorAll("[data-plus]").forEach((button) => {
    button.addEventListener("click", () => {
      changeQuantity(button.dataset.plus, 1);
    });
  });
}

function openCart() {
  get("cartOverlay")?.classList.add("active");
}

function closeCart() {
  get("cartOverlay")?.classList.remove("active");
}

get("cartButton")?.addEventListener("click", openCart);
get("closeCart")?.addEventListener("click", closeCart);

get("cartOverlay")?.addEventListener("click", (event) => {
  if (event.target === get("cartOverlay")) {
    closeCart();
  }
});

// ================= LOGIN / SIGNUP PANEL =================
function openAuthPanel() {
  get("authOverlay")?.classList.add("active");
}

function closeAuthPanel() {
  get("authOverlay")?.classList.remove("active");
}

function showLoginForm() {
  if (get("loginForm")) get("loginForm").hidden = false;
  if (get("signupForm")) get("signupForm").hidden = true;
  if (get("authTitle")) get("authTitle").textContent = "Login";
  if (get("authSubtitle")) {
    get("authSubtitle").textContent = "Welcome back! Please sign in.";
  }
}

function showSignupForm() {
  if (get("loginForm")) get("loginForm").hidden = true;
  if (get("signupForm")) get("signupForm").hidden = false;
  if (get("authTitle")) get("authTitle").textContent = "Create Account";
  if (get("authSubtitle")) {
    get("authSubtitle").textContent = "Create your Foodie Cafe account.";
  }
}

get("authClose")?.addEventListener("click", closeAuthPanel);

get("authOverlay")?.addEventListener("click", (event) => {
  if (event.target === get("authOverlay")) {
    closeAuthPanel();
  }
});

get("loginBtn")?.addEventListener("click", () => {
  showLoginForm();
  openAuthPanel();
});

get("signupBtn")?.addEventListener("click", () => {
  showSignupForm();
  openAuthPanel();
});

get("showSignup")?.addEventListener("click", showSignupForm);
get("showLogin")?.addEventListener("click", showLoginForm);

// ================= SIGNUP =================
get("signupForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = get("signupName")?.value.trim() || "";
  const email = get("signupEmail")?.value.trim() || "";
  const password = get("signupPassword")?.value || "";

  if (!name || !email || !password) {
    showToast("Enter your name, email and password.");
    return;
  }

  try {
    const result = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });

    if (result.token) {
      localStorage.setItem("foodieToken", result.token);
    }

    if (result.user) {
      localStorage.setItem("foodieUser", JSON.stringify(result.user));
    }

    currentUser = result.user || null;
    updateAuthUI();

    get("signupForm").reset();
    closeAuthPanel();
    showToast("Account created successfully.");
  } catch (error) {
    showToast(error.message || "Signup failed.");
  }
});

// ================= LOGIN =================
get("loginForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Read the exact IDs used in your index.html.
  const email = get("loginEmail")?.value.trim() || "";
  const password = get("loginPassword")?.value || "";

  if (!email || !password) {
    showToast("Enter your email and password.");
    return;
  }

  try {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    if (result.token) {
      localStorage.setItem("foodieToken", result.token);
    }

    if (result.user) {
      localStorage.setItem("foodieUser", JSON.stringify(result.user));
    }

    currentUser = result.user || null;
    updateAuthUI();

    get("loginForm").reset();
    closeAuthPanel();
    showToast("Login successful.");
  } catch (error) {
    showToast(error.message || "Login failed.");
  }
});

// ================= PROFILE / LOGOUT =================
function updateAuthUI() {
  if (get("profileBtn")) get("profileBtn").hidden = !currentUser;
  if (get("loginBtn")) get("loginBtn").hidden = !!currentUser;
  if (get("signupBtn")) get("signupBtn").hidden = !!currentUser;
  if (get("logoutBtn")) get("logoutBtn").hidden = !currentUser;
}

async function loadCurrentUser() {
  if (!token()) {
    currentUser = null;
    updateAuthUI();
    return;
  }

  try {
    const result = await apiRequest("/auth/me");
    currentUser = result.user || result.data || null;
    updateAuthUI();
  } catch (error) {
    console.warn("Could not load user profile:", error);
    localStorage.removeItem("foodieToken");
    localStorage.removeItem("foodieUser");
    currentUser = null;
    updateAuthUI();
  }
}

function logout() {
  localStorage.removeItem("foodieToken");
  localStorage.removeItem("foodieUser");
  currentUser = null;

  if (get("profilePanel")) get("profilePanel").hidden = true;

  updateAuthUI();
  showToast("Logged out.");
}

get("logoutBtn")?.addEventListener("click", logout);
get("profileLogout")?.addEventListener("click", logout);

get("profileBtn")?.addEventListener("click", () => {
  const panel = get("profilePanel");
  if (!panel) return;

  if (!currentUser) {
    showToast("Please log in to view your profile.");
    return;
  }

  if (get("profileName")) {
    get("profileName").textContent = currentUser.name || "";
  }

  if (get("profileEmail")) {
    get("profileEmail").textContent = currentUser.email || "";
  }

  panel.hidden = false;
});

// ================= CHECKOUT =================
get("checkoutButton")?.addEventListener("click", async () => {
  if (!cart.length) {
    showToast("Your cart is empty.");
    return;
  }

  if (!token()) {
    showToast("Please log in before placing an order.");
    showLoginForm();
    openAuthPanel();
    return;
  }

  const mobile = prompt("Enter your contact number:");
  if (!mobile) return;

  const address = prompt("Enter your complete delivery address:");
  if (!address) return;

  const customerName = currentUser?.name || prompt("Enter your name:");
  if (!customerName) return;

  try {
    const result = await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify({
        customerName,
        mobile,
        address,
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity
        }))
      })
    });

    cart = [];
    renderCart();
    closeCart();
    showToast(result.message || "Order placed successfully.");
  } catch (error) {
    showToast(error.message || "Could not place your order.");
  }
});

// ================= MOBILE MENU / FOOTER =================
get("menuToggle")?.addEventListener("click", () => {
  get("nav")?.classList.toggle("active");
});

if (get("year")) {
  get("year").textContent = new Date().getFullYear();
}

// ================= START =================
renderCart();
loadMenu();
loadCurrentUser();
