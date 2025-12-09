const PRODUCTS = [
  {id:'straw', title:'Strawberry', price:39, img:'https://i.pinimg.com/736x/cb/0c/8e/cb0c8e0bf7623a91df502e7fb8a350a0.jpg'},
  {id:'matcha', title:'Matcha Latte', price:39, img:'https://i.pinimg.com/736x/cd/c1/4e/cdc14ed21cb89833a5256fc4624878a3.jpg'},
  {id:'coffee1', title:'Latte', price:59, img:'https://i.pinimg.com/1200x/f8/56/d2/f856d2d30045e34f7a3d7438d81c5141.jpg'},
  {id:'coffee2', title:'Cappuccino', price:79, img:'https://i.pinimg.com/736x/f8/56/1e/f8561ea80e14bd1989b4fe87736e1468.jpg'}
];

const KEY_CART = 'ct_cart_v1';
const KEY_USERS = 'ct_users_v1';
const KEY_SESSION = 'ct_session_v1';

let Cart = JSON.parse(localStorage.getItem(KEY_CART) || '{}');

// ---------- Utilities ----------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const currency = n => '₱' + Number(n).toFixed(2);

// ---------- Render products ----------
function renderProducts(list = PRODUCTS){
  const grid = $('#productsGrid');
  if(!grid) return;
  grid.innerHTML = '';
  list.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="price-badge">${currency(p.price)}</div>
      <img src="${p.img}" alt="${p.title}">
      <h4>${p.title}</h4>
      <div style="margin-top:10px;display:flex;gap:8px;justify-content:center">
        <input class="qty" type="number" min="1" value="1" style="width:60px;padding:6px;border-radius:8px;border:1px solid #ddd">
        <button class="btn add-btn" data-id="${p.id}">Add</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ---------- Search ----------
function initSearch(){
  const input = $('#searchInput');
  const btn = $('#searchBtn');
  const apply = () => {
    const q = input.value.trim().toLowerCase();
    if(!q) renderProducts(PRODUCTS);
    else renderProducts(PRODUCTS.filter(p=>p.title.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q)));
  };
  input && input.addEventListener('input', apply);
  btn && btn.addEventListener('click', apply);
}

// ---------- Cart UI ----------
function saveCart(){ localStorage.setItem(KEY_CART, JSON.stringify(Cart)); updateCartUI(); }
function updateCartUI(){
  const list = $('#cartList');
  const countSpan = $('#cartCount');
  const subtotalEl = $('#subtotal');
  if(!list) return;
  list.innerHTML = '';
  let subtotal = 0;
  const items = Object.values(Cart);
  if(items.length===0){ list.innerHTML = '<div class="muted">Your cart is empty</div>'; subtotalEl.textContent = currency(0); countSpan.textContent = 0; return; }
  items.forEach(it=>{
    subtotal += it.product.price * it.qty;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${it.product.img}">
      <div style="flex:1">
        <div style="font-weight:700">${it.product.title}</div>
        <div class="small muted">${currency(it.product.price)} × ${it.qty}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="link-btn small remove" data-id="${it.product.id}">Remove</button>
      </div>
    `;
    list.appendChild(row);
  });
  subtotalEl.textContent = currency(subtotal);
  countSpan.textContent = items.reduce((s,i)=>s+i.qty,0);
}

// add to cart
document.body.addEventListener('click', (e)=>{
  if(e.target.matches('.add-btn')){
    const id = e.target.dataset.id;
    const card = e.target.closest('.product-card');
    const qtyInput = card.querySelector('.qty');
    const qty = Math.max(1, Number(qtyInput.value || 1));
    const product = PRODUCTS.find(p=>p.id===id);
    if(!product) return;
    if(!Cart[id]) Cart[id] = {product:product, qty: qty};
    else Cart[id].qty += qty;
    saveCart();
    // show cart panel
    $('#cartPanel').classList.remove('hidden');
  }

  if(e.target.matches('.remove')){
    const id = e.target.dataset.id;
    if(id && Cart[id]) delete Cart[id];
    saveCart();
  }

  if(e.target.id === 'cartToggle'){
    $('#cartPanel').classList.toggle('hidden');
  }

  if(e.target.id === 'orderNow' || e.target.id === 'checkoutLocal'){
    // scroll to products or open cart if empty
    if(Object.keys(Cart).length === 0){
      document.querySelector('.products').scrollIntoView({behavior:'smooth'});
      flash('Add items to cart first');
    } else {
      // simple local checkout flow
      placeLocalOrder();
    }
  }
});

// clear cart
$('#clearCart') && $('#clearCart').addEventListener('click', ()=>{
  if(confirm('Clear cart?')){ Cart={}; saveCart(); }
});

// ---------- Local checkout ----------
function placeLocalOrder(){
  const items = Object.values(Cart).map(i=>({product:i.product, qty:i.qty}));
  const total = items.reduce((s,i)=>s + i.product.price * i.qty, 0);
  const orders = JSON.parse(localStorage.getItem('ct_local_orders')||'[]');
  const order = { id:'L'+Date.now().toString().slice(-6), created: new Date().toLocaleString(), items, total };
  orders.unshift(order);
  localStorage.setItem('ct_local_orders', JSON.stringify(orders));
  Cart = {}; saveCart();
  flash('Order placed locally — thank you!');
}

// ---------- Auth: register / login (localStorage) ----------
function registerUser(name, email, password){
  const users = JSON.parse(localStorage.getItem(KEY_USERS) || '[]');
  if(users.some(u=>u.email === email)) return {ok:false, msg:'Email already registered'};
  users.push({name, email, password});
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
  return {ok:true};
}
function loginUser(email, password){
  const users = JSON.parse(localStorage.getItem(KEY_USERS) || '[]');
  const found = users.find(u=>u.email === email && u.password === password);
  if(!found) return {ok:false, msg:'Invalid credentials'};
  localStorage.setItem(KEY_SESSION, JSON.stringify(found));
  return {ok:true, user:found};
}
function currentUser(){ return JSON.parse(localStorage.getItem(KEY_SESSION) || 'null'); }

// handle register form
document.addEventListener('DOMContentLoaded', ()=>{
  renderProducts();
  initSearch();
  updateCartUI();

  // account button behavior: go to login if not signed, else alert & option to sign out
  $('#accountBtn') && $('#accountBtn').addEventListener('click', ()=>{
    const u = currentUser();
    if(u) {
      if(confirm('Sign out ' + u.name + '?')){ localStorage.removeItem(KEY_SESSION); flash('Signed out'); }
    } else {
      window.location.href = 'login.html';
    }
  });

  // register page
  const regForm = $('#registerForm');
  if(regForm){
    regForm.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const name = $('#regName').value.trim();
      const email = $('#regEmail').value.trim();
      const pass = $('#regPass').value;
      const res = registerUser(name, email, pass);
      if(!res.ok){ $('#regMsg').textContent = res.msg; return; }
      $('#regMsg').textContent = 'Account created. Redirecting to login...';
      setTimeout(()=>window.location.href='login.html', 900);
    });
  }

  // login page
  const loginForm = $('#loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const email = $('#loginEmail').value.trim();
      const pass = $('#loginPass').value;
      const res = loginUser(email, pass);
      if(!res.ok){ $('#loginMsg').textContent = res.msg; return; }
      $('#loginMsg').textContent = 'Logged in. Redirecting...';
      setTimeout(()=>window.location.href = 'index.html', 700);
    });
  }
});

// small toast
function flash(msg, ms=1500){
  const tip = document.createElement('div');
  tip.style = 'position:fixed;right:18px;bottom:18px;background:#111;color:#fff;padding:10px 14px;border-radius:10px;z-index:999;opacity:1';
  tip.textContent = msg;
  document.body.appendChild(tip);
  setTimeout(()=>tip.style.opacity='0', ms);
  setTimeout(()=>tip.remove(), ms+300);
}
