document.addEventListener("DOMContentLoaded", () => {
  const notifyBtn = document.getElementById("notifyBtn");
  const notifyList = document.getElementById("notifyList");
  const notifyContainer = document.getElementById("notifyContainer");
  const notifyCount = document.getElementById("notifyCount");
  const loading = document.getElementById("loading");
  const accessToken = localStorage.getItem("accessToken");
  const baseUrl = "https://smart-room-entry-be.onrender.com";
  // const baseUrl = "http://localhost:3000";
  let page = 1;
  const pageSize = 10;
  let hasMore = true;
  let isLoading = false;

  // --- Toggle dropdown ---
  notifyBtn.addEventListener("click", async (event) => {
    notifyList.classList.toggle("hidden");

    // Nếu đang mở => load lại dữ liệu
    if (!notifyList.classList.contains("hidden")) {
      page = 1;
      hasMore = true;
      notifyContainer.innerHTML = "";
      await fetchNotifications();
    }

    event.stopPropagation();
  });

  // --- Fetch danh sách thông báo ---
  async function fetchNotifications() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    loading.classList.remove("hidden");

    try {
      const res = await fetch(
        `${baseUrl}/notifications/me?page=${page}&pageSize=${pageSize}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();

      data.data.forEach(renderNotification);

      if (page >= data.meta.totalPages || data.data.length === 0) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (err) {
      console.error("Lỗi fetch thông báo:", err);
    } finally {
      isLoading = false;
      loading.classList.add("hidden");
    }
  }

  // --- Render 1 thông báo ---
  function renderNotification(notify) {
    const div = document.createElement("div");
    div.className = `
      p-3 border-b cursor-pointer flex items-start gap-2 
      ${notify.isRead ? "opacity-90" : "bg-blue-50"}
    `;

    div.innerHTML = `
      <span class="w-2 h-2 mt-2 rounded-full ${
        notify.isRead ? "bg-transparent" : "bg-red-500"
      }"></span>
      <div class="flex-1">
        <div class="text-sm font-semibold text-gray-800">${notify.title}</div>
        <div class="text-xs text-gray-600">${notify.content}</div>
        <div class="text-[11px] text-gray-400 mt-1">
          ${new Date(notify.sentAt).toLocaleString()}
        </div>
      </div>
    `;
    div.addEventListener("click", () => {
      if (!notify.isRead) {
        try {
          markAsRead(notify.id, div);
        } catch (error) {
          console.error(`Mark as read notify ${notify.id} errors !!!`);
        }
        notify.isRead = true;
      }
    });
    notifyContainer.appendChild(div);
  }

  // --- Cuộn xuống cuối => fetch thêm ---
  notifyList.addEventListener("scroll", async () => {
    const nearBottom =
      notifyList.scrollTop + notifyList.clientHeight >=
      notifyList.scrollHeight - 20;

    if (
      nearBottom &&
      !isLoading &&
      hasMore &&
      !notifyList.classList.contains("hidden")
    ) {
      await fetchNotifications();
    }
  });

  // --- Đánh dấu đã đọc ---
  async function markAsRead(id, element) {
    try {
      await fetch(`${baseUrl}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      element.classList.remove("bg-blue-50");
      element.classList.add("opacity-70");

      const dot = element.querySelector(".bg-red-500");
      if (dot) dot.classList.remove("bg-red-500");

      const current = parseInt(notifyCount.innerText) || 0;
      updateBadge(Math.max(current - 1, 0));
    } catch (err) {
      console.error("Không thể mark read:", err);
    }
  }

  // --- Cập nhật badge ---
  function updateBadge(count) {
    if (count > 0) {
      notifyCount.innerText = count;
      notifyCount.classList.remove("hidden");
    } else {
      notifyCount.classList.add("hidden");
    }
  }

  // --- Click ngoài => đóng dropdown ---
  document.addEventListener("click", (event) => {
    if (
      !notifyList.contains(event.target) &&
      !notifyBtn.contains(event.target)
    ) {
      notifyList.classList.add("hidden");
    }
  });

  // --- Fetch số thông báo chưa đọc ban đầu ---
  fetch(`${baseUrl}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then((r) => r.json())
    .then(updateBadge)
    .catch(() => console.warn("Không load được số thông báo."));

  // --- Socket ---
  const socket = io(`${baseUrl}/notification`, {
    extraHeaders: { Authorization: `Bearer ${accessToken}` },
  });

  socket.emit("join");

  socket.on("newNotification", (n) => {
    // Render lên đầu danh sách
    notifyContainer.prepend(renderNotification(n));

    // Cập nhật badge
    const current = parseInt(notifyCount.innerText) || 0;
    updateBadge(current + 1);
  });
});
