import "./styles.css";
import "./home.css";

const clockEl = document.getElementById("footer-clock");
const liveEls = document.querySelectorAll(".footer-live, .footer-bunny-wrap");

const TZ = "Asia/Ho_Chi_Minh";

function formatClock(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";
  const dayPeriod = (
    parts.find((p) => p.type === "dayPeriod")?.value ?? ""
  ).toLowerCase();

  return `${hour}:${minute} ${dayPeriod}`;
}

function tick() {
  if (!clockEl) return;
  clockEl.textContent = formatClock(new Date());
}

tick();
liveEls.forEach((el) => el.classList.add("is-ready"));
setInterval(tick, 1000);
