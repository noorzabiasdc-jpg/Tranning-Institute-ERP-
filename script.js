
const form = document.getElementById("studentForm");
const studentTable = document.getElementById("studentTable");
const search = document.getElementById("search");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const courseInput = document.getElementById("course");
const feesInput = document.getElementById("fees");
const paidInput = document.getElementById("paid");
const dateInput = document.getElementById("joiningDate");
const statusInput = document.getElementById("status");

const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const formTitle = document.getElementById("formTitle");
const formMessage = document.getElementById("formMessage");

let students = [];
let editingId = null;

// Load previously saved records
try {
  const savedData = JSON.parse(
    localStorage.getItem("trainingStudents") || "[]"
  );

  if (Array.isArray(savedData)) {
    students = savedData.filter(
      s => s && typeof s.id === "string"
    );
  }
} catch (error) {
  students = [];
}

// Safely display text entered by users
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Save records in the browser
function saveData() {
  try {
    localStorage.setItem(
      "trainingStudents",
      JSON.stringify(students)
    );
    return true;
  } catch (error) {
    alert("Unable to save data. Check browser storage.");
    return false;
  }
}

// Format amounts in Indian rupees
function money(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

// Update dashboard numbers
function updateDashboard() {
  const totalFees = students.reduce(
    (sum, student) => sum + Number(student.fees), 0
  );

  const received = students.reduce(
    (sum, student) => sum + Number(student.paid), 0
  );

  document.getElementById("totalStudents").textContent =
    students.length;

  document.getElementById("totalFees").textContent =
    money(totalFees);

  document.getElementById("feesReceived").textContent =
    money(received);
}

// Display student records
function renderStudents() {
  const query = search.value.trim().toLowerCase();

  const filteredStudents = students.filter(student => {
    const text = [
      student.name,
      student.phone,
      student.email,
      student.course
    ].join(" ").toLowerCase();

    return text.includes(query);
  });

  studentTable.innerHTML = filteredStudents.map(student => {
    const due = Number(student.fees) - Number(student.paid);

    return `
      <tr>
        <td>
          <strong>${escapeHTML(student.name)}</strong><br>
          ${escapeHTML(student.phone)}<br>
          ${escapeHTML(student.email)}
        </td>
        <td>${escapeHTML(student.course)}</td>
        <td>${money(student.fees)}</td>
        <td>${money(student.paid)}</td>
        <td>${money(due)}</td>
        <td>${escapeHTML(student.date)}</td>
        <td>
          <span class="status ${escapeHTML(student.status)}">
            ${escapeHTML(student.status)}
          </span>
        </td>
        <td>
          <button class="edit" data-action="edit"
            data-id="${escapeHTML(student.id)}">
            Edit
          </button>
          <button class="delete" data-action="delete"
            data-id="${escapeHTML(student.id)}">
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join("");

  document.getElementById("emptyMessage").textContent =
    filteredStudents.length
      ? ""
      : students.length
        ? "No matching students found."
        : "No students added yet.";

  updateDashboard();
}

// Reset form for a new student
function resetForm() {
  form.reset();
  editingId = null;

  formTitle.textContent = "Add New Student";
  saveButton.textContent = "Add Student";
  cancelButton.classList.add("hidden");

  paidInput.value = 0;
  dateInput.value = new Date().toLocaleDateString("en-CA");
  formMessage.textContent = "";
}

// Add a student or save edited details
form.addEventListener("submit", function(event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();
  const course = courseInput.value;
  const fees = Number(feesInput.value);
  const paid = Number(paidInput.value);
  const date = dateInput.value;
  const status = statusInput.value;

  if (!name || !/^[0-9]{10}$/.test(phone)) {
    alert("Enter a name and a valid 10-digit phone number.");
    return;
  }

  if (
    !Number.isFinite(fees) ||
    !Number.isFinite(paid) ||
    fees < 0 ||
    paid < 0 ||
    paid > fees
  ) {
    alert("Paid fees must be between ₹0 and total course fees.");
    return;
  }

  if (!course || !date) {
    alert("Please select a course and joining date.");
    return;
  }

  const student = {
    id: editingId || (
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Date.now().toString() + Math.random().toString(36).slice(2)
    ),
    name,
    phone,
    email,
    course,
    fees,
    paid,
    date,
    status
  };

  const previousStudents = [...students];

  if (editingId) {
    students = students.map(item =>
      item.id === editingId ? student : item
    );
  } else {
    students.push(student);
  }

  if (!saveData()) {
    students = previousStudents;
    return;
  }

  renderStudents();
  resetForm();

  formMessage.textContent = "Student record saved successfully!";
});

// Handle Edit and Delete buttons
studentTable.addEventListener("click", function(event) {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = button.dataset.id;
  const student = students.find(item => item.id === id);

  if (!student) return;

  if (button.dataset.action === "edit") {
    editingId = id;

    nameInput.value = student.name;
    phoneInput.value = student.phone;
    emailInput.value = student.email;
    courseInput.value = student.course;
    feesInput.value = student.fees;
    paidInput.value = student.paid;
    dateInput.value = student.date;
    statusInput.value = student.status;

    formTitle.textContent = "Update Student Details";
    saveButton.textContent = "Save Changes";
    cancelButton.classList.remove("hidden");
    formMessage.textContent = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (button.dataset.action === "delete") {
    if (!confirm(`Delete the record of ${student.name}?`)) {
      return;
    }

    const previousStudents = [...students];
    students = students.filter(item => item.id !== id);

    if (!saveData()) {
      students = previousStudents;
      return;
    }

    if (editingId === id) resetForm();

    renderStudents();
  }
});

// Search records as you type
search.addEventListener("input", renderStudents);

// Cancel editing
cancelButton.addEventListener("click", resetForm);

// Start the application
resetForm();
renderStudents();
