document.addEventListener("DOMContentLoaded", () => {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  userMenuBtn.addEventListener("click", () =>
    userDropdown.classList.toggle("hidden")
  );
  document.addEventListener("click", (e) => {
    if (!userMenuBtn.contains(e.target)) userDropdown.classList.add("hidden");
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/smart-room-entry-fe/pages/login.html";
  });
});
