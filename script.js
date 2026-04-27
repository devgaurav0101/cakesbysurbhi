const OWNER_USERNAME = "admin";
const OWNER_PASSWORD = "admin";
const WHATSAPP_NUMBER = "917666118044";
const STORAGE_KEY = "cakes-by-surbhi-cakes";
const SESSION_KEY = "cakes-by-surbhi-owner-session";

const defaultCakes = [
  { id: 1, name: "Rose Velvet Cake", price: 899, size: "1 kg" },
  { id: 2, name: "Chocolate Truffle", price: 499, size: "Half kg" },
  { id: 3, name: "Strawberry Bento Bliss", price: 299, size: "Bento" }
];

const pageType = document.body.dataset.page || "home";
const cakeGrid = document.getElementById("cakeGrid");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
let activeFilter = "all";

const ownerPanel = document.getElementById("ownerPanel");
const loginForm = document.getElementById("loginForm");
const cakeForm = document.getElementById("cakeForm");
const logoutButton = document.getElementById("logoutButton");
const panelTitle = document.getElementById("panelTitle");
const statusMessage = document.getElementById("statusMessage");
const saveCakeButton = document.getElementById("saveCakeButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const editingCakeId = document.getElementById("editingCakeId");
const cakeNameInput = document.getElementById("cakeName");
const cakePriceInput = document.getElementById("cakePrice");
const cakeSizeInput = document.getElementById("cakeSize");

function getCakes() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCakes));
    return defaultCakes;
  }

  try {
    const cakes = JSON.parse(saved);
    return Array.isArray(cakes) ? cakes : defaultCakes;
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCakes));
    return defaultCakes;
  }
}

function saveCakes(cakes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cakes));
}

function isLoggedIn() {
  return localStorage.getItem(SESSION_KEY) === "true";
}

function setLoggedIn(value) {
  localStorage.setItem(SESSION_KEY, value ? "true" : "false");
}

function canManageOnThisPage() {
  return Boolean(ownerPanel && loginForm && cakeForm && logoutButton && panelTitle && statusMessage);
}

function formatCurrency(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(price);
}

function buildWhatsAppLink(cake) {
  const message = [
    "Hello Surbhi, I would like to place an order.",
    "",
    `Cake: ${cake.name}`,
    `Size: ${cake.size}`,
    `Price: ${formatCurrency(cake.price)}`,
    "",
    "Please share availability and confirm the order."
  ].join("\n");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function resetCakeForm() {
  if (!cakeForm || !editingCakeId || !saveCakeButton || !cancelEditButton || !panelTitle) {
    return;
  }

  cakeForm.reset();
  editingCakeId.value = "";
  saveCakeButton.textContent = "Add Cake";
  cancelEditButton.classList.add("hidden");
  panelTitle.textContent = "Add a New Cake";
}

function showStatus(message, isError = false) {
  if (!statusMessage) {
    return;
  }

  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#a6325d" : "#7b5a69";
}

function startEditCake(cakeId) {
  if (!canManageOnThisPage()) {
    return;
  }

  if (!isLoggedIn()) {
    showStatus("Please log in before editing cakes.", true);
    return;
  }

  const cake = getCakes().find((entry) => String(entry.id) === String(cakeId));
  if (!cake) {
    showStatus("Cake not found.", true);
    return;
  }

  editingCakeId.value = String(cake.id);
  cakeNameInput.value = cake.name;
  cakePriceInput.value = cake.price;
  cakeSizeInput.value = cake.size;
  saveCakeButton.textContent = "Save Changes";
  cancelEditButton.classList.remove("hidden");
  panelTitle.textContent = "Edit Cake";
  ownerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  showStatus(`Editing "${cake.name}".`);
}

function deleteCake(cakeId) {
  if (!canManageOnThisPage()) {
    return;
  }

  if (!isLoggedIn()) {
    showStatus("Please log in before deleting cakes.", true);
    return;
  }

  const cakes = getCakes();
  const cake = cakes.find((entry) => String(entry.id) === String(cakeId));
  if (!cake) {
    showStatus("Cake not found.", true);
    return;
  }

  const updatedCakes = cakes.filter((entry) => String(entry.id) !== String(cakeId));
  saveCakes(updatedCakes);
  renderCakes();

  if (editingCakeId && editingCakeId.value === String(cakeId)) {
    resetCakeForm();
  }

  showStatus(`Deleted "${cake.name}" from the menu.`);
}

function renderCakes() {
  if (!cakeGrid) {
    return;
  }

  const cakes = getCakes();
  const filteredCakes = pageType === "menu" && activeFilter !== "all"
    ? cakes.filter((cake) => cake.size === activeFilter)
    : cakes;
  const showOwnerActions = canManageOnThisPage() && isLoggedIn();

  if (!filteredCakes.length) {
    cakeGrid.innerHTML = `
      <article class="${pageType === "menu" ? "menu-card menu-empty-state" : "cake-card"}">
        <p class="section-tag">No Cakes Found</p>
        <h3>No cakes in this filter right now</h3>
        <p class="cake-meta">Try another size filter or add a new cake from the admin section.</p>
      </article>
    `;
    return;
  }

  cakeGrid.innerHTML = filteredCakes.map((cake) => `
    <article class="${pageType === "menu" ? "menu-card" : "cake-card"}">
      <p class="section-tag">${pageType === "menu" ? "Fresh Today" : "Fresh Pick"}</p>
      <h3>${escapeHtml(cake.name)}</h3>
      <div class="cake-badges">
        <span class="chip">${escapeHtml(cake.size)}</span>
        <span class="chip">Homemade</span>
      </div>
      <p class="cake-meta">${pageType === "menu" ? "Quick order on WhatsApp with cake details prefilled." : "Perfect for gifting, birthdays, or just a sweet craving."}</p>
      <p class="price">${formatCurrency(cake.price)}</p>
      <div class="card-actions">
        <a class="btn btn-primary" href="${buildWhatsAppLink(cake)}" target="_blank" rel="noreferrer">Order Now</a>
        ${showOwnerActions ? `
          <button class="btn btn-soft owner-action" type="button" data-action="edit" data-id="${cake.id}">Edit</button>
          <button class="btn btn-danger owner-action" type="button" data-action="delete" data-id="${cake.id}">Delete</button>
        ` : ""}
      </div>
    </article>
  `).join("");
}

function updateOwnerUI() {
  if (!canManageOnThisPage()) {
    renderCakes();
    return;
  }

  const loggedIn = isLoggedIn();

  ownerPanel.classList.remove("hidden");
  loginForm.classList.toggle("hidden", loggedIn);
  cakeForm.classList.toggle("hidden", !loggedIn);
  logoutButton.classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    if (!editingCakeId.value) {
      panelTitle.textContent = "Add a New Cake";
    }
  } else {
    panelTitle.textContent = "Login to Manage Cakes";
    resetCakeForm();
  }

  renderCakes();
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const username = String(formData.get("username") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "").trim();

    if (username === OWNER_USERNAME && password === OWNER_PASSWORD) {
      setLoggedIn(true);
      updateOwnerUI();
      loginForm.reset();
      showStatus("Logged in successfully. You can now manage cakes.");
      return;
    }

    showStatus("Invalid username or password.", true);
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";
    filterButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    renderCakes();
  });
});

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    setLoggedIn(false);
    updateOwnerUI();
    showStatus("You have been logged out.");
  });
}

if (cancelEditButton) {
  cancelEditButton.addEventListener("click", () => {
    resetCakeForm();
    showStatus("Edit cancelled.");
  });
}

if (cakeForm) {
  cakeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!isLoggedIn()) {
      showStatus("Please log in before managing cakes.", true);
      updateOwnerUI();
      return;
    }

    const formData = new FormData(cakeForm);
    const cakeId = String(formData.get("editingCakeId") || "").trim();
    const name = String(formData.get("cakeName") || "").trim();
    const price = Number(formData.get("cakePrice"));
    const size = String(formData.get("cakeSize") || "").trim();

    if (!name || !size || !Number.isFinite(price) || price <= 0) {
      showStatus("Please enter a valid cake name, size, and price.", true);
      return;
    }

    const cakes = getCakes();

    if (cakeId) {
      const cakeIndex = cakes.findIndex((entry) => String(entry.id) === cakeId);
      if (cakeIndex === -1) {
        showStatus("Cake not found.", true);
        resetCakeForm();
        renderCakes();
        return;
      }

      cakes[cakeIndex] = {
        ...cakes[cakeIndex],
        name,
        price,
        size
      };

      saveCakes(cakes);
      renderCakes();
      showStatus(`Updated "${name}".`);
      resetCakeForm();
      return;
    }

    cakes.unshift({
      id: Date.now(),
      name,
      price,
      size
    });

    saveCakes(cakes);
    renderCakes();
    resetCakeForm();
    showStatus(`Added "${name}" to the menu.`);
  });
}

if (cakeGrid) {
  cakeGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionButton = target.closest("[data-action]");
    if (!(actionButton instanceof HTMLElement)) {
      return;
    }

    const action = actionButton.dataset.action;
    const cakeId = actionButton.dataset.id;

    if (!cakeId) {
      return;
    }

    if (action === "edit") {
      startEditCake(cakeId);
      return;
    }

    if (action === "delete") {
      deleteCake(cakeId);
    }
  });
}

renderCakes();
updateOwnerUI();
