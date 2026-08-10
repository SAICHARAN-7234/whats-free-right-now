/**
 * "WHAT'S FREE RIGHT NOW?" - Central Application Logic & Real-Time Controller
 */

(function() {
  // Application State
  const state = {
    facilities: [...window.CAMPUS_FACILITIES],
    activeTab: 'home',
    activeCategory: 'all',
    searchQuery: '',
    userLocation: window.CAMPUS_LOCATIONS_LIST[0],
    userRole: 'student', // student, faculty, admin
    theme: 'dark',
    myBookings: [
      {
        id: "BK-98421",
        facilityId: "sp-badminton-1",
        facilityName: "Badminton Court 1",
        date: "Today",
        timeSlot: "05:00 PM - 05:30 PM",
        status: "ACTIVE",
        qrCode: "QR-BADM-98421"
      }
    ],
    waitlists: [],
    savedFacilities: ["sp-badminton-1", "std-nook-c", "fd-juice-point-a"],
    selectedFacilityForBooking: null,
    selectedSlot: null,
    radarParams: {
      timeMins: 30,
      groupSize: 1,
      vibe: 'active'
    }
  };

  // --- Initialization ---
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    renderHeroCanvas();
    renderCategories();
    renderFacilityGrid();
    renderNearbyAvailability();
    renderTimeMachine();
    renderCampusPulse();
    renderUserBookings();
    renderAdminPanel();

    // Start Live Simulation Ticker (updates background availability every 10 seconds)
    startRealtimeSimulation();
  });

  // --- Theme Management ---
  function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        if (state.theme === 'dark') state.theme = 'light';
        else if (state.theme === 'light') state.theme = 'high-contrast';
        else state.theme = 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);
        themeBtn.textContent = state.theme === 'dark' ? '🌙 Dark' : (state.theme === 'light' ? '☀️ Light' : '👁️ Contrast');
      });
    }
  }

  // --- Navigation & View Switching ---
  function setupEventListeners() {
    // Navigation Links (Desktop & Mobile)
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // Smart Search Input
    const searchInput = document.getElementById('main-search-input');
    const searchClear = document.getElementById('search-clear-btn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (searchClear) searchClear.style.display = state.searchQuery ? 'block' : 'none';
        executeSearch();
      });
    }
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        state.searchQuery = '';
        if (searchInput) searchInput.value = '';
        searchClear.style.display = 'none';
        executeSearch();
      });
    }

    // Preset Search Chips
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        if (searchInput) searchInput.value = query;
        state.searchQuery = query;
        if (searchClear) searchClear.style.display = 'block';
        executeSearch();
      });
    });

    // Radar Wizard Selects
    const radarTime = document.getElementById('radar-time-select');
    const radarGroup = document.getElementById('radar-group-select');
    const radarVibe = document.getElementById('radar-vibe-select');

    if (radarTime && radarGroup && radarVibe) {
      [radarTime, radarGroup, radarVibe].forEach(sel => {
        sel.addEventListener('change', () => {
          state.radarParams = {
            timeMins: parseInt(radarTime.value, 10),
            groupSize: parseInt(radarGroup.value, 10),
            vibe: radarVibe.value
          };
          renderRadarResults();
        });
      });
    }

    // Location Picker Modal Trigger
    const locationBtn = document.getElementById('location-picker-btn');
    if (locationBtn) {
      locationBtn.addEventListener('click', () => {
        openLocationModal();
      });
    }

    // Modal Close buttons
    document.querySelectorAll('.modal-close-btn, .modal-backdrop').forEach(el => {
      el.addEventListener('click', () => {
        closeAllModals();
      });
    });

    // Trigger Waitlist Cancellation Demo Button
    const cancelSimBtn = document.getElementById('sim-cancellation-btn');
    if (cancelSimBtn) {
      cancelSimBtn.addEventListener('click', () => {
        triggerSimulatedCancellation();
      });
    }
  }

  function switchTab(tabName) {
    state.activeTab = tabName;

    // Update nav buttons
    document.querySelectorAll('[data-tab]').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.style.display = 'none';
    });

    // Show selected view section
    const targetSec = document.getElementById(`view-${tabName}`);
    if (targetSec) {
      targetSec.style.display = 'block';
    }

    // Tab specific initializations
    if (tabName === 'map') {
      window.CampusMapEngine.renderMap('campus-map-viewport', state.facilities, state.userLocation, (fac) => {
        openFacilityDetailModal(fac);
      });
    } else if (tabName === 'radar') {
      renderRadarResults();
    } else if (tabName === 'bookings') {
      renderUserBookings();
    } else if (tabName === 'admin') {
      renderAdminPanel();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Topographic Canvas Hero Animation ---
  function renderHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = canvas.parentElement.clientHeight || 400;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 400;
    });

    // Animated dots representing moving students
    const dots = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.3 ? '#06b6d4' : '#10b981'
    }));

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Draw faint topographic grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw dots
      dots.forEach(d => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > width) d.vx *= -1;
        if (d.y < 0 || d.y > height) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  // --- Category Filter Pills ---
  function renderCategories() {
    const container = document.getElementById('category-bar');
    if (!container) return;

    const cats = [
      { id: 'all', label: '⚡ All Facilities', emoji: '' },
      { id: 'sports', label: '🏸 Sports', emoji: '' },
      { id: 'study', label: '📚 Study', emoji: '' },
      { id: 'group', label: '👥 Group Spaces', emoji: '' },
      { id: 'food', label: '☕ Food & Refreshment', emoji: '' },
      { id: 'relax', label: '🌳 Relax & Nature', emoji: '' },
      { id: 'auditoriums', label: '🏛️ Auditoriums', emoji: '' },
      { id: 'labs', label: '🧪 Laboratories', emoji: '' },
      { id: 'utilities', label: '⚡ Utilities', emoji: '' },
      { id: 'grounds', label: '🏟️ Grounds', emoji: '' }
    ];

    container.innerHTML = cats.map(c => {
      const count = c.id === 'all' 
        ? state.facilities.length 
        : state.facilities.filter(f => f.category === c.id).length;

      return `
        <button class="category-pill ${state.activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">
          ${c.label} <span class="category-count">${count}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.getAttribute('data-cat');
        renderCategories();
        executeSearch();
      });
    });
  }

  // --- Search Execution ---
  function executeSearch() {
    let result = window.SmartSearchEngine.parseAndFilter(state.searchQuery, state.facilities, state.userLocation);
    let items = result.matches;

    // Apply category filter if set
    if (state.activeCategory !== 'all') {
      items = items.filter(f => f.category === state.activeCategory);
    }

    // Show/Hide Natural Language Intent Indicator
    const nlIndicator = document.getElementById('nl-intent-banner');
    if (nlIndicator) {
      if (result.isNL && result.intentDesc) {
        nlIndicator.style.display = 'flex';
        nlIndicator.innerHTML = `🧠 <strong>Smart Intent Detected:</strong> ${result.intentDesc}`;
      } else {
        nlIndicator.style.display = 'none';
      }
    }

    // Render Smart Alternatives if top results are occupied!
    renderSmartAlternatives(items);

    renderFacilityGrid(items);
  }

  // --- Facility Card Grid Renderer ---
  function renderFacilityGrid(items = state.facilities) {
    const grid = document.getElementById('facility-grid');
    if (!grid) return;

    if (items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-glass);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3>No matching facilities available right now</h3>
          <p style="color: var(--text-muted); margin-top: 0.25rem;">Try searching for "Badminton", "Study space", or clear your filter.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(f => {
      const isSaved = state.savedFacilities.includes(f.id);

      return `
        <div class="facility-card" data-status="${f.status}">
          <div class="facility-card-header">
            <div>
              <div class="facility-title">${f.name}</div>
              <div class="facility-zone">📍 ${f.zone} • ${f.locationDesc}</div>
            </div>
            <span class="status-badge" data-status="${f.status}">
              ${getStatusBadgeHTML(f.status)}
            </span>
          </div>

          <div class="occupancy-bar-container">
            <div class="occupancy-info">
              <span>Occupancy</span>
              <span>${f.occupancy}/${f.capacity} (${Math.round((f.occupancy/f.capacity)*100)}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" 
                   data-level="${(f.occupancy/f.capacity) > 0.8 ? 'high' : ((f.occupancy/f.capacity) > 0.4 ? 'medium' : 'low')}" 
                   style="width: ${Math.round((f.occupancy/f.capacity)*100)}%"></div>
            </div>
          </div>

          <div class="facility-meta">
            <div class="meta-item">
              <span class="meta-label">Distance & Walk</span>
              <span class="meta-value">${f.distanceMeters} m • ${f.walkTimeMins} min walk</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Next Available</span>
              <span class="meta-value" style="color: ${f.status === 'AVAILABLE_NOW' ? 'var(--status-available)' : 'var(--status-soon)'};">
                ${f.nextAvailableTime}
              </span>
            </div>
          </div>

          <div class="facility-card-footer">
            ${getActionButtonHTML(f)}
            <button class="btn btn-secondary btn-icon-only bookmark-btn" data-id="${f.id}" title="Save space">
              ${isSaved ? '⭐' : '☆'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach Action Handlers
    grid.querySelectorAll('.action-book-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const fac = state.facilities.find(item => item.id === id);
        if (fac) openBookingModal(fac);
      });
    });

    grid.querySelectorAll('.action-waitlist-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const fac = state.facilities.find(item => item.id === id);
        if (fac) joinWaitlist(fac);
      });
    });

    grid.querySelectorAll('.bookmark-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (state.savedFacilities.includes(id)) {
          state.savedFacilities = state.savedFacilities.filter(i => i !== id);
          showToast('Removed from saved spaces');
        } else {
          state.savedFacilities.push(id);
          showToast('Added to saved spaces! ⭐', 'success');
        }
        renderFacilityGrid(items);
      });
    });
  }

  function getStatusBadgeHTML(status) {
    switch (status) {
      case 'AVAILABLE_NOW': return '🟢 AVAILABLE NOW';
      case 'AVAILABLE_SOON': return '🟡 AVAILABLE SOON';
      case 'OCCUPIED': return '🔴 OCCUPIED';
      case 'BOOKABLE': return '🔵 BOOKABLE';
      case 'CLOSED': return '⚪ CLOSED';
      default: return status;
    }
  }

  function getActionButtonHTML(f) {
    if (f.status === 'AVAILABLE_NOW' || f.status === 'BOOKABLE') {
      return `<button class="btn btn-primary action-book-btn" data-id="${f.id}">⚡ BOOK NOW</button>`;
    } else if (f.status === 'OCCUPIED') {
      return `<button class="btn btn-outline action-waitlist-btn" data-id="${f.id}">⏳ JOIN WAITLIST</button>`;
    } else if (f.status === 'AVAILABLE_SOON') {
      return `<button class="btn btn-secondary action-book-btn" data-id="${f.id}">⏰ PRE-BOOK SLOT</button>`;
    } else {
      return `<button class="btn btn-secondary" disabled>CLOSED</button>`;
    }
  }

  // --- Time-Saving Feature: Smart Alternatives ---
  function renderSmartAlternatives(searchResults) {
    const box = document.getElementById('smart-alternatives-container');
    if (!box) return;

    // Check if user searched specifically for something occupied
    const occupiedMatches = searchResults.filter(f => f.status === 'OCCUPIED');
    if (occupiedMatches.length > 0 && state.searchQuery.length > 2) {
      // Find open alternatives in same category
      const targetCat = occupiedMatches[0].category;
      const openAlts = state.facilities.filter(f => f.category === targetCat && f.status === 'AVAILABLE_NOW');

      if (openAlts.length > 0) {
        box.style.display = 'block';
        box.innerHTML = `
          <div class="smart-alternatives-box">
            <div class="smart-alt-header">
              💡 <span><strong>Time-Saving Suggestion:</strong> '${occupiedMatches[0].name}' is currently occupied, but these alternatives are free right now:</span>
            </div>
            <div class="smart-alt-grid">
              ${openAlts.slice(0, 2).map(alt => `
                <div class="smart-alt-item">
                  <div>
                    <strong style="color: var(--text-primary); font-size: 0.9rem;">${alt.name}</strong>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">${alt.distanceMeters} m • ${alt.walkTimeMins} min walk</div>
                  </div>
                  <button class="btn btn-primary action-book-btn" data-id="${alt.id}" style="padding: 0.4rem 0.75rem; font-size: 0.78rem; width: auto;">
                    ⚡ BOOK NOW
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        box.querySelectorAll('.action-book-btn').forEach(b => {
          b.addEventListener('click', () => {
            const fac = state.facilities.find(f => f.id === b.getAttribute('data-id'));
            if (fac) openBookingModal(fac);
          });
        });
        return;
      }
    }
    box.style.display = 'none';
  }

  // --- Nearby Availability ---
  function renderNearbyAvailability() {
    const container = document.getElementById('nearby-list-container');
    if (!container) return;

    const nearby = [...state.facilities]
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 4);

    container.innerHTML = nearby.map((f, idx) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: var(--radius-md);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem;">
            ${idx + 1}
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.9rem;">${f.name}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${f.distanceMeters} m • ${f.walkTimeMins} min walk</div>
          </div>
        </div>
        <span class="status-badge" data-status="${f.status}">${getStatusBadgeHTML(f.status)}</span>
      </div>
    `).join('');
  }

  // --- Campus Opportunity Radar ("What can I do right now?") ---
  function renderRadarResults() {
    const container = document.getElementById('radar-results-container');
    if (!container) return;

    const { timeMins, groupSize, vibe } = state.radarParams;

    // Intelligent recommendation scoring
    const recommendations = state.facilities.filter(f => {
      if (f.status === 'CLOSED') return false;
      if (groupSize > f.capacity) return false;
      
      if (vibe === 'active' && (f.category === 'sports' || f.category === 'grounds' || f.tags.includes('walk'))) return true;
      if (vibe === 'relax' && (f.category === 'relax' || f.category === 'food' || f.category === 'auditoriums')) return true;
      if (vibe === 'study' && (f.category === 'study' || f.category === 'labs' || f.category === 'group')) return true;
      if (vibe === 'eat' && (f.category === 'food' || f.tags.includes('juice'))) return true;

      return true;
    }).sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, 4);

    container.innerHTML = `
      <div style="margin-bottom: 0.75rem; font-weight: 700; color: var(--accent-cyan);">
        🎯 Top Campus Opportunities for ${timeMins} Mins • ${groupSize} Person(s) • ${vibe.toUpperCase()} Vibe:
      </div>
      <div class="facility-grid" style="margin-bottom: 0;">
        ${recommendations.map(f => `
          <div class="facility-card" data-status="${f.status}">
            <div style="font-weight: 700; font-size: 1rem;">${f.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin: 0.3rem 0;">
              📍 ${f.locationDesc} (${f.distanceMeters} m away)
            </div>
            <div style="font-size: 0.82rem; color: var(--status-available); font-weight: 700; margin-bottom: 0.75rem;">
              ⚡ Available Now for ${f.availableForMins} mins
            </div>
            <button class="btn btn-primary action-book-btn" data-id="${f.id}">⚡ QUICK RESERVE</button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.action-book-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fac = state.facilities.find(f => f.id === btn.getAttribute('data-id'));
        if (fac) openBookingModal(fac);
      });
    });
  }

  // --- Campus Time Machine ("COMING FREE") ---
  function renderTimeMachine() {
    const container = document.getElementById('time-machine-container');
    if (!container) return;

    const comingFree = state.facilities.filter(f => f.status === 'AVAILABLE_SOON' || f.status === 'OCCUPIED');

    container.innerHTML = `
      <div class="time-machine-timeline">
        ${comingFree.map(f => `
          <div class="timeline-card">
            <span class="timeline-time-badge">${f.nextAvailableTime}</span>
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.3rem;">${f.name}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">📍 ${f.zone} (${f.walkTimeMins} min walk)</div>
            <button class="btn btn-secondary action-book-btn" data-id="${f.id}" style="margin-top: 0.75rem; padding: 0.4rem; font-size: 0.78rem;">
              ⏰ PRE-RESERVE
            </button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.action-book-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const fac = state.facilities.find(f => f.id === btn.getAttribute('data-id'));
        if (fac) openBookingModal(fac);
      });
    });
  }

  // --- Campus Pulse ---
  function renderCampusPulse() {
    const container = document.getElementById('campus-pulse-stats');
    if (!container) return;

    const p = window.CAMPUS_PULSE_DATA;
    container.innerHTML = `
      <div class="pulse-stat-card">
        <div class="pulse-stat-val">${p.crowdLevel}</div>
        <div class="pulse-stat-label">Campus Crowd Density</div>
      </div>
      <div class="pulse-stat-card">
        <div class="pulse-stat-val">${p.activeStudents}</div>
        <div class="pulse-stat-label">Students Currently Active</div>
      </div>
      <div class="pulse-stat-card">
        <div class="pulse-stat-val">${p.sportsAvailable}</div>
        <div class="pulse-stat-label">Sports Courts Free</div>
      </div>
      <div class="pulse-stat-card">
        <div class="pulse-stat-val">${p.hutsAvailable}</div>
        <div class="pulse-stat-label">Project Huts Open</div>
      </div>
    `;
  }

  // --- Booking Modal Engine ---
  function openBookingModal(facility) {
    state.selectedFacilityForBooking = facility;
    const modal = document.getElementById('booking-modal');
    if (!modal) return;

    document.getElementById('booking-modal-title').textContent = `Book ${facility.name}`;
    document.getElementById('booking-modal-location').textContent = `📍 ${facility.locationDesc} • ${facility.walkTimeMins} min walk from your current position`;

    const slotsGrid = document.getElementById('booking-slots-grid');
    const slots = facility.slots || ["05:00 PM - 05:30 PM", "05:30 PM - 06:00 PM", "06:00 PM - 06:30 PM", "06:30 PM - 07:00 PM"];

    slotsGrid.innerHTML = slots.map((s, i) => `
      <button class="slot-btn available ${i === 0 ? 'selected' : ''}" data-slot="${s}">
        🕒 ${s}
      </button>
    `).join('');

    state.selectedSlot = slots[0];

    slotsGrid.querySelectorAll('.slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        slotsGrid.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.selectedSlot = btn.getAttribute('data-slot');
      });
    });

    const confirmBtn = document.getElementById('confirm-booking-btn');
    confirmBtn.onclick = () => {
      executeBookingConfirmation();
    };

    modal.classList.add('active');
  }

  function executeBookingConfirmation() {
    const fac = state.selectedFacilityForBooking;
    if (!fac || !state.selectedSlot) return;

    const bookingId = `BK-${Math.floor(10000 + Math.random() * 90000)}`;
    const newBooking = {
      id: bookingId,
      facilityId: fac.id,
      facilityName: fac.name,
      date: "Today",
      timeSlot: state.selectedSlot,
      status: "ACTIVE",
      qrCode: `QR-${fac.id.toUpperCase()}-${bookingId}`
    };

    state.myBookings.unshift(newBooking);
    
    // Update facility status in real-time
    fac.occupancy = Math.min(fac.capacity, fac.occupancy + 1);

    closeAllModals();

    // Show Confirmation Pass Dialog
    openBookingSuccessPass(newBooking, fac);
    renderFacilityGrid();
    showToast(`Successfully booked ${fac.name}! 🎉`, 'success');
  }

  function openBookingSuccessPass(booking, facility) {
    const modal = document.getElementById('booking-pass-modal');
    if (!modal) return;

    document.getElementById('pass-facility-name').textContent = facility.name;
    document.getElementById('pass-time-slot').textContent = booking.timeSlot;
    document.getElementById('pass-booking-id').textContent = booking.id;
    document.getElementById('pass-walk-time').textContent = `${facility.walkTimeMins} min walk from Academic Block C`;

    modal.classList.add('active');
  }

  // --- Smart Waitlist & Simulated Auto-Notification ---
  function joinWaitlist(facility) {
    if (state.waitlists.some(w => w.facilityId === facility.id)) {
      showToast('You are already on the waitlist for this facility');
      return;
    }

    state.waitlists.push({
      facilityId: facility.id,
      facilityName: facility.name,
      joinedAt: new Date().toLocaleTimeString()
    });

    showToast(`Added to waitlist for ${facility.name}! You will be automatically notified if someone cancels. ⏳`, 'success');
  }

  function triggerSimulatedCancellation() {
    if (state.waitlists.length === 0) {
      // Add a dummy waitlist item first
      state.waitlists.push({
        facilityId: "sp-badminton-2",
        facilityName: "Badminton Court 2",
        joinedAt: new Date().toLocaleTimeString()
      });
    }

    const waitlistItem = state.waitlists.shift();
    const fac = state.facilities.find(f => f.id === waitlistItem.facilityId);
    if (fac) {
      fac.status = "AVAILABLE_NOW";
      fac.occupancy = Math.max(0, fac.occupancy - 1);
    }

    // Trigger Notification Toast
    showToast(`🔔 WAITLIST ALERT: ${waitlistItem.facilityName} is now FREE! Tap to claim your slot.`, 'success');
    renderFacilityGrid();
  }

  // --- User Dashboard ("MY BOOKINGS") ---
  function renderUserBookings() {
    const container = document.getElementById('user-bookings-list');
    if (!container) return;

    if (state.myBookings.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted);">No active bookings found.</p>`;
      return;
    }

    container.innerHTML = state.myBookings.map(b => `
      <div style="background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 800; text-transform: uppercase;">BOOKING ID: ${b.id}</div>
          <div style="font-size: 1.1rem; font-weight: 800;">${b.facilityName}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">🕒 ${b.date} • ${b.timeSlot}</div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary cancel-booking-btn" data-id="${b.id}">Cancel</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.cancel-booking-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        state.myBookings = state.myBookings.filter(b => b.id !== id);
        showToast('Booking cancelled');
        renderUserBookings();
      });
    });
  }

  // --- Admin Panel ---
  function renderAdminPanel() {
    const container = document.getElementById('admin-facility-table');
    if (!container) return;

    container.innerHTML = state.facilities.map(f => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid var(--border-glass); font-size: 0.85rem;">
        <div>
          <strong>${f.name}</strong> (${f.zone})
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary admin-override-btn" data-id="${f.id}" data-status="AVAILABLE_NOW" style="padding: 0.3rem 0.5rem; font-size: 0.72rem;">Set Available</button>
          <button class="btn btn-secondary admin-override-btn" data-id="${f.id}" data-status="OCCUPIED" style="padding: 0.3rem 0.5rem; font-size: 0.72rem;">Set Occupied</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.admin-override-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const st = btn.getAttribute('data-status');
        const fac = state.facilities.find(f => f.id === id);
        if (fac) {
          fac.status = st;
          renderFacilityGrid();
          renderAdminPanel();
          showToast(`Admin override: Updated ${fac.name} to ${st}`);
        }
      });
    });
  }

  // --- Location Modal ---
  function openLocationModal() {
    const modal = document.getElementById('location-modal');
    if (!modal) return;

    const list = document.getElementById('location-options-list');
    list.innerHTML = window.CAMPUS_LOCATIONS_LIST.map(loc => `
      <button class="btn btn-secondary location-opt-btn ${loc.id === state.userLocation.id ? 'active' : ''}" data-id="${loc.id}" style="width:100%; justify-content: flex-start; margin-bottom: 0.5rem;">
        📍 ${loc.name}
      </button>
    `).join('');

    list.querySelectorAll('.location-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const loc = window.CAMPUS_LOCATIONS_LIST.find(l => l.id === id);
        if (loc) {
          state.userLocation = loc;
          document.getElementById('current-location-name').textContent = loc.name;
          showToast(`Updated campus location to ${loc.name}`);
          closeAllModals();
          renderNearbyAvailability();
          executeSearch();
        }
      });
    });

    modal.classList.add('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  // --- Real-Time Simulation Ticker ---
  function startRealtimeSimulation() {
    setInterval(() => {
      // Pick a random facility and alter occupancy slightly to simulate real campus activity
      const randomIdx = Math.floor(Math.random() * state.facilities.length);
      const fac = state.facilities[randomIdx];

      if (fac.status === 'AVAILABLE_NOW' && Math.random() > 0.6) {
        fac.occupancy = Math.min(fac.capacity, fac.occupancy + 1);
        if (fac.occupancy === fac.capacity) fac.status = 'OCCUPIED';
      } else if (fac.status === 'OCCUPIED' && Math.random() > 0.5) {
        fac.status = 'AVAILABLE_NOW';
        fac.occupancy = Math.max(0, fac.occupancy - 2);
      }

      // Update pulse badge counter
      const liveAvailCount = state.facilities.filter(f => f.status === 'AVAILABLE_NOW').length;
      const pulseEl = document.getElementById('header-live-count');
      if (pulseEl) pulseEl.textContent = `${liveAvailCount} Free Now`;

    }, 8000);
  }

  // --- Toast Notification Engine ---
  function showToast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

})();
