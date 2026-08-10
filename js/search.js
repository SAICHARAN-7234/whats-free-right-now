/**
 * "WHAT'S FREE RIGHT NOW?" - Natural Language Search Engine
 */

window.SmartSearchEngine = {
  parseAndFilter: function(query, facilities, userLocation) {
    if (!query || query.trim() === '') {
      return { matches: facilities, isNL: false, intentDesc: '' };
    }

    const q = query.toLowerCase().trim();
    let filtered = [...facilities];
    let intentDesc = '';
    let isNL = false;

    // 1. Natural Language Query Patterns:
    
    // Pattern: "badminton"
    if (q.includes('badminton')) {
      isNL = true;
      filtered = filtered.filter(f => f.tags.includes('badminton') || f.name.toLowerCase().includes('badminton'));
      intentDesc = 'Showing all Badminton courts sorted by availability & proximity';
    }
    // Pattern: "cricket"
    else if (q.includes('cricket')) {
      isNL = true;
      filtered = filtered.filter(f => f.tags.includes('cricket') || f.name.toLowerCase().includes('cricket'));
      intentDesc = 'Showing Cricket Ground availability';
    }
    // Pattern: "football" / "soccer"
    else if (q.includes('football') || q.includes('soccer')) {
      isNL = true;
      filtered = filtered.filter(f => f.tags.includes('football') || f.name.toLowerCase().includes('football'));
      intentDesc = 'Showing Football turf availability';
    }
    // Pattern: "quiet" / "study" / "alone"
    else if (q.includes('quiet') || q.includes('study') || q.includes('read') || q.includes('alone')) {
      isNL = true;
      filtered = filtered.filter(f => f.category === 'study' || f.tags.includes('quiet') || f.tags.includes('study'));
      intentDesc = 'Showing quiet places suitable for focused study';
    }
    // Pattern: "hut" / "project" / "discussion" / "group"
    else if (q.includes('hut') || q.includes('project') || q.includes('discussion')) {
      isNL = true;
      filtered = filtered.filter(f => f.category === 'group' || f.tags.includes('hut'));
      
      // Extract numbers for group size (e.g. "8 people" or "for 2")
      const numMatch = q.match(/(\d+)\s*(people|person|friends|members|guys)/i) || q.match(/for\s*(\d+)/i);
      if (numMatch) {
        const size = parseInt(numMatch[1], 10);
        filtered = filtered.filter(f => f.capacity >= size);
        intentDesc = `Showing project huts & group spaces with capacity for ${size}+ people`;
      } else {
        intentDesc = 'Showing all Project Huts for group work';
      }
    }
    // Pattern: "juice" / "drink" / "cafe" / "coffee" / "eat" / "food"
    else if (q.includes('juice') || q.includes('drink') || q.includes('cafe') || q.includes('coffee') || q.includes('food') || q.includes('snack')) {
      isNL = true;
      filtered = filtered.filter(f => f.category === 'food' || f.tags.includes('juice') || f.tags.includes('cafe'));
      intentDesc = 'Showing food, coffee & fresh juice spots nearby';
    }
    // Pattern: "walk" / "walking" / "jog" / "perimeter"
    else if (q.includes('walk') || q.includes('jog') || q.includes('nature') || q.includes('perimeter')) {
      isNL = true;
      filtered = filtered.filter(f => f.tags.includes('walk') || f.tags.includes('nature') || f.tags.includes('perimeter'));
      intentDesc = 'Showing campus walking routes & green nature spots';
    }
    // Pattern: "lab" / "gpu" / "coding"
    else if (q.includes('lab') || q.includes('gpu') || q.includes('coding') || q.includes('robotics')) {
      isNL = true;
      filtered = filtered.filter(f => f.category === 'labs' || f.tags.includes('lab') || f.tags.includes('coding'));
      intentDesc = 'Showing specialized laboratory facilities';
    }
    // Pattern: "charging" / "power" / "ups" / "plug"
    else if (q.includes('charging') || q.includes('power') || q.includes('ups') || q.includes('plug')) {
      isNL = true;
      filtered = filtered.filter(f => f.category === 'utilities' || f.tags.includes('charging') || f.tags.includes('power'));
      intentDesc = 'Showing UPS charging points and powered workspaces';
    }
    // Generic Keyword Search Fallback
    else {
      const keywords = q.split(' ').filter(k => k.length > 2);
      filtered = filtered.filter(f => {
        const text = `${f.name} ${f.category} ${f.zone} ${f.locationDesc} ${f.tags.join(' ')}`.toLowerCase();
        return keywords.some(kw => text.includes(kw));
      });
      intentDesc = `Matching search results for "${query}"`;
    }

    // Sort priority: AVAILABLE_NOW first, then AVAILABLE_SOON, then OCCUPIED. Then sort by walking distance.
    filtered.sort((a, b) => {
      const statusWeight = { 'AVAILABLE_NOW': 1, 'AVAILABLE_SOON': 2, 'BOOKABLE': 3, 'OCCUPIED': 4, 'CLOSED': 5 };
      const weightA = statusWeight[a.status] || 9;
      const weightB = statusWeight[b.status] || 9;

      if (weightA !== weightB) return weightA - weightB;
      return a.distanceMeters - b.distanceMeters;
    });

    return {
      matches: filtered,
      isNL: isNL,
      intentDesc: intentDesc
    };
  }
};
