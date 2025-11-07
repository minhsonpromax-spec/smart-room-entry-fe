const VAPID_PUBLIC_KEY =
  "BOYnmHw76TWX5vfGjerozh34mwZO18Kz-Kpmg1xkgGRVtO3WyS1NaaNQg3NuTnqV3sXzd540w-9mnAsjnnr4gzs";
const baseUrl = "https://smart-room-entry-be.onrender.com";
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
async function getOrCreateSubscription() {
  const registration = await window.getServiceWorkerRegistration();
  if (!registration) {
    console.warn("❌ Chưa có service worker để đăng ký push");
    return null;
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    console.log("🔔 Chưa có subscription — tạo mới...");
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  } else {
    console.log("✅ Subscription đã tồn tại:", subscription.endpoint);
  }

  return subscription;
}

async function sendSubscriptionToServer(accessToken) {
  const subscription = await getOrCreateSubscription();
  if (!subscription) return;
  const res = await fetch(`${baseUrl}/push-notify/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(subscription),
  });
  if (res.ok) {
    console.log("📨 Subscription sent to server successfully");
  } else {
    console.error("❌ Lỗi gửi subscription:", await res.text());
  }
  return subscription;
}

window.sendSubscriptionToServer = sendSubscriptionToServer;
