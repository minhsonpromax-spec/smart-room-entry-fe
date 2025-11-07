document.addEventListener("DOMContentLoaded", async () => {
  const register = await window.registerServiceWorker();
  console.log("Register:: ", register);
  if (window.location.pathname === "/smart-room-entry-fe/") {
    console.log("hello redirect !!");
    setTimeout(() => {
      window.location.href = "/smart-room-entry-fe/pages/log-access.html";
    }, 200);
  }
  console.log("path:: ", window.location.pathname);
});
