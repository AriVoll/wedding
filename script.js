// Вставьте сюда URL развернутого Google Apps Script Web App (заканчивается на /exec).
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxOL9e9EGF99bTmvxKAExrLh8-cZxcYW4izMH_MxJKKq6wvl9XccfVqYXMeFMhXSKp86w/exec";

const form = document.getElementById("rsvp-form");
const methodRadios = document.querySelectorAll('input[name="contactMethod"]');
const contactLabel = document.getElementById("contact-label");
const contactInput = document.getElementById("contact-value");
const message = document.getElementById("form-message");
const submitButton = document.getElementById("submit-button");

function updateContactField() {
  const method = document.querySelector('input[name="contactMethod"]:checked').value;
  if (method === "Телефон") {
    contactLabel.firstChild.textContent = "Номер телефона *";
    contactInput.type = "tel";
    contactInput.name = "contact";
    contactInput.autocomplete = "tel";
    contactInput.placeholder = "+7 900 000-00-00";
  } else {
    contactLabel.firstChild.textContent = "Электронная почта *";
    contactInput.type = "email";
    contactInput.autocomplete = "email";
    contactInput.placeholder = "name@example.com";
  }
}
methodRadios.forEach(radio => radio.addEventListener("change", updateContactField));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.className = "form-message";
  message.textContent = "";

  if (!form.reportValidity()) return;
  if (!GOOGLE_SCRIPT_URL.startsWith("https://script.google.com/")) {
    message.textContent = "Сначала укажите URL Google Apps Script в файле script.js.";
    message.classList.add("error");
    return;
  }

  const data = new FormData(form);
  const payload = {
    firstName: String(data.get("firstName") || "").trim(),
    lastName: String(data.get("lastName") || "").trim(),
    attendance: data.get("attendance"),
    contactMethod: data.get("contactMethod"),
    contact: String(data.get("contact") || "").trim(),
    alcohol: data.getAll("alcohol")
  };

  if (!payload.firstName || !payload.lastName || !payload.attendance || !payload.contact) {
    message.textContent = "Пожалуйста, заполните обязательные поля.";
    message.classList.add("error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Отправляем…";
  try {
    // text/plain + no-cors позволяет отправить POST из статического сайта без preflight.
    // Ответ opaque: браузер не даёт прочитать его статус, поэтому показываем сообщение после отправки.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    message.textContent = "Спасибо! Ваш ответ отправлен. Будем рады вас видеть!";
    form.reset();
    updateContactField();
  } catch (error) {
    console.error(error);
    message.textContent = "Не удалось отправить ответ. Проверьте подключение и попробуйте ещё раз.";
    message.classList.add("error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Отправить ответ";
  }
});
updateContactField();
