/* ==========================================================================
   DriveEase - Core JavaScript Application Engine
   Connected to Python FastAPI Backend (http://127.0.0.1:8000/api)
   ========================================================================== */

const API_BASE = "http://127.0.0.1:8000/api";
let isBackendLive = false;

// --- FALLBACK CITIES & SHOP COORDINATES ---
const CITIES_DATA = {
  Goa: {
    lat: 15.5204,
    lng: 73.8000,
    shops: [
      { id: "shop-goa-1", name: "Baga Beach Rental Hub", address: "Tito's Lane, Baga, Goa", lat: 15.5553, lng: 73.7517, phone: "+91 98221 11223" },
      { id: "shop-goa-2", name: "Panjim Central Mobility", address: "Near MG Road, Panjim, Goa", lat: 15.4989, lng: 73.8278, phone: "+91 98221 44556" },
      { id: "shop-goa-3", name: "Calangute Scooters & Cars", address: "Main Beach Road, Calangute, Goa", lat: 15.5438, lng: 73.7554, phone: "+91 98221 77889" }
    ]
  },
  Delhi: {
    lat: 28.6139,
    lng: 77.2090,
    shops: [
      { id: "shop-delhi-1", name: "Connaught Place Wheels", address: "Block B, Inner Circle, CP, New Delhi", lat: 28.6315, lng: 77.2167, phone: "+91 98110 12345" },
      { id: "shop-delhi-2", name: "Karol Bagh Bike Hub", address: "Gurudwara Road, Karol Bagh, New Delhi", lat: 28.6514, lng: 77.1907, phone: "+91 98110 54321" }
    ]
  },
  Mumbai: {
    lat: 19.0760,
    lng: 72.8777,
    shops: [
      { id: "shop-mum-1", name: "Bandra Car & Bike Zone", address: "Hill Road, Bandra West, Mumbai", lat: 19.0596, lng: 72.8295, phone: "+91 98200 33445" },
      { id: "shop-mum-2", name: "Marine Drive Mobility", address: "Near Churchgate Station, Mumbai", lat: 18.9438, lng: 72.8233, phone: "+91 98200 66778" }
    ]
  },
  Pondicherry: {
    lat: 11.9416,
    lng: 79.8083,
    shops: [
      { id: "shop-pon-1", name: "French Quarter Rides", address: "White Town, Puducherry", lat: 11.9338, lng: 79.8335, phone: "+91 94430 11223" },
      { id: "shop-pon-2", name: "Rock Beach Bikes & Cars", address: "Goubert Avenue, Puducherry", lat: 11.9352, lng: 79.8360, phone: "+91 94430 44556" }
    ]
  },
  Bengaluru: {
    lat: 12.9716,
    lng: 77.5946,
    shops: [
      { id: "shop-blr-1", name: "Indiranagar Wheels", address: "100 Feet Road, Indiranagar, Bengaluru", lat: 12.9784, lng: 77.6408, phone: "+91 98450 12345" },
      { id: "shop-blr-2", name: "Koramangala Mobility", address: "80 Feet Road, 4th Block, Koramangala, Bengaluru", lat: 12.9352, lng: 77.6245, phone: "+91 98450 67890" }
    ]
  }
};

// --- LOCAL STORAGE BACKUP CONTROLLER ---
const Storage = {
  getVehicles() {
    const data = localStorage.getItem("driveease_vehicles");
    return data ? JSON.parse(data) : [];
  },
  saveVehicles(vehicles) {
    localStorage.setItem("driveease_vehicles", JSON.stringify(vehicles));
  },
  getBookings() {
    const data = localStorage.getItem("driveease_bookings");
    return data ? JSON.parse(data) : [];
  },
  saveBookings(bookings) {
    localStorage.setItem("driveease_bookings", JSON.stringify(bookings));
  },
  getUser() {
    const data = localStorage.getItem("driveease_user");
    return data ? JSON.parse(data) : null;
  },
  saveUser(user) {
    localStorage.setItem("driveease_user", JSON.stringify(user));
  },
  clearUser() {
    localStorage.removeItem("driveease_user");
  }
};

// Global State
let currentSlide = 'user';
let currentUser = null;
let activeCategoryFilter = 'all';
let activeSubcategoryFilter = 'all';
let maxPriceLimit = 6000;
let searchQuery = '';
let activeBookingVehicle = null;
let leafletMap = null;
let leafletMarkers = [];
let timerInterval = null;

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  await checkBackendStatus();
  updateSubcategoryDropdown();

  const savedUser = Storage.getUser();
  if (savedUser) {
    currentUser = savedUser;
    initMainApp();
  } else {
    showAuthHero();
  }

  startOrderTimerTicker();
});

// Check if Python FastAPI server is active
async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_BASE}/vehicles?city=Goa`, { method: "GET" });
    if (res.ok) {
      isBackendLive = true;
      console.log(" Connected to Python FastAPI Backend (http://127.0.0.1:8000)");
      showToast("Backend Connected", "FastAPI Python Backend is Online", "success");
    }
  } catch (e) {
    isBackendLive = false;
    console.log("ℹ️ Python Backend offline, running in browser client mode.");
  }
}

// --- AUTH & SLIDE SWITCHING LOGIC ---
function switchAuthSlide(slide) {
  currentSlide = slide;
  const userTab = document.getElementById("tab-user");
  const ownerTab = document.getElementById("tab-owner");
  const indicator = document.getElementById("tab-indicator");

  const slideUser = document.getElementById("slide-user");
  const slideOwner = document.getElementById("slide-owner");

  if (slide === 'user') {
    userTab.classList.add("active");
    ownerTab.classList.remove("active");
    indicator.classList.remove("owner-active");
    slideUser.classList.add("active");
    slideOwner.classList.remove("active");
  } else {
    ownerTab.classList.add("active");
    userTab.classList.remove("active");
    indicator.classList.add("owner-active");
    slideOwner.classList.add("active");
    slideUser.classList.remove("active");
  }
}

async function handleUserLogin(e) {
  e.preventDefault();
  const email = document.getElementById("user-email").value;
  const city = document.getElementById("user-city-select").value;

  currentUser = { email, role: 'user', city };
  Storage.saveUser(currentUser);
  showToast("Welcome Customer!", `Logged in for ${city}`, "success");
  initMainApp();
}

async function handleOwnerLogin(e) {
  e.preventDefault();
  const email = document.getElementById("owner-email").value;
  const city = document.getElementById("owner-city-select").value;

  currentUser = { email, role: 'owner', city };
  Storage.saveUser(currentUser);
  showToast("Welcome Owner!", `Logged in to manage fleet in ${city}`, "info");
  initMainApp();
}

function quickLogin(role) {
  if (role === 'user') {
    document.getElementById("user-email").value = "demo.renter@gmail.com";
    document.getElementById("user-city-select").value = "Goa";
    switchAuthSlide('user');
    handleUserLogin({ preventDefault: () => {} });
  } else {
    document.getElementById("owner-email").value = "owner.goa@rentals.com";
    document.getElementById("owner-city-select").value = "Goa";
    switchAuthSlide('owner');
    handleOwnerLogin({ preventDefault: () => {} });
  }
}

function logout() {
  Storage.clearUser();
  currentUser = null;
  showAuthHero();
  showToast("Logged Out", "You have been logged out safely.", "info");
}

function showAuthHero() {
  document.getElementById("auth-hero-section").classList.remove("hidden");
  document.getElementById("main-app").classList.add("hidden");
}

function initMainApp() {
  document.getElementById("auth-hero-section").classList.add("hidden");
  document.getElementById("main-app").classList.remove("hidden");

  const headerCitySelect = document.getElementById("header-city-select");
  headerCitySelect.value = currentUser.city;

  const roleBadge = document.getElementById("role-badge");
  const roleLabel = document.getElementById("user-role-label");

  if (currentUser.role === 'owner') {
    roleBadge.className = "role-badge owner-mode";
    roleLabel.textContent = `Owner (${currentUser.email.split('@')[0]})`;
    document.getElementById("customer-view").classList.add("hidden");
    document.getElementById("owner-view").classList.remove("hidden");
    renderOwnerDashboard();
  } else {
    roleBadge.className = "role-badge user-mode";
    roleLabel.textContent = `Renter (${currentUser.email.split('@')[0]})`;
    document.getElementById("customer-view").classList.remove("hidden");
    document.getElementById("owner-view").classList.add("hidden");
    applyFilters();
    updateUserBookingsBadge();
  }
}

function toggleRoleSwitch() {
  if (!currentUser) return;
  currentUser.role = currentUser.role === 'user' ? 'owner' : 'user';
  Storage.saveUser(currentUser);
  showToast("Role Switched", `Switched to ${currentUser.role.toUpperCase()} View`, "info");
  initMainApp();
}

function changeCity(newCity) {
  currentUser.city = newCity;
  Storage.saveUser(currentUser);
  showToast("City Updated", `Showing vehicles for ${newCity}`, "info");

  if (currentUser.role === 'owner') {
    renderOwnerDashboard();
  } else {
    applyFilters();
  }
}

function resetToHome() {
  if (currentUser.role === 'user') resetFilters();
}

// --- VEHICLE FILTERING & CATALOG ENGINE ---
function setCategoryFilter(category) {
  activeCategoryFilter = category;
  const buttons = document.querySelectorAll("#category-btn-group .btn-filter");
  buttons.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-value") === category);
  });
  updateSubcategoryDropdown();
  applyFilters();
}

function updateSubcategoryDropdown() {
  const subSelect = document.getElementById("subcategory-select");
  subSelect.innerHTML = `<option value="all">All Sub-Categories</option>`;

  if (activeCategoryFilter === '2w') {
    subSelect.innerHTML += `<option value="Scooty">Scooty (Scooter)</option><option value="Gear Bike">Gear Bike</option>`;
  } else if (activeCategoryFilter === '4w') {
    subSelect.innerHTML += `<option value="4 Seater">4 Seater</option><option value="6/7 Seater">6/7 Seater</option>`;
  } else {
    subSelect.innerHTML += `
      <option value="Scooty">Scooty (Scooter)</option>
      <option value="Gear Bike">Gear Bike</option>
      <option value="4 Seater">4 Seater</option>
      <option value="6/7 Seater">6/7 Seater</option>
    `;
  }
  activeSubcategoryFilter = 'all';
}

function updatePriceSlider(val) {
  maxPriceLimit = parseInt(val, 10);
  document.getElementById("price-limit-val").textContent = `₹${maxPriceLimit.toLocaleString()} / day`;
  applyFilters();
}

function resetFilters() {
  document.getElementById("search-input").value = "";
  searchQuery = "";
  setCategoryFilter('all');
  document.getElementById("price-range").value = 6000;
  updatePriceSlider(6000);
}

// Fetch vehicles from Python Backend or LocalStorage
async function applyFilters() {
  searchQuery = document.getElementById("search-input").value.toLowerCase().trim();
  activeSubcategoryFilter = document.getElementById("subcategory-select").value;

  if (isBackendLive) {
    try {
      const url = `${API_BASE}/vehicles?city=${encodeURIComponent(currentUser.city)}&category=${activeCategoryFilter}&subcategory=${activeSubcategoryFilter}&max_price=${maxPriceLimit}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (res.ok) {
        const vehicles = await res.json();
        renderVehicleCatalog(vehicles);
        return;
      }
    } catch (e) {
      console.warn("Backend request failed, falling back to local storage", e);
    }
  }

  // Fallback to client-side filter
  let vehicles = Storage.getVehicles();
  const filtered = vehicles.filter(v => {
    if (v.city.toLowerCase() !== currentUser.city.toLowerCase()) return false;
    if (activeCategoryFilter !== 'all' && v.category !== activeCategoryFilter) return false;
    if (activeSubcategoryFilter !== 'all' && v.subcategory !== activeSubcategoryFilter) return false;
    if (v.price > maxPriceLimit) return false;
    if (searchQuery) {
      const matchName = v.name.toLowerCase().includes(searchQuery);
      const matchShop = v.shop_name?.toLowerCase().includes(searchQuery) || v.shopName?.toLowerCase().includes(searchQuery);
      if (!matchName && !matchShop) return false;
    }
    return true;
  });

  renderVehicleCatalog(filtered);
}

function renderVehicleCatalog(vehicles) {
  const grid = document.getElementById("vehicle-grid");
  const noResults = document.getElementById("no-results");
  const resultsCount = document.getElementById("results-count");

  resultsCount.textContent = `Showing ${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} in ${currentUser.city}`;

  if (vehicles.length === 0) {
    grid.innerHTML = "";
    noResults.classList.remove("hidden");
    return;
  }

  noResults.classList.add("hidden");

  grid.innerHTML = vehicles.map(v => {
    const catClass = v.category === '2w' ? 'badge-2w' : 'badge-4w';
    const catLabel = v.category === '2w' ? '2-Wheeler' : '4-Wheeler';
    const shopName = v.shop_name || v.shopName || "City Hub";

    return `
      <div class="vehicle-card">
        <div class="card-img-wrapper">
          <img src="${v.image}" alt="${v.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'">
          <span class="card-badge ${catClass}">
            <i class="fa-solid ${v.category === '2w' ? 'fa-motorcycle' : 'fa-car'}"></i> ${catLabel}
          </span>
          <span class="card-shop-tag">
            <i class="fa-solid fa-store"></i> ${shopName}
          </span>
        </div>

        <div class="card-body">
          <div class="card-title-row">
            <h4 class="vehicle-name">${v.name}</h4>
            <span class="vehicle-subtag">${v.subcategory}</span>
          </div>

          <div class="vehicle-specs">
            <div class="spec-item"><i class="fa-solid fa-circle-info"></i> ${v.specs}</div>
          </div>

          <div class="card-footer-row">
            <div class="price-tag">
              <span class="price-amount">₹${v.price}</span>
              <span class="price-unit">per day</span>
            </div>

            ${v.available ? `
              <button class="btn btn-primary btn-sm" onclick="openBookingModal('${v.id}')">
                <i class="fa-solid fa-key"></i> Book Now
              </button>
            ` : `
              <button class="btn btn-outline btn-sm" disabled style="opacity:0.5;">
                <i class="fa-solid fa-ban"></i> Unavailable
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// --- BOOKING MODAL & LEAFLET MAP ---
async function openBookingModal(vehicleId) {
  let vehicles = [];
  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/vehicles?city=${currentUser.city}`);
      vehicles = await res.json();
    } catch (e) { vehicles = Storage.getVehicles(); }
  } else {
    vehicles = Storage.getVehicles();
  }

  activeBookingVehicle = vehicles.find(v => v.id === vehicleId);
  if (!activeBookingVehicle) return;

  document.getElementById("booking-vehicle-banner").innerHTML = `
    <img src="${activeBookingVehicle.image}" class="banner-img" alt="${activeBookingVehicle.name}">
    <div>
      <h4>${activeBookingVehicle.name} (${activeBookingVehicle.subcategory})</h4>
      <p style="color:var(--text-muted); font-size:0.85rem;">${activeBookingVehicle.specs} • <strong>₹${activeBookingVehicle.price}/day</strong></p>
    </div>
  `;

  document.getElementById("map-city-title").textContent = currentUser.city;
  await renderCityShopsSidebar(currentUser.city, activeBookingVehicle.shop_id || activeBookingVehicle.shopId);

  document.getElementById("booking-modal").classList.remove("hidden");
  setTimeout(() => {
    initBookingMap(currentUser.city, activeBookingVehicle.shop_id || activeBookingVehicle.shopId);
  }, 200);
}

function closeBookingModal() {
  document.getElementById("booking-modal").classList.add("hidden");
  activeBookingVehicle = null;
}

async function renderCityShopsSidebar(cityName, defaultShopId) {
  let shops = [];
  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/shops?city=${cityName}`);
      shops = await res.json();
    } catch (e) {
      shops = (CITIES_DATA[cityName] || CITIES_DATA["Goa"]).shops;
    }
  } else {
    shops = (CITIES_DATA[cityName] || CITIES_DATA["Goa"]).shops;
  }

  const sidebar = document.getElementById("shops-list-sidebar");
  sidebar.innerHTML = shops.map(shop => {
    const isSelected = shop.id === defaultShopId;
    return `
      <div class="shop-item-card ${isSelected ? 'selected' : ''}" id="shop-card-${shop.id}" onclick="selectShopLocation('${shop.id}')">
        <h5><i class="fa-solid fa-location-dot"></i> ${shop.name}</h5>
        <p>${shop.address}</p>
        <div class="distance"><i class="fa-solid fa-phone"></i> ${shop.phone}</div>
      </div>
    `;
  }).join("");

  document.getElementById("selected-shop-id").value = defaultShopId || shops[0]?.id;
}

function selectShopLocation(shopId) {
  document.getElementById("selected-shop-id").value = shopId;
  document.querySelectorAll(".shop-item-card").forEach(el => el.classList.remove("selected"));
  const card = document.getElementById(`shop-card-${shopId}`);
  if (card) card.classList.add("selected");

  const cityInfo = CITIES_DATA[currentUser.city] || CITIES_DATA["Goa"];
  const shop = cityInfo.shops.find(s => s.id === shopId);
  if (shop && leafletMap) {
    leafletMap.flyTo([shop.lat, shop.lng], 14, { duration: 1 });
  }
}

function initBookingMap(cityName, selectedShopId) {
  const cityInfo = CITIES_DATA[cityName] || CITIES_DATA["Goa"];

  if (!leafletMap) {
    leafletMap = L.map("booking-map").setView([cityInfo.lat, cityInfo.lng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);
  } else {
    leafletMap.setView([cityInfo.lat, cityInfo.lng], 12);
    leafletMarkers.forEach(m => leafletMap.removeLayer(m));
    leafletMarkers = [];
  }

  cityInfo.shops.forEach(shop => {
    const marker = L.marker([shop.lat, shop.lng]).addTo(leafletMap);
    marker.bindPopup(`
      <div style="font-family:sans-serif;">
        <strong>${shop.name}</strong><br/>
        <span style="font-size:12px; color:#666;">${shop.address}</span><br/>
        <button onclick="selectShopLocation('${shop.id}')" style="margin-top:6px; background:#3b82f6; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
          Select Shop
        </button>
      </div>
    `);

    if (shop.id === selectedShopId) marker.openPopup();
    leafletMarkers.push(marker);
  });

  leafletMap.invalidateSize();
}

// Confirm booking with DL and Aadhar
async function handleConfirmBooking(e) {
  e.preventDefault();
  if (!activeBookingVehicle) return;

  const name = document.getElementById("kyc-name").value.trim();
  const phone = document.getElementById("kyc-phone").value.trim();
  const dl = document.getElementById("kyc-dl").value.trim().toUpperCase();
  const aadhar = document.getElementById("kyc-aadhar").value.trim();
  const shopId = document.getElementById("selected-shop-id").value;

  const payload = {
    vehicle_id: activeBookingVehicle.id,
    customer_name: name,
    customer_email: currentUser.email,
    customer_phone: phone,
    dl_number: dl,
    aadhar_number: aadhar,
    shop_id: shopId
  };

  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        closeBookingModal();
        showToast("Booking Confirmed!", `Order #${data.id} created in Python DB! Arrive within 30 mins.`, "success");
        updateUserBookingsBadge();
        applyFilters();
        return;
      }
    } catch (e) {
      console.warn("Backend failed to save booking, using local fallback", e);
    }
  }

  // Local fallback
  const booking = {
    id: "BK" + Math.floor(100000 + Math.random() * 900000),
    vehicle_id: activeBookingVehicle.id,
    vehicle_name: activeBookingVehicle.name,
    vehicle_image: activeBookingVehicle.image,
    customer_name: name,
    customer_email: currentUser.email,
    customer_phone: phone,
    dl_number: dl,
    aadhar_number: aadhar,
    city_name: currentUser.city,
    shop_id: shopId,
    shop_name: "Rental Hub",
    price_per_day: activeBookingVehicle.price,
    booking_time: new Date().toISOString(),
    status: 'Pending Pickup'
  };

  const bookings = Storage.getBookings();
  bookings.unshift(booking);
  Storage.saveBookings(bookings);

  closeBookingModal();
  showToast("Booking Reserved!", "Arrive within 30 minutes for vehicle pickup!", "success");
  updateUserBookingsBadge();
  applyFilters();
}

async function updateUserBookingsBadge() {
  let count = 0;
  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/bookings?customer_email=${currentUser.email}`);
      const data = await res.json();
      count = data.length;
    } catch (e) {
      count = Storage.getBookings().filter(b => b.customer_email === currentUser.email).length;
    }
  } else {
    count = Storage.getBookings().filter(b => (b.customer_email || b.customerEmail) === currentUser.email).length;
  }
  document.getElementById("bookings-count-badge").textContent = count;
}

// --- OWNER DASHBOARD & 30-MINUTE CANCELLATION ---
function switchOwnerSubTab(tab) {
  document.getElementById("owner-tab-fleet").classList.toggle("active", tab === 'fleet');
  document.getElementById("owner-tab-orders").classList.toggle("active", tab === 'orders');
  document.getElementById("owner-fleet-section").classList.toggle("hidden", tab !== 'fleet');
  document.getElementById("owner-orders-section").classList.toggle("hidden", tab !== 'orders');
}

async function renderOwnerDashboard() {
  let vehicles = [];
  let bookings = [];

  if (isBackendLive) {
    try {
      const [vRes, bRes] = await Promise.all([
        fetch(`${API_BASE}/vehicles?city=${currentUser.city}`),
        fetch(`${API_BASE}/bookings?city=${currentUser.city}`)
      ]);
      vehicles = await vRes.json();
      bookings = await bRes.json();
    } catch (e) {
      vehicles = Storage.getVehicles().filter(v => v.city === currentUser.city);
      bookings = Storage.getBookings().filter(b => (b.city_name || b.cityName) === currentUser.city);
    }
  } else {
    vehicles = Storage.getVehicles().filter(v => v.city === currentUser.city);
    bookings = Storage.getBookings().filter(b => (b.city_name || b.cityName) === currentUser.city);
  }

  // Stats
  document.getElementById("stat-total-vehicles").textContent = vehicles.length;
  document.getElementById("stat-available-vehicles").textContent = vehicles.filter(v => v.available).length;
  const activeOrders = bookings.filter(b => b.status === 'Pending Pickup');
  document.getElementById("stat-active-orders").textContent = activeOrders.length;
  document.getElementById("owner-orders-badge").textContent = activeOrders.length;

  const totalRev = bookings.reduce((sum, b) => b.status !== 'Cancelled (No-Show)' ? sum + (b.price_per_day || b.pricePerDay || 0) : sum, 0);
  document.getElementById("stat-total-revenue").textContent = `₹${totalRev.toLocaleString()}`;

  renderOwnerInventoryTable(vehicles);
  renderOwnerOrdersQueue(bookings);
}

function renderOwnerInventoryTable(vehicles) {
  const tbody = document.getElementById("owner-inventory-table-body");
  if (vehicles.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No vehicles added yet for ${currentUser.city}.</td></tr>`;
    return;
  }

  tbody.innerHTML = vehicles.map(v => `
    <tr>
      <td>
        <div class="table-veh-cell">
          <img src="${v.image}" class="table-thumb" alt="${v.name}" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'">
          <div><strong>${v.name}</strong><div style="font-size:0.78rem; color:var(--text-muted);">${v.specs}</div></div>
        </div>
      </td>
      <td>
        <span class="badge ${v.category === '2w' ? 'badge-warning' : 'badge-success'}">${v.category.toUpperCase()}</span>
        <span style="font-size:0.8rem; margin-left:4px;">${v.subcategory}</span>
      </td>
      <td><i class="fa-solid fa-store" style="color:var(--primary);"></i> ${v.shop_name || v.shopName || "Main Hub"}</td>
      <td>
        <div class="price-edit-group">
          <span>₹</span>
          <input type="number" class="price-input-inline" value="${v.price}" min="100" max="20000" onchange="updateVehiclePriceInline('${v.id}', this.value)">
        </div>
      </td>
      <td>${v.available ? `<span class="badge badge-success">Available</span>` : `<span class="badge badge-danger">Unavailable</span>`}</td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="toggleVehicleAvailability('${v.id}')"><i class="fa-solid ${v.available ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
          <button class="btn btn-danger btn-sm" onclick="deleteVehicle('${v.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function updateVehiclePriceInline(vehicleId, newPrice) {
  const priceNum = parseInt(newPrice, 10);
  if (isNaN(priceNum) || priceNum <= 0) return;

  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/price`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: priceNum })
      });
      if (res.ok) {
        showToast("Price Updated in Python DB", `New daily rate: ₹${priceNum}`, "success");
        renderOwnerDashboard();
        return;
      }
    } catch (e) {}
  }

  // Local fallback
  const vehicles = Storage.getVehicles();
  const v = vehicles.find(veh => veh.id === vehicleId);
  if (v) {
    v.price = priceNum;
    Storage.saveVehicles(vehicles);
    showToast("Price Updated", `Price changed to ₹${priceNum}`, "success");
    renderOwnerDashboard();
  }
}

async function toggleVehicleAvailability(vehicleId) {
  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/toggle`, { method: "PATCH" });
      if (res.ok) {
        showToast("Status Changed", "Vehicle status updated", "info");
        renderOwnerDashboard();
        return;
      }
    } catch (e) {}
  }

  const vehicles = Storage.getVehicles();
  const v = vehicles.find(veh => veh.id === vehicleId);
  if (v) {
    v.available = !v.available;
    Storage.saveVehicles(vehicles);
    showToast("Status Changed", `Vehicle marked ${v.available ? 'Available' : 'Unavailable'}`, "info");
    renderOwnerDashboard();
  }
}

async function deleteVehicle(vehicleId) {
  if (!confirm("Are you sure you want to remove this vehicle?")) return;

  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/vehicles/${vehicleId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Vehicle Removed", "Deleted from Python database", "warning");
        renderOwnerDashboard();
        return;
      }
    } catch (e) {}
  }

  let vehicles = Storage.getVehicles();
  vehicles = vehicles.filter(v => v.id !== vehicleId);
  Storage.saveVehicles(vehicles);
  showToast("Vehicle Removed", "Deleted from inventory", "warning");
  renderOwnerDashboard();
}

function renderOwnerOrdersQueue(bookings) {
  const container = document.getElementById("owner-orders-list");
  if (bookings.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);"><i class="fa-solid fa-inbox" style="font-size:2.5rem; margin-bottom:10px;"></i><p>No customer orders placed yet in ${currentUser.city}.</p></div>`;
    return;
  }

  container.innerHTML = bookings.map(b => {
    const elapsedMins = getElapsedMinutes(b.booking_time || b.bookingTime);
    const isOverdue = elapsedMins >= 30 && b.status === 'Pending Pickup';

    let timerBadgeClass = 'normal';
    let timerLabel = `${elapsedMins} mins elapsed`;

    if (b.status !== 'Pending Pickup') {
      timerLabel = `Status: ${b.status}`;
    } else if (isOverdue) {
      timerBadgeClass = 'overdue-alert';
      timerLabel = `NO-SHOW ALERT (${elapsedMins} mins)`;
    }

    return `
      <div class="order-card ${isOverdue ? 'overdue' : ''}">
        <div class="order-header-row">
          <span class="order-id">BOOKING #${b.id}</span>
          <span class="timer-badge ${timerBadgeClass}"><i class="fa-solid fa-stopwatch"></i> ${timerLabel}</span>
        </div>

        <h4 style="color:var(--text-main); font-size:1.1rem;">${b.vehicle_name || b.vehicleName}</h4>
        
        <div class="order-details-grid">
          <div class="detail-item"><span>Customer</span><strong>${b.customer_name || b.customerName}</strong></div>
          <div class="detail-item"><span>Phone</span><strong>${b.customer_phone || b.customerPhone}</strong></div>
          <div class="detail-item"><span>DL</span><strong>${b.dl_number || b.dlNumber}</strong></div>
          <div class="detail-item"><span>Aadhar</span><strong>${b.aadhar_number || b.aadharNumber}</strong></div>
        </div>

        <div style="font-size:0.8rem; color:var(--text-muted);">
          <i class="fa-solid fa-location-dot" style="color:var(--accent);"></i> Pickup Shop: <strong>${b.shop_name || b.shopName}</strong>
        </div>

        <div style="display:flex; gap:8px; margin-top:8px;">
          ${b.status === 'Pending Pickup' ? `
            <button class="btn btn-accent btn-sm" onclick="completeRentalOrder('${b.id}')"><i class="fa-solid fa-check"></i> Handover Ride</button>
            <button class="btn ${isOverdue ? 'btn-danger' : 'btn-outline'} btn-sm" onclick="cancelOverdueOrder('${b.id}')">
              <i class="fa-solid fa-ban"></i> Cancel Order ${isOverdue ? '(No-Show >30m)' : '(If >30m)'}
            </button>
          ` : `<button class="btn btn-outline btn-sm" disabled style="opacity:0.6;">Order ${b.status}</button>`}
        </div>
      </div>
    `;
  }).join("");
}

function getElapsedMinutes(isoTimestamp) {
  const diffMs = new Date() - new Date(isoTimestamp);
  return Math.max(0, Math.floor(diffMs / 60000));
}

// Cancel overdue order
async function cancelOverdueOrder(bookingId) {
  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel-noshow`, { method: "POST" });
      if (res.ok) {
        showToast("Order Cancelled", `Booking #${bookingId} cancelled in Python backend.`, "warning");
        renderOwnerDashboard();
        return;
      }
    } catch (e) {}
  }

  const bookings = Storage.getBookings();
  const b = bookings.find(item => item.id === bookingId);
  if (b) {
    b.status = 'Cancelled (No-Show)';
    Storage.saveBookings(bookings);
    showToast("Order Cancelled", `Booking #${b.id} cancelled.`, "warning");
    renderOwnerDashboard();
  }
}

async function completeRentalOrder(bookingId) {
  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/complete`, { method: "POST" });
      if (res.ok) {
        showToast("Ride Handed Over", "Booking marked as completed.", "success");
        renderOwnerDashboard();
        return;
      }
    } catch (e) {}
  }

  const bookings = Storage.getBookings();
  const b = bookings.find(item => item.id === bookingId);
  if (b) {
    b.status = 'Completed';
    Storage.saveBookings(bookings);
    showToast("Pickup Confirmed", `Key handed over to customer.`, "success");
    renderOwnerDashboard();
  }
}

function triggerTestTimerFastForward() {
  const bookings = Storage.getBookings();
  if (bookings.length === 0) {
    showToast("No Orders", "Place a booking first to test timer!", "warning");
    return;
  }
  const newest = bookings[0];
  const oldTime = new Date(newest.booking_time || newest.bookingTime);
  oldTime.setMinutes(oldTime.getMinutes() - 31);
  newest.booking_time = oldTime.toISOString();
  newest.bookingTime = oldTime.toISOString();
  Storage.saveBookings(bookings);
  showToast("Fast-Forward Active!", `Simulated 31 minutes passage for Booking #${newest.id}`, "info");
  renderOwnerDashboard();
}

function startOrderTimerTicker() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (currentUser && currentUser.role === 'owner') {
      renderOwnerDashboard();
    }
  }, 10000);
}

// Add vehicle modal
function openAddVehicleModal() {
  const cityShops = (CITIES_DATA[currentUser.city] || CITIES_DATA["Goa"]).shops;
  const shopSelect = document.getElementById("add-veh-shop");
  shopSelect.innerHTML = cityShops.map(s => `<option value="${s.id}">${s.name} (${s.address})</option>`).join("");
  document.getElementById("add-vehicle-modal").classList.remove("hidden");
}

function closeAddVehicleModal() {
  document.getElementById("add-vehicle-modal").classList.add("hidden");
}

function updateAddFormSubcategories() {
  const cat = document.getElementById("add-veh-category").value;
  const subSelect = document.getElementById("add-veh-subcategory");
  if (cat === '2w') {
    subSelect.innerHTML = `<option value="Scooty">Scooty (Scooter)</option><option value="Gear Bike">Gear Bike</option>`;
  } else {
    subSelect.innerHTML = `<option value="4 Seater">4 Seater</option><option value="6/7 Seater">6/7 Seater</option>`;
  }
}

async function handleAddVehicleSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("add-veh-name").value.trim();
  const category = document.getElementById("add-veh-category").value;
  const subcategory = document.getElementById("add-veh-subcategory").value;
  const price = parseInt(document.getElementById("add-veh-price").value, 10);
  const specs = document.getElementById("add-veh-specs").value.trim();
  const shopId = document.getElementById("add-veh-shop").value;
  const image = document.getElementById("add-veh-image").value.trim() || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600';

  const payload = {
    name, category, subcategory,
    city: currentUser.city,
    shop_id: shopId,
    price, specs, image
  };

  if (isBackendLive) {
    try {
      const res = await fetch(`${API_BASE}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        closeAddVehicleModal();
        showToast("Vehicle Registered!", `${name} added to Python database.`, "success");
        renderOwnerDashboard();
        return;
      }
    } catch (e) {}
  }

  // Local fallback
  const cityShops = (CITIES_DATA[currentUser.city] || CITIES_DATA["Goa"]).shops;
  const shopObj = cityShops.find(s => s.id === shopId) || cityShops[0];
  const newVehicle = {
    id: "v-" + Date.now(),
    name, category, subcategory,
    city: currentUser.city,
    shop_id: shopObj.id,
    shop_name: shopObj.name,
    price, specs, image, available: true
  };

  const vehicles = Storage.getVehicles();
  vehicles.unshift(newVehicle);
  Storage.saveVehicles(vehicles);

  closeAddVehicleModal();
  showToast("Vehicle Added!", `${name} is live for rent in ${currentUser.city}`, "success");
  renderOwnerDashboard();
}

function openMyBookingsModal() {
  const bookings = Storage.getBookings().filter(b => (b.customer_email || b.customerEmail) === currentUser.email);
  const listEl = document.getElementById("my-bookings-list");

  if (bookings.length === 0) {
    listEl.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);"><i class="fa-solid fa-calendar-xmark" style="font-size:2rem; margin-bottom:10px;"></i><p>No active bookings yet.</p></div>`;
  } else {
    listEl.innerHTML = bookings.map(b => `
      <div class="my-booking-card">
        <div>
          <h4>${b.vehicle_name || b.vehicleName} <small style="color:var(--text-dim);">#${b.id}</small></h4>
          <p style="font-size:0.85rem; color:var(--text-muted);"><i class="fa-solid fa-store"></i> ${b.shop_name || b.shopName}, ${b.city_name || b.cityName}</p>
          <p style="font-size:0.8rem; color:var(--text-dim); margin-top:4px;">DL: <strong>${b.dl_number || b.dlNumber}</strong></p>
        </div>
        <div style="text-align:right;">
          <span class="badge ${b.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${b.status}</span>
          <div style="font-size:1.1rem; font-weight:800; color:var(--accent); margin-top:6px;">₹${b.price_per_day || b.pricePerDay}</div>
        </div>
      </div>
    `).join("");
  }
  document.getElementById("my-bookings-modal").classList.remove("hidden");
}

function closeMyBookingsModal() {
  document.getElementById("my-bookings-modal").classList.add("hidden");
}

function showToast(title, message, type = 'info') {
  const container = document.getElementById("toast-container");
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type]} toast-icon"></i><div class="toast-content"><h5>${title}</h5><p>${message}</p></div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s ease-reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
