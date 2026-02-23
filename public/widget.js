/**
 * DockSlot Booking Widget
 * Embeddable JavaScript widget for captain websites.
 * Renders trip cards with schema.org structured data for SEO.
 *
 * Usage:
 *   <div data-dockslot-widget="CAPTAIN_ID_OR_SLUG"></div>
 *   <script src="https://dockslot.app/widget.js" defer></script>
 */
(function () {
  'use strict';

  var SCRIPT_SRC = document.currentScript && document.currentScript.src;
  var BASE_URL = SCRIPT_SRC
    ? SCRIPT_SRC.replace(/\/widget\.js(\?.*)?$/, '')
    : 'https://dockslot.app';

  function formatDollars(amount) {
    return '$' + Math.floor(amount).toLocaleString('en-US');
  }

  function formatDuration(hours) {
    if (hours < 1) return Math.round(hours * 60) + ' min';
    if (hours === 1) return '1 hour';
    return hours + ' hours';
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------------
  // Styles (injected into Shadow DOM)
  // ---------------------------------------------------------------------------
  var WIDGET_CSS = /* css */ '\
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\
    :host { display: block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }\
    .ds-widget { max-width: 800px; }\
    .ds-header { margin-bottom: 16px; }\
    .ds-header h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }\
    .ds-header p { font-size: 14px; color: #64748b; margin: 0; }\
    .ds-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }\
    @media (min-width: 560px) { .ds-grid { grid-template-columns: repeat(2, 1fr); } }\
    .ds-trip-card { display: flex; flex-direction: column; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; overflow: hidden; text-decoration: none; color: inherit; transition: box-shadow 0.2s, border-color 0.2s; }\
    .ds-trip-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); }\
    .ds-trip-img { width: 100%; height: 144px; object-fit: cover; display: block; }\
    .ds-trip-body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 12px; }\
    .ds-trip-title { font-size: 16px; font-weight: 600; color: #0f172a; }\
    .ds-trip-desc { font-size: 13px; color: #64748b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }\
    .ds-trip-meta { display: flex; flex-wrap: wrap; gap: 16px; margin-top: auto; }\
    .ds-trip-meta-item { display: flex; align-items: center; gap: 6px; }\
    .ds-trip-meta-icon { width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }\
    .ds-trip-meta-icon svg { width: 16px; height: 16px; }\
    .ds-trip-meta-label { font-size: 11px; color: #94a3b8; }\
    .ds-trip-meta-value { font-size: 13px; font-weight: 500; color: #0f172a; }\
    .ds-deposit { font-size: 12px; font-weight: 500; padding: 8px 12px; border-radius: 8px; }\
    .ds-footer { margin-top: 16px; text-align: center; }\
    .ds-footer a { font-size: 12px; color: #cbd5e1; text-decoration: none; }\
    .ds-footer a:hover { color: #94a3b8; }\
    .ds-loading { padding: 32px; text-align: center; color: #94a3b8; font-size: 14px; }\
    .ds-error { padding: 24px; text-align: center; color: #94a3b8; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }\
    .ds-empty { padding: 32px; text-align: center; color: #94a3b8; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }\
    \
    .ds-theme-dark .ds-trip-card { background: #1e293b; border-color: #334155; }\
    .ds-theme-dark .ds-trip-title { color: #f1f5f9; }\
    .ds-theme-dark .ds-trip-desc { color: #94a3b8; }\
    .ds-theme-dark .ds-trip-meta-icon { background: #334155; }\
    .ds-theme-dark .ds-trip-meta-value { color: #f1f5f9; }\
    .ds-theme-dark .ds-header h2 { color: #f1f5f9; }\
    .ds-theme-dark .ds-header p { color: #94a3b8; }\
    .ds-theme-dark .ds-error, .ds-theme-dark .ds-empty { background: #1e293b; border-color: #334155; color: #94a3b8; }\
  ';

  // ---------------------------------------------------------------------------
  // SVG icons (inline to avoid external requests)
  // ---------------------------------------------------------------------------
  var ICON_CLOCK =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  var ICON_DOLLAR =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';

  // ---------------------------------------------------------------------------
  // Schema.org JSON-LD injection
  // ---------------------------------------------------------------------------
  function injectStructuredData(data) {
    var offers = data.trips.map(function (trip) {
      return {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: trip.title,
          description: trip.description || undefined,
          url: trip.bookingUrl,
        },
        price: trip.priceTotal.toString(),
        priceCurrency: 'USD',
        url: trip.bookingUrl,
        availability: 'https://schema.org/InStock',
      };
    });

    var jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: data.captain.name + ' — Charter Trips',
      url: data.captain.bookingUrl,
      provider: {
        '@type': 'LocalBusiness',
        name: data.captain.name,
        url: data.captain.bookingUrl,
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Available Trips',
        itemListElement: offers,
      },
    };

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function renderWidget(container, data, theme) {
    var accent = data.captain.accentColor || '#0891b2';
    var accentLight = accent + '1a';

    var themeClass = theme === 'dark' ? ' ds-theme-dark' : '';

    var tripsHtml = '';

    if (data.trips.length === 0) {
      tripsHtml = '<div class="ds-empty">No trips available at this time.</div>';
    } else {
      tripsHtml = '<div class="ds-grid">';
      for (var i = 0; i < data.trips.length; i++) {
        var trip = data.trips[i];
        var imgHtml = trip.imageUrl
          ? '<img class="ds-trip-img" src="' +
            escapeHtml(trip.imageUrl) +
            '" alt="' +
            escapeHtml(trip.title) +
            '" loading="lazy" />'
          : '';
        var descHtml = trip.description
          ? '<p class="ds-trip-desc">' + escapeHtml(trip.description) + '</p>'
          : '';
        var depositHtml =
          trip.depositAmount > 0
            ? '<div class="ds-deposit" style="background:' +
              accentLight +
              ';color:' +
              accent +
              ';border:1px solid ' +
              accent +
              '40">' +
              formatDollars(trip.depositAmount) +
              ' deposit to book</div>'
            : '';

        tripsHtml +=
          '<a class="ds-trip-card" href="' +
          escapeHtml(trip.bookingUrl) +
          '" target="_blank" rel="noopener noreferrer">' +
          imgHtml +
          '<div class="ds-trip-body">' +
          '<div class="ds-trip-title">' +
          escapeHtml(trip.title) +
          '</div>' +
          descHtml +
          '<div class="ds-trip-meta">' +
          '<div class="ds-trip-meta-item">' +
          '<div class="ds-trip-meta-icon" style="color:' +
          accent +
          '">' +
          ICON_CLOCK +
          '</div>' +
          '<div><div class="ds-trip-meta-label">Duration</div><div class="ds-trip-meta-value">' +
          formatDuration(trip.durationHours) +
          '</div></div>' +
          '</div>' +
          '<div class="ds-trip-meta-item">' +
          '<div class="ds-trip-meta-icon">' +
          ICON_DOLLAR +
          '</div>' +
          '<div><div class="ds-trip-meta-label">Total Price</div><div class="ds-trip-meta-value">' +
          formatDollars(trip.priceTotal) +
          '</div></div>' +
          '</div>' +
          '</div>' +
          depositHtml +
          '</div>' +
          '</a>';
      }
      tripsHtml += '</div>';
    }

    var headerHtml = '';
    if (data.captain.name) {
      headerHtml =
        '<div class="ds-header">' +
        '<h2>' +
        escapeHtml(data.captain.name) +
        '</h2>' +
        (data.captain.tagline
          ? '<p>' + escapeHtml(data.captain.tagline) + '</p>'
          : '') +
        '</div>';
    }

    var footerHtml =
      '<div class="ds-footer">' +
      '<a href="' +
      escapeHtml(BASE_URL) +
      '" target="_blank" rel="noopener noreferrer">Powered by DockSlot</a>' +
      '</div>';

    var html =
      '<div class="ds-widget' +
      themeClass +
      '">' +
      headerHtml +
      tripsHtml +
      footerHtml +
      '</div>';

    container.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  function initWidget(el) {
    var captainId = el.getAttribute('data-dockslot-widget');
    if (!captainId) return;

    var theme = el.getAttribute('data-dockslot-theme') || 'light';

    // Attach Shadow DOM
    var shadow = el.attachShadow({ mode: 'open' });

    // Inject styles
    var styleEl = document.createElement('style');
    styleEl.textContent = WIDGET_CSS;
    shadow.appendChild(styleEl);

    // Loading state
    var wrapper = document.createElement('div');
    wrapper.innerHTML = '<div class="ds-loading">Loading trips...</div>';
    shadow.appendChild(wrapper);

    // Fetch data
    var apiUrl = BASE_URL + '/api/widget/' + encodeURIComponent(captainId);

    fetch(apiUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data.error) {
          wrapper.innerHTML =
            '<div class="ds-error">' + escapeHtml(data.error) + '</div>';
          return;
        }
        renderWidget(wrapper, data, theme);
        injectStructuredData(data);
      })
      .catch(function () {
        wrapper.innerHTML =
          '<div class="ds-error">Unable to load booking information.</div>';
      });
  }

  function init() {
    var elements = document.querySelectorAll('[data-dockslot-widget]');
    for (var i = 0; i < elements.length; i++) {
      // Skip if already initialized
      if (elements[i].shadowRoot) continue;
      initWidget(elements[i]);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
