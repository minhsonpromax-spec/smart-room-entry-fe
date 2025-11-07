document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const userNameInput = document.getElementById("userName");
  const passwordInput = document.getElementById("password");
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const baseUrl = "https://smart-room-entry-be.onrender.com";
  // const baseUrl = "http://localhost:3000";
  let isSubmitting = false;
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    setTimeout(() => {
      window.location.href = "/smart-room-entry-fe/pages/log-access.html";
    }, 200);
  }
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-50");

    const userName = userNameInput.value.trim();
    const password = passwordInput.value.trim();
    userNameError.classList.add("hidden");
    passwordError.classList.add("hidden");
    serverError.classList.add("hidden");
    let hasError = false;
    if (!userNameInput.value.trim()) {
      userNameError.classList.remove("hidden");
      hasError = true;
    }
    if (!passwordInput.value.trim()) {
      passwordError.classList.remove("hidden");
      hasError = true;
    }
    if (hasError) return;
    try {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        Toastify({
          text: data.message || "Đăng nhập thất bại",
          close: true,
          duration: 3000,
          gravity: "top",
          position: "right",
          backgroundColor: "#f87171",
        }).showToast();
        return;
      }
      Toastify({
        text: "Đăng nhập thành công!",
        close: true,

        duration: 2000,
        gravity: "top",
        position: "right",
        backgroundColor: "#4ade80",
      }).showToast();
      localStorage.setItem("accessToken", data.data.token);
      const canNotify = await requestPermissionNotification();
      if (canNotify) {
        console.log("Can notify");
        console.log(
          "Subscription:: ",
          await window.sendSubscriptionToServer(data.data.token)
        );
        console.log("send notify success");
      }
      console.log("Set timeout !!!");
      setTimeout(() => {
        window.location.href = "/smart-room-entry-fe/pages/log-access.html";
      }, 1000);
    } catch (err) {
      Toastify({
        text: "Lỗi kết nối server",
        close: true,

        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#f87171",
      }).showToast();
      console.error(err);
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  });
});

async function requestPermissionNotification() {
  const currentPermission = Notification.permission;

  if (currentPermission === "granted") {
    console.log("🔔 Người dùng đã cho phép thông báo");
    return true;
  }

  const result = await Notification.requestPermission();
  if (result === "granted") {
    console.log("✅ Người dùng cho phép thông báo");
    return true;
  } else {
    console.warn("🚫 Người dùng từ chối thông báo");
    return false;
  }
}
