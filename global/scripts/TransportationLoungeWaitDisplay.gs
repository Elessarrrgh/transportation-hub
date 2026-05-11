/**
 * Transportation lounge wait-time endpoint.
 *
 * Deploy this file as a Google Apps Script web app and use the deployment URL
 * as window.__TH_LOUNGE_CONFIG__.dataUrl in the lounge display snippet.
 *
 * Expected sheet layout, using the same five-row-per-route structure as the
 * standard wait-time display:
 * - row:     service status
 * - row + 1: wait display value
 * - row + 2: last updated
 * - row + 3: optional wait display mode: "text" or "countdown"
 * - row + 4: optional countdown target time/date
 *
 * The endpoint accepts:
 * - ?route=1 for one route
 * - ?routes=1,2,3,4,5,6 for multiple routes
 * - ?callback=someFunction for JSONP, which is useful from Squarespace
 */

const LOUNGE_SPREADSHEET_ID = "REPLACE_WITH_SPREADSHEET_ID";
const LOUNGE_SHEET_NAME = "Display Tab";

const LOUNGE_ROUTE_MAPPINGS = {
  "1": { row: 5, label: "Route 1", color: "#0f766e" },
  "2": { row: 10, label: "Route 2", color: "#2563eb" },
  "3": { row: 15, label: "Route 3", color: "#b45309" },
  "4": { row: 20, label: "Route 4", color: "#7c3aed" },
  "5": { row: 25, label: "Route 5", color: "#c2410c" },
  "6": { row: 30, label: "Route 6", color: "#047857" }
};

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const callback = sanitizeJsonpCallback_(params.callback);
  const routeKeys = getRequestedRoutes_(params);
  const payload = buildLoungePayload_(routeKeys);
  const json = JSON.stringify(payload);

  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function buildLoungePayload_(routeKeys) {
  const ss = SpreadsheetApp.openById(LOUNGE_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(LOUNGE_SHEET_NAME);
  const now = new Date();
  const routes = routeKeys
    .filter(routeKey => LOUNGE_ROUTE_MAPPINGS[routeKey])
    .map(routeKey => readLoungeRoute_(sheet, routeKey));

  const activeRoutes = routes.filter(route => route.isActive);

  return {
    generatedAt: now.toISOString(),
    isServiceActive: activeRoutes.length > 0,
    routes
  };
}

function readLoungeRoute_(sheet, routeKey) {
  const routeConfig = LOUNGE_ROUTE_MAPPINGS[routeKey];
  const row = routeConfig.row;
  const serviceStatus = stringify_(sheet.getRange(`C${row}`).getValue());
  const waitText = stringify_(sheet.getRange(`C${row + 1}`).getDisplayValue());
  const lastUpdated = stringify_(sheet.getRange(`C${row + 2}`).getDisplayValue());
  const waitMode = normalizeWaitMode_(sheet.getRange(`C${row + 3}`).getValue());
  const countdownTarget = normalizeCountdownTarget_(sheet.getRange(`C${row + 4}`).getValue());

  return {
    id: routeKey,
    label: routeConfig.label,
    color: routeConfig.color,
    serviceStatus,
    isActive: isActiveStatus_(serviceStatus),
    waitMode,
    waitText,
    countdownTarget,
    lastUpdated
  };
}

function getRequestedRoutes_(params) {
  const rawRoutes = params.routes || params.route || "1,2,3,4,5,6";
  return String(rawRoutes)
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
}

function normalizeWaitMode_(value) {
  const mode = stringify_(value).toLowerCase();
  return mode === "countdown" ? "countdown" : "text";
}

function normalizeCountdownTarget_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return value.toISOString();
  }
  return stringify_(value);
}

function isActiveStatus_(value) {
  const status = stringify_(value).toLowerCase();
  if (!status) return false;
  return !/^(inactive|not active|no service|service ended|closed|off)$/i.test(status);
}

function stringify_(value) {
  return String(value == null ? "" : value).trim();
}

function sanitizeJsonpCallback_(callback) {
  const raw = stringify_(callback);
  return /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(raw) ? raw : "";
}
