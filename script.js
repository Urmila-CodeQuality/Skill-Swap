const STORAGE_KEY = "skillswap-posts-v1";

const samplePosts = [
  { id: "sample-1", name: "Maya Chen", kind: "offer", topic: "Calculus I", teachBack: "Python basics", format: "online", availability: "Tue & Thu after 4pm", contact: "maya.chen@example.edu" },
  { id: "sample-2", name: "Ethan Brooks", kind: "need", topic: "Statistics", teachBack: "Guitar", format: "in person", availability: "Weekday lunch breaks", contact: "@ethanb" },
  { id: "sample-3", name: "Priya Patel", kind: "offer", topic: "Financial Accounting", teachBack: "", format: "in person", availability: "Mon or Wed evenings", contact: "priya.patel@example.edu" },
  { id: "sample-4", name: "Sofia Ramirez", kind: "need", topic: "Spanish conversation", teachBack: "Chemistry", format: "online", availability: "Flexible on weekends", contact: "@sofiar" },
  { id: "sample-5", name: "Noah Williams", kind: "offer", topic: "Intro to Statistics", teachBack: "Guitar", format: "in person", availability: "Tue & Fri after 2pm", contact: "noah.w@example.edu" },
  { id: "sample-6", name: "Aisha Khan", kind: "need", topic: "Calculus I", teachBack: "Python basics", format: "online", availability: "Mon, Wed after 5pm", contact: "@aishak" },
  { id: "sample-7", name: "Leo Martin", kind: "offer", topic: "Spanish conversation", teachBack: "Chemistry", format: "online", availability: "Thu afternoons", contact: "leo.martin@example.edu" },
  { id: "sample-8", name: "Grace Kim", kind: "need", topic: "Financial Accounting", teachBack: "", format: "in person", availability: "Friday mornings", contact: "@gracekim" }
];

const grid = document.querySelector("#post-grid");
const searchInput = document.querySelector("#search");
const filterButtons = [...document.querySelectorAll(".filter-chip")];
const emptyState = document.querySelector("#empty-state");
const form = document.querySelector("#post-form-element");
const dialog = document.querySelector("#request-dialog");
let posts = loadPosts();
let activeFilter = "all";
let matchIds = new Set();

function loadPosts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return [...samplePosts];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isValidPost)) throw new Error("Saved SkillSwap posts have an invalid format.");
    return parsed;
  } catch (error) {
    console.error("Unable to load saved SkillSwap posts.", error);
    return [...samplePosts];
  }
}

function isValidPost(post) {
  return post && typeof post.id === "string" && typeof post.name === "string" &&
    (post.kind === "need" || post.kind === "offer") && typeof post.topic === "string" &&
    typeof post.teachBack === "string" && (post.format === "online" || post.format === "in person") &&
    typeof post.availability === "string" && typeof post.contact === "string";
}

function savePosts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return true;
  } catch (error) {
    console.error("Unable to save SkillSwap posts.", error);
    setFormStatus("Your post could not be saved on this device. Check your browser storage settings and try again.", true);
    return false;
  }
}

function normalized(value) {
  return value.trim().toLocaleLowerCase();
}

function isSwap(post) {
  return Boolean(post.teachBack.trim());
}

function findMatches(post) {
  const topic = normalized(post.topic);
  const returnTopic = normalized(post.teachBack);
  return posts.filter((other) => {
    if (other.id === post.id || other.kind === post.kind || normalized(other.topic) !== topic) return false;
    if (returnTopic && normalized(other.teachBack) === returnTopic) return true;
    return !returnTopic && !other.teachBack.trim();
  }).map((postMatch) => postMatch.id);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function cardMarkup(post) {
  const mine = post.id.startsWith("user-");
  const matching = matchIds.has(post.id);
  const kindText = post.kind === "need" ? "I need help" : "I can tutor";
  const badgeText = isSwap(post) ? "Swap" : "Free help";
  const requestText = isSwap(post) ? "Request swap" : "Request help";
  const safe = {
    name: escapeHtml(post.name), topic: escapeHtml(post.topic), teachBack: escapeHtml(post.teachBack),
    format: escapeHtml(post.format), availability: escapeHtml(post.availability)
  };

  return `<article class="post-card${matching ? " perfect-match" : ""}" data-id="${escapeHtml(post.id)}">
    <div class="card-top"><span class="type-pill ${post.kind}">${kindText}</span><span class="deal-badge ${isSwap(post) ? "swap" : "free"}">${badgeText}</span></div>
    ${matching ? '<span class="match-pill">✳ Perfect match</span>' : ""}
    <h3 class="card-name">${safe.name}</h3>
    <p class="topic-label">${post.kind === "need" ? "Looking for help with" : "Can help with"}</p>
    <span class="topic-tag">${safe.topic}</span>
    ${post.teachBack ? `<p class="teach-back"><strong>Can teach in return:</strong> <span>${safe.teachBack}</span></p>` : ""}
    <div class="card-details">
      <div class="card-detail"><span class="card-detail-icon" aria-hidden="true">${post.format === "online" ? "◉" : "⌖"}</span><span>${safe.format === "online" ? "Online" : "In person"}</span></div>
      <div class="card-detail"><span class="card-detail-icon" aria-hidden="true">◷</span><span>${safe.availability}</span></div>
    </div>
    <div class="card-bottom"><button class="request-button" type="button" data-action="request" data-id="${escapeHtml(post.id)}">${requestText}</button>
    ${mine ? `<button class="delete-button" type="button" data-action="delete" data-id="${escapeHtml(post.id)}" aria-label="Delete your post about ${safe.topic}">Delete</button>` : ""}</div>
  </article>`;
}

function visiblePosts() {
  const query = normalized(searchInput.value);
  return posts.filter((post) => {
    const matchesSearch = !query || [post.name, post.topic, post.teachBack, post.availability].some((value) => normalized(value).includes(query));
    const matchesFilter = activeFilter === "all" ||
      activeFilter === post.format ||
      (activeFilter === "swap" && isSwap(post)) ||
      (activeFilter === "free help" && !isSwap(post));
    return matchesSearch && matchesFilter;
  });
}

function renderPosts() {
  const filtered = visiblePosts();
  grid.innerHTML = filtered.map(cardMarkup).join("");
  emptyState.hidden = filtered.length > 0;
  document.querySelector("#results-count").textContent = `${filtered.length} ${filtered.length === 1 ? "post" : "posts"} to explore`;
  document.querySelector("#clear-filters").hidden = !searchInput.value && activeFilter === "all";
}

function setFormStatus(message, isError = false) {
  const status = document.querySelector("#form-status");
  status.textContent = message;
  status.style.color = isError ? "#b33c35" : "";
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((element) => { element.textContent = ""; });
  document.querySelectorAll(".field.invalid").forEach((element) => {
    element.classList.remove("invalid");
    element.querySelectorAll("[aria-invalid]").forEach((input) => {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    });
  });
}

function showError(fieldName, message) {
  const field = form.elements[fieldName];
  const wrapper = field.closest(".field");
  wrapper.classList.add("invalid");
  const error = document.querySelector(`#${fieldName}-error`);
  error.textContent = message;
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", error.id);
}

function validEmailOrHandle(value) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
  return /^@?[a-z0-9_.]{2,32}$/i.test(value) || /^[a-z0-9_.]{2,32}#\d{4}$/i.test(value);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();
  setFormStatus("");
  const data = new FormData(form);
  const fields = {
    name: String(data.get("name") || "").trim(),
    kind: String(data.get("kind") || ""),
    topic: String(data.get("topic") || "").trim(),
    teachBack: String(data.get("teachBack") || "").trim(),
    format: String(data.get("format") || ""),
    availability: String(data.get("availability") || "").trim(),
    contact: String(data.get("contact") || "").trim()
  };
  let firstInvalid = null;
  const required = [
    ["name", fields.name, "Please enter your name."],
    ["topic", fields.topic, "Please enter a course or topic."],
    ["format", fields.format, "Please choose a preferred format."],
    ["availability", fields.availability, "Please add when you’re available."]
  ];
  required.forEach(([fieldName, value, message]) => {
    if (!value) {
      showError(fieldName, message);
      firstInvalid ||= form.elements[fieldName];
    }
  });
  if (!fields.contact) {
    showError("contact", "Please add an email address or Discord handle.");
    firstInvalid ||= form.elements.contact;
  } else if (!validEmailOrHandle(fields.contact)) {
    showError("contact", "Enter a valid email address or a Discord handle beginning with @.");
    firstInvalid ||= form.elements.contact;
  }
  if (firstInvalid) {
    firstInvalid.focus();
    setFormStatus("A couple of details need your attention.", true);
    return;
  }

  const newPost = { ...fields, id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  const matches = findMatches(newPost);
  posts.unshift(newPost);
  matchIds = new Set(matches);
  const saved = savePosts();
  renderPosts();
  form.reset();
  document.querySelector("#topic-label").textContent = "Course or topic you need help with";
  document.querySelector("#match-banner").hidden = matches.length === 0;
  document.querySelector("#match-banner").textContent = matches.length
    ? `✳ We found ${matches.length} ${matches.length === 1 ? "possible match" : "possible matches"} for ${newPost.topic}! They’re highlighted below.`
    : `Your post is live! We’ll highlight a perfect match here when one appears.`;
  document.querySelector("#match-banner").hidden = false;
  if (saved) setFormStatus("Your post is live in the community.");
  document.querySelector("#community").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll('input[name="kind"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    document.querySelector("#topic-label").textContent = radio.value === "offer"
      ? "Course or topic you can tutor"
      : "Course or topic you need help with";
  });
});

searchInput.addEventListener("input", renderPosts);
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((chip) => {
      const selected = chip === button;
      chip.classList.toggle("active", selected);
      chip.setAttribute("aria-pressed", String(selected));
    });
    renderPosts();
  });
});

function resetFilters() {
  searchInput.value = "";
  activeFilter = "all";
  filterButtons.forEach((chip) => {
    const selected = chip.dataset.filter === "all";
    chip.classList.toggle("active", selected);
    chip.setAttribute("aria-pressed", String(selected));
  });
  renderPosts();
  searchInput.focus();
}
document.querySelector("#clear-filters").addEventListener("click", resetFilters);
document.querySelector("#empty-clear").addEventListener("click", resetFilters);

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

grid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const post = posts.find((item) => item.id === button.dataset.id);
  if (!post) return;
  if (button.dataset.action === "delete") {
    posts = posts.filter((item) => item.id !== post.id);
    matchIds.delete(post.id);
    savePosts();
    renderPosts();
    return;
  }
  openRequest(post);
});

function openRequest(post) {
  const message = `Hi ${post.name}! I found your SkillSwap post about ${post.topic}. ${post.kind === "need" ? "I’d love to help you with it." : "I’d love to learn from you."}${post.teachBack ? ` I can teach you ${post.teachBack} in return.` : ""} Would you be up for connecting?`;
  document.querySelector("#request-name").textContent = post.name;
  document.querySelector("#request-message").value = message;
  document.querySelector("#copy-status").textContent = "";
  document.querySelector("#dialog-contact").textContent = post.contact.startsWith("@")
    ? `Their Discord: ${post.contact}`
    : `Contact: ${post.contact}`;
  const subject = encodeURIComponent("SkillSwap — let's connect");
  const body = encodeURIComponent(`${message}${post.contact.startsWith("@") ? `\n\nI found you on Discord: ${post.contact}` : ""}`);
  document.querySelector("#email-link").href = `mailto:${post.contact.startsWith("@") ? "" : post.contact}?subject=${subject}&body=${body}`;
  document.querySelector("#email-link").textContent = post.contact.startsWith("@") ? "Open email" : "Email them";
  dialog.showModal();
}

document.querySelector("#dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
document.querySelector("#copy-message").addEventListener("click", async () => {
  const message = document.querySelector("#request-message").value;
  try {
    await navigator.clipboard.writeText(message);
    document.querySelector("#copy-status").textContent = "Copied! Paste it into your message.";
  } catch (error) {
    console.error("Unable to copy the request message.", error);
    const textarea = document.querySelector("#request-message");
    textarea.focus();
    textarea.select();
    document.querySelector("#copy-status").textContent = "Copy wasn’t available. The message is selected—copy it from here.";
  }
});

renderPosts();
