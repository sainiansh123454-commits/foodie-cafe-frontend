
const API_URL = "https://foodie-cafe-backend-1.onrender.com/api/menu";
const ORDER_API = "https://foodie-cafe-backend-1.onrender.com/api/orders";

let menuItems = [];
let cart = [];
let activeCategory = "all";

const grid = document.getElementById("menuGrid");

const rupees = amount =>
  "₹" + Number(amount).toLocaleString("en-IN");

// LOAD MENU FROM BACKEND
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

// DISPLAY MENU
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

// ADD TO CART
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

// CATEGORY FILTER
document.getElementById("filters").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  activeCategory = button.dataset.category;

  document.querySelectorAll(".filter").forEach(btn => {
    btn.classList.toggle("active", btn === button);
  });

  renderMenu();
});

// SEARCH
document.getElementById("searchInput")
  .addEventListener("input", renderMenu);

// UPDATE CART
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

// CART QUANTITY
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

// TOAST MESSAGE
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => el.classList.remove("show"), 1900);
}

// OPEN AND CLOSE CART
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

// REAL CHECKOUT - SAVE ORDER IN MONGODB
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

// MOBILE NAVIGATION
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

// WEBSITE YEAR
document.getElementById("year").textContent =
  new Date().getFullYear();

// START WEBSITE
updateCart();
loadMenu();
