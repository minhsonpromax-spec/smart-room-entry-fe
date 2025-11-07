// Đăng ký Service Worker
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("❌ Trình duyệt không hỗ trợ Service Worker");
    return null;
  }
  try {
    // Đăng ký service-worker.js (nên đặt ở root)
    const registration = await navigator.serviceWorker.register(
      "/smart-room-entry-fe/service-worker.js"
    );
    console.log("✅ Service Worker registered:", registration);

    // Lưu toàn cục để các file khác dùng lại
    window.serviceWorkerRegistration = registration;
    return registration;
  } catch (err) {
    console.error("❌ Lỗi khi đăng ký Service Worker:", err);
    return null;
  }
}

// Lấy lại registration nếu đã có sẵn
async function getServiceWorkerRegistration() {
  if (window.serviceWorkerRegistration) {
    return window.serviceWorkerRegistration;
  }

  if ("serviceWorker" in navigator) {
    const readyRegistration = await navigator.serviceWorker.ready;
    window.serviceWorkerRegistration = readyRegistration;
    return readyRegistration;
  }

  return null;
}

// Cho phép các file JS khác gọi trực tiếp
window.registerServiceWorker = registerServiceWorker;
window.getServiceWorkerRegistration = getServiceWorkerRegistration;
