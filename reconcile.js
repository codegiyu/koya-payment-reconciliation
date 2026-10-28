// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;

function parseAmount(n) {
  if (typeof n === "string") {
    n = n.replace(/,/g, "");
  }
  return Number(n);
}

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");
const latest = new Map();

for (const rawLine of lines) {
  const line = rawLine.trim();
  if (line.length === 0) continue;

  let event;
  try {
    event = JSON.parse(line);
  } catch (error) {
    continue;
  }

  if (event === null || typeof event !== "object" || Array.isArray(event)) {
    continue;
  }

  const txnId = event.txn_id;
  if (!txnId) {
    continue;
  }

  const ts = typeof event.ts === "string" ? event.ts : "";
  const prev = latest.get(txnId);

  if (prev === undefined || ts >= prev.ts) {
    latest.set(txnId, { ts, status: event.status, amount: event.amount });
  }
}

for (const { status, amount } of latest.values()) {
  if (status === "success") {
    total += parseAmount(amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
