
"use strict";

const REPORTER_URL = "https://taylorsvilleut.maps.arcgis.com/apps/instant/reporter/index.html?appid=ad0a20f8399a4fdfa6d138653222adc7";

const categoryEl = document.getElementById("category");
const typeEl = document.getElementById("type");
const resultEl = document.getElementById("result");
const errorEl = document.getElementById("error");

let records = [];

function makeOption(label, value) {
  const opt = document.createElement("option");
  opt.textContent = label;
  opt.value = value;
  return opt;
}

function resetSelect(el, placeholder) {
  el.replaceChildren(makeOption(placeholder, ""));
}

function makeLink(label, href, className) {
  const a = document.createElement("a");
  a.textContent = label;
  a.href = href;

  if (className) a.className = className;

  a.target = "_blank";
  a.rel = "noopener noreferrer";

  return a;
}

function renderSelection() {
  resultEl.replaceChildren();

  const record = records.find(
    r => r.category === categoryEl.value &&
         r.type === typeEl.value
  );

  resultEl.hidden = !record;

  if (!record) return;

  const title = document.createElement("h3");

  title.textContent =
    record.routing === "city"
      ? "This request is handled by the City of Taylorsville"
      : "This request is handled by another agency";

  resultEl.append(title);

  // CITY-HANDLED REQUESTS
  if (record.routing === "city") {
    const p = document.createElement("p");

    p.textContent =
      "You can report this issue to the City. Continue to the reporting application to enter the location and details. You'll select the category and type again there.";

    resultEl.append(
      p,
      makeLink(
        "Continue to Report",
        REPORTER_URL,
        "button button-primary"
      )
    );

    return;
  }

  // OUTSIDE-AGENCY REQUESTS
  const agency = document.createElement("div");
  agency.className = "agency";
  agency.textContent = record.agency;

  const p = document.createElement("p");
  p.textContent = record.message;

  resultEl.append(agency, p);

  // WEBSITE AND PHONE CONTACTS
  const contact = document.createElement("div");
  contact.className = "contact";

  try {
    const url = new URL(record.website);

    if (
      url.protocol === "https:" ||
      url.protocol === "http:"
    ) {
      contact.append(
        makeLink("Visit Website", url.href)
      );
    }
  } catch (_) {
    // Ignore missing or invalid website URLs
  }

  const digits = String(record.phone || "")
    .replace(/[^0-9+]/g, "");

  if (digits) {
    if (contact.childNodes.length) {
      const sep = document.createElement("span");
      sep.className = "separator";
      sep.textContent = "|";
      contact.append(sep);
    }

    const call = document.createElement("a");
    call.href = "tel:" + digits;
    call.textContent = "Call " + record.phone;

    contact.append(call);
  }

  resultEl.append(contact);
}

// CATEGORY SELECTION
categoryEl.addEventListener("change", () => {
  resetSelect(typeEl, "Select a request type");

  const selected = records.filter(
    r => r.category === categoryEl.value
  );

  selected.forEach(r => {
    typeEl.append(makeOption(r.type, r.type));
  });

  typeEl.disabled = selected.length === 0;

  resultEl.hidden = true;
  resultEl.replaceChildren();
});

// REQUEST TYPE SELECTION
typeEl.addEventListener("change", renderSelection);

// LOAD ROUTING DATA
async function loadRouting() {
  try {
    const response = await fetch(
      "routing.json",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Routing data unavailable");
    }

    const data = await response.json();

    if (!Array.isArray(data.requests)) {
      throw new Error("Invalid routing data");
    }

    records = data.requests;

    const categories = [
      ...new Set(records.map(r => r.category))
    ];

    resetSelect(categoryEl, "Select a category");

    categories.forEach(c => {
      categoryEl.append(makeOption(c, c));
    });

    categoryEl.disabled = false;

    resetSelect(typeEl, "Select a category first");

    document.getElementById("draft-note").hidden =
      data.approved === true;

  } catch (err) {
    console.error(err);

    resetSelect(
      categoryEl,
      "Request options unavailable"
    );

    errorEl.hidden = false;
  }
}

loadRouting();
