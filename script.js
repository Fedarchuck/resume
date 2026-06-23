const caseViewer = document.getElementById("case-viewer");
const caseTabs = Array.from(document.querySelectorAll(".case-tab"));
const expandable = document.querySelector(".expandable");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderMarkdown(mdText) {
  const lines = mdText.split(/\r?\n/);
  const chunks = [];
  let listBuffer = [];
  let blockOpen = false;

  function flushList() {
    if (listBuffer.length) {
      const items = listBuffer.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      chunks.push(`<ul>${items}</ul>`);
      listBuffer = [];
    }
  }

  function closeBlock() {
    flushList();
    if (blockOpen) {
      chunks.push("</div>");
      blockOpen = false;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      chunks.push(`<h5>${escapeHtml(trimmed.slice(4))}</h5>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      closeBlock();
      chunks.push(`<div class="case-block"><h4>${escapeHtml(trimmed.slice(3))}</h4>`);
      blockOpen = true;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      closeBlock();
      chunks.push(`<h3>${escapeHtml(trimmed.slice(2))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      listBuffer.push(trimmed.slice(2));
      continue;
    }

    flushList();
    chunks.push(`<p>${escapeHtml(trimmed)}</p>`);
  }

  closeBlock();
  return chunks.join("");
}

async function loadCase(fileName) {
  if (!caseViewer) return;
  caseViewer.innerHTML = "<p>Загрузка кейса...</p>";

  try {
    const response = await fetch(`cases/${fileName}`);
    if (!response.ok) {
      throw new Error("Не удалось загрузить кейс.");
    }
    const markdown = await response.text();
    caseViewer.innerHTML = renderMarkdown(markdown);
  } catch (error) {
    caseViewer.innerHTML =
      "<p>Не удалось загрузить кейс. Проверьте, что файл существует в папке cases.</p>";
  }
}

caseTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    caseTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    const fileName = tab.getAttribute("data-case");
    if (fileName) {
      loadCase(fileName);
    }
  });
});

if (caseTabs[0]) {
  const firstFile = caseTabs[0].getAttribute("data-case");
  if (firstFile) {
    loadCase(firstFile);
  }
}

if (expandable) {
  const toggle = expandable.querySelector(".expand-toggle");
  const content = expandable.querySelector(".expand-content");
  const marker = expandable.querySelector(".toggle-mark");

  if (toggle && content && marker) {
    toggle.addEventListener("click", () => {
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isExpanded));
      content.hidden = isExpanded;
      marker.textContent = isExpanded ? "Развернуть" : "Свернуть";
    });
  }
}

const reveals = document.querySelectorAll(".fade-in-up");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  reveals.forEach((item) => observer.observe(item));
} else {
  reveals.forEach((item) => item.classList.add("visible"));
}
