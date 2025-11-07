document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("historyTableBody");
  const searchBoxSelect = document.getElementById("searchBoxLog");
  const startDateSelect = document.getElementById("startDateLog");
  const endDateSelect = document.getElementById("endDateLog");
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  const paginationContainer = document.getElementById("pagination");
  const MIN_SPINNER_TIME = 300;
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
  // --- State ---
  let currentPage = 1;
  let pageSize = Number(pageSizeSelect?.value) || 10;
  const accessToken = localStorage.getItem("accessToken");
  // --- Helper debounce ---
  function debounce(fn, delay = 500) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  // --- Check date validity ---
  function isValidDateRange(startDate, endDate) {
    if (!startDate || !endDate) return true;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
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
    const startDate = startDateSelect.value
      ? new Date(startDateSelect.value).toISOString()
      : "";
    const endDate = endDateSelect.value
      ? new Date(endDateSelect.value).toISOString()
      : "";
    const search = searchBoxSelect?.value?.trim() || "";

    if (!isValidDateRange(startDate, endDate)) {
      alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!");
      return;
    }

    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(search && { search }),
      page: String(page),
      pageSize: String(size),
    });

    try {
      const res = await fetch(
        `${baseUrl}/license-plates?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      currentData = data.data;
      renderTable(data.data);
      renderPagination(data.meta);
    } catch (error) {
      console.error("Fetch error:", error);

      if (typeof Toastify !== "undefined") {
        Toastify({
          text: "Không thể tải dữ liệu",
          duration: 3000,
          gravity: "top",
          position: "right",
          backgroundColor: "#f87171",
        }).showToast();
      }
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-red-500 py-4">
            Lỗi tải dữ liệu, vui lòng thử lại sau.
          </td>
        </tr>`;
    } finally {
      const elapsed = Date.now() - spinnerStart;
      const remaining = MIN_SPINNER_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(hideSpinner, remaining);
      } else {
        hideSpinner();
      }
    }
  };

  // --- Render bảng ---
  const renderTable = (data) => {
    const tableBody = document.getElementById("historyTableBody");
    const cardContainer = document.getElementById("cardContainer");
    const isMobile = window.innerWidth < 768;

    tableBody.innerHTML = "";
    cardContainer.innerHTML = "";

    if (!data?.length) {
      const noData = `<p class="text-center text-gray-400 py-4 col-span-full">Không có dữ liệu.</p>`;
      if (isMobile) cardContainer.innerHTML = noData;
      else
        tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-gray-400 py-4">Không có dữ liệu.</td>
        </tr>`;
      return;
    }

    data.forEach((log) => {
      if (isMobile) {
        // Card mode
        const card = document.createElement("div");
        card.className =
          "bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4";

        // Format thời gian
        const formattedDate = new Date(log.logDate).toLocaleString("vi-VN");

        // Nội dung hiển thị
        card.innerHTML = `
  <div class="flex items-center justify-between mb-2">
    <h3 class="font-semibold text-gray-800 text-base flex items-center gap-1">
      <i class="fa-solid fa-door-open text-black"></i>
      Phòng ${log.roomNumber}
    </h3>
    <p class="text-xs text-gray-500">${formattedDate}</p>
  </div>

  <div class="text-sm text-gray-700 mb-1 flex items-center gap-1">
    <i class="fa-regular fa-id-card text-black"></i>
    <span><b>Biển số xe:</b> ${log.licensePlateNumber}
  </div>

  <div class="text-sm text-gray-700 mb-1">
    <b>Hãng:</b> ${log.brand} - <b>Màu sắc:</b> ${translateColor(log.color)}
  </div>

  <div class="text-sm text-gray-600 italic">
    ${log.note ? log.note : "Không có ghi chú"}
  </div>
`;

        // Thêm vào container
        cardContainer.appendChild(card);
      } else {
        // Table mode
        const row = document.createElement("tr");
        row.classList.add("hover:bg-gray-50", "transition");
        row.innerHTML = `
        <td class="px-4 py-3">${log.id}</td>
        <td class="px-4 py-3 font-semibold">${log.roomNumber}</td>
        <td class="px-4 py-3">${log.licensePlateNumber}</td>
        <td class="px-4 py-3 text-center">${translateVehicleType(log.type)}</td>
        <td class="px-4 py-3 text-center">${log.brand}</td>
        <td class="px-4 py-3 text-center">${translateColor(log.color)}</td>
        <td class="px-4 py-3 italic text-gray-600">${log.note || "-"}</td>
        <td class="px-4 py-3 text-gray-500">${new Date(
          log.logDate
        ).toLocaleString("vi-VN")}</td>`;
        tableBody.appendChild(row);
      }
    });
  };

  // --- Render 1 dòng mới (realtime) ---

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
      ) {
        range.push(i);
      }
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

  // --- Event listeners ---
  const debouncedFetch = debounce(() => fetchData(currentPage, pageSize), 600);
  searchBoxSelect?.addEventListener("input", debouncedFetch);
  startDateSelect?.addEventListener("change", debouncedFetch);
  endDateSelect?.addEventListener("change", debouncedFetch);
  pageSizeSelect?.addEventListener("change", (e) => {
    pageSize = Number(e.target.value);
    fetchData(1, pageSize);
  });
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
  document.getElementById("logPopup").addEventListener("click", () => {
    currentPage = 1;
    debouncedFetch();
  });

  document.getElementById("closePopup").addEventListener("click", (event) => {
    document.getElementById("logPopup").classList.add("hidden");
    event.stopPropagation();
  });
  function translateColor(color) {
    const colors = {
      red: "Đỏ",
      blue: "Xanh dương",
      green: "Xanh lá",
      yellow: "Vàng",
      orange: "Cam",
      purple: "Tím",
      pink: "Hồng",
      black: "Đen",
      white: "Trắng",
      gray: "Xám",
      brown: "Nâu",
      cyan: "Xanh ngọc",
      magenta: "Đỏ tươi",
      gold: "Vàng kim",
      silver: "Bạc",
    };
    const lowerColor = color.toLowerCase();
    return colors[lowerColor] || "Không xác định";
  }
  function translateVehicleType(type) {
    const types = {
      gas: "Xe máy",
      elec: "Xe điện",
    };
    const lowerType = type.toLowerCase();
    return types[lowerType] || "Không xác định";
  }
  // --- WebSocket (realtime) ---
  const socket = io(`${baseUrl}/license-plates`, {
    extraHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  socket.on("connect", () => console.log("✅ Socket connected"));
  socket.on("newLog", (log) => {
    if (currentPage === 1) {
      currentData.unshift(log);
      if (currentData.length > pageSize) currentData.pop();
      renderTable(currentData);
    } else {
      const message = `${log.note}. Nhấp vào để xem.`;
      showLogPopup(message);
    }
  });
  socket.on("disconnect", () => console.warn("Socket disconnected"));
  fetchData(currentPage, pageSize);
});
