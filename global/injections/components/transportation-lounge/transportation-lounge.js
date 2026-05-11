(function transportationLoungeBootstrap(window, document) {
  "use strict";

  var DEFAULT_CONFIG = {
    containerId: "th-transportation-lounge",
    title: "Transportation Lounge",
    subtitle: "Live shuttle wait times",
    note: "Times update automatically.",
    dataUrl: "",
    refreshIntervalMs: 30000,
    requestMode: "jsonp",
    inactiveTitle: "Shuttle service is not currently active",
    inactiveCopy: "Please check the event transportation schedule for the next service period.",
    inactiveMeta: "This screen will return to live wait times automatically when service resumes.",
    routes: [
      { id: "1", label: "Route 1", color: "#0f766e" },
      { id: "2", label: "Route 2", color: "#2563eb" },
      { id: "3", label: "Route 3", color: "#b45309" },
      { id: "4", label: "Route 4", color: "#7c3aed" },
      { id: "5", label: "Route 5", color: "#c2410c" },
      { id: "6", label: "Route 6", color: "#047857" }
    ]
  };

  var timers = [];

  function init(userConfig) {
    var config = mergeConfig(userConfig);
    var root = document.getElementById(config.containerId);
    if (!root) {
      return;
    }

    root.classList.add("th-lounge");
    root.innerHTML = "";
    var elements = createShell(root, config);
    var routeState = {};

    config.routes.forEach(function(route) {
      routeState[route.id] = {
        config: route,
        data: normalizeRouteData(route, {}),
        loaded: false,
        error: ""
      };
      elements.routes.appendChild(createRouteCard(route));
    });

    updateClock(elements);
    timers.push(window.setInterval(function() {
      updateClock(elements);
      renderAll(root, elements, config, routeState);
    }, 1000));

    config.routes.forEach(function(route, index) {
      scheduleRouteRefresh(root, elements, config, routeState, route, Math.min(index * 500, 3000));
    });

    renderAll(root, elements, config, routeState);
  }

  function mergeConfig(userConfig) {
    var globalConfig = window.__TH_LOUNGE_CONFIG__ || {};
    return Object.assign({}, DEFAULT_CONFIG, globalConfig, userConfig || {}, {
      routes: (userConfig && userConfig.routes) || globalConfig.routes || DEFAULT_CONFIG.routes
    });
  }

  function createShell(root, config) {
    var screen = createNode("section", "th-lounge__screen");
    var header = createNode("header", "th-lounge__header");
    var titleWrap = createNode("div", "");
    var title = createNode("h1", "th-lounge__title", config.title);
    var subtitle = createNode("p", "th-lounge__subtitle", config.subtitle);
    var clock = createNode("div", "th-lounge__clock");
    var clockTime = createNode("span", "th-lounge__clock-time");
    var clockLabel = createNode("span", "th-lounge__clock-label");
    var routes = createNode("div", "th-lounge__routes");
    var footer = createNode("footer", "th-lounge__footer");
    var note = createNode("div", "th-lounge__note", config.note);
    var updated = createNode("div", "th-lounge__updated");

    var inactive = createNode("section", "th-lounge__inactive");
    var inactivePanel = createNode("div", "th-lounge__inactive-panel");
    var inactiveTitle = createNode("h2", "th-lounge__inactive-title", config.inactiveTitle);
    var inactiveCopy = createNode("p", "th-lounge__inactive-copy", config.inactiveCopy);
    var inactiveMeta = createNode("div", "th-lounge__inactive-meta", config.inactiveMeta);

    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);
    clock.appendChild(clockTime);
    clock.appendChild(clockLabel);
    header.appendChild(titleWrap);
    header.appendChild(clock);
    footer.appendChild(note);
    footer.appendChild(updated);
    screen.appendChild(header);
    screen.appendChild(routes);
    screen.appendChild(footer);

    inactivePanel.appendChild(inactiveTitle);
    inactivePanel.appendChild(inactiveCopy);
    inactivePanel.appendChild(inactiveMeta);
    inactive.appendChild(inactivePanel);

    root.appendChild(screen);
    root.appendChild(inactive);

    return {
      routes: routes,
      clockTime: clockTime,
      clockLabel: clockLabel,
      updated: updated
    };
  }

  function createRouteCard(route) {
    var card = createNode("article", "th-lounge__route");
    card.dataset.routeId = route.id;
    card.style.setProperty("--route-color", route.color || "#0f766e");
    card.setAttribute("aria-live", "polite");

    var head = createNode("div", "th-lounge__route-head");
    var title = createNode("h2", "th-lounge__route-label", route.label || "Route " + route.id);
    var status = createNode("div", "th-lounge__status", "Loading");
    status.dataset.role = "status";

    var wait = createNode("div", "th-lounge__wait");
    var value = createNode("div", "th-lounge__wait-value", "--");
    value.dataset.role = "value";
    var label = createNode("div", "th-lounge__wait-label", "Checking current wait");
    label.dataset.role = "label";

    var foot = createNode("div", "th-lounge__route-foot");
    var updated = createNode("div", "th-lounge__route-updated", "");
    updated.dataset.role = "updated";
    var message = createNode("div", "th-lounge__route-message", "");
    message.dataset.role = "message";

    head.appendChild(title);
    head.appendChild(status);
    wait.appendChild(value);
    wait.appendChild(label);
    foot.appendChild(updated);
    foot.appendChild(message);
    card.appendChild(head);
    card.appendChild(wait);
    card.appendChild(foot);

    return card;
  }

  function refreshRoute(root, elements, config, routeState, route) {
    var url = buildRouteUrl(config, route);
    if (!url) {
      routeState[route.id].error = "Missing data URL";
      routeState[route.id].loaded = true;
      renderAll(root, elements, config, routeState);
      return Promise.resolve();
    }

    return loadRouteData(url, config.requestMode)
      .then(function(payload) {
        routeState[route.id].data = normalizeRouteData(route, extractRoutePayload(payload, route.id));
        routeState[route.id].loaded = true;
        routeState[route.id].error = "";
        renderAll(root, elements, config, routeState);
      })
      .catch(function(error) {
        routeState[route.id].loaded = true;
        routeState[route.id].error = error && error.message ? error.message : "Unable to update";
        renderAll(root, elements, config, routeState);
      });
  }

  function scheduleRouteRefresh(root, elements, config, routeState, route, delayMs) {
    var refreshInterval = Math.max(10000, Number(config.refreshIntervalMs) || DEFAULT_CONFIG.refreshIntervalMs);
    var timer = window.setTimeout(function runRefresh() {
      refreshRoute(root, elements, config, routeState, route).finally(function() {
        timers.push(window.setTimeout(runRefresh, refreshInterval));
      });
    }, delayMs);
    timers.push(timer);
  }

  function buildRouteUrl(config, route) {
    var baseUrl = route.dataUrl || config.dataUrl;
    if (!baseUrl) {
      return "";
    }

    var url = new URL(baseUrl, window.location.href);
    url.searchParams.set("route", route.id);
    url.searchParams.set("t", Date.now());
    return url.href;
  }

  function loadRouteData(url, mode) {
    return mode === "fetch" ? fetchJson(url) : fetchJsonp(url);
  }

  function fetchJson(url) {
    return window.fetch(url, { cache: "no-store" }).then(function(response) {
      if (!response.ok) {
        throw new Error("Request failed");
      }
      return response.json();
    });
  }

  function fetchJsonp(url) {
    return new Promise(function(resolve, reject) {
      var callbackName = "__thLoungeJsonp" + Date.now() + Math.random().toString(36).slice(2);
      var script = document.createElement("script");
      var requestUrl = new URL(url, window.location.href);
      var timeout = window.setTimeout(function() {
        cleanup();
        reject(new Error("Request timed out"));
      }, 12000);

      function cleanup() {
        window.clearTimeout(timeout);
        delete window[callbackName];
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      }

      window[callbackName] = function(payload) {
        cleanup();
        resolve(payload);
      };

      requestUrl.searchParams.set("callback", callbackName);
      script.src = requestUrl.href;
      script.async = true;
      script.onerror = function() {
        cleanup();
        reject(new Error("Request failed"));
      };
      document.head.appendChild(script);
    });
  }

  function extractRoutePayload(payload, routeId) {
    if (!payload) {
      return {};
    }
    if (Array.isArray(payload.routes)) {
      return payload.routes.find(function(route) {
        return String(route.id) === String(routeId);
      }) || {};
    }
    if (payload.routes && payload.routes[routeId]) {
      return payload.routes[routeId];
    }
    return payload;
  }

  function normalizeRouteData(routeConfig, payload) {
    return {
      id: String(payload.id || routeConfig.id),
      label: payload.label || routeConfig.label || "Route " + routeConfig.id,
      color: payload.color || routeConfig.color || "#0f766e",
      serviceStatus: stringify(payload.serviceStatus || payload.status || "Checking"),
      isActive: payload.isActive === false ? false : isActiveStatus(payload.serviceStatus || payload.status),
      waitMode: stringify(payload.waitMode || payload.mode || "text").toLowerCase() === "countdown" ? "countdown" : "text",
      waitText: stringify(payload.waitText || payload.waitTime || payload.wait || "--"),
      countdownTarget: stringify(payload.countdownTarget || payload.targetTime || payload.target || ""),
      lastUpdated: stringify(payload.lastUpdated || payload.updatedAt || payload.generatedAt || "")
    };
  }

  function renderAll(root, elements, config, routeState) {
    var stateList = Object.keys(routeState).map(function(key) {
      return routeState[key];
    });
    var allLoaded = stateList.every(function(state) {
      return state.loaded;
    });
    var anyActive = stateList.some(function(state) {
      return state.data && state.data.isActive;
    });

    root.classList.toggle("is-inactive", allLoaded && !anyActive);

    stateList.forEach(function(state) {
      renderRoute(root, state);
    });

    elements.updated.textContent = "Last screen refresh: " + formatTime(new Date());
  }

  function renderRoute(root, state) {
    var card = root.querySelector('[data-route-id="' + cssEscape(state.config.id) + '"]');
    if (!card) {
      return;
    }

    var data = state.data;
    var wait = getWaitDisplay(data);
    card.classList.toggle("is-inactive", !data.isActive);
    card.classList.toggle("has-error", Boolean(state.error));
    card.style.setProperty("--route-color", data.color);

    setText(card, "status", state.error ? "Update issue" : data.serviceStatus || "Checking");
    setText(card, "value", wait.value);
    setText(card, "label", wait.label);
    setText(card, "updated", data.lastUpdated ? "Updated " + data.lastUpdated : "");
    setText(card, "message", state.error || "");
  }

  function getWaitDisplay(data) {
    if (!data.isActive) {
      return {
        value: "Off",
        label: data.waitText && data.waitText !== "--" ? data.waitText : "Service not active"
      };
    }

    if (data.waitMode === "countdown" && data.countdownTarget) {
      var target = parseDate(data.countdownTarget);
      if (target) {
        var diffMs = target.getTime() - Date.now();
        if (diffMs <= 0) {
          return { value: "Due", label: "Now boarding or arriving shortly" };
        }
        return { value: formatCountdown(diffMs), label: "Live countdown" };
      }
    }

    return {
      value: data.waitText || "--",
      label: data.waitMode === "countdown" ? "Countdown target unavailable" : "Approximate wait"
    };
  }

  function isActiveStatus(status) {
    var value = stringify(status).toLowerCase();
    if (!value) {
      return false;
    }
    return !/^(inactive|not active|no service|service ended|closed|off)$/i.test(value);
  }

  function parseDate(value) {
    var parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    var timeMatch = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(value);
    if (!timeMatch) {
      return null;
    }

    var now = new Date();
    var hours = Number(timeMatch[1]);
    var minutes = Number(timeMatch[2]);
    var meridiem = timeMatch[3] ? timeMatch[3].toUpperCase() : "";

    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    var target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    if (target.getTime() < now.getTime() - 60000) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  function formatCountdown(diffMs) {
    var totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    if (minutes >= 60) {
      var hours = Math.floor(minutes / 60);
      var remainingMinutes = minutes % 60;
      return hours + "h " + pad(remainingMinutes) + "m";
    }
    return minutes + ":" + pad(seconds);
  }

  function updateClock(elements) {
    var now = new Date();
    elements.clockTime.textContent = formatTime(now);
    elements.clockLabel.textContent = now.toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function setText(card, role, value) {
    var node = card.querySelector('[data-role="' + role + '"]');
    if (node) {
      node.textContent = value;
    }
  }

  function createNode(tagName, className, text) {
    var node = document.createElement(tagName);
    if (className) {
      node.className = className;
    }
    if (typeof text === "string") {
      node.textContent = text;
    }
    return node;
  }

  function stringify(value) {
    return String(value == null ? "" : value).trim();
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function cssEscape(value) {
    if (window.CSS && window.CSS.escape) {
      return window.CSS.escape(String(value));
    }
    return String(value).replace(/"/g, '\\"');
  }

  window.THTransportationLounge = {
    init: init,
    stop: function() {
      timers.forEach(function(timer) {
        window.clearInterval(timer);
        window.clearTimeout(timer);
      });
      timers = [];
    }
  };

  document.addEventListener("DOMContentLoaded", function() {
    if (window.__TH_LOUNGE_CONFIG__ && window.__TH_LOUNGE_CONFIG__.autoInit !== false) {
      init();
    }
  });
})(window, document);
