/**
 * "WHAT'S FREE RIGHT NOW?" - Interactive 110-Acre Campus Vector Map Engine
 */

window.CampusMapEngine = {
  renderMap: function(containerId, facilities, userLocation, onFacilitySelect) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Build SVG Topographic Map
    const svgHTML = `
      <svg viewBox="0 0 1000 600" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" id="campus-svg">
        <defs>
          <radialGradient id="mapBgGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="#0e1726" />
            <stop offset="100%" stop-color="#07090e" />
          </radialGradient>
          <linearGradient id="perimeterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Background -->
        <rect width="1000" height="600" fill="url(#mapBgGrad)" />

        <!-- Topographic Contour Lines -->
        <path d="M 50 100 Q 200 40 400 90 T 800 60" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="2" />
        <path d="M 30 200 Q 300 150 600 220 T 950 180" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="2" />
        <path d="M 100 400 Q 400 350 700 420 T 920 390" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="2" />

        <!-- 2.8 km Perimeter Walk Loop Trail -->
        <path d="M 100 60 C 400 20 850 40 920 200 C 960 380 900 520 600 550 C 300 570 80 500 60 300 C 40 180 60 80 100 60 Z" 
              fill="none" stroke="url(#perimeterGrad)" stroke-width="6" stroke-dasharray="10 6" opacity="0.6" />
        <text x="120" y="45" fill="#10b981" font-size="12" font-weight="700" letter-spacing="1">🏃 2.8 KM PERIMETER GREEN WALK</text>

        <!-- Campus Zones -->
        <!-- 1. Academic Quad (West) -->
        <path d="M 200 180 L 480 180 L 480 380 L 200 380 Z" fill="rgba(59, 130, 246, 0.06)" stroke="rgba(59, 130, 246, 0.2)" stroke-dasharray="4" />
        <text x="220" y="200" fill="#60a5fa" font-size="14" font-weight="800">ACADEMIC QUAD</text>

        <!-- 2. Sports Complex & Grounds (East) -->
        <path d="M 680 120 L 930 120 L 930 350 L 680 350 Z" fill="rgba(16, 185, 129, 0.06)" stroke="rgba(16, 185, 129, 0.2)" stroke-dasharray="4" />
        <text x="700" y="140" fill="#34d399" font-size="14" font-weight="800">SPORTS & ATHLETICS COMPLEX</text>

        <!-- 3. Eco Lake & Green Park (Center South) -->
        <ellipse cx="550" cy="420" rx="100" ry="60" fill="rgba(6, 182, 212, 0.08)" stroke="rgba(6, 182, 212, 0.3)" />
        <text x="500" y="425" fill="#22d3ee" font-size="12" font-weight="700">🌿 Central Eco Lake</text>

        <!-- Building Outlines -->
        <!-- Academic Block A -->
        <rect x="250" y="220" width="80" height="50" rx="6" fill="rgba(30, 41, 59, 0.8)" stroke="rgba(255,255,255,0.15)" />
        <text x="260" y="250" fill="#cbd5e1" font-size="11" font-weight="700">Block A</text>

        <!-- Academic Block B -->
        <rect x="350" y="220" width="80" height="50" rx="6" fill="rgba(30, 41, 59, 0.8)" stroke="rgba(255,255,255,0.15)" />
        <text x="360" y="250" fill="#cbd5e1" font-size="11" font-weight="700">Block B</text>

        <!-- Academic Block C (User Default Position) -->
        <rect x="350" y="300" width="90" height="60" rx="6" fill="rgba(30, 58, 138, 0.8)" stroke="#60a5fa" stroke-width="2" />
        <text x="360" y="335" fill="#ffffff" font-size="12" font-weight="800">Block C ⭐</text>

        <!-- Sports Complex Indoor Stadium -->
        <rect x="720" y="200" width="120" height="70" rx="8" fill="rgba(20, 83, 45, 0.8)" stroke="#34d399" />
        <text x="735" y="240" fill="#ffffff" font-size="12" font-weight="800">Indoor Stadium</text>

        <!-- Cricket Ground Circle -->
        <circle cx="850" cy="180" r="45" fill="rgba(234, 179, 8, 0.06)" stroke="rgba(234, 179, 8, 0.3)" stroke-dasharray="3" />
        <text x="825" y="185" fill="#fde047" font-size="10" font-weight="700">Cricket Pitch</text>

        <!-- User Walking Polyline Layer -->
        <polyline id="walking-route-path" points="" fill="none" stroke="#06b6d4" stroke-width="4" stroke-dasharray="8 4" filter="url(#glow)" />

        <!-- User Location Marker (Simulated Position: Block C) -->
        <g transform="translate(390, 330)" class="user-location-pin">
          <circle r="16" fill="rgba(59, 130, 246, 0.3)" />
          <circle r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2" />
          <text x="0" y="26" fill="#60a5fa" font-size="11" font-weight="800" text-anchor="middle">YOU ARE HERE</text>
        </g>

        <!-- Dynamic Facility Markers -->
        <g id="svg-facility-markers">
          ${facilities.map(f => {
            const cx = f.coords.x * 10; // scale 100% to 1000px
            const cy = f.coords.y * 6;  // scale 100% to 600px
            
            let color = '#10b981'; // AVAILABLE_NOW
            if (f.status === 'AVAILABLE_SOON') color = '#f59e0b';
            if (f.status === 'OCCUPIED') color = '#ef4444';
            if (f.status === 'BOOKABLE') color = '#3b82f6';
            if (f.status === 'CLOSED') color = '#64748b';

            return `
              <g transform="translate(${cx}, ${cy})" class="facility-map-node" data-id="${f.id}" style="cursor:pointer;">
                <circle r="14" fill="${color}" opacity="0.2" class="pulse-ring" />
                <circle r="7" fill="${color}" stroke="#ffffff" stroke-width="1.5" />
                <text x="12" y="4" fill="#ffffff" font-size="10" font-weight="700" class="map-node-label">${f.name.split('-')[0].trim()}</text>
              </g>
            `;
          }).join('')}
        </g>
      </svg>
    `;

    container.innerHTML = svgHTML;

    // Attach click listeners to markers
    container.querySelectorAll('.facility-map-node').forEach(node => {
      node.addEventListener('click', (e) => {
        const id = node.getAttribute('data-id');
        const fac = facilities.find(item => item.id === id);
        if (fac && onFacilitySelect) {
          // Draw walking route line
          const userX = 390;
          const userY = 330;
          const targetX = fac.coords.x * 10;
          const targetY = fac.coords.y * 6;
          
          const pathEl = document.getElementById('walking-route-path');
          if (pathEl) {
            pathEl.setAttribute('points', `${userX},${userY} ${(userX+targetX)/2},${userY} ${targetX},${targetY}`);
          }
          
          onFacilitySelect(fac);
        }
      });
    });
  }
};
