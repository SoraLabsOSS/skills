// Three-line icon set — real coordinates in a 14×14 box centred on (7,7).
// A line with x1===x2 && y1===y2 is a collapsed (invisible) slot.
const ICONS = {
  menu: {
    group: null,
    angle: 0,
    lines: [
      [2.5, 4, 11.5, 4],
      [2.5, 7, 11.5, 7],
      [2.5, 10, 11.5, 10],
    ],
  },
  cross: {
    group: "x",
    angle: 45,
    lines: [
      [9.82842712, 4.17157288, 4.17157288, 9.82842712],
      [4.17157288, 4.17157288, 9.82842712, 9.82842712],
      [7, 7, 7, 7],
    ],
  },
  plus: {
    group: "x",
    angle: 0,
    lines: [
      [7, 3, 7, 11],
      [3, 7, 11, 7],
      [7, 7, 7, 7],
    ],
  },
  check: {
    group: null,
    angle: 0,
    lines: [
      [2.5, 7, 5.5, 10.5],
      [5.5, 10.5, 11.5, 4],
      [7, 7, 7, 7],
    ],
  },
};
const ORDER = ["menu", "cross", "plus", "check"];

const grp = document.getElementById("grp");
const lines = [...document.querySelectorAll(".ln")];
const btn = document.getElementById("cycle");

const collapsed = ([x1, y1, x2, y2]) => x1 === x2 && y1 === y2;
const easeOutQuint = (t) => 1 - (1 - t) ** 5;
const DUR = 520;

let idx = 0;
let cur = ICONS[ORDER[0]].lines.map((l) => l.slice());
let animating = false;

function paint(coords, deg) {
  lines.forEach((el, i) => {
    const [x1, y1, x2, y2] = coords[i];
    el.setAttribute("x1", x1);
    el.setAttribute("y1", y1);
    el.setAttribute("x2", x2);
    el.setAttribute("y2", y2);
    el.setAttribute("opacity", collapsed(coords[i]) ? 0 : 1);
  });
  grp.setAttribute("transform", deg ? `rotate(${deg} 7 7)` : "");
}

paint(cur, 0);

const prefersReduce = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

function go(fromName, toName) {
  const from = ICONS[fromName],
    to = ICONS[toName];
  const sameGroup = from.group && from.group === to.group;
  animating = true;

  if (prefersReduce) {
    // essential state change stays instant
    cur = to.lines.map((l) => l.slice());
    paint(cur, 0);
    animating = false;
    return;
  }

  const start = performance.now();

  if (sameGroup) {
    // rotate the whole group; snap to target coords at the end
    const delta = to.angle - from.angle;
    const step = (now) => {
      const t = Math.min(1, (now - start) / DUR);
      const e = easeOutQuint(t);
      grp.setAttribute("transform", `rotate(${e * delta} 7 7)`);
      if (t < 1) requestAnimationFrame(step);
      else {
        cur = to.lines.map((l) => l.slice());
        paint(cur, 0);
        animating = false;
      }
    };
    requestAnimationFrame(step);
  } else {
    // tween each coordinate from current to target
    const A = cur.map((l) => l.slice());
    const B = to.lines;
    const step = (now) => {
      const t = Math.min(1, (now - start) / DUR);
      const e = easeOutQuint(t);
      const frame = A.map((l, i) => l.map((v, k) => v + (B[i][k] - v) * e));
      paint(frame, 0);
      if (t < 1) requestAnimationFrame(step);
      else {
        cur = B.map((l) => l.slice());
        paint(cur, 0);
        animating = false;
      }
    };
    requestAnimationFrame(step);
  }
}

btn.addEventListener("click", () => {
  if (animating) return;
  const from = ORDER[idx];
  idx = (idx + 1) % ORDER.length;
  go(from, ORDER[idx]);
});

// Subtle Icon Copy functionality
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
        setTimeout(() => {
          copyBtn.classList.remove("copied");
        }, 1500);
      });
    }
  });
});
