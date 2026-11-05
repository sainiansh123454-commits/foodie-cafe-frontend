const menuItems = [
 {id:1,name:"Velvet Cappuccino",category:"coffee",tag:"BESTSELLER",price:160,desc:"Rich espresso, silky milk and a soft cocoa finish.",image:"https://images.unsplash.com/photo-1534778101976-628a944c3a69?auto=format&fit=crop&w=700&q=80"},
 {id:2,name:"Iced Caramel Latte",category:"coffee",tag:"CHILLED FAVOURITE",price:190,desc:"Smooth espresso over ice with buttery caramel.",image:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=80"},
 {id:3,name:"Cafe Club Sandwich",category:"food",tag:"FRESH PICK",price:220,desc:"Toasted layers, crisp veggies and our house sauce.",image:"https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=700&q=80"},
 {id:4,name:"Margherita Pizza",category:"food",tag:"CLASSIC",price:280,desc:"Golden crust, fresh basil and gooey mozzarella.",image:"https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=700&q=80"},
 {id:5,name:"Chocolate Brownie",category:"dessert",tag:"SWEET TOOTH",price:150,desc:"Fudgy centre, crisp edges and pure chocolate joy.",image:"https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80"},
 {id:6,name:"Strawberry Cheesecake",category:"dessert",tag:"HOUSE FAVOURITE",price:210,desc:"Creamy cheesecake with a bright berry topping.",image:"https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=700&q=80"},
 {id:7,name:"Mango Smoothie",category:"drinks",tag:"FRUITY & FRESH",price:170,desc:"A sunny blend of mango, yoghurt and a little love.",image:"https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=700&q=80"},
 {id:8,name:"Classic Cold Coffee",category:"drinks",tag:"COOL DOWN",price:180,desc:"Creamy, chilled coffee blended until perfectly frothy.",image:"https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=700&q=80"}
];
let cart = [];
let activeCategory = "all";
const grid = document.getElementById("menuGrid");
const rupees = n => "₹" + n.toLocaleString("en-IN");
function renderMenu(){
 const query = document.getElementById("searchInput").value.trim().toLowerCase();
 const filtered = menuItems.filter(item => (activeCategory==="all" || item.category===activeCategory) && (item.name.toLowerCase().includes(query)||item.desc.toLowerCase().includes(query)));
 grid.innerHTML = filtered.length ? filtered.map(item=>`<article class="menu-card"><div class="food-photo"><img src="${item.image}" alt="${item.name}" loading="lazy"><span class="food-tag">${item.tag}</span></div><div class="menu-info"><h3>${item.name}</h3><p>${item.desc}</p><div class="menu-meta"><strong>${rupees(item.price)}</strong><button class="add-button" data-add="${item.id}" aria-label="Add ${item.name} to order">+</button></div></div></article>`).join("") : '<p class="empty-cart">No items found. Try another search.</p>';
}
function updateCart(){
 document.getElementById("cartCount").textContent=cart.reduce((sum,x)=>sum+x.qty,0);
 document.getElementById("cartTotal").textContent=rupees(cart.reduce((sum,x)=>sum+x.price*x.qty,0));
 const box=document.getElementById("cartItems");
 box.innerHTML=cart.length?cart.map(x=>`<div class="cart-row"><div><strong>${x.name}</strong><small>${rupees(x.price)} each</small></div><div class="quantity"><button data-change="${x.id}" data-delta="-1" aria-label="Remove one">−</button><span>${x.qty}</span><button data-change="${x.id}" data-delta="1" aria-label="Add one">+</button></div></div>`).join(""):'<p class="empty-cart">Your basket is waiting for something delicious.</p>';
}
function toast(message){const el=document.getElementById("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1900)}
grid.addEventListener("click",e=>{const btn=e.target.closest("[data-add]");if(!btn)return;const item=menuItems.find(x=>x.id===Number(btn.dataset.add));const found=cart.find(x=>x.id===item.id);found?found.qty++:cart.push({...item,qty:1});updateCart();toast(item.name+" added to your order")});
document.getElementById("filters").addEventListener("click",e=>{const btn=e.target.closest("[data-category]");if(!btn)return;activeCategory=btn.dataset.category;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===btn));renderMenu()});
document.getElementById("searchInput").addEventListener("input",renderMenu);
document.getElementById("cartItems").addEventListener("click",e=>{const btn=e.target.closest("[data-change]");if(!btn)return;const item=cart.find(x=>x.id===Number(btn.dataset.change));item.qty+=Number(btn.dataset.delta);if(item.qty<=0)cart=cart.filter(x=>x.id!==item.id);updateCart()});
const drawer=document.getElementById("cartDrawer"),overlay=document.getElementById("cartOverlay");
function openCart(){drawer.classList.add("open");overlay.classList.add("open");drawer.setAttribute("aria-hidden","false")}
function closeCart(){drawer.classList.remove("open");overlay.classList.remove("open");drawer.setAttribute("aria-hidden","true")}
document.getElementById("cartOpen").addEventListener("click",openCart);document.getElementById("cartClose").addEventListener("click",closeCart);overlay.addEventListener("click",closeCart);
document.getElementById("checkout").addEventListener("click",()=>{if(!cart.length){toast("Add something tasty first!");return}toast("Demo order received — thank you!");cart=[];updateCart();closeCart()});
const toggle=document.getElementById("menuToggle"),nav=document.getElementById("nav");toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));toggle.textContent=open?"×":"☰"});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");toggle.setAttribute("aria-expanded","false");toggle.textContent="☰"}));
document.getElementById("year").textContent=new Date().getFullYear();renderMenu();updateCart();
