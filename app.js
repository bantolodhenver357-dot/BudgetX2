
/* ==========================================
   BUDGETX — FUNCTIONAL APP
   Vanilla JavaScript + localStorage
========================================== */

"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const STORAGE = {
  name: "budgetx_name",
  transactions: "budgetx_transactions",
  budgets: "budgetx_budgets",
  hidden: "budgetx_balance_hidden",
  notificationDismissed: "budgetx_notification_dismissed"
};

const welcomeScreen = $("#welcomeScreen");
const nameScreen = $("#nameScreen");
const dashboardScreen = $("#dashboardScreen");

const startButton = $("#startButton");
const backButton = $("#backButton");
const nameForm = $("#nameForm");
const userNameInput = $("#userName");
const nameError = $("#nameError");

const mainGreeting = $("#mainGreeting");
const netWorthElement = $("#netWorth");
const totalAssetsElement = $("#totalAssets");
const totalLiabilitiesElement = $("#totalLiabilities");
const toggleBalanceButton = $("#toggleBalance");
const eyeIcon = $("#eyeIcon");

const notificationCard = $("#notificationCard");
const dismissNotification = $("#dismissNotification");
const grantPermission = $("#grantPermission");

const budgetEmpty = $("#budgetEmpty");
const addBudgetButton = $("#addBudgetButton");
const transactionsList = $("#transactionsList");

let transactions = readArray(STORAGE.transactions);
let budgets = readArray(STORAGE.budgets);
let balanceHidden = localStorage.getItem(STORAGE.hidden) === "true";
let toastTimer;

/* ==========================================
   SAFE STORAGE & HELPERS
========================================== */

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveData() {
  localStorage.setItem(STORAGE.transactions, JSON.stringify(transactions));
  localStorage.setItem(STORAGE.budgets, JSON.stringify(budgets));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function money(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

function displayMoney(amount) {
  return balanceHidden ? "••••••" : money(amount);
}

function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function makeId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

function getTotals() {
  const income = transactions
    .filter(item => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const expenses = transactions
    .filter(item => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return {
    income,
    expenses,
    netWorth: income - expenses
  };
}

/* ==========================================
   SCREENS & GREETING
========================================== */


function showScreen(screen, animation = "right") {
  [welcomeScreen, nameScreen, dashboardScreen].forEach(item => {
    if (!item) return;
    item.classList.add("hidden");
    item.classList.remove(
      "bx-screen-enter-right",
      "bx-screen-enter-right-slow",
      "bx-screen-exit-left"
    );
  });

  if (!screen) return;

  screen.classList.remove("hidden");

  if (animation === "right") {
    screen.classList.add("bx-screen-enter-right");
  } else if (animation === "slow") {
    screen.classList.add("bx-screen-enter-right-slow");
  }
}

function openDashboard() {
  showScreen(dashboardScreen);
  updateGreeting();
  renderDashboard();
  renderBudgets();
  renderTransactions();
  updateNotificationCard();
}


startButton?.addEventListener("click", () => {
  if (nameError) nameError.classList.add("hidden");

  if (userNameInput) {
    userNameInput.value = localStorage.getItem(STORAGE.name) || "";
  }

  showScreen(nameScreen, "right");

  if (userNameInput) {
    setTimeout(() => userNameInput.focus(), 350);
  }
});


backButton?.addEventListener("click", () => showScreen(welcomeScreen));

nameForm?.addEventListener("submit", event => {
  event.preventDefault();

  const name = userNameInput.value.trim();

  if (!name) {
    nameError?.classList.remove("hidden");
    userNameInput.focus();
    return;
  }

  localStorage.setItem(STORAGE.name, name);
  nameError?.classList.add("hidden");
  openDashboard();
});

/* ==========================================
   BALANCE CARD
========================================== */

function renderDashboard() {
  const totals = getTotals();

  if (netWorthElement) {
    netWorthElement.textContent = displayMoney(totals.netWorth);
  }

  if (totalAssetsElement) {
    totalAssetsElement.textContent = displayMoney(totals.income);
  }

  if (totalLiabilitiesElement) {
    totalLiabilitiesElement.textContent = displayMoney(totals.expenses);
  }

  if (eyeIcon) {
    eyeIcon.textContent = balanceHidden ? "visibility_off" : "visibility";
  }

  if (toggleBalanceButton) {
    toggleBalanceButton.setAttribute(
      "aria-label",
      balanceHidden ? "Show balances" : "Hide balances"
    );
    toggleBalanceButton.setAttribute("aria-pressed", String(balanceHidden));
  }

  updateGreeting();
}

toggleBalanceButton?.addEventListener("click", () => {
  balanceHidden = !balanceHidden;
  localStorage.setItem(STORAGE.hidden, String(balanceHidden));
  renderDashboard();
});

/* ==========================================
   TOAST MESSAGES
========================================== */

function showToast(message) {
  let toast = $("#bxToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "bxToast";
    toast.className = "bx-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

/* ==========================================
   MODALS
========================================== */

let modalOverlay = null;

function closeModal() {
  modalOverlay?.remove();
  modalOverlay = null;
}

function showModal(title, content, onReady) {
  closeModal();

  modalOverlay = document.createElement("div");
  modalOverlay.className = "bx-modal-overlay";

  modalOverlay.innerHTML = `
    <section class="bx-modal" role="dialog" aria-modal="true"
      aria-label="${escapeHTML(title)}">
      <div class="bx-modal-heading">
        <h2>${escapeHTML(title)}</h2>
        <button class="bx-close" type="button" aria-label="Close">
          <span class="material-symbols-rounded" aria-hidden="true">close</span>
        </button>
      </div>
      <div class="bx-modal-body">${content}</div>
    </section>
  `;

  document.body.appendChild(modalOverlay);

  $(".bx-close", modalOverlay).addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", event => {
    if (event.target === modalOverlay) closeModal();
  });

  const handleKeydown = event => {
    if (event.key === "Escape" && modalOverlay) closeModal();
  };

  modalOverlay.addEventListener("keydown", handleKeydown);
  onReady?.(modalOverlay);
}

/* ==========================================
   TRANSACTIONS
========================================== */

function openTransactionForm(type) {
  const income = type === "income";

  const categories = income
    ? ["Salary", "Business", "Allowance", "Gift", "Investment", "Other"]
    : ["Food", "Transportation", "Bills", "Shopping", "Health",
       "Education", "Entertainment", "Rent", "Other"];

  showModal(income ? "Add Income" : "Add Expense", `
    <form id="transactionForm" class="bx-form">
      <label for="transactionAmount">Amount (₱)</label>
      <input id="transactionAmount" name="amount" type="number"
        min="0.01" step="0.01" inputmode="decimal"
        placeholder="0.00" required>

      <label for="transactionCategory">Category</label>
      <select id="transactionCategory" name="category" required>
        ${categories.map(category =>
          `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
        ).join("")}
      </select>

      <label for="transactionNote">Description (optional)</label>
      <input id="transactionNote" name="note" type="text"
        maxlength="100" placeholder="What was this for?">

      <label for="transactionDate">Date</label>
      <input id="transactionDate" name="date" type="date"
        value="${today()}" required>

      <button class="bx-submit" type="submit">
        Save ${income ? "Income" : "Expense"}
      </button>
    </form>
  `, overlay => {
    $("#transactionAmount", overlay).focus();

    $("#transactionForm", overlay).addEventListener("submit", event => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);
      const amount = Number(form.get("amount"));
      const date = String(form.get("date"));

      if (!Number.isFinite(amount) || amount <= 0) {
        showToast("Enter an amount greater than zero.");
        return;
      }

      if (!date) {
        showToast("Please choose a transaction date.");
        return;
      }

      transactions.unshift({
        id: makeId(),
        type,
        amount: Math.round(amount * 100) / 100,
        category: String(form.get("category")),
        note: String(form.get("note") || "").trim(),
        date
      });

      saveData();
      closeModal();
      refreshDashboard();
      showToast(`${income ? "Income" : "Expense"} saved.`);
    });
  });
}

function refreshDashboard() {
  renderDashboard();
  renderBudgets();
  renderTransactions();
}

/* Latest transaction list */

function renderTransactions(showAll = false) {
  if (!transactionsList) return;

  const items = showAll ? transactions : transactions.slice(0, 5);

  if (!items.length) {
    transactionsList.innerHTML = `
      <div class="transaction-empty">
        <span class="material-symbols-rounded" aria-hidden="true">receipt_long</span>
        <p>No transactions yet.</p>
        <p>Add your first income or expense to get started.</p>
      </div>
    `;
    return;
  }

  transactionsList.innerHTML = items.map(item => {
    const income = item.type === "income";
    const title = item.note || item.category;

    return `
      <article class="bx-transaction">
        <div class="bx-transaction-icon ${income ? "bx-income" : "bx-expense"}">
          <span class="material-symbols-rounded" aria-hidden="true">
            ${income ? "trending_up" : "trending_down"}
          </span>
        </div>

        <div class="bx-transaction-info">
          <h3>${escapeHTML(title)}</h3>
          <p>${escapeHTML(item.category)} · ${escapeHTML(formatDate(item.date))}</p>
        </div>

        <div class="bx-transaction-right">
          <strong class="${income ? "bx-income-text" : "bx-expense-text"}">
            ${income ? "+" : "−"}${displayMoney(item.amount)}
          </strong>
          <button type="button" class="bx-delete-transaction"
            data-delete-transaction="${escapeHTML(item.id)}">
            Delete
          </button>
        </div>
      </article>
    `;
  }).join("");
}

transactionsList?.addEventListener("click", event => {
  const button = event.target.closest("[data-delete-transaction]");
  if (!button) return;

  const id = button.dataset.deleteTransaction;
  if (!transactions.some(item => item.id === id)) return;

  if (!confirm("Delete this transaction?")) return;

  transactions = transactions.filter(item => item.id !== id);
  saveData();
  refreshDashboard();
  showToast("Transaction deleted.");
});

/* ==========================================
   BUDGETS
========================================== */

function openBudgetForm() {
  const categories = [
    "Food", "Transportation", "Bills", "Shopping", "Health",
    "Education", "Entertainment", "Rent", "Other"
  ];

  showModal("Create Budget", `
    <form id="budgetForm" class="bx-form">
      <label for="budgetName">Budget name</label>
      <input id="budgetName" name="name" type="text"
        maxlength="50" placeholder="e.g. Monthly food" required>

      <label for="budgetLimit">Spending limit (₱)</label>
      <input id="budgetLimit" name="limit" type="number"
        min="0.01" step="0.01" inputmode="decimal"
        placeholder="5000.00" required>

      <label for="budgetCategory">Category to track</label>
      <select id="budgetCategory" name="category">
        ${categories.map(category =>
          `<option value="${category}">${category}</option>`
        ).join("")}
      </select>

      <button class="bx-submit" type="submit">Create Budget</button>
    </form>
  `, overlay => {
    $("#budgetForm", overlay).addEventListener("submit", event => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);
      const name = String(form.get("name")).trim();
      const limit = Number(form.get("limit"));

      if (!name || !Number.isFinite(limit) || limit <= 0) {
        showToast("Enter a name and a valid budget limit.");
        return;
      }

      budgets.push({
        id: makeId(),
        name,
        limit: Math.round(limit * 100) / 100,
        category: String(form.get("category"))
      });

      saveData();
      closeModal();
      renderBudgets();
      showToast("Budget created.");
    });
  });
}

function getBudgetSpent(budget) {
  return transactions
    .filter(item =>
      item.type === "expense" && item.category === budget.category
    )
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function renderBudgets() {
  if (!budgetEmpty) return;

  if (!budgets.length) {
    budgetEmpty.innerHTML = `
      <div class="budget-illustration material-symbols-rounded" aria-hidden="true">savings</div>
      <p>You haven't added any budgets.</p>
      <button class="add-budget-button" id="addBudgetButton" type="button">
        <span class="material-symbols-rounded" aria-hidden="true">add</span>
        Add Budget
      </button>
    `;
    return;
  }

  budgetEmpty.innerHTML = budgets.map(budget => {
    const spent = getBudgetSpent(budget);
    const percent = Math.min(100, budget.limit > 0 ? spent / budget.limit * 100 : 0);
    const remaining = budget.limit - spent;

    return `
      <article class="bx-budget-card">
        <div class="bx-budget-heading">
          <div>
            <h3>${escapeHTML(budget.name)}</h3>
            <p>${escapeHTML(budget.category)}</p>
          </div>
          <button type="button" class="bx-delete-budget"
            data-delete-budget="${escapeHTML(budget.id)}">Delete</button>
        </div>

        <div class="bx-budget-amounts">
          <span>${displayMoney(spent)} spent</span>
          <span>of ${displayMoney(budget.limit)}</span>
        </div>

        <div class="bx-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          aria-valuenow="${Math.round(percent)}">
          <div class="bx-progress-fill ${percent >= 100 ? "over-budget" : ""}"
            style="width:${percent}%"></div>
        </div>

        <p class="bx-budget-remaining">
          ${remaining >= 0
            ? `${displayMoney(remaining)} remaining`
            : `${displayMoney(Math.abs(remaining))} over budget`}
        </p>
      </article>
    `;
  }).join("") + `
    <button class="add-budget-button" id="addBudgetButton" type="button">
      <span class="material-symbols-rounded" aria-hidden="true">add</span>
      Add Budget
    </button>
  `;
}

budgetEmpty?.addEventListener("click", event => {
  const addButton = event.target.closest("#addBudgetButton");
  if (addButton) {
    openBudgetForm();
    return;
  }

  const deleteButton = event.target.closest("[data-delete-budget]");
  if (!deleteButton) return;

  const id = deleteButton.dataset.deleteBudget;
  if (!confirm("Delete this budget?")) return;

  budgets = budgets.filter(budget => budget.id !== id);
  saveData();
  renderBudgets();
  showToast("Budget deleted.");
});

/* ==========================================
   ALL TRANSACTIONS & REPORTS
========================================== */

function openAllTransactions() {
  const rows = transactions.length
    ? transactions.map(item => `
        <div class="bx-simple-row">
          <span>
            <strong>${escapeHTML(item.note || item.category)}</strong>
            <small>${escapeHTML(formatDate(item.date))} · ${escapeHTML(item.category)}</small>
          </span>
          <strong class="${item.type === "income" ? "bx-income-text" : "bx-expense-text"}">
            ${item.type === "income" ? "+" : "−"}${displayMoney(item.amount)}
          </strong>
        </div>
      `).join("")
    : `<p class="transaction-empty">No transactions recorded yet.</p>`;

  showModal("All Transactions", `
    <div class="bx-all-transactions">${rows}</div>
  `);
}

function openReports() {
  const totals = getTotals();

  showModal("Financial Reports", `
    <div class="bx-report-list">
      <div><span>Total Income</span><strong class="bx-income-text">${displayMoney(totals.income)}</strong></div>
      <div><span>Total Expenses</span><strong class="bx-expense-text">${displayMoney(totals.expenses)}</strong></div>
      <div><span>Net Worth</span><strong>${displayMoney(totals.netWorth)}</strong></div>
      <div><span>Transactions</span><strong>${transactions.length}</strong></div>
      <div><span>Budgets</span><strong>${budgets.length}</strong></div>
    </div>
    <p class="bx-report-note">
      Summary of transactions saved in this browser. Expenses are grouped
      by their recorded category in your budget progress.
    </p>
  `);
}

/* ==========================================
   PROFILE
========================================== */

function openProfile() {
  const currentName = localStorage.getItem(STORAGE.name) || "";

  showModal("Your Profile", `
    <form id="profileForm" class="bx-form">
      <label for="profileName">Display name</label>
      <input id="profileName" name="name" maxlength="40"
        value="${escapeHTML(currentName)}" required>
      <button class="bx-submit" type="submit">Save Name</button>
    </form>
  `, overlay => {
    $("#profileForm", overlay).addEventListener("submit", event => {
      event.preventDefault();

      const name = String(new FormData(event.currentTarget).get("name")).trim();
      if (!name) {
        showToast("Please enter your name.");
        return;
      }

      localStorage.setItem(STORAGE.name, name);
      closeModal();
      updateGreeting();
      showToast("Profile updated.");
    });
  });
}

/* ==========================================
   QUICK ACTIONS
========================================== */

$("#addIncomeButton")?.addEventListener("click", () => openTransactionForm("income"));
$("#addExpenseButton")?.addEventListener("click", () => openTransactionForm("expense"));
$("#budgetsButton")?.addEventListener("click", openBudgetForm);
$("#reportsButton")?.addEventListener("click", openReports);
$("#headerProfileButton")?.addEventListener("click", openProfile);
$("#viewAllTransactions")?.addEventListener("click", openAllTransactions);
$("#viewAllBudgets")?.addEventListener("click", openBudgetForm);

/* ==========================================
   BOTTOM NAVIGATION
========================================== */

function setActiveNavigation(page) {
  $$(".finance-nav-item").forEach(button => {
    const active = button.dataset.page === page;
    button.classList.toggle("active", active);

    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

$$(".finance-nav-item").forEach(button => {
  button.addEventListener("click", () => {
    const page = button.dataset.page;

    if (page === "add") {
      showModal("Add Transaction", `
        <div class="bx-choice-list">
          <button class="bx-choice" data-type="income" type="button">
            <span class="material-symbols-rounded" aria-hidden="true">trending_up</span>
            Add Income
          </button>
          <button class="bx-choice" data-type="expense" type="button">
            <span class="material-symbols-rounded" aria-hidden="true">trending_down</span>
            Add Expense
          </button>
        </div>
      `, overlay => {
        $$("[data-type]", overlay).forEach(choice => {
          choice.addEventListener("click", () => {
            const type = choice.dataset.type;
            closeModal();
            openTransactionForm(type);
          });
        });
      });
      return;
    }

    setActiveNavigation(page);

    if (page === "home") {
      openDashboard();
    } else if (page === "transactions") {
      openAllTransactions();
    } else if (page === "reports") {
      openReports();
    } else if (page === "profile") {
      openProfile();
    }
  });
});

/* ==========================================
   NOTIFICATIONS
========================================== */

function updateNotificationCard() {
  if (!notificationCard) return;

  if (
    localStorage.getItem(STORAGE.notificationDismissed) === "true" ||
    ("Notification" in window && Notification.permission === "granted")
  ) {
    notificationCard.classList.add("hidden");
  } else {
    notificationCard.classList.remove("hidden");
  }
}

dismissNotification?.addEventListener("click", () => {
  localStorage.setItem(STORAGE.notificationDismissed, "true");
  notificationCard?.classList.add("hidden");
});

grantPermission?.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    showToast("Notifications are not supported by this browser.");
    return;
  }

  if (!window.isSecureContext) {
    showToast("Notifications require HTTPS or localhost.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      notificationCard?.classList.add("hidden");
      showToast("Notifications enabled on this device.");

      new Notification("BudgetX", {
        body: "Notifications are now enabled."
      });
    } else if (permission === "denied") {
      showToast("Permission denied. Check your browser settings.");
    } else {
      showToast("Notification permission was not granted.");
    }
  } catch (error) {
    console.error("Notification error:", error);
    showToast("Could not enable notifications.");
  }
});

/* ==========================================
   INITIALIZE
========================================== */

if (localStorage.getItem(STORAGE.name)) {
  openDashboard();
} else {
  showScreen(welcomeScreen);
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .catch(error => console.error("Service worker registration failed:", error));
  });
}
