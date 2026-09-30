"use strict";

// Change this to your receiving WhatsApp number.
// International format, digits only.
const ADVISER_WHATSAPP = "254799383765";

const $ = id => document.getElementById(id);

const money = value =>
  "KES " + Math.ceil(value).toLocaleString("en-KE");

let plan = null;

// Calculate savings needed.
function calculatePlan(target, years, saved, goal) {
  const validNumbers = [target, years, saved].every(
    Number.isFinite
  );

  if (
    !validNumbers ||
    target <= 0 ||
    target > 1000000000 ||
    years < 1 / 12 - 0.0000000001 ||
    years > 40 ||
    saved < 0 ||
    saved > 1000000000
  ) {
    throw new Error(
      "Enter a target above zero, a timeline from one month " +
      "to 40 years, and savings of zero or more. " +
      "Amounts must be no more than KES 1 billion."
    );
  }

  const months = Math.max(1, Math.round(years * 12));
  const gap = Math.max(0, target - saved);
  const monthly = Math.ceil(gap / months);

  return {
    target,
    saved,
    months,
    gap,
    monthly,
    goal
  };
}

// Read calculator inputs.
function readPlan() {
  return calculatePlan(
    Number($("target").value),
    Number($("years").value),
    Number($("saved").value),
    $("goalType").value
  );
}

// Build downloadable and shareable summary.
function summary(p) {
  return [
    "School Fees Future Planner",
    "",
    "Education goal: " + p.goal,
    "Future target: " + money(p.target),
    "Already saved: " + money(p.saved),
    "Still to save: " + money(p.gap),
    "Timeline: " + p.months + " months",
    "Monthly savings target: " + money(p.monthly),
    "",
    "Simple savings arithmetic only.",
    "Excludes returns, inflation, policy charges and benefits.",
    "This is not an insurance premium or guaranteed policy benefit."
  ].join("\n");
}

// Display results.
function renderPlan(p) {
  $("monthly").textContent = money(p.monthly);
  $("timeline").textContent = "for " + p.months + " months";

  $("targetOut").textContent = money(p.target);
  $("savedOut").textContent = money(p.saved);
  $("gapOut").textContent = money(p.gap);

  $("resultIntro").textContent =
    "Your " + p.goal.toLowerCase() +
    " goal, based on the amounts you entered.";

  $("resultStatus").textContent =
    p.gap === 0
      ? "Your stated savings already meet this target. " +
        "You can review your next education goal."
      : "Your estimate is ready. Share it below " +
        "to discuss your next step.";

  $("nextLink").hidden = false;
  $("contact").hidden = false;
}

// Handle calculation.
$("plannerForm").addEventListener("submit", event => {
  event.preventDefault();

  $("calcError").textContent = "";

  try {
    if (!$("plannerForm").checkValidity()) {
      throw new Error(
        "Please complete every field with valid numbers."
      );
    }

    plan = readPlan();
    renderPlan(plan);
  } catch (error) {
    $("calcError").textContent = error.message;
  }
});

// Invalidate an old estimate when inputs change.
$("plannerForm").addEventListener("input", () => {
  plan = null;

  $("contact").hidden = true;
  $("nextLink").hidden = true;

  $("resultStatus").textContent =
    "Your inputs have changed. Calculate again " +
    "to update the estimate.";
});

// Handle WhatsApp enquiry.
$("contactForm").addEventListener("submit", event => {
  event.preventDefault();

  $("contactError").textContent = "";
  $("sendStatus").textContent = "";

  if (!plan) {
    $("contactError").textContent =
      "Calculate your savings target first.";
    return;
  }

  const name = $("name").value.trim();

  let phone = $("phone").value.replace(
    /[\s()+-]/g,
    ""
  );

  // Convert common Kenyan number formats.
  if (/^0[17]\d{8}$/.test(phone)) {
    phone = "254" + phone.slice(1);
  } else if (/^[17]\d{8}$/.test(phone)) {
    phone = "254" + phone;
  }

  if (!name || !/^\d{10,15}$/.test(phone)) {
    $("contactError").textContent =
      "Enter your first name and a valid WhatsApp number, " +
      "such as 0712 345 678 or +254712345678.";
    return;
  }

  if (!$("consent").checked) {
    $("contactError").textContent =
      "Please agree to share your details before proceeding.";
    return;
  }

  const message = [
    "Hi Moses, my name is " + name + ".",
    "",
    "WhatsApp: +" + phone,
    "Request: " + $("interest").value,
    "Comfortable monthly budget: " + $("budget").value,
    "Preferred contact time (Kenya): " +
      $("contactTime").value,
    "",
    summary(plan),
    "",
    "I consent to being contacted about " +
      "this education planning enquiry."
  ].join("\n");

  const url =
    "https://wa.me/" +
    ADVISER_WHATSAPP +
    "?text=" +
    encodeURIComponent(message);

  const link = document.createElement("a");

  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  document.body.appendChild(link);
  link.click();
  link.remove();

  $("sendStatus").textContent =
    "Review the message in WhatsApp and press Send. " +
    "Your enquiry has not been submitted until you send it.";
});

// Download summary as a text file.
$("download").addEventListener("click", () => {
  if (!plan) return;

  const blob = new Blob(
    [summary(plan)],
    { type: "text/plain;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "my-school-fees-plan.txt";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
});
