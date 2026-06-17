import { Route } from '../../types';

export function categorizeRoutes(routes: any[]): Route[] {
  return routes.map(r => {
    const name = r.name?.toLowerCase() || '';
    const routeNo = r.routeNumber || r.busNo || '';
    const stopsStr = (r.stops || []).map((s: any) => typeof s === 'string' ? s : s.name).join(' ').toLowerCase();

    let layerCategory: 'Feeder' | 'Ring' | 'BRT' | 'Suburban' = 'Suburban'; // default

    // Layer 1: Metro Feeder (Green)
    if (
      name.includes('metro') ||
      name.includes('velachery \u2192 guindy') ||
      name.includes('medavakkam \u2192 airport') ||
      name.includes('ambattur \u2192 koyambedu') ||
      stopsStr.includes('metro') ||
      stopsStr.includes('airport')
    ) {
      layerCategory = 'Feeder';
    }
    // Layer 2: Circular Ring (Blue)
    else if (
      name.includes('ring') ||
      name.includes('ennore') ||
      name.includes('tiruvottiyur') ||
      name.includes('madhavaram') ||
      name.includes('puzhal') ||
      name.includes('anna nagar') ||
      name.includes('vadapalani') ||
      name.includes('ashok nagar')
    ) {
      layerCategory = 'Ring';
    }
    // Layer 3: Express BRT Corridors (Red)
    else if (
      r.busType === 'Express' ||
      name.includes('omr') ||
      name.includes('tambaram') ||
      name.includes('central') ||
      name.includes('guindy \u2192') ||
      stopsStr.includes('omr') ||
      routeNo.includes('570') ||
      routeNo.includes('19') ||
      routeNo.includes('21G')
    ) {
      layerCategory = 'BRT';
    }
    // Layer 4: Suburban Connectors (Yellow)
    else if (
      name.includes('poonamallee') ||
      name.includes('red hills') ||
      name.includes('minjur') ||
      name.includes('kelambakkam') ||
      name.includes('navalur') ||
      name.includes('perungalathur')
    ) {
      layerCategory = 'Suburban';
    } else {
      // Default heuristics if nothing matches
      if (routeNo.startsWith('M') || routeNo.startsWith('S')) layerCategory = 'Feeder';
      else if (routeNo.length >= 3 && routeNo.startsWith('1')) layerCategory = 'BRT';
      else if (routeNo.length >= 3 && routeNo.startsWith('5')) layerCategory = 'Suburban';
      else layerCategory = 'Ring';
    }

    return {
      ...r,
      layerCategory
    } as Route;
  });
}
