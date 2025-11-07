document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("settingsForm");
  const saveBtn = document.getElementById("saveBtn");
  const inputs = document.querySelectorAll(".setting-input");
  const baseUrl = "https://smart-room-entry-be.onrender.com";
  let originalSettings = {};
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuToggleBtn");
  const closeBtn = document.getElementById("closeSidebarBtn");

  menuBtn?.addEventListener("click", () => {
    sidebar.classList.remove("-translate-x-full");
  });
  closeBtn?.addEventListener("click", () => {
    sidebar.classList.add("-translate-x-full");
  });
  // 🧭 1️⃣ Load dữ liệu ban đầu từ API
  async function loadSettings() {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const res = await fetch(`${baseUrl}/settings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();

      originalSettings = data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});

      inputs.forEach((input) => {
        const key = input.dataset.key;
        if (originalSettings[key] !== undefined) {
          input.value = originalSettings[key];
        }
      });

      saveBtn.disabled = true; // disable nút khi load
    } catch (err) {
      Toastify({
        text: "⚠️ Không thể tải cài đặt!",
        backgroundColor: "#f87171",
        duration: 3000,
      }).showToast();
      console.error(err);
    }
  }

  await loadSettings();

  // 🧩 2️⃣ Lắng nghe thay đổi -> bật/tắt nút Lưu
  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      const changed = Array.from(inputs).some(
        (inp) => String(inp.value) !== String(originalSettings[inp.dataset.key])
      );
      saveBtn.disabled = !changed;
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // reset lỗi cũ
    document
      .querySelectorAll(".error-text")
      .forEach((el) => el.classList.add("hidden"));

    let hasError = false;
    const updatedFields = [];

    inputs.forEach((input) => {
      const key = input.dataset.key;
      const errorEl = input.parentElement.querySelector(".error-text");

      if (input.value.trim() === "") {
        errorEl.textContent = "Giá trị không được để trống.";
        errorEl.classList.remove("hidden");
        hasError = true;
      } else if (String(input.value) !== String(originalSettings[key])) {
        updatedFields.push({ key, value: input.value });
      }
    });

    if (hasError) {
      Toastify({
        text: "⚠️ Vui lòng kiểm tra lại các trường bắt buộc!",
        backgroundColor: "#f97316",
        duration: 3000,
      }).showToast();
      return;
    }

    if (updatedFields.length === 0) return;

    // 🌀 Hiển thị spinner trong lúc gửi request
    const spinner = document.getElementById("spinnerOverlay");
    spinner.classList.remove("hidden");

    try {
      const res = await fetch(`${baseUrl}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        // ✅ bọc updatedFields trong { settings: [...] }
        body: JSON.stringify({ settings: updatedFields }),
      });

      spinner.classList.add("hidden");

      if (!res.ok) throw new Error("Cập nhật thất bại");
      const data = await res.json(); // [{ key, value }]

      // ✅ Update lại UI với giá trị mới
      data.forEach((item) => {
        const input = document.querySelector(`[data-key="${item.key}"]`);
        if (input) {
          input.value = item.value;
          originalSettings[item.key] = item.value;
        }
      });

      saveBtn.disabled = true;

      Toastify({
        text: "Cập nhật cài đặt thành công!",
        backgroundColor: "#34d399",
        duration: 3000,
      }).showToast();
    } catch (err) {
      spinner.classList.add("hidden");
      Toastify({
        text: "Cập nhật thất bại!",
        backgroundColor: "#f87171",
        duration: 3000,
      }).showToast();
      console.error(err);
    }
  });
});
