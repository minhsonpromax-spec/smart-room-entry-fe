document.addEventListener("DOMContentLoaded", () => {
  const accountName = document.getElementById("accountName");
  const accountRole = document.getElementById("accountRole");
  const baseUrl = "https://smart-room-entry-be.onrender.com";
  // const baseUrl = "http://localhost:3000";
  const checkLogin = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      window.location.href = "/smart-room-entry-fe/pages/login.html";
      return;
    } else {
      try {
        const res = await fetch(`${baseUrl}/accounts/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          localStorage.removeItem("accessToken");
          window.location.href = "/smart-room-entry-fe/pages/login.html";
        }
        const data = await res.json();
        console.log("Data me:: ", data);
        if (accountName) {
          accountName.textContent = data.name;
        }
        if (accountRole) {
          accountRole.textContent = convertRole(data.role);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        localStorage.removeItem("accessToken");
        window.location.href = "/smart-room-entry-fe/pages/login.html";
      }
    }
  };
  convertRole = (role) => {
    switch (role) {
      case "ADMIN":
        return "Quản trị viên";
      case "SECURITY":
        return "Bảo vệ";
      case "MANAGER":
        return "Quản lý";
      case "USER":
        return "Người dùng";
      default:
        return "Không rõ";
    }
  };
  checkLogin();
});
