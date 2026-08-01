import "./styles.css";
import "./motion-meaning.css";

const track = document.getElementById("mm-track");
const pill = document.getElementById("mm-pill");
const tabs = [...document.querySelectorAll("[data-tab]")];
const reduceToggle = document.getElementById("mm-reduce");
const status = document.getElementById("mm-status");

const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
let osReduce = reduceMq.matches;
reduceMq.addEventListener("change", (e) => {
  osReduce = e.matches;
  syncReduceUi();
  placePill(true);
});

function forcedReduce() {
  return Boolean(reduceToggle?.checked);
}

function isReduced() {
  return osReduce || forcedReduce();
}

function syncReduceUi() {
  const reduced = isReduced();
  document.documentElement.dataset.mmReduce = reduced ? "on" : "off";
  if (status) {
    status.textContent = reduced
      ? "Collapse — pill jumps"
      : "Full motion — pill slides";
  }
  if (reduceToggle && osReduce) {
    reduceToggle.checked = true;
    reduceToggle.disabled = true;
    reduceToggle.title = "OS prefers-reduced-motion is already on";
  } else if (reduceToggle) {
    reduceToggle.disabled = false;
    reduceToggle.title = "";
  }
}

function placePill(instant) {
  const active = track?.querySelector('[aria-selected="true"]');
  if (!pill || !active || !track) return;

  const reduced = isReduced() || instant;
  const trackRect = track.getBoundingClientRect();
  const tabRect = active.getBoundingClientRect();
  const left = tabRect.left - trackRect.left;
  const width = tabRect.width;

  pill.style.transition = reduced
    ? "none"
    : "left 320ms cubic-bezier(0.19, 1, 0.22, 1), width 320ms cubic-bezier(0.19, 1, 0.22, 1)";
  pill.style.transform = "none";
  pill.style.left = `${left}px`;
  pill.style.width = `${width}px`;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
    tab.setAttribute("aria-selected", "true");
    placePill(false);
  });
});

reduceToggle?.addEventListener("change", () => {
  syncReduceUi();
  placePill(true);
});

window.addEventListener("resize", () => placePill(true));

// After fonts/layout settle so the first paint isn't skewed
syncReduceUi();
requestAnimationFrame(() => {
  placePill(true);
  requestAnimationFrame(() => placePill(true));
});

document.querySelectorAll(".copy-btn").forEach((copyBtn) => {
  copyBtn.addEventListener("click", () => {
    const parent = copyBtn.parentElement;
    let textToCopy = "";

    if (parent.classList.contains("install")) {
      const cmds = parent.querySelectorAll(".cmd");
      textToCopy = Array.from(cmds)
        .map((c) => c.textContent.trim())
        .join("\n");
    } else if (parent.classList.contains("prompt")) {
      const q = parent.querySelector("q");
      textToCopy = q ? q.textContent.trim() : "";
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.classList.add("copied");
        setTimeout(() => copyBtn.classList.remove("copied"), 1500);
      });
    }
  });
});
