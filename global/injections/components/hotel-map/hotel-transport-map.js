(function hotelTransportMapBootstrap(window, document) {
  "use strict";

  var DEFAULT_CONFIG = {
    mapboxToken: "",
    dataUrl: "",
    containerId: "th-hotel-map",
    mapStyle: "mapbox://styles/mapbox/light-v11",
    fallbackCenter: [-87.6298, 41.8781],
    fallbackZoom: 11
  };

  var MAP_RUNTIME = window.__TH_HOTEL_MAP_RUNTIME__ || {
    globalName: "mapboxgl",
    cssUrl: "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css",
    scriptUrl: "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js",
    requiresToken: true
  };

  var ROUTE_PALETTE = ["#0d6e6e", "#2563eb", "#b45309", "#7c3aed", "#c2410c", "#047857", "#b91c1c"];

  function mergeConfig(userConfig) {
    var overrideConfig = window.__TH_HOTEL_MAP_CONFIG__ || {};
    return Object.assign({}, DEFAULT_CONFIG, overrideConfig, userConfig || {});
  }

  function getMapLibrary() {
    return window[MAP_RUNTIME.globalName];
  }

  function loadStyleSheet(href) {
    if (!href || document.querySelector('link[data-th-hotel-map-css="' + href + '"]')) {
      return;
    }
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-th-hotel-map-css", href);
    document.head.appendChild(link);
  }

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      var existing = document.querySelector('script[data-th-hotel-map-js="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.setAttribute("data-th-hotel-map-js", src);
      script.addEventListener("load", function() {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", function() {
        reject(new Error("Unable to load the map library script."));
      }, { once: true });
      document.head.appendChild(script);
    });
  }

  function ensureMapLibrary() {
    if (getMapLibrary()) {
      return Promise.resolve();
    }
    loadStyleSheet(MAP_RUNTIME.cssUrl);
    return loadScript(MAP_RUNTIME.scriptUrl).then(function() {
      if (!getMapLibrary()) {
        throw new Error("Map library loaded but did not initialize.");
      }
    });
  }

  function isWalkingService(serviceType) {
    return String(serviceType || "").trim().toLowerCase() === "walking";
  }

  function normalizeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function safeUrl(value) {
    var raw = normalizeString(value);
    if (!raw) {
      return "";
    }

    try {
      var parsed = new URL(raw, window.location.href);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.href;
      }
    } catch (error) {
      return "";
    }

    return "";
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

  function appendMetaRow(container, label, value) {
    if (!value) {
      return;
    }
    var row = createNode("div", "th-hotel-map__meta-row");
    var dt = createNode("dt", "", label);
    var dd = createNode("dd", "", value);
    row.appendChild(dt);
    row.appendChild(dd);
    container.appendChild(row);
  }

  function setStatus(elements, title, copy, isVisible) {
    elements.statusTitle.textContent = title || "";
    elements.statusCopy.textContent = copy || "";
    elements.status.classList.toggle("is-visible", Boolean(isVisible));
  }

  function createShell(root) {
    root.innerHTML = [
      '<div class="th-hotel-map__shell">',
      '  <section class="th-hotel-map__panel" aria-label="Hotel map panel">',
      '    <div class="th-hotel-map__panel-head">',
      '      <div>',
      '        <span class="th-hotel-map__eyebrow">Transportation Hub</span>',
      '        <h2 class="th-hotel-map__title">Official Hotel Map</h2>',
      '        <p class="th-hotel-map__subtitle">Search hotels, review service details, and jump to your hotel page.</p>',
      "      </div>",
      '      <div class="th-hotel-map__summary" aria-live="polite"><strong data-th-summary-count>0</strong><span data-th-summary-label>hotels loaded</span></div>',
      "    </div>",
      '    <div class="th-hotel-map__map-wrap">',
      '      <div class="th-hotel-map__map" data-th-map role="region" aria-label="Interactive hotel transportation map"></div>',
      '      <div class="th-hotel-map__status is-visible" data-th-status>',
      '        <strong class="th-hotel-map__status-title" data-th-status-title>Loading map</strong>',
      '        <p class="th-hotel-map__status-copy" data-th-status-copy>Fetching hotel data and preparing the map.</p>',
      "      </div>",
      "    </div>",
      "  </section>",
      '  <aside class="th-hotel-map__sidebar" aria-label="Hotel search and filters">',
      '    <div class="th-hotel-map__sidebar-head">',
      "      <div>",
      '        <span class="th-hotel-map__eyebrow" data-th-event-label>Event Hotels</span>',
      '        <h3 class="th-hotel-map__title">Find Your Hotel</h3>',
      '        <p class="th-hotel-map__subtitle">Use the control panel to narrow by route or service type.</p>',
      "      </div>",
      '      <div class="th-hotel-map__legend" data-th-legend aria-label="Route legend"></div>',
      "    </div>",
      '    <div class="th-hotel-map__filters">',
      '      <label class="th-hotel-map__search" for="th-hotel-map-search">',
      '        <span class="th-hotel-map__sr-only">Search hotels by name or address</span>',
      '        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10.5 3a7.5 7.5 0 0 1 5.93 12.09l4.24 4.24-1.41 1.41-4.24-4.24A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11a5.5 5.5 0 0 0 0-11Z"/></svg>',
      '        <input class="th-hotel-map__input" id="th-hotel-map-search" type="search" inputmode="search" placeholder="Search by hotel name or address" autocomplete="off" />',
      "      </label>",
      '      <div class="th-hotel-map__filter-grid">',
      '        <label><span class="th-hotel-map__sr-only">Filter hotels by route</span><select class="th-hotel-map__select" data-th-route-filter aria-label="Filter hotels by route"></select></label>',
      '        <label><span class="th-hotel-map__sr-only">Filter hotels by service type</span><select class="th-hotel-map__select" data-th-service-filter aria-label="Filter hotels by service type"></select></label>',
      "      </div>",
      "    </div>",
      '    <div class="th-hotel-map__list-meta"><span data-th-results>0 hotels shown</span><span>Tap a hotel to focus the map</span></div>',
      '    <div class="th-hotel-map__list"><div class="th-hotel-map__cards" data-th-list></div></div>',
      "  </aside>",
      "</div>"
    ].join("");

    return {
      map: root.querySelector("[data-th-map]"),
      list: root.querySelector("[data-th-list]"),
      legend: root.querySelector("[data-th-legend]"),
      routeFilter: root.querySelector("[data-th-route-filter]"),
      serviceFilter: root.querySelector("[data-th-service-filter]"),
      search: root.querySelector("#th-hotel-map-search"),
      status: root.querySelector("[data-th-status]"),
      statusTitle: root.querySelector("[data-th-status-title]"),
      statusCopy: root.querySelector("[data-th-status-copy]"),
      results: root.querySelector("[data-th-results]"),
      summaryCount: root.querySelector("[data-th-summary-count]"),
      summaryLabel: root.querySelector("[data-th-summary-label]"),
      eventLabel: root.querySelector("[data-th-event-label]")
    };
  }

  function normalizeHotel(rawHotel, routeColorMap) {
    var lat = Number(rawHotel && rawHotel.lat);
    var lng = Number(rawHotel && rawHotel.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.warn("Skipping hotel with invalid coordinates:", rawHotel);
      return null;
    }

    var route = normalizeString(rawHotel.route);
    var serviceType = normalizeString(rawHotel.serviceType);
    var isWalking = isWalkingService(serviceType);

    return {
      id: normalizeString(rawHotel.id) || "hotel-" + Math.random().toString(36).slice(2, 9),
      name: normalizeString(rawHotel.name) || "Unnamed hotel",
      address: normalizeString(rawHotel.address),
      lat: lat,
      lng: lng,
      route: route || (isWalking ? "Walking" : "Unassigned"),
      routeColor: normalizeString(rawHotel.routeColor) || routeColorMap[route] || "",
      stop: normalizeString(rawHotel.stop),
      serviceType: serviceType || "Service info pending",
      pageUrl: safeUrl(rawHotel.pageUrl),
      notes: normalizeString(rawHotel.notes),
      isWalking: isWalking
    };
  }

  function buildRouteColors(data, rawHotels) {
    var routeColors = Object.assign({}, data && data.routeColors ? data.routeColors : {});
    var routeIndex = 0;

    rawHotels.forEach(function(hotel) {
      var route = normalizeString(hotel && hotel.route);
      if (!route || routeColors[route]) {
        return;
      }
      routeColors[route] = ROUTE_PALETTE[routeIndex % ROUTE_PALETTE.length];
      routeIndex += 1;
    });

    return routeColors;
  }

  function populateSelect(select, placeholder, values) {
    select.innerHTML = "";

    var baseOption = document.createElement("option");
    baseOption.value = "";
    baseOption.textContent = placeholder;
    select.appendChild(baseOption);

    values.forEach(function(value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function buildLegend(legendEl, hotels) {
    legendEl.innerHTML = "";

    var seen = {};
    hotels.forEach(function(hotel) {
      var key = hotel.route + "|" + hotel.serviceType;
      if (seen[key]) {
        return;
      }
      seen[key] = true;

      var badge = createNode("span", "th-hotel-map__badge th-hotel-map__badge--route", hotel.route);
      badge.style.background = hotel.routeColor || "#0d6e6e";

      if (hotel.isWalking) {
        badge.className += " th-hotel-map__badge--walking";
        badge.style.background = "";
      }

      legendEl.appendChild(badge);
    });
  }

  function createPopupContent(hotel) {
    var wrapper = createNode("article", "th-hotel-map__popup");
    wrapper.setAttribute("aria-label", hotel.name + " hotel details");

    var topline = createNode("div", "th-hotel-map__popup-topline");
    var routeBadge = createNode("span", "th-hotel-map__badge th-hotel-map__badge--route", hotel.route);
    routeBadge.style.background = hotel.routeColor || "#0d6e6e";
    if (hotel.isWalking) {
      routeBadge.className += " th-hotel-map__badge--walking";
      routeBadge.style.background = "";
    }

    var serviceBadge = createNode(
      "span",
      "th-hotel-map__badge th-hotel-map__badge--service" + (hotel.isWalking ? " th-hotel-map__badge--walking" : ""),
      hotel.serviceType
    );
    topline.appendChild(routeBadge);
    topline.appendChild(serviceBadge);
    wrapper.appendChild(topline);

    wrapper.appendChild(createNode("h3", "th-hotel-map__popup-title", hotel.name));
    wrapper.appendChild(createNode("p", "th-hotel-map__popup-address", hotel.address));

    var meta = createNode("dl", "th-hotel-map__popup-meta");
    appendMetaRow(meta, "Route", hotel.route);
    appendMetaRow(meta, "Stop", hotel.stop);
    appendMetaRow(meta, "Service", hotel.serviceType);
    if (hotel.notes) {
      appendMetaRow(meta, "Notes", hotel.notes);
    }
    wrapper.appendChild(meta);

    if (hotel.notes) {
      wrapper.appendChild(createNode("p", "th-hotel-map__popup-note", hotel.notes));
    }

    if (hotel.pageUrl) {
      var link = createNode("a", "th-hotel-map__popup-link", "View Hotel Details");
      link.href = hotel.pageUrl;
      link.setAttribute("aria-label", "View details for " + hotel.name);
      wrapper.appendChild(link);
    }

    return wrapper;
  }

  function createMarkerElement(hotel) {
    var marker = createNode(
      "button",
      "th-hotel-map__marker" + (hotel.isWalking ? " is-walking" : ""),
      ""
    );
    marker.type = "button";
    marker.style.background = hotel.routeColor || "#0d6e6e";
    marker.setAttribute("aria-label", "View " + hotel.name + " on the map");
    return marker;
  }

  function createMarker(mapLibrary, map, hotel, state) {
    var markerElement = createMarkerElement(hotel);
    var popup = new mapLibrary.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 18,
      maxWidth: "320px"
    }).setDOMContent(createPopupContent(hotel));

    popup.on("open", function() {
      state.activeHotelId = hotel.id;
      syncActiveState(state);
    });

    popup.on("close", function() {
      if (state.activeHotelId === hotel.id) {
        state.activeHotelId = "";
        syncActiveState(state);
      }
    });

    markerElement.addEventListener("mouseenter", function() {
      markerElement.classList.add("is-hovered");
    });

    markerElement.addEventListener("mouseleave", function() {
      markerElement.classList.remove("is-hovered");
    });

    var marker = new mapLibrary.Marker({
      element: markerElement,
      anchor: "center"
    })
      .setLngLat([hotel.lng, hotel.lat])
      .setPopup(popup)
      .addTo(map);

    state.markerIndex[hotel.id] = {
      hotel: hotel,
      marker: marker,
      element: markerElement,
      popup: popup
    };
  }

  function syncActiveState(state) {
    var ids = Object.keys(state.markerIndex);
    ids.forEach(function(id) {
      var markerRecord = state.markerIndex[id];
      markerRecord.element.classList.toggle("is-active", state.activeHotelId === id);
    });

    Array.prototype.forEach.call(state.elements.list.querySelectorAll(".th-hotel-map__card"), function(card) {
      card.classList.toggle("is-active", card.dataset.hotelId === state.activeHotelId);
    });
  }

  function updateSummary(state) {
    var visibleCount = state.filteredHotels.length;
    var totalCount = state.hotels.length;
    state.elements.summaryCount.textContent = String(visibleCount);
    state.elements.summaryLabel.textContent = visibleCount === 1 ? "hotel shown" : "hotels shown";
    state.elements.results.textContent = visibleCount + " of " + totalCount + " hotels shown";
  }

  function renderList(state) {
    var list = state.elements.list;
    list.innerHTML = "";

    if (!state.filteredHotels.length) {
      list.appendChild(createNode("div", "th-hotel-map__empty", "No hotels match the current search and filter settings."));
      updateSummary(state);
      syncActiveState(state);
      return;
    }

    state.filteredHotels.forEach(function(hotel) {
      var card = createNode("article", "th-hotel-map__card");
      card.dataset.hotelId = hotel.id;

      var selectButton = createNode("button", "th-hotel-map__card-select");
      selectButton.type = "button";
      selectButton.setAttribute("aria-label", "Focus map on " + hotel.name);

      var topline = createNode("div", "th-hotel-map__card-topline");
      var routeBadge = createNode("span", "th-hotel-map__badge th-hotel-map__badge--route", hotel.route);
      routeBadge.style.background = hotel.routeColor || "#0d6e6e";
      if (hotel.isWalking) {
        routeBadge.className += " th-hotel-map__badge--walking";
        routeBadge.style.background = "";
      }

      var serviceBadge = createNode(
        "span",
        "th-hotel-map__badge th-hotel-map__badge--service" + (hotel.isWalking ? " th-hotel-map__badge--walking" : ""),
        hotel.serviceType
      );
      topline.appendChild(routeBadge);
      topline.appendChild(serviceBadge);
      selectButton.appendChild(topline);
      selectButton.appendChild(createNode("h4", "th-hotel-map__card-title", hotel.name));
      selectButton.appendChild(createNode("p", "th-hotel-map__card-address", hotel.address));

      var meta = createNode("dl", "th-hotel-map__card-meta");
      appendMetaRow(meta, "Route", hotel.route);
      appendMetaRow(meta, "Stop", hotel.stop);
      appendMetaRow(meta, "Service", hotel.serviceType);
      if (hotel.notes) {
        appendMetaRow(meta, "Notes", hotel.notes);
      }
      selectButton.appendChild(meta);

      selectButton.addEventListener("click", function() {
        selectHotel(hotel.id, state, { focusList: false, openPopup: true, shouldAnimate: true });
      });
      selectButton.addEventListener("mouseenter", function() {
        toggleMarkerHover(hotel.id, state, true);
      });
      selectButton.addEventListener("mouseleave", function() {
        toggleMarkerHover(hotel.id, state, false);
      });

      card.appendChild(selectButton);

      var actions = createNode("div", "th-hotel-map__card-actions");
      actions.appendChild(createNode("span", "th-hotel-map__card-hint", "Tap to preview on the map"));

      if (hotel.pageUrl) {
        var link = createNode("a", "th-hotel-map__details-link", "View Hotel Details");
        link.href = hotel.pageUrl;
        link.setAttribute("aria-label", "View details for " + hotel.name);
        actions.appendChild(link);
      }

      card.appendChild(actions);
      list.appendChild(card);
    });

    updateSummary(state);
    syncActiveState(state);
  }

  function toggleMarkerHover(hotelId, state, isHovered) {
    var markerRecord = state.markerIndex[hotelId];
    if (!markerRecord) {
      return;
    }
    markerRecord.element.classList.toggle("is-hovered", Boolean(isHovered));
  }

  function hotelMatchesFilters(hotel, searchTerm, routeFilter, serviceFilter) {
    var normalizedSearch = searchTerm.toLowerCase();
    var searchable = (hotel.name + " " + hotel.address).toLowerCase();

    if (normalizedSearch && searchable.indexOf(normalizedSearch) === -1) {
      return false;
    }
    if (routeFilter && hotel.route !== routeFilter) {
      return false;
    }
    if (serviceFilter && hotel.serviceType !== serviceFilter) {
      return false;
    }
    return true;
  }

  function applyFilters(state) {
    var searchTerm = normalizeString(state.elements.search.value);
    var routeFilter = state.elements.routeFilter.value;
    var serviceFilter = state.elements.serviceFilter.value;

    state.filteredHotels = state.hotels.filter(function(hotel) {
      return hotelMatchesFilters(hotel, searchTerm, routeFilter, serviceFilter);
    });

    if (state.map) {
      state.hotels.forEach(function(hotel) {
        var markerRecord = state.markerIndex[hotel.id];
        if (!markerRecord) {
          return;
        }
        markerRecord.element.style.display = state.filteredHotels.indexOf(hotel) > -1 ? "" : "none";
        if (state.filteredHotels.indexOf(hotel) === -1 && markerRecord.popup.isOpen()) {
          markerRecord.popup.remove();
        }
      });
    }

    if (state.activeHotelId && !state.filteredHotels.some(function(hotel) { return hotel.id === state.activeHotelId; })) {
      state.activeHotelId = "";
    }

    renderList(state);

    if (state.map) {
      fitMapToHotels(state.filteredHotels, state, false);
    }
  }

  function fitMapToHotels(hotels, state, animate) {
    if (!state.map || !hotels.length) {
      return;
    }

    if (hotels.length === 1) {
      state.map.easeTo({
        center: [hotels[0].lng, hotels[0].lat],
        zoom: 14,
        duration: animate ? 900 : 0
      });
      return;
    }

    var mapLibrary = getMapLibrary();
    var bounds = new mapLibrary.LngLatBounds();
    hotels.forEach(function(hotel) {
      bounds.extend([hotel.lng, hotel.lat]);
    });

    state.map.fitBounds(bounds, {
      padding: { top: 80, right: 80, bottom: 80, left: 80 },
      duration: animate ? 900 : 0,
      maxZoom: 14
    });
  }

  function selectHotel(hotelId, state, options) {
    var hotel = state.hotels.find(function(item) {
      return item.id === hotelId;
    });
    if (!hotel) {
      return;
    }

    state.activeHotelId = hotelId;
    syncActiveState(state);

    if (options && options.focusList) {
      var card = state.elements.list.querySelector('[data-hotel-id="' + hotelId + '"]');
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    var markerRecord = state.markerIndex[hotelId];
    if (state.map && markerRecord) {
      if (options && options.shouldAnimate) {
        state.map.flyTo({
          center: [hotel.lng, hotel.lat],
          zoom: 14.5,
          speed: 0.85,
          curve: 1.3,
          essential: true
        });
      }
      if (options && options.openPopup) {
        markerRecord.popup.setDOMContent(createPopupContent(hotel));
        if (!markerRecord.popup.isOpen()) {
          markerRecord.marker.togglePopup();
        }
      }
    }
  }

  function initializeMap(config, state, data) {
    var mapLibrary = getMapLibrary();
    if (!mapLibrary) {
      throw new Error("Map library is not available.");
    }

    if (MAP_RUNTIME.requiresToken && config.mapboxToken) {
      mapLibrary.accessToken = config.mapboxToken;
    }

    var center = Array.isArray(data.defaultCenter) && data.defaultCenter.length === 2
      ? data.defaultCenter
      : config.fallbackCenter;
    var zoom = Number.isFinite(Number(data.defaultZoom)) ? Number(data.defaultZoom) : config.fallbackZoom;

    state.map = new mapLibrary.Map({
      container: state.elements.map,
      style: config.mapStyle,
      center: center,
      zoom: zoom,
      cooperativeGestures: true
    });

    state.map.addControl(new mapLibrary.NavigationControl({ showCompass: false }), "top-right");

    state.map.on("load", function() {
      state.hotels.forEach(function(hotel) {
        createMarker(mapLibrary, state.map, hotel, state);
      });
      fitMapToHotels(state.hotels, state, false);
      setStatus(state.elements, "", "", false);
    });

    state.map.on("error", function() {
      setStatus(
        state.elements,
        "Map unavailable",
        "The hotel list is still available, but the map could not finish loading with the current map settings.",
        true
      );
    });
  }

  function fetchJson(url) {
    return fetch(url, {
      credentials: "same-origin"
    }).then(function(response) {
      if (!response.ok) {
        throw new Error("HTTP " + response.status + " while loading hotel data.");
      }
      return response.json();
    });
  }

  function createState(root, config) {
    return {
      root: root,
      config: config,
      elements: createShell(root),
      map: null,
      hotels: [],
      filteredHotels: [],
      markerIndex: {},
      activeHotelId: ""
    };
  }

  function initializeFilters(state) {
    var routes = Array.from(new Set(state.hotels.map(function(hotel) { return hotel.route; }))).sort();
    var services = Array.from(new Set(state.hotels.map(function(hotel) { return hotel.serviceType; }))).sort();
    populateSelect(state.elements.routeFilter, "All routes", routes);
    populateSelect(state.elements.serviceFilter, "All service types", services);

    state.elements.search.addEventListener("input", function() {
      applyFilters(state);
    });
    state.elements.routeFilter.addEventListener("change", function() {
      applyFilters(state);
    });
    state.elements.serviceFilter.addEventListener("change", function() {
      applyFilters(state);
    });
  }

  function initializeData(state, data) {
    var rawHotels = Array.isArray(data && data.hotels) ? data.hotels : [];
    var routeColorMap = buildRouteColors(data, rawHotels);

    state.hotels = rawHotels
      .map(function(hotel) {
        return normalizeHotel(hotel, routeColorMap);
      })
      .filter(Boolean)
      .sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });

    state.filteredHotels = state.hotels.slice();
    state.elements.eventLabel.textContent = normalizeString(data.event) && normalizeString(data.year)
      ? data.event + " " + data.year
      : "Event Hotels";

    buildLegend(state.elements.legend, state.hotels);
    initializeFilters(state);
    renderList(state);
  }

  function init(userConfig) {
    var config = mergeConfig(userConfig);
    var root = document.getElementById(config.containerId);
    if (!root) {
      return Promise.reject(new Error("Hotel map container not found: " + config.containerId));
    }

    root.classList.add("th-hotel-map");
    var state = createState(root, config);

    if (!config.dataUrl) {
      setStatus(
        state.elements,
        "Missing data source",
        "Add a JSON URL to the hotel map config before loading the map.",
        true
      );
      return Promise.resolve(state);
    }

    return fetchJson(config.dataUrl)
      .then(function(data) {
        initializeData(state, data);

        if (!state.hotels.length) {
          setStatus(
            state.elements,
            "No hotel locations available",
            "The data file loaded, but none of the hotels included valid latitude and longitude values.",
            true
          );
          return state;
        }

        if (MAP_RUNTIME.requiresToken && !config.mapboxToken) {
          setStatus(
            state.elements,
            "Mapbox token required",
            "The hotel list loaded successfully. Add a Mapbox access token to render the interactive map.",
            true
          );
          return state;
        }

        return ensureMapLibrary()
          .then(function() {
            initializeMap(config, state, data);
            return state;
          })
          .catch(function(error) {
            console.error(error);
            setStatus(
              state.elements,
              "Map unavailable",
              "The hotel list loaded, but the interactive map library could not be loaded.",
              true
            );
            return state;
          });
      })
      .catch(function(error) {
        console.error(error);
        var message = window.location.protocol === "file:"
          ? "The JSON file could not be loaded from file://. Serve this page over a local web server or a hosted URL."
          : "The hotel data feed could not be loaded right now. Check the JSON URL and try again.";

        setStatus(state.elements, "Unable to load hotel data", message, true);
        state.elements.list.innerHTML = "";
        state.elements.list.appendChild(createNode("div", "th-hotel-map__empty", "Hotel data is temporarily unavailable."));
        state.elements.results.textContent = "0 hotels shown";
        return state;
      });
  }

  window.THHotelMap = {
    init: init
  };

  if (window.__TH_HOTEL_MAP_AUTOINIT__ !== false) {
    document.addEventListener("DOMContentLoaded", function() {
      var config = mergeConfig();
      if (config.containerId && document.getElementById(config.containerId)) {
        init(config).catch(function(error) {
          console.error("Hotel map initialization failed:", error);
        });
      }
    });
  }
})(window, document);
