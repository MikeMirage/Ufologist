// ============================================================
// UFOlogist — astronomical context layer
// Uses Astronomy Engine (VSOP87/NOVAS-tested) when available.
// ============================================================

(function () {
  const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function normalizeLongitude(lng) {
    return ((lng + 540) % 360) - 180;
  }

  function normalizeTime(time) {
    const t = String(time || '12:00').trim();
    return t.length === 5 ? `${t}:00` : t;
  }

  function parseOffsetDate(date, time, timezone) {
    const clock = normalizeTime(time);
    const tz = String(timezone || 'Z').trim();
    if (tz === 'Z' || /^[+-]\d{2}:\d{2}$/.test(tz)) return new Date(`${date}T${clock}${tz}`);
    return new Date(`${date}T${clock}Z`);
  }

  function caseDateTime(c) {
    const date = c.date || `${c.year || 2000}-01-01`;
    const reportedTime = c.time || c.localTime || c.hour || null;
    const hasExactUtc = !!c.datetimeUtc;
    const hasTimezone = !!c.timezone;
    const time = reportedTime ? String(reportedTime) : '12:00';
    const precision = c.datetimePrecision || (hasExactUtc ? 'exact-utc' : (hasTimezone && reportedTime ? 'reported-local' : 'date-only'));
    const parsed = hasExactUtc
      ? new Date(c.datetimeUtc)
      : (hasTimezone && reportedTime ? parseOffsetDate(date, time, c.timezone) : new Date(`${date}T12:00:00Z`));
    return {
      date,
      time,
      precision,
      timeNote: c.timeNote || null,
      timeNoteEn: c.timeNoteEn || c.timeNote || null,
      utc: Number.isFinite(parsed.getTime()) ? parsed : new Date(`${date}T12:00:00Z`),
    };
  }

  function precisionLabel(precision, lang) {
    if (precision === 'exact-utc') return lang === 'en' ? 'exact UTC timestamp' : 'fecha y hora UTC exactas';
    if (precision === 'reported-local') return lang === 'en' ? 'reported local time' : 'hora local reportada';
    if (precision === 'reported-window') return lang === 'en' ? 'representative time from a reported event window' : 'hora representativa dentro de una ventana reportada';
    if (precision === 'approx-local') return lang === 'en' ? 'approximate reported local time' : 'hora local aproximada';
    return lang === 'en' ? 'date only, rendered at 12:00 UTC' : 'solo fecha, renderizado a las 12:00 UTC';
  }

  function horizon(body, astroTime, observer) {
    const A = window.Astronomy;
    const eq = A.Equator(A.Body[body], astroTime, observer, true, true);
    const hor = A.Horizon(astroTime, observer, eq.ra, eq.dec, 'normal');
    return {
      altitude: hor.altitude,
      azimuth: hor.azimuth,
      visible: hor.altitude > 0,
    };
  }

  function normalize(v) {
    const len = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  function approximateSolarDeclination(date) {
    const start = Date.UTC(date.getUTCFullYear(), 0, 0);
    const day = (date.getTime() - start) / 86400000;
    return 23.44 * Math.sin((2 * Math.PI / 365.2422) * (day - 81));
  }

  function approximateSubsolarPoint(date) {
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    return { lat: approximateSolarDeclination(date), lng: normalizeLongitude(180 - hours * 15) };
  }

  // Converts UTC date into the subsolar point. This drives the visible
  // day/night orientation and falls back to a compact approximation if the
  // astronomy engine is unavailable.
  function subsolarPoint(date, astronomy) {
    if (astronomy) {
      const astroTime = new astronomy.AstroTime(date);
      const eq = astronomy.Equator(astronomy.Body.Sun, astroTime, new astronomy.Observer(0, 0, 0), true, true);
      const sidereal = astronomy.SiderealTime(astroTime);
      return { lat: eq.dec, lng: normalizeLongitude((eq.ra - sidereal) * 15) };
    }
    return approximateSubsolarPoint(date);
  }

  function phaseName(angle, lang) {
    const a = ((angle % 360) + 360) % 360;
    if (a < 22.5 || a >= 337.5) return lang === 'en' ? 'new moon' : 'luna nueva';
    if (a < 67.5) return lang === 'en' ? 'waxing crescent' : 'creciente';
    if (a < 112.5) return lang === 'en' ? 'first quarter' : 'cuarto creciente';
    if (a < 157.5) return lang === 'en' ? 'waxing gibbous' : 'gibosa creciente';
    if (a < 202.5) return lang === 'en' ? 'full moon' : 'luna llena';
    if (a < 247.5) return lang === 'en' ? 'waning gibbous' : 'gibosa menguante';
    if (a < 292.5) return lang === 'en' ? 'last quarter' : 'cuarto menguante';
    return lang === 'en' ? 'waning crescent' : 'menguante';
  }

  function fallbackContext(c, lang) {
    const dt = caseDateTime(c);
    const subsolar = subsolarPoint(dt.utc);
    return {
      available: false,
      date: dt.utc,
      precision: dt.precision,
      precisionLabel: precisionLabel(dt.precision, lang),
      timeNote: lang === 'en' ? dt.timeNoteEn : dt.timeNote,
      subsolar,
      sun: null,
      moon: null,
      planets: [],
      error: 'Astronomy Engine unavailable',
    };
  }

  function computeCaseContext(c, lang = 'es') {
    const A = window.Astronomy;
    if (!A) return fallbackContext(c, lang);

    const dt = caseDateTime(c);
    const astroTime = new A.AstroTime(dt.utc);
    const observer = new A.Observer(c.lat, c.lng, 0);
    const sun = horizon('Sun', astroTime, observer);
    const moon = horizon('Moon', astroTime, observer);
    const moonIllum = A.Illumination(A.Body.Moon, astroTime);
    const moonPhase = A.MoonPhase(astroTime);
    const sunGeo = A.GeoVector(A.Body.Sun, astroTime, true);
    const moonGeo = A.GeoVector(A.Body.Moon, astroTime, true);
    const sunVec = normalize(sunGeo);

    const planets = PLANETS.map(name => {
      const h = horizon(name, astroTime, observer);
      const gv = A.GeoVector(A.Body[name], astroTime, true);
      const hv = A.HelioVector(A.Body[name], astroTime);
      return {
        name,
        altitude: h.altitude,
        azimuth: h.azimuth,
        visible: h.visible,
        geo: { x: gv.x, y: gv.y, z: gv.z, dist: Math.hypot(gv.x, gv.y, gv.z) },
        helio: { x: hv.x, y: hv.y, z: hv.z },
      };
    });

    return {
      available: true,
      date: dt.utc,
      precision: dt.precision,
      precisionLabel: precisionLabel(dt.precision, lang),
      timeNote: lang === 'en' ? dt.timeNoteEn : dt.timeNote,
      subsolar: subsolarPoint(dt.utc, A),
      sun,
      sunVector: sunVec,
      sunGeo: { x: sunGeo.x, y: sunGeo.y, z: sunGeo.z, dist: Math.hypot(sunGeo.x, sunGeo.y, sunGeo.z) },
      moon: {
        ...moon,
        phaseAngle: moonPhase,
        illuminated: moonIllum.phase_fraction,
        phaseName: phaseName(moonPhase, lang),
        geo: { x: moonGeo.x, y: moonGeo.y, z: moonGeo.z, dist: Math.hypot(moonGeo.x, moonGeo.y, moonGeo.z) },
      },
      planets,
    };
  }

  window.UFOAstro = {
    PLANETS,
    caseDateTime,
    computeCaseContext,
  };
})();
