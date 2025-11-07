// --- Modal Elements ---
const updateModal = document.getElementById("updateModal");
const modalTitle = document.getElementById("modalTitle");
const modalInput = document.getElementById("modalInput");
const modalCancel = document.getElementById("modalCancel");
const modalSave = document.getElementById("modalSave");
const modalClose = document.getElementById("modalClose");
const MIN_SPINNER_TIME = 300;
const baseUrl = "https://smart-room-entry-be.onrender.com";
// const baseUrl = "http://localhost:3000";
// const baseUrl = "http://localhost:3000";
function showSpinner() {
  document.getElementById("spinnerOverlay").classList.remove("hidden");
}

function hideSpinner() {
  document.getElementById("spinnerOverlay").classList.add("hidden");
}
let currentRoom = null;
let updateField = ""; // "currentPeople" hoặc "capacity"

// --- Hàm mở modal ---
function openModal(room, field) {
  currentRoom = room;
  updateField = field;
  modalTitle.textContent =
    field === "currentPeople"
      ? `Cập nhật số người hiện tại phòng ${room.roomNumber}`
      : `Cập nhật số người quy định phòng ${room.roomNumber}`;
  modalInput.value = room[field];
  updateModal.classList.remove("hidden");
}

// --- Hàm đóng modal ---
function closeModal() {
  updateModal.classList.add("hidden");
  hideSpinner();
  currentRoom = null;
  updateField = "";
}

// --- Event nút modal ---
modalCancel.addEventListener("click", closeModal);
modalClose.addEventListener("click", closeModal);
updateModal.addEventListener("click", (e) => {
  if (e.target === updateModal) closeModal(); // click ngoài modal
});

modalSave.addEventListener("click", () => {
  const spinnerStart = Date.now();
  showSpinner();
  const newValue = Number(modalInput.value);
  if (isNaN(newValue) || (updateField === "capacity" && newValue < 0)) {
    Toastify({
      text: "Vui lòng nhập số hợp lệ!",
      close: true,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: "#f87171",
    }).showToast();
    hideSpinner();
    return;
  }
  fetch(`${baseUrl}/rooms/${currentRoom.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({ [updateField]: newValue }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then((data) => {
      // Thông báo cho các script khác cập nhật UI
      document.dispatchEvent(
        new CustomEvent("room-updated", {
          detail: { id: currentRoom.id, field: updateField, value: newValue },
        })
      );
      closeModal();
    })
    .catch((err) => {
      console.error("Update room error", err);
      Toastify({
        text: data.message || "Cập nhập thông tin phòng thất bại",
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#f87171",
      }).showToast();
    })
    .finally(() => {
      const elapsed = Date.now() - spinnerStart;
      const remaining = MIN_SPINNER_TIME - elapsed;
      if (remaining > 0) setTimeout(hideSpinner, remaining);
      else hideSpinner();
    });
});
