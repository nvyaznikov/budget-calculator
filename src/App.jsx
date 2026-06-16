import React, { useEffect, useMemo, useState } from "react";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const TRANSACTION_TYPES = {
  all: "Все",
  income: "Доход",
  expense: "Расход",
  regular: "Регулярный расход",
};

const FORM_TYPES = {
  income: "Доход",
  expense: "Расход",
  regular: "Регулярный расход",
};

const EMPTY_FORM = {
  type: "expense",
  category: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
};

const REGULAR_CATEGORIES = [
  "Аренда жилья",
  "ЖКУ",
  "Продукты",
  "Транспорт",
  "Связь",
  "Другое",
];

const CATEGORY_PLACEHOLDERS = {
  income: "Например: зарплата, подработка, возврат долга",
  expense: "Например: кафе, транспорт, продукты",
};

const CHART_COLORS = [
  "#9af012",
  "#f7c948",
  "#4dabf7",
  "#ff6b6b",
  "#b197fc",
  "#63e6be",
  "#ffa94d",
  "#adb5bd",
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "66%",
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label(context) {
          return `${context.label}: ${formatMoney(context.parsed)}`;
        },
      },
    },
  },
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("cashKeeperToken");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Ошибка запроса");
  }

  return data;
}

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function formatMoney(value) {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getPreviousMonth(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 2, 1);

  return date.toISOString().slice(0, 7);
}

function formatMonth(month) {
  const [year, monthIndex] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex - 1, 1));
}

function getMonthDaysLeft() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return Math.max(1, lastDay - now.getDate() + 1);
}

function sumByType(items, type) {
  return items
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

function calculateTotals(items) {
  const income = sumByType(items, "income");
  const expense = sumByType(items, "expense");
  const regular = sumByType(items, "regular");

  return {
    income,
    expense,
    regular,
    balance: income - expense - regular,
    spending: expense + regular,
    operations: items.length,
  };
}

function groupByCategory(items) {
  const groups = items.reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + Number(item.amount);
    return result;
  }, {});

  return Object.entries(groups)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function createChartData(items) {
  return {
    labels: items.map((item) => item.category),
    datasets: [
      {
        data: items.map((item) => item.amount),
        backgroundColor: items.map(
          (_, index) => CHART_COLORS[index % CHART_COLORS.length]
        ),
        borderColor: "#2f2f2f",
        borderWidth: 4,
        hoverOffset: 8,
        spacing: 2,
      },
    ],
  };
}

function getDelta(current, previous) {
  if (!previous && !current) return "без изменений";
  if (!previous) return "новый показатель";

  const percent = ((current - previous) / previous) * 100;
  const sign = percent > 0 ? "+" : "";

  return `${sign}${percent.toFixed(0)}% к прошлому месяцу`;
}

function App() {
  const [transactions, setTransactions] = useState([]);
  const [saving, setSaving] = useState(() =>
    readStorage("cashKeeperSaving", 0)
  );
  const [theme, setTheme] = useState(() =>
    readStorage("cashKeeperTheme", "dark")
  );
  const [month, setMonth] = useState(getCurrentMonth);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [historyType, setHistoryType] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem("cashKeeperToken"),
    user: readStorage("cashKeeperUser", null),
  }));
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [appError, setAppError] = useState("");

  useEffect(() => {
    localStorage.setItem("cashKeeperSaving", JSON.stringify(saving));
  }, [saving]);

  useEffect(() => {
    localStorage.setItem("cashKeeperTheme", JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    if (!auth.token) return;

    setIsLoadingTransactions(true);
    setAppError("");

    apiRequest("/transactions")
      .then((data) => setTransactions(data.transactions))
      .catch((error) => {
        setAppError(error.message);
        if (error.message === "Сессия истекла") {
          logout();
        }
      })
      .finally(() => setIsLoadingTransactions(false));
  }, [auth.token]);

  const previousMonth = getPreviousMonth(month);

  const monthTransactions = useMemo(
    () => transactions.filter((item) => item.date.slice(0, 7) === month),
    [transactions, month]
  );

  const previousMonthTransactions = useMemo(
    () =>
      transactions.filter((item) => item.date.slice(0, 7) === previousMonth),
    [transactions, previousMonth]
  );

  const analytics = useMemo(() => {
    const totals = calculateTotals(monthTransactions);
    const maxSaving = Math.max(0, totals.balance);
    const actualSaving = Math.min(Number(saving), maxSaving);
    const dailyBudget = Math.max(
      0,
      (totals.balance - actualSaving) / getMonthDaysLeft()
    );

    return {
      ...totals,
      actualSaving,
      dailyBudget,
      expenseCategories: groupByCategory(
        monthTransactions.filter((item) => item.type !== "income")
      ),
      incomeCategories: groupByCategory(
        monthTransactions.filter((item) => item.type === "income")
      ),
    };
  }, [monthTransactions, saving]);

  const previousAnalytics = useMemo(
    () => calculateTotals(previousMonthTransactions),
    [previousMonthTransactions]
  );

  const filteredTransactions = useMemo(() => {
    const search = historySearch.trim().toLowerCase();

    return monthTransactions.filter((item) => {
      const typeMatches = historyType === "all" || item.type === historyType;
      const searchMatches =
        !search ||
        item.category.toLowerCase().includes(search) ||
        String(item.amount).includes(search) ||
        item.date.includes(search);

      return typeMatches && searchMatches;
    });
  }, [historySearch, historyType, monthTransactions]);

  const notices = useMemo(() => {
    const result = [];

    if (!monthTransactions.length) {
      result.push("За выбранный месяц пока нет операций. Добавьте доходы и расходы, чтобы увидеть аналитику.");
    }

    if (!analytics.income && monthTransactions.length) {
      result.push("В выбранном месяце нет доходов, поэтому дневной бюджет не рассчитывается полноценно.");
    }

    if (analytics.balance < 0) {
      result.push("Баланс отрицательный: расходы и регулярные платежи превышают доходы.");
    }

    if (analytics.balance <= 0) {
      result.push("Накопления недоступны, пока баланс месяца не станет положительным.");
    }

    if (historySearch && !filteredTransactions.length) {
      result.push("По текущему поиску и фильтрам операций не найдено.");
    }

    return result;
  }, [
    analytics.balance,
    analytics.income,
    filteredTransactions.length,
    historySearch,
    monthTransactions.length,
  ]);

  useEffect(() => {
    if (saving !== analytics.actualSaving) {
      setSaving(analytics.actualSaving);
    }
  }, [analytics.actualSaving, saving]);

  function updateForm(field, value) {
    setFormError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const category = form.category.trim();
    const amount = Number(form.amount);

    if (!category) {
      setFormError("Укажите категорию операции.");
      return;
    }

    if (!amount || amount <= 0) {
      setFormError("Сумма должна быть больше 0.");
      return;
    }

    if (!form.date) {
      setFormError("Выберите дату операции.");
      return;
    }

    const nextItem = {
      id: editingId || crypto.randomUUID(),
      type: form.type,
      category,
      amount,
      date: form.date,
    };

    try {
      setFormError("");

      if (editingId) {
        const data = await apiRequest(`/transactions/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(nextItem),
        });

        setTransactions((current) =>
          current.map((item) =>
            item.id === editingId ? data.transaction : item
          )
        );
      } else {
        const data = await apiRequest("/transactions", {
          method: "POST",
          body: JSON.stringify(nextItem),
        });

        setTransactions((current) => [data.transaction, ...current]);
      }

      resetForm();
    } catch (error) {
      setFormError(error.message);
    }
  }

  function startEdit(transaction) {
    setEditingId(transaction.id);
    setFormError("");
    setForm({
      type: transaction.type,
      category: transaction.category,
      amount: String(transaction.amount),
      date: transaction.date,
    });
  }

  async function deleteTransaction(id) {
    if (!confirm("Удалить эту операцию?")) return;

    try {
      await apiRequest(`/transactions/${id}`, { method: "DELETE" });
      setTransactions((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setAppError(error.message);
    }
  }

  function updateSaving(value) {
    const nextValue = Math.max(0, Math.min(Number(value) || 0, maxSaving));
    setSaving(nextValue);
  }

  function exportData() {
    const data = JSON.stringify({ transactions, saving }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `cash-keeper-${month}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleAuthSuccess(data) {
    localStorage.setItem("cashKeeperToken", data.token);
    localStorage.setItem("cashKeeperUser", JSON.stringify(data.user));
    setAuth(data);
  }

  function logout() {
    localStorage.removeItem("cashKeeperToken");
    localStorage.removeItem("cashKeeperUser");
    setAuth({ token: null, user: null });
    setTransactions([]);
  }

  const maxSaving = Math.max(0, analytics.balance);

  if (!auth.token) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  return (
    <main className={`app ${theme}`}>
      <header className="topbar">
        <a className="logo" href="/">
          <span>Cash</span>
          <span>Keeper</span>
        </a>

        <div className="topbarTitle">
          <p>Учет и анализ личных финансов</p>
          <h1>Финансовый обзор</h1>
          {auth.user && <p className="userLine">{auth.user.name} · {auth.user.email}</p>}
        </div>

        <div className="topbarActions">
          <label className="monthPicker">
            <span>Месяц</span>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>
          <button className="plainButton" type="button" onClick={exportData}>
            Экспорт
          </button>
          <button className="plainButton" type="button" onClick={logout}>
            Выйти
          </button>
          <button
            className="plainButton themeButton"
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Переключить тему"
            title="Переключить тему"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </header>

      {appError && (
        <section className="noticeList">
          <p>{appError}</p>
        </section>
      )}

      {isLoadingTransactions && (
        <section className="noticeList">
          <p>Загружаем операции пользователя...</p>
        </section>
      )}

      <section className="summaryGrid">
        <article className="dailyCard">
          <span>Можно тратить в день</span>
          <strong>{formatMoney(analytics.dailyBudget)}</strong>
          <p>
            Расчет учитывает доходы, расходы, регулярные платежи и сумму
            накоплений до конца месяца.
          </p>
        </article>

        <SummaryCard label="Доходы" value={analytics.income} tone="good" />
        <SummaryCard label="Расходы" value={analytics.expense} tone="bad" />
        <SummaryCard
          label="Регулярные"
          value={analytics.regular}
          tone="neutral"
        />
        <SummaryCard
          label="Баланс"
          value={analytics.balance}
          tone={analytics.balance >= 0 ? "good" : "bad"}
        />
      </section>

      {notices.length > 0 && (
        <section className="noticeList">
          {notices.map((notice) => (
            <p key={notice}>{notice}</p>
          ))}
        </section>
      )}

      <section className="comparisonGrid">
        <ComparisonCard
          label="Доходы"
          current={analytics.income}
          previous={previousAnalytics.income}
        />
        <ComparisonCard
          label="Расходы"
          current={analytics.spending}
          previous={previousAnalytics.spending}
        />
        <ComparisonCard
          label="Баланс"
          current={analytics.balance}
          previous={previousAnalytics.balance}
        />
        <ComparisonCard
          label="Операции"
          current={analytics.operations}
          previous={previousAnalytics.operations}
          isMoney={false}
        />
      </section>

      <section className="layoutGrid">
        <form className="panel transactionForm" onSubmit={handleSubmit}>
          <PanelHeader
            title={editingId ? "Редактирование" : "Новая операция"}
            text="Доход, расход или регулярный платеж"
          />

          <div className="typeSwitch" role="group" aria-label="Тип операции">
            {Object.entries(FORM_TYPES).map(([value, label]) => (
              <button
                className={form.type === value ? "active" : ""}
                key={value}
                type="button"
                onClick={() => updateForm("type", value)}
              >
                {label}
              </button>
            ))}
          </div>

          <label>
            Категория
            {form.type === "regular" ? (
              <select
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
              >
                <option value="">Выберите категорию</option>
                {REGULAR_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                placeholder={CATEGORY_PLACEHOLDERS[form.type]}
              />
            )}
          </label>

          <div className="formGrid">
            <label>
              Сумма
              <input
                type="number"
                min="1"
                step="1"
                value={form.amount}
                onChange={(event) => updateForm("amount", event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Дата
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateForm("date", event.target.value)}
              />
            </label>
          </div>

          <div className="savingControl">
            <label className="savingRange">
              <span>Откладывать в месяц: {formatMoney(saving)}</span>
              <input
                type="range"
                min="0"
                max={maxSaving}
                step="100"
                value={saving}
                onChange={(event) => updateSaving(event.target.value)}
              />
            </label>

            <label>
              Ввести сумму вручную
              <input
                type="number"
                min="0"
                max={maxSaving}
                step="100"
                value={saving}
                onChange={(event) => updateSaving(event.target.value)}
              />
            </label>
          </div>

          {formError && <p className="formError">{formError}</p>}

          <div className="formActions">
            <button className="primaryButton" type="submit">
              {editingId ? "Сохранить" : "Добавить"}
            </button>
            {editingId && (
              <button className="plainButton" type="button" onClick={resetForm}>
                Отмена
              </button>
            )}
          </div>
        </form>

        <section className="panel analyticsPanel">
          <PanelHeader
            title="Аналитика"
            text={`${analytics.operations} операций за ${formatMonth(month)}`}
          />

          <div className="donutGrid">
            <DonutCard
              title="Структура расходов"
              total={analytics.spending}
              items={analytics.expenseCategories}
              emptyText="Расходов за месяц пока нет"
            />
            <DonutCard
              title="Структура доходов"
              total={analytics.income}
              items={analytics.incomeCategories}
              emptyText="Доходов за месяц пока нет"
            />
          </div>
        </section>
      </section>

      <section className="panel historyPanel">
        <PanelHeader
          title="История операций"
          text="Поиск, фильтр, редактирование и удаление записей"
        />

        <div className="historyControls">
          <input
            type="search"
            value={historySearch}
            onChange={(event) => setHistorySearch(event.target.value)}
            placeholder="Поиск по категории, сумме или дате"
          />

          <select
            value={historyType}
            onChange={(event) => setHistoryType(event.target.value)}
          >
            {Object.entries(TRANSACTION_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="transactionList">
          {filteredTransactions.length ? (
            filteredTransactions.map((transaction) => (
              <article className="transactionItem" key={transaction.id}>
                <div>
                  <span className={`typeBadge ${transaction.type}`}>
                    {TRANSACTION_TYPES[transaction.type]}
                  </span>
                  <h3>{transaction.category}</h3>
                  <p>{transaction.date}</p>
                </div>
                <strong
                  className={
                    transaction.type === "income" ? "amountGood" : "amountBad"
                  }
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatMoney(transaction.amount)}
                </strong>
                <div className="rowActions">
                  <button type="button" onClick={() => startEdit(transaction)}>
                    Изм.
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTransaction(transaction.id)}
                  >
                    Удалить
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="emptyState">Операций по текущим условиям нет</p>
          )}
        </div>
      </section>
    </main>
  );
}

function PanelHeader({ title, text }) {
  return (
    <div className="panelHeader">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  return (
    <article className={`summaryCard ${tone}`}>
      <span>{label}</span>
      <strong>{formatMoney(value)}</strong>
    </article>
  );
}

function ComparisonCard({ label, current, previous, isMoney = true }) {
  const currentText = isMoney ? formatMoney(current) : current;
  const previousText = isMoney ? formatMoney(previous) : previous;

  return (
    <article className="comparisonCard">
      <span>{label}</span>
      <strong>{currentText}</strong>
      <p>{getDelta(current, previous)}</p>
      <small>Было: {previousText}</small>
    </article>
  );
}

function DonutCard({ title, total, items, emptyText }) {
  return (
    <article className="donutCard">
      <div className="donutHeader">
        <div>
          <h3>{title}</h3>
          <p>{formatMoney(total)}</p>
        </div>
      </div>

      {items.length ? (
        <div className="donutContent">
          <div className="chartWrap">
            <Doughnut data={createChartData(items)} options={chartOptions} />
            <div className="chartCenter">
              <span>Итого</span>
              <strong>{formatMoney(total)}</strong>
            </div>
          </div>

          <ul className="legendList">
            {items.map((item, index) => (
              <li key={item.category}>
                <i
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span>{item.category}</span>
                <strong>{formatMoney(item.amount)}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="emptyState">{emptyText}</p>
      )}
    </article>
  );
}

function AuthScreen({ onSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : form;
      const data = await apiRequest(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onSuccess(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authCard">
        <a className="logo authLogo" href="/">
          <span>Cash</span>
          <span>Keeper</span>
        </a>

        <div className="authHeader">
          <p>Личный кабинет</p>
          <h1>{mode === "login" ? "Вход" : "Регистрация"}</h1>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Имя
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Например: Никита"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="mail@example.com"
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Минимум 6 символов"
            />
          </label>

          {error && <p className="formError">{error}</p>}

          <button className="primaryButton" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Подождите..."
              : mode === "login"
                ? "Войти"
                : "Создать аккаунт"}
          </button>
        </form>

        <button
          className="authSwitch"
          type="button"
          onClick={() => {
            setError("");
            setMode(mode === "login" ? "register" : "login");
          }}
        >
          {mode === "login"
            ? "Нет аккаунта? Зарегистрироваться"
            : "Уже есть аккаунт? Войти"}
        </button>
      </section>
    </main>
  );
}

export default App;
