// Это только визуальный барьер. Пароль в клиентском JS можно посмотреть через инструменты разработчика.
const ADMIN_PASSWORD = "admin123";
// Укажите тот же URL Web App, что и в script.js.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxOL9e9EGF99bTmvxKAExrLh8-cZxcYW4izMH_MxJKKq6wvl9XccfVqYXMeFMhXSKp86w/exec";

const body = document.getElementById("responses-body");
const statusMessage = document.getElementById("admin-message");
const refreshButton = document.getElementById("refresh-button");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function renderRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    body.innerHTML = '<tr><td colspan="7">Пока нет ответов.</td></tr>';
    return;
  }
  body.innerHTML = rows.map(row => `<tr>
    <td>${escapeHtml(row.firstName)}</td>
    <td>${escapeHtml(row.lastName)}</td>
    <td><span class="status-pill">${escapeHtml(row.attendance)}</span></td>
    <td>${escapeHtml(row.contactMethod)}</td>
    <td>${escapeHtml(row.contact)}</td>
    <td>${escapeHtml(Array.isArray(row.alcohol) ? row.alcohol.join(", ") : row.alcohol)}</td>
    <td>${escapeHtml(row.timestamp)}</td>
  </tr>`).join("");
}

async function loadResponses() {
  if (!GOOGLE_SCRIPT_URL.startsWith("https://script.google.com/")) {
    statusMessage.textContent = "Укажите URL Web App в файле admin.js.";
    statusMessage.classList.add("error");
    return;
  }
  refreshButton.disabled = true;
  statusMessage.textContent = "Загружаем ответы…";
  try {
    // JSONP используется, чтобы получить данные с Google Apps Script без CORS-проблем.
    const callbackName = "rsvpCallback_" + Date.now();
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      statusMessage.textContent = "Не удалось загрузить данные. Проверьте URL и доступ Web App.";
      statusMessage.classList.add("error");
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
      refreshButton.disabled = false;
    }

    window[callbackName] = (result) => {
      cleanup();
      if (!result || result.ok !== true) {
        statusMessage.textContent = result?.error || "Сервер вернул ошибку.";
        statusMessage.classList.add("error");
        return;
      }
      statusMessage.textContent = `Всего ответов: ${result.rows.length}`;
      statusMessage.className = "form-message";
      renderRows(result.rows);
    };
    script.onerror = () => {
      cleanup();
      statusMessage.textContent = "Ошибка загрузки. Проверьте URL и публикацию скрипта.";
      statusMessage.classList.add("error");
    };
    script.src = `${GOOGLE_SCRIPT_URL}?callback=${encodeURIComponent(callbackName)}&t=${Date.now()}`;
    document.body.appendChild(script);
  } catch (error) {
    console.error(error);
    statusMessage.textContent = "Не удалось загрузить ответы.";
    statusMessage.classList.add("error");
    refreshButton.disabled = false;
  }
}

const enteredPassword = window.prompt("Введите пароль администратора:");
if (enteredPassword === ADMIN_PASSWORD) {
  loadResponses();
} else {
  document.body.innerHTML = '<main class="admin-wrap"><h2>Доступ закрыт</h2><p>Неверный пароль.</p><a class="text-link" href="index.html">Вернуться к приглашению</a></main>';
}
refreshButton.addEventListener("click", loadResponses);
