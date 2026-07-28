// Descarga el recuento de lanzamientos por año desde Launch Library 2 (LL2) y
// lo acumula en data/launches-per-year.json. Usa el campo `count` con limit=1
// (una petición ligera por año).
//
// LL2 anónimo está limitado a ~15 peticiones/hora, así que este script es
// REANUDABLE: guarda cada año al vuelo, salta los años ya presentes y, cuando
// LL2 empieza a devolver 429 de forma sostenida, guarda y sale limpio.
// Vuelve a ejecutarlo (`node tools/fetch-launch-history.js`) pasada ~1 h para
// continuar donde lo dejó, hasta completar 1957→año en curso.
const fs = require('fs');
const PATH = 'data/launches-per-year.json';
const BASE = 'https://ll.thespacedevs.com/2.2.0/launch/';
const FROM = 1957, TO = new Date().getUTCFullYear();
const sleep = ms => new Promise(r => setTimeout(r, ms));

function load() {
  try { return JSON.parse(fs.readFileSync(PATH, 'utf8')); }
  catch (e) { return { source: 'thespacedevs LL2', note: 'lanzamientos por año (count del endpoint launch)', byYear: {} }; }
}
function save(data) { data.generated = new Date().toISOString(); fs.writeFileSync(PATH, JSON.stringify(data)); }

async function countForYear(y) {
  const url = `${BASE}?net__gte=${y}-01-01T00:00:00Z&net__lte=${y}-12-31T23:59:59Z&limit=1`;
  const r = await fetch(url);
  if (r.status === 429) return '429';
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return (await r.json()).count;
}

(async () => {
  const data = load();
  let done = 0, throttled = 0;
  for (let y = FROM; y <= TO; y++) {
    if (data.byYear[y] != null) continue;              // ya lo tenemos → reanudar
    let c;
    try { c = await countForYear(y); }
    catch (e) { console.error(`  ${y}: ${e.message}`); await sleep(3000); continue; }
    if (c === '429') {
      if (++throttled >= 3) { console.log(`\n⏸ rate-limit de LL2 alcanzado. ${Object.keys(data.byYear).length} años guardados; re-ejecuta en ~1 h para continuar.`); break; }
      await sleep(5000); y--; continue;                // reintenta el mismo año un par de veces
    }
    throttled = 0;
    data.byYear[y] = c; save(data); done++;
    process.stdout.write(`${y}:${c}  `);
    await sleep(1300);
  }
  const total = Object.keys(data.byYear).length, need = TO - FROM + 1;
  console.log(`\n✓ ${PATH}: ${total}/${need} años (${done} nuevos esta vez)` + (total >= need ? ' — COMPLETO' : ''));
})();
