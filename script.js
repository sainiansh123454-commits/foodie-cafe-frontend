
 // ================= FOODIE CAFE CONFIG =================
const API_BASE = "https://foodie-cafe-backend.onrender.com/api";

// ================= STATE =================
let menuItems = [];
let cart = [];
let activeCategory = "all";
let currentUser = null;

const token = () => localStorage.getItem("foodieToken");

const rupees = (amount) =>
  "₹" + Number(amount || 0).toLocaleString("en-IN");

const get = (id) => document.getElementById(id);

const showToast = (message) => {
  const toast = get("toast");

  if (toast) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  } else {
    alert(message);
  }
};

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

    if (!menuItems.length) {
      grid.innerHTML = "<p>No menu items are available right now.</p>";
      return;
    }

    renderMenu();
  } catch (error) {
    console.error("Menu loading error:", error);
    grid.innerHTML = `
      <p class="menu-error">
        Could not load menu. Please refresh the page.
      </p>
    `;
  }
}

function renderMenu() {
  const grid = get("menuGrid");
  if (!grid) return;

  const searchInput = get("menuSearch");
  const searchText = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

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

  grid.innerHTML = filteredItems.map((item) => {
    // Use the new image for Velvet Cappuccino only.
    const imageUrl = String(item.id) === "1"
      ? "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=700&q=80"
      : item.image || "";

    return `
      <article class="menu-card">
        <div class="menu-card-image">
          <img
            src="${escapeHTML(imageUrl)}"
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
    `;
  }).join("");

  grid.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(button.dataset.add);
    });
  });
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ================= CATEGORY AND SEARCH =================
document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = String(button.dataset.category || "all").toLowerCase();

    document.querySelectorAll(".filter-btn").forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    renderMenu();
  });
});

if (get("menuSearch")) {
  get("menuSearch").addEventListener("input", renderMenu);
}

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
      image: item.image,
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
  const cartCountElement = get("cartCount");
  const cartTotalElement = get("cartTotal");

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (cartCountElement) cartCountElement.textContent = count;
  if (cartTotalElement) cartTotalElement.textContent = rupees(total);

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
  const overlay = get("cartOverlay");
  if (overlay) overlay.classList.add("active");
}

function closeCart() {
  const overlay = get("cartOverlay");
  if (overlay) overlay.classList.remove("active");
}

if (get("cartButton")) {
  get("cartButton").addEventListener("click", openCart);
}

if (get("cartOverlay")) {
  get("cartOverlay").addEventListener("click", (event) => {
    if (event.target === get("cartOverlay")) closeCart();
  });
}

// ================= AUTH PANEL =================
function openAuthPanel() {
  const overlay = get("authOverlay");
  if (overlay) overlay.classList.add("active");
}

function closeAuthPanel() {
  const overlay = get("authOverlay");
  if (overlay) overlay.classList.remove("active");
}

if (get("authClose")) {
  get("authClose").addEventListener("click", closeAuthPanel);
}

if (get("authOverlay")) {
  get("authOverlay").addEventListener("click", (event) => {
    if (event.target === get("authOverlay")) closeAuthPanel();
  });
}

if (get("loginBtn")) {
  get("loginBtn").addEventListener("click", openAuthPanel);
}

if (get("signupBtn")) {
  get("signupBtn").addEventListener("click", openAuthPanel);
}

function formValue(form, names) {
  for (const name of names) {
    const field =
      form.querySelector(`[name="${name}"]`) ||
      form.querySelector(`#${name}`);

    if (field && field.value) return field.value.trim();
  }

  return "";
}

function setAuthStatus(message) {
  showToast(message);
}

// ================= SIGNUP =================
if (get("signupForm")) {
  get("signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const name = formValue(form, ["name", "fullName", "customerName"]);
    const email = formValue(form, ["email"]);
    const mobile = formValue(form, ["mobile", "phone", "phoneNumber"]);
    const password = formValue(form, ["password"]);

    if (!name || !email || !password) {
      setAuthStatus("Enter your name, email and password.");
      return;
    }

    try {
      const result = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, mobile, password })
      });

      if (result.token) {
        localStorage.setItem("foodieToken", result.token);
      }

      if (result.user) {
        localStorage.setItem("foodieUser", JSON.stringify(result.user));
      }

      currentUser = result.user || null;

      updateAuthUI();
      form.reset();
      closeAuthPanel();
      setAuthStatus("Account created successfully.");
    } catch (error) {
      setAuthStatus(error.message);
    }
  });
}

// ================= LOGIN =================
if (get("loginForm")) {
  get("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const email = formValue(form, ["email"]);
    const password = formValue(form, ["password"]);

    if (!email || !password) {
      setAuthStatus("Enter your email and password.");
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
      form.reset();
      closeAuthPanel();
      setAuthStatus("Login successful.");
    } catch (error) {
      setAuthStatus(error.message);
    }
  });
}

// ================= PROFILE =================
function updateAuthUI() {
  const profileButton = get("profileBtn");
  const loginButton = get("loginBtn");
  const signupButton = get("signupBtn");
  const logoutButton = get("logoutBtn");

  if (currentUser) {
    if (profileButton) profileButton.hidden = false;
    if (loginButton) loginButton.hidden = true;
    if (signupButton) signupButton.hidden = true;
    if (logoutButton) logoutButton.hidden = false;
  } else {
    if (profileButton) profileButton.hidden = true;
    if (loginButton) loginButton.hidden = false;
    if (signupButton) signupButton.hidden = false;
    if (logoutButton) logoutButton.hidden = true;
  }
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

    if (currentUser) {
      localStorage.setItem("foodieUser", JSON.stringify(currentUser));
    }

    updateAuthUI();
  } catch (error) {
    console.warn("Could not load user profile:", error);

    localStorage.removeItem("foodieToken");
    localStorage.removeItem("foodieUser");

    currentUser = null;
    updateAuthUI();
  }
}

if (get("logoutBtn")) {
  get("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("foodieToken");
    localStorage.removeItem("foodieUser");

    currentUser = null;
    updateAuthUI();
    showToast("Logged out.");
  });
}

if (get("profileBtn")) {
  get("profileBtn").addEventListener("click", () => {
    const panel = get("profilePanel");
    if (!panel) return;

    panel.innerHTML = currentUser
      ? `<p><strong>${escapeHTML(currentUser.name || "Customer")}</strong></p>
         <p>${escapeHTML(currentUser.email || "")}</p>
         <p>${escapeHTML(currentUser.mobile || currentUser.phone || "")}</p>`
      : "<p>Please sign in to view your profile.</p>";

    panel.classList.toggle("active");
  });
}

// ================= CHECKOUT =================
if (get("checkoutButton")) {
  get("checkoutButton").addEventListener("click", async () => {
    if (!cart.length) {
      showToast("Your cart is empty.");
      return;
    }

    if (!token()) {
      showToast("Please sign in before placing an order.");
      openAuthPanel();
      return;
    }

    const mobile = prompt("Enter your contact number:");
    if (!mobile) return;

    const address = prompt("Enter your complete delivery address:");
    if (!address) return;

    const customerName =
      currentUser?.name ||
      prompt("Enter your name:");

    if (!customerName) return;

    const orderData = {
      customerName,
      mobile,
      address,
      items: cart.map((item) => ({
        id: item.id,
        quantity: item.quantity
      }))
    };

    try {
      const result = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(orderData)
      });

      cart = [];
      renderCart();
      closeCart();

      showToast(result.message || "Order placed successfully.");
    } catch (error) {
      console.error("Order error:", error);
      showToast(error.message || "Could not place your order.");
    }
  });
}

// ================= MOBILE MENU =================
if (get("menuToggle") && get("nav")) {
  get("menuToggle").addEventListener("click", () => {
    get("nav").classList.toggle("active");
  });
}

// ================= FOOTER YEAR =================
if (get("year")) {
  get("year").textContent = new Date().getFullYear();
}

// ================= START =================
renderCart();
loadMenu();
loadCurrentUser();
