document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("historyTableBody");
  const searchBoxSelect = document.getElementById("searchBoxLog");
  const paginationContainer = document.getElementById("pagination");
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  const MIN_SPINNER_TIME = 300;
  const accessToken = localStorage.getItem("accessToken");
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuToggleBtn");
  const closeBtn = document.getElementById("closeSidebarBtn");
  const btn = document.getElementById("toggleFilterBtn");
  const container = document.getElementById("filterContainer");
  const icon = document.getElementById("toggleIcon");
  const text = document.getElementById("toggleText");
  const baseUrl = "https://smart-room-entry-be.onrender.com";
  // const baseUrl = "http://localhost:3000";
  let isOpen = false;
  let currentData = [];
  let currentPage = 1;
  let pageSize = Number(pageSizeSelect?.value) || 10;
  async function getPageByRoomId(roomId, pageSize) {
    try {
      const params = new URLSearchParams({
        roomId: roomId,
        pageSize: pageSize,
      });
      const res = await fetch(
        `${baseUrl}/rooms/find-pages/${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log("Data:: ", data);
      return data.page; // giả sử API trả về { page: 3 }
    } catch (error) {
      console.error("Đã có lỗi xảy ra vui lòng thử lại", error);
      return null;
    }
  }
  function highlightRow(roomId) {
    const row = document.querySelector(`[data-room-id="${roomId}"]`);
    if (row) {
      row.classList.add("bg-yellow-100");
      setTimeout(() => row.classList.remove("bg-yellow-100"), 2000);
    }
  }
  function showLogPopup(message) {
    const popup = document.getElementById("logPopup");
    const logMessage = document.getElementById("logMessage");
    logMessage.innerText = message;
    popup.classList.remove("hidden");
    // Tự ẩn sau 5 giây
    setTimeout(() => {
      popup.classList.add("hidden");
    }, 5000);
  }
  document.getElementById("logPopup").addEventListener("click", async (e) => {
    const popup = e.currentTarget;
    const roomId = popup.dataset.roomId;
    const pageSize = popup.dataset.pageSize;
    console.log("Pagesize:: ", pageSize);
    const targetPage = await getPageByRoomId(roomId, pageSize);
    if (targetPage) {
      currentPage = targetPage;
      await fetchData(currentPage, pageSize);
      highlightRow(roomId);
    }
  });
  // --- Helper debounce ---
  function debounce(fn, delay = 500) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  function showSpinner() {
    document.getElementById("spinnerOverlay").classList.remove("hidden");
  }
  function hideSpinner() {
    document.getElementById("spinnerOverlay").classList.add("hidden");
  }

  menuBtn?.addEventListener("click", () => {
    sidebar.classList.remove("-translate-x-full");
  });
  closeBtn?.addEventListener("click", () => {
    sidebar.classList.add("-translate-x-full");
  });

  // --- Toggle Filter ---
  const openFilter = () => {
    container.classList.remove("max-h-0", "opacity-0", "invisible");
    container.classList.add("max-h-[1000px]", "opacity-100", "visible");
    icon.style.transform = "rotate(180deg)";
  };
  const closeFilter = () => {
    container.classList.add("max-h-0", "opacity-0", "invisible");
    container.classList.remove("max-h-[1000px]", "opacity-100", "visible");
    icon.style.transform = "rotate(0deg)";
  };
  btn.addEventListener("click", () => {
    isOpen = !isOpen;
    isOpen ? openFilter() : closeFilter();
  });
  if (window.innerWidth >= 1024) openFilter();
  else closeFilter();

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) openFilter();
    else if (!isOpen) closeFilter();
    renderTable(currentData);
  });

  // --- Fetch data ---
  const fetchData = async (page = 1, size = pageSize) => {
    const spinnerStart = Date.now();
    showSpinner();
    const search = searchBoxSelect?.value?.trim() || "";
    const params = new URLSearchParams({
      ...(search && { search }),
      page: String(page),
      pageSize: String(size),
    });

    try {
      const res = await fetch(`${baseUrl}/rooms?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      currentData = data.data;
      renderTable(data.data);
      renderPagination(data.meta);
    } catch (error) {
      console.error("Fetch error:", error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-red-500 py-4">
            Lỗi tải dữ liệu, vui lòng thử lại sau.
          </td>
        </tr>`;
    } finally {
      const elapsed = Date.now() - spinnerStart;
      const remaining = MIN_SPINNER_TIME - elapsed;
      if (remaining > 0) setTimeout(hideSpinner, remaining);
      else hideSpinner();
    }
  };

  // --- Render table ---
  const renderTable = (data) => {
    const tableBody = document.getElementById("historyTableBody");
    const cardContainer = document.getElementById("cardContainer");
    const isMobile = window.innerWidth < 768;

    tableBody.innerHTML = "";
    cardContainer.innerHTML = "";

    if (!data?.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-gray-400 py-4">
            Không có dữ liệu.
          </td>
        </tr>`;
      return;
    }

    data.forEach((room) => {
      if (isMobile) {
        const card = document.createElement("div");
        card.className =
          "bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4";
        card.dataset.roomId = room.id;

        card.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-gray-800 text-base flex items-center gap-1">
              <i class="fa-solid fa-door-closed text-black"></i>
              Phòng ${room.roomNumber}
            </h3>
            <p class="px-2 py-1 rounded-full text-sm font-medium ${getStatusClass(
              room.status
            )}">
              ${convertStatusRoom(room.status)}
            </p>
          </div>

          <div class="flex justify-between items-center">
            <div class="flex flex-col gap-1 text-sm text-gray-700 mb-2">
              <p><i class="fa-solid fa-users text-black mr-1"></i>
                <b>Số người hiện tại:</b> ${room.currentPeople}
              </p>
              <p><i class="fa-solid fa-user-group text-black mr-1"></i>
                <b>Giới hạn:</b> ${room.capacity}
              </p>
            </div>
            <div class="flex justify-end">
              <button class="actionBtn text-gray-500 hover:text-gray-700 px-2 py-1">
                <i class="fa-solid fa-ellipsis-vertical"></i>
              </button>
            </div>
          </div>`;
        cardContainer.appendChild(card);
      } else {
        const row = document.createElement("tr");
        row.dataset.roomId = room.id;
        row.className = "hover:bg-gray-50 transition";
        row.innerHTML = `
          <td class="px-4 py-3">${room.id}</td>
          <td class="px-4 py-3 font-semibold">${room.roomNumber}</td>
          <td class="px-4 py-3 text-center">${room.currentPeople}</td>
          <td class="px-4 py-3 text-center">${room.capacity}</td>
          <td class="px-4 py-3 text-center">
            <span class="px-2 py-1 rounded-full text-sm font-medium ${getStatusClass(
              room.status
            )}">
              ${convertStatusRoom(room.status)}
            </span>
          </td>
          <td class="px-4 py-3 text-center">
            <button class="actionBtn text-gray-500 hover:text-gray-700 px-2 py-1">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
          </td>`;
        tableBody.appendChild(row);
      }
    });
  };

  // --- Floating menu ---

  // --- Floating menu ---
  const floatingMenu = document.createElement("div");
  floatingMenu.id = "floatingMenu";
  floatingMenu.className =
    "absolute bg-white border border-gray-200 shadow-lg rounded-lg w-60 z-50 hidden right-0";
  floatingMenu.innerHTML = `
    <ul>
      <li>
        <button class="updateCurrentPeople w-full flex items-center space-x-2 text-left px-4 py-2 hover:bg-gray-100 text-sm">
          <i class="fa-solid fa-users text-black"></i>
          <span>Cập nhật số người hiện tại</span>
        </button>
      </li>
      <li>
        <button class="updateLimitPeople w-full flex items-center space-x-2 text-left px-4 py-2 hover:bg-gray-100 text-sm">
          <i class="fa-solid fa-user-group text-black"></i>
          <span>Cập nhật số người quy định</span>
        </button>
      </li>
    </ul>`;
  document.body.appendChild(floatingMenu);

  // --- Handle menu click (desktop + mobile) ---
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".actionBtn");
    const isMenu = e.target.closest("#floatingMenu");

    // Nếu click vào actionBtn
    if (btn) {
      e.stopPropagation();

      const isMobile = window.innerWidth < 768;
      const container = btn.closest(isMobile ? "div[data-room-id]" : "tr");
      const roomId = container?.dataset?.roomId;
      if (!roomId) return;

      // Toggle: nếu đang mở cùng phòng → ẩn luôn
      if (
        floatingMenu.dataset.roomId === roomId &&
        !floatingMenu.classList.contains("hidden")
      ) {
        floatingMenu.classList.add("hidden");
        return;
      }

      floatingMenu.classList.remove("hidden");
      floatingMenu.dataset.roomId = roomId;

      const rect = btn.getBoundingClientRect();
      const menuWidth = floatingMenu.offsetWidth;
      const viewportWidth = document.documentElement.clientWidth;

      let left = rect.right - menuWidth + window.scrollX;
      if (isMobile) {
        left = Math.min(rect.left, viewportWidth - menuWidth - 8);
      } else {
        if (left + menuWidth > viewportWidth - 10)
          left = viewportWidth - menuWidth - 10;
        if (left < 10) left = 10;
      }

      floatingMenu.style.top = `${rect.bottom + window.scrollY + 4}px`;
      floatingMenu.style.left = `${left}px`;

      return;
    }

    // Nếu click ngoài menu → ẩn
    if (!isMenu) {
      floatingMenu.classList.add("hidden");
    }
  });

  // --- Xử lý menu ---
  floatingMenu.addEventListener("click", (e) => {
    const roomId = floatingMenu.dataset.roomId;
    const room = currentData.find((r) => String(r.id) === roomId);
    if (!room) return;

    if (e.target.closest(".updateCurrentPeople")) {
      openModal(room, "currentPeople");
    } else if (e.target.closest(".updateLimitPeople")) {
      openModal(room, "capacity");
    }

    floatingMenu.classList.add("hidden");
  });

  // --- Pagination ---
  function renderPagination(meta) {
    const { currentPage: curentPageSafe, totalPages } = meta;
    paginationContainer.innerHTML = "";
    if (totalPages == 0) return;

    const createBtn = (
      label,
      page,
      disabled = false,
      active = false,
      icon = null
    ) => {
      const btn = document.createElement("button");
      btn.className = [
        "px-3 py-1 rounded-lg text-sm font-medium transition-all duration-150",
        "hover:bg-blue-100 text-gray-700 flex items-center justify-center",
        active ? "bg-blue-600 text-white" : "",
        disabled ? "opacity-50 pointer-events-none" : "",
      ].join(" ");
      btn.innerHTML = icon ? `<i class="${icon}"></i>` : label;
      if (!disabled && !active) {
        btn.addEventListener("click", () => {
          currentPage = page;
          fetchData(currentPage, pageSize);
        });
      }
      return btn;
    };

    paginationContainer.appendChild(
      createBtn(
        "",
        currentPage - 1,
        currentPage === 1,
        false,
        "fas fa-chevron-left"
      )
    );
    const visiblePages = getVisiblePages(curentPageSafe, totalPages);
    visiblePages.forEach((p) => {
      if (p === "...") {
        const span = document.createElement("span");
        span.textContent = "...";
        span.className = "text-gray-500 px-2";
        paginationContainer.appendChild(span);
      } else {
        paginationContainer.appendChild(
          createBtn(p, p, false, p === curentPageSafe)
        );
      }
    });
    paginationContainer.appendChild(
      createBtn(
        "",
        currentPage + 1,
        currentPage === totalPages,
        false,
        "fas fa-chevron-right"
      )
    );
  }

  function getVisiblePages(current, total) {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let last;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      )
        range.push(i);
    }

    for (let i of range) {
      if (last) {
        if (i - last === 2) rangeWithDots.push(last + 1);
        else if (i - last !== 1) rangeWithDots.push("...");
      }
      rangeWithDots.push(i);
      last = i;
    }
    return rangeWithDots;
  }

  const debouncedFetch = debounce(() => fetchData(currentPage, pageSize), 600);
  searchBoxSelect.addEventListener("input", debouncedFetch);
  pageSizeSelect.addEventListener("change", (e) => {
    pageSize = Number(e.target.value);
    fetchData(1, pageSize);
  });

  document.addEventListener("room-updated", (e) => {
    const { id, field, value } = e.detail;
    const room = currentData.find((r) => r.id === id);
    Toastify({
      text: "Cập nhật thông tin phòng thành công",
      close: true,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: "#4ade80",
    }).showToast();
    if (room) {
      room[field] = value;
      renderTable(currentData);
    }
  });

  getStatusClass = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500 text-white";
      case "OCCUPIED":
        return "bg-blue-400 text-white";
      case "MAINTENANCE":
        return "bg-red-400 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  convertStatusRoom = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "Trống";
      case "OCCUPIED":
        return "Đang thuê";
      case "MAINTENANCE":
        return "Sửa chữa";
      default:
        return "Không rõ";
    }
  };
  // --- WebSocket (realtime) ---
  const socket = io(`${baseUrl}/rooms`, {
    extraHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  socket.on("connect", () => console.log("✅ Socket connected"));
  socket.on("newLog", (roomUpdated) => {
    if (!roomUpdated || !roomUpdated.id) return;
    if (currentPage === 1) {
      const index = currentData.findIndex((item) => item.id == roomUpdated.id);
      if (index != -1) {
        currentData[index] = {
          ...currentData[index],
          ...roomUpdated,
        };
      }
      renderTable(currentData);
    } else {
      const message = `Số lượng người hiện tại trong phòng ${roomUpdated.roomNumber} đã cập nhập. Nhấp vào để xem.`;
      const popup = document.getElementById("logPopup");
      popup.dataset.roomId = roomUpdated.id;
      popup.dataset.pageSize = pageSize;
      showLogPopup(message);
    }
  });
  socket.on("disconnect", () => console.warn("Socket disconnected"));

  // --- Initial fetch ---
  fetchData(currentPage, pageSize);
});
