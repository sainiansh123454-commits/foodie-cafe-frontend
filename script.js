

const API_URL = "https://foodie-cafe-backend-1.onrender.com/api/menu";

let menuItems = [];
let cart = [];
let activeCategory = "all";

const grid = document.getElementById("menuGrid");
const rupees = n => "₹" + Number(n).toLocaleString("en-IN");

// Load menu items from the backend
async function loadMenu() {
  grid.innerHTML = '<p class="empty-cart">Loading menu...</p>';

  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      throw new Error("Menu could not be loaded");
    }

    menuItems = result.data.map(item => ({
      ...item,
      id: Number(item.id),
      price: Number(item.price),
      name: item.name || "Menu item",
      category: item.category || "food",
      tag: item.tag || "",
      desc: item.desc || "",
      image: item.image || ""
    }));

    renderMenu();

  } catch (error) {
    console.error("Menu loading error:", error);
    grid.innerHTML =
      '<p class="empty-cart">Unable to load menu. Please refresh the page.</p>';
  }
}

// Display menu items
function renderMenu() {
  const query = document.getElementById("searchInput").value
    .trim()
    .toLowerCase();

  const filtered = menuItems.filter(item =>
    (activeCategory === "all" || item.category === activeCategory) &&
    (
      item.name.toLowerCase().includes(query) ||
      item.desc.toLowerCase().includes(query)
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
          <span class="food-tag">${item.tag}</span>
        </div>

        <div class="menu-info">
          <h3>${item.name}</h3>
          <p>${item.desc}</p>

          <div class="menu-meta">
            <strong>${rupees(item.price)}</strong>
            <button
              class="add-button"
              data-add="${item.id}"
              aria-label="Add ${item.name} to order"
            >+</button>
          </div>
        </div>
      </article>
    `).join("")
    : '<p class="empty-cart">No items found. Try another search.</p>';
}

// Update shopping cart
function updateCart() {
  document.getElementById("cartCount").textContent =
    cart.reduce((sum, item) => sum + item.qty, 0);

  document.getElementById("cartTotal").textContent =
    rupees(cart.reduce((sum, item) => sum + item.price * item.qty, 0));

  const box = document.getElementById("cartItems");

  box.innerHTML = cart.length
    ? cart.map(item => `
      <div class="cart-row">
        <div>
          <strong>${item.name}</strong>
          <small>${rupees(item.price)} each</small>
        </div>

        <div class="quantity">
          <button
            data-change="${item.id}"
            data-delta="-1"
            aria-label="Remove one"
          >−</button>

          <span>${item.qty}</span>

          <button
            data-change="${item.id}"
            data-delta="1"
            aria-label="Add one"
          >+</button>
        </div>
      </div>
    `).join("")
    : '<p class="empty-cart">Your basket is waiting for something delicious.</p>';
}

// Show notification
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 1900);
}

// Add items to cart
grid.addEventListener("click", event => {
  const btn = event.target.closest("[data-add]");
  if (!btn) return;

  const item = menuItems.find(
    x => x.id === Number(btn.dataset.add)
  );

  if (!item) return;

  const found = cart.find(x => x.id === item.id);

  if (found) {
    found.qty++;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  updateCart();
  toast(item.name + " added to your order");
});

// Menu category filters
document.getElementById("filters").addEventListener("click", event => {
  const btn = event.target.closest("[data-category]");
  if (!btn) return;

  activeCategory = btn.dataset.category;

  document.querySelectorAll(".filter").forEach(button => {
    button.classList.toggle("active", button === btn);
  });

  renderMenu();
});

// Menu search
document.getElementById("searchInput").addEventListener("input", renderMenu);

// Increase or decrease cart quantity
document.getElementById("cartItems").addEventListener("click", event => {
  const btn = event.target.closest("[data-change]");
  if (!btn) return;

  const item = cart.find(
    x => x.id === Number(btn.dataset.change)
  );

  if (!item) return;

  item.qty += Number(btn.dataset.delta);

  if (item.qty <= 0) {
    cart = cart.filter(x => x.id !== item.id);
  }

  updateCart();
});

// Cart drawer
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

// Demo checkout
document.getElementById("checkout").addEventListener("click", () => {
  if (!cart.length) {
    toast("Add something tasty first!");
    return;
  }

  toast("Demo order received — thank you!");
  cart = [];
  updateCart();
  closeCart();
});

// Mobile navigation
const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");

  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "×" : "☰";
});

nav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☰";
  });
});

// Start website
document.getElementById("year").textContent =
  new Date().getFullYear();

updateCart();
loadMenu();
