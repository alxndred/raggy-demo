'use strict';
(() => {

/* =====================================================================
   CELL DEFENDERS - an immune system roguelike
   ===================================================================== */

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};
const store = {
  get(k, d) { try { const v = localStorage.getItem('cd_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('cd_' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
};

/* ---------- art (all drawn with inline SVG) ---------- */
const svg = inner => `<svg viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;
const ST = 'stroke="rgba(0,0,0,.35)" stroke-width="3"';

function face(x1, x2, y, r, angry) {
  let s = `<circle cx="${x1}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#fff"/>` +
          `<circle cx="${x1 + 1}" cy="${y + 1}" r="${r * 0.5}" fill="#1b1030"/><circle cx="${x2 - 1}" cy="${y + 1}" r="${r * 0.5}" fill="#1b1030"/>`;
  if (angry) {
    s += `<path d="M${x1 - r} ${y - r - 3} L${x1 + r} ${y - r + 2}" stroke="#1b1030" stroke-width="3" stroke-linecap="round"/>` +
         `<path d="M${x2 + r} ${y - r - 3} L${x2 - r} ${y - r + 2}" stroke="#1b1030" stroke-width="3" stroke-linecap="round"/>`;
  }
  return s;
}

function pathogenSVG(shape, c) {
  let body = '', fc = '';
  switch (shape) {
    case 'rod':
      body = `<path d="M78 50 q6 -10 11 0 t11 0" fill="none" stroke="${c}" stroke-width="3"/><rect x="6" y="28" width="72" height="44" rx="22" fill="${c}" ${ST}/>`;
      fc = face(30, 54, 46, 6, true); break;
    case 'cocci':
      body = `<g fill="${c}" ${ST}><circle cx="34" cy="62" r="24"/><circle cx="66" cy="62" r="24"/><circle cx="50" cy="36" r="24"/></g>`;
      fc = face(41, 59, 52, 5.5, true); break;
    case 'virus': {
      let sp = '';
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        const x1 = 50 + Math.cos(a) * 27, y1 = 52 + Math.sin(a) * 27, x2 = 50 + Math.cos(a) * 39, y2 = 52 + Math.sin(a) * 39;
        sp += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="4"/><circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="4.5" fill="${c}"/>`;
      }
      body = sp + `<circle cx="50" cy="52" r="28" fill="${c}" ${ST}/>`;
      fc = face(41, 59, 50, 5, true); break;
    }
    case 'fungus':
      body = `<g fill="${c}" ${ST}><circle cx="24" cy="30" r="13"/><circle cx="80" cy="26" r="10"/><circle cx="50" cy="58" r="30"/></g>`;
      fc = face(40, 60, 54, 5.5, true); break;
    case 'worm':
      body = `<path d="M16 66 C24 14 76 14 84 66" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="32" stroke-linecap="round"/>` +
             `<path d="M16 66 C24 14 76 14 84 66" fill="none" stroke="${c}" stroke-width="26" stroke-linecap="round"/>`;
      fc = face(41, 59, 29, 5, true); break;
    default: // blob (rogue cell)
      body = `<path d="M50 12 C72 8 92 28 87 50 C94 72 72 94 50 87 C28 95 8 72 13 50 C7 28 30 8 50 12Z" fill="${c}" ${ST}/><circle cx="68" cy="68" r="8" fill="rgba(0,0,0,.18)"/><circle cx="30" cy="70" r="5" fill="rgba(0,0,0,.14)"/>`;
      fc = face(40, 60, 44, 6, true);
  }
  return svg(body + fc);
}

function cellSVG(id) {
  const f = `<circle cx="40" cy="62" r="5" fill="#fff"/><circle cx="60" cy="62" r="5" fill="#fff"/><circle cx="41" cy="63" r="2.6" fill="#1b1030"/><circle cx="61" cy="63" r="2.6" fill="#1b1030"/>` +
            `<path d="M43 73 Q50 79 57 73" fill="none" stroke="#1b1030" stroke-width="2.5" stroke-linecap="round"/>`;
  const ring = fill => `<circle cx="50" cy="52" r="38" fill="${fill}" stroke="rgba(0,0,0,.3)" stroke-width="3"/>`;
  const label = (t, col) => `<text x="50" y="41" text-anchor="middle" font-size="13" font-weight="700" fill="${col || '#fff'}" font-family="system-ui,sans-serif">${t}</text>`;
  switch (id) {
    case 'neutrophil':
      return svg(ring('#f1eafc') + `<g stroke="#8e6bd6" stroke-width="5"><line x1="36" y1="36" x2="52" y2="30"/><line x1="52" y1="30" x2="66" y2="40"/></g><g fill="#8e6bd6"><circle cx="36" cy="36" r="9"/><circle cx="52" cy="30" r="9"/><circle cx="66" cy="40" r="9"/></g>` + f);
    case 'macrophage':
      return svg(`<g fill="#ffe3c8" stroke="rgba(0,0,0,.3)" stroke-width="3"><circle cx="9" cy="34" r="8"/><circle cx="92" cy="30" r="8"/><circle cx="14" cy="80" r="8"/><circle cx="88" cy="82" r="8"/></g>` +
                 `<path d="M50 8 C74 6 94 24 92 50 C98 72 76 96 50 93 C24 97 4 72 8 50 C4 24 26 6 50 8Z" fill="#ffe3c8" stroke="rgba(0,0,0,.3)" stroke-width="3"/><ellipse cx="50" cy="34" rx="21" ry="11" fill="#b98ad1"/>` + f);
    case 'helperT':
      return svg(ring('#d3e6ff') + `<circle cx="50" cy="36" r="18" fill="#5f86e6"/>` + label('Th') + f);
    case 'killerT':
      return svg(ring('#ffd6d6') + `<circle cx="50" cy="36" r="18" fill="#d9534f"/>` + label('Tc') + f);
    case 'bcell':
      return svg(ring('#d7f5e2') + `<circle cx="50" cy="36" r="18" fill="#3fa56c"/>` + label('B') +
                 `<g fill="#2f8a57" font-family="system-ui,sans-serif" font-weight="700" font-size="16"><text x="8" y="26">Y</text><text x="82" y="26">Y</text><text x="84" y="84">Y</text></g>` + f);
    case 'nk':
      return svg(ring('#ffe8c4') + `<circle cx="50" cy="36" r="18" fill="#e39118"/><g fill="#8f4a00"><circle cx="42" cy="32" r="2.2"/><circle cx="56" cy="30" r="2.2"/><circle cx="50" cy="42" r="2.2"/><circle cx="60" cy="40" r="2.2"/></g>` + f);
    case 'eosinophil':
      return svg(ring('#ffdbed') + `<g fill="#7a5ad6"><circle cx="40" cy="34" r="11"/><circle cx="60" cy="34" r="11"/></g><g fill="#ff5c93"><circle cx="20" cy="50" r="3.2"/><circle cx="80" cy="50" r="3.2"/><circle cx="26" cy="74" r="3.2"/><circle cx="74" cy="74" r="3.2"/><circle cx="50" cy="88" r="3.2"/><circle cx="30" cy="30" r="3.2"/><circle cx="70" cy="22" r="3.2"/><circle cx="50" cy="16" r="3.2"/></g>` + f);
    case 'rbc':
      return svg(`<circle cx="50" cy="52" r="38" fill="#e5484d" stroke="rgba(0,0,0,.3)" stroke-width="3"/><ellipse cx="50" cy="34" rx="18" ry="9" fill="#b72f36"/>` + f);
    default: // platelet
      return svg(`<path d="M50 20 L68 26 L80 44 L76 68 L60 82 L38 80 L22 64 L24 40 L36 24Z" fill="#cdb4ff" stroke="rgba(0,0,0,.3)" stroke-width="3"/><g fill="#9b7ee0"><circle cx="40" cy="38" r="3"/><circle cx="62" cy="40" r="3"/></g>` + f);
  }
}

/* ---------- data: immune cells ---------- */
const CELLS = {
  neutrophil: {
    name: 'Neutrophil', role: 'First responder', hp: 24, atk: 5, strong: ['bacteria', 'fungus'],
    basic: 'Phagocytosis',
    sp: { name: 'NETs', cd: 3, target: 'allEnemies', text: 'Throws sticky DNA nets: 4 damage to every enemy.' },
    info: 'The most common white blood cell. Neutrophils rush to infections first, especially bacterial ones. They swallow microbes and can cast sticky nets made of DNA (called NETs) to trap them.'
  },
  macrophage: {
    name: 'Macrophage', role: 'Heavy eater & alarm', hp: 34, atk: 4, strong: ['bacteria'],
    basic: 'Engulf', basicNote: 'heals itself 2',
    sp: { name: 'Antigen presentation', cd: 3, target: 'allAllies', text: 'Shows the enemy to your team: all cells deal +40% damage for 2 turns.' },
    info: 'A big, long-lived eater that patrols your tissues. After swallowing a germ it displays pieces of it (antigens) on its surface, which is how it alerts T cells to what they must hunt.'
  },
  helperT: {
    name: 'Helper T cell', role: 'Coordinator', hp: 22, atk: 3, strong: [],
    basic: 'Poke',
    sp: { name: 'Cytokine signal', cd: 3, target: 'allAllies', text: 'Heals every cell for 3 and shortens all cooldowns by 1.' },
    info: 'The conductor of the immune orchestra. Helper T cells do not kill germs themselves. They release chemical messages (cytokines) that activate and energise other immune cells.'
  },
  killerT: {
    name: 'Killer T cell', role: 'Assassin', hp: 24, atk: 6, strong: ['virus', 'cancer'],
    basic: 'Slash',
    sp: { name: 'Perforin strike', cd: 3, target: 'enemy', text: 'Punches holes in one target: 12 damage.' },
    info: 'Cytotoxic T cells find your own cells that have been hijacked by viruses (or turned cancerous) and destroy them with proteins like perforin, which makes holes in the target.'
  },
  bcell: {
    name: 'B cell', role: 'Antibody factory', hp: 20, atk: 3, strong: ['virus'],
    basic: 'Antibody burst',
    sp: { name: 'Antibodies', cd: 3, target: 'enemy', text: 'Tags one enemy for 3 turns: it takes +50% damage and deals 30% less.' },
    info: 'B cells make antibodies, Y-shaped proteins that stick to one specific germ. Antibodies block viruses from entering cells and tag germs so other cells can destroy them.'
  },
  nk: {
    name: 'Natural Killer cell', role: 'Seek & destroy', hp: 26, atk: 5, strong: ['virus', 'cancer'],
    basic: 'Cytotoxic hit',
    sp: { name: 'Missing-self kill', cd: 3, target: 'enemy', text: 'Instantly destroys a non-boss enemy under 35% HP. Otherwise 6 damage (14 vs bosses).' },
    info: 'NK cells check other cells for a molecular ID tag. Cells missing it, which often means virus-infected or cancerous, get destroyed. They need no prior training, so they act fast.'
  },
  eosinophil: {
    name: 'Eosinophil', role: 'Parasite hunter', hp: 26, atk: 5, strong: ['parasite'],
    basic: 'Granule spray',
    sp: { name: 'Toxic granules', cd: 3, target: 'enemy', text: '8 damage and poison (2 per turn for 3 turns).' },
    info: 'Eosinophils are packed with granules full of toxic proteins. They are specialised for large parasites, such as worms, that are too big to swallow. They also play a role in allergies.'
  },
  rbc: {
    name: 'Red blood cell', role: 'Oxygen supplier', hp: 30, atk: 1, strong: [],
    basic: 'Bump',
    sp: { name: 'Oxygen delivery', cd: 2, target: 'ally', text: 'Heals one cell for 12 HP.' },
    info: 'Red blood cells are not fighters. They carry oxygen to every cell in your body, including every immune cell. No oxygen, no defence. Some germs, like malaria parasites, invade them.'
  },
  platelet: {
    name: 'Platelet', role: 'Wall builder', hp: 16, atk: 2, strong: [],
    basic: 'Jab',
    sp: { name: 'Clot barrier', cd: 3, target: 'allAllies', text: 'Gives every cell a 5-point shield for this turn.' },
    info: 'Tiny cell fragments that rush to a wound and clump together to form a plug, which stops bleeding and blocks germs from getting in. They also release signals that call immune cells.'
  }
};
const STARTERS = ['neutrophil', 'macrophage', 'rbc', 'platelet', 'nk'];

/* ---------- data: pathogens ---------- */
const KIND = {
  bacteria: { label: 'Bacteria', weak: 'Antibiotics, neutrophils, macrophages' },
  virus: { label: 'Virus', weak: 'Antivirals, killer T cells, NK cells, B cells' },
  fungus: { label: 'Fungus', weak: 'Antifungals, neutrophils' },
  parasite: { label: 'Parasite', weak: 'Antiparasitics, eosinophils' },
  cancer: { label: 'Rogue cell', weak: 'Killer T cells, NK cells, immunotherapy' }
};

const E = {
  staph: { name: 'Staphylococcus', kind: 'bacteria', shape: 'cocci', color: '#e6c84a', hp: 14, atk: 3, moves: [{ t: 'atk' }],
    fact: 'Staphylococcus aureus lives harmlessly on the skin of many people, but can cause infections when it gets into a cut. Neutrophils are the first immune cells to arrive.' },
  strep: { name: 'Streptococcus', kind: 'bacteria', shape: 'cocci', color: '#d98cc6', hp: 13, atk: 3, moves: [{ t: 'atk' }, { t: 'poison', m: 0.7 }],
    fact: 'Streptococcus bacteria cause strep throat and some skin infections. Some strains release toxins that damage tissue.' },
  mrsa: { name: 'MRSA', kind: 'bacteria', shape: 'cocci', color: '#c2453f', hp: 60, atk: 5, boss: true, resistAb: true,
    moves: [{ t: 'atk' }, { t: 'all', m: 0.5 }, { t: 'block', v: 10 }],
    fact: 'MRSA is a Staphylococcus that has evolved to resist many antibiotics. Using antibiotics when they are not needed lets resistant bacteria survive and spread. Its shield here stands for a biofilm, a slimy layer bacteria build for protection.' },
  rhino: { name: 'Rhinovirus', kind: 'virus', shape: 'virus', color: '#8fb4ff', hp: 15, atk: 3, moves: [{ t: 'atk' }, { t: 'rep' }],
    fact: 'Rhinoviruses cause most common colds. Viruses must get inside your cells to copy themselves, so antibiotics (which target bacteria) do nothing against them.' },
  flu: { name: 'Influenza virus', kind: 'virus', shape: 'virus', color: '#c58cff', hp: 20, atk: 4, moves: [{ t: 'atk' }, { t: 'atk' }, { t: 'rep' }],
    fact: 'Influenza viruses keep changing the proteins on their surface, which is why flu vaccines are updated every year.' },
  pneumo: { name: 'Pneumococcus', kind: 'bacteria', shape: 'cocci', color: '#7fd6a0', hp: 22, atk: 4, moves: [{ t: 'atk' }, { t: 'poison', m: 0.7 }],
    fact: 'Streptococcus pneumoniae can cause pneumonia, when bacteria and fluid fill the tiny air sacs of the lungs. A vaccine helps protect against it.' },
  panflu: { name: 'Pandemic Flu', kind: 'virus', shape: 'virus', color: '#9a4dff', hp: 80, atk: 6, boss: true,
    moves: [{ t: 'atk' }, { t: 'mut' }, { t: 'all', m: 0.6 }, { t: 'rep', id: 'flu' }],
    fact: 'When flu viruses swap genes or change a lot at once, almost nobody has immunity and a pandemic can start. Its Mutate move stands for this: it sheds your tags and recovers.' },
  ecoli: { name: 'E. coli', kind: 'bacteria', shape: 'rod', color: '#79c26a', hp: 24, atk: 5, moves: [{ t: 'atk' }],
    fact: 'Most E. coli strains are harmless gut residents. A few produce toxins that cause severe food poisoning.' },
  salmonella: { name: 'Salmonella', kind: 'bacteria', shape: 'rod', color: '#6ab7d8', hp: 26, atk: 4, moves: [{ t: 'poison', m: 0.8 }, { t: 'atk' }],
    fact: 'Salmonella usually comes from contaminated food. Stomach acid and the friendly bacteria in your gut are your first lines of defence against it.' },
  candida: { name: 'Candida', kind: 'fungus', shape: 'fungus', color: '#f0b45a', hp: 24, atk: 4, moves: [{ t: 'atk' }, { t: 'rep' }],
    fact: 'Candida is a yeast that normally lives in small numbers on and in your body. It can overgrow when the balance of microbes is disturbed, for example after antibiotics. It multiplies by budding.' },
  cdiff: { name: 'C. difficile', kind: 'bacteria', shape: 'rod', color: '#8c6a3f', hp: 90, atk: 6, boss: true,
    moves: [{ t: 'poison', m: 0.8 }, { t: 'all', m: 0.5 }, { t: 'atk' }],
    fact: 'C. difficile thrives when antibiotics wipe out the friendly gut bacteria that normally keep it in check. That is why this boss is tougher the more antibiotics you used.' },
  plasmodium: { name: 'Plasmodium', kind: 'parasite', shape: 'worm', color: '#3fc1b0', hp: 30, atk: 5, pref: 'rbc', moves: [{ t: 'drain' }, { t: 'atk' }],
    fact: 'Plasmodium parasites cause malaria. They are spread by mosquito bites, invade red blood cells, multiply inside them and burst them open.' },
  meningo: { name: 'Meningococcus', kind: 'bacteria', shape: 'cocci', color: '#d6786f', hp: 28, atk: 6, moves: [{ t: 'atk' }, { t: 'all', m: 0.5 }],
    fact: 'Neisseria meningitidis can cause meningitis and blood poisoning. Bacteria in the bloodstream are dangerous because they can spread everywhere fast. Vaccines exist for common types.' },
  hiv: { name: 'HIV', kind: 'virus', shape: 'virus', color: '#e07bd0', hp: 32, atk: 5, pref: 'helperT', moves: [{ t: 'atk' }, { t: 'rep' }],
    fact: 'HIV infects helper T cells, the coordinators of the immune system. Without enough of them, the whole defence loses its organiser. Modern antiviral treatment keeps the virus under control.' },
  falciparum: { name: 'Malaria Swarm', kind: 'parasite', shape: 'worm', color: '#1f9e8f', hp: 110, atk: 7, boss: true, pref: 'rbc',
    moves: [{ t: 'drain' }, { t: 'all', m: 0.5 }, { t: 'rep', id: 'plasmodium' }, { t: 'block', v: 10 }],
    fact: 'Plasmodium falciparum is the deadliest malaria parasite. It hides inside red blood cells, where many immune defences cannot easily reach it.' },
  hepatitis: { name: 'Hepatitis virus', kind: 'virus', shape: 'virus', color: '#e5c35c', hp: 36, atk: 6, moves: [{ t: 'atk' }, { t: 'rep' }],
    fact: 'Hepatitis viruses infect liver cells and cause inflammation of the liver. A vaccine protects against hepatitis B.' },
  tumor: { name: 'Rogue cell', kind: 'cancer', shape: 'blob', color: '#ff8fc0', hp: 34, atk: 5, moves: [{ t: 'atk' }, { t: 'rep' }],
    fact: 'Cancer cells are your own cells that grow out of control. NK cells and killer T cells constantly patrol and destroy many of them before you ever notice. This is called immune surveillance.' },
  fluke: { name: 'Liver fluke', kind: 'parasite', shape: 'worm', color: '#9c7bd0', hp: 38, atk: 6, moves: [{ t: 'drain' }, { t: 'atk' }],
    fact: 'Flukes are parasitic flatworms that can live in the liver. They are far too large to swallow, so eosinophils attack them by spraying toxic granules.' },
  malignant: { name: 'Malignant Tumor', kind: 'cancer', shape: 'blob', color: '#d94a8c', hp: 130, atk: 8, boss: true, camo: true,
    moves: [{ t: 'atk' }, { t: 'rep', id: 'tumor' }, { t: 'block', v: 12 }, { t: 'all', m: 0.6 }],
    fact: 'Some tumors hide from the immune system by showing off signals that say do not attack me. Checkpoint-inhibitor drugs block those signals so T cells can see the tumor again. Only NK and killer T cells hurt this boss at full strength, unless you use immunotherapy.' }
};

const REGIONS = [
  { name: 'Skin', tag: 'The outer wall', text: 'A scrape has broken the skin barrier. Bacteria from the surface are slipping inside.', pool: ['staph', 'strep', 'staph'], boss: 'mrsa' },
  { name: 'Airways', tag: 'Nose, throat and lungs', text: 'Mucus and tiny hairs trap most germs, but some slip past. Viruses and lung bacteria move in.', pool: ['rhino', 'flu', 'pneumo'], boss: 'panflu' },
  { name: 'Gut', tag: 'Home of friendly bacteria', text: 'Your gut hosts trillions of helpful microbes, and a few unwelcome guests.', pool: ['ecoli', 'salmonella', 'candida'], boss: 'cdiff' },
  { name: 'Bloodstream', tag: 'The highway', text: 'Blood carries oxygen to every cell, and it carries invaders everywhere too.', pool: ['plasmodium', 'meningo', 'hiv'], boss: 'falciparum' },
  { name: 'Liver', tag: 'The body\u2019s filter', text: 'The liver cleans the blood, which makes it a target for viruses, parasites and rogue cells.', pool: ['hepatitis', 'tumor', 'fluke'], boss: 'malignant' }
];

/* ---------- data: medicines (single-use, free action) ---------- */
const MEDS = {
  antibiotic: {
    name: 'Antibiotic', icon: '\u{1F48A}', w: 3,
    text: '12 damage to every bacterium. Does nothing to viruses, fungi or parasites. Each use raises the risk that bacteria resist it.',
    note: 'Antibiotics kill bacteria or stop them growing. They do not work on viruses. Every time they are used, resistant bacteria get a chance to survive and multiply, so they should only be used when needed.',
    use() {
      const t = foes().filter(e => e.kind === 'bacteria');
      if (!t.length) { say('Antibiotics only work on bacteria, and there are none here. Viruses, fungi and parasites are different kinds of life, so they ignore them.'); return false; }
      const risk = Math.min(0.6, 0.2 * run.abUses);
      run.abUses++;
      for (const e of t) {
        if (e.resistAb || Math.random() < risk) fx(eid(e), 'Resistant!', 'muted');
        else hurtEnemy(e, 12);
      }
      say('Antibiotics flood the area. Resistant bacteria shrug them off.');
      return true;
    }
  },
  antiviral: {
    name: 'Antiviral', icon: '\u{1F9EA}', w: 3,
    text: '12 damage to every virus. Does nothing to other enemies.',
    note: 'Antivirals block specific steps a virus needs to copy itself inside our cells. Each one only works on certain viruses.',
    use() {
      const t = foes().filter(e => e.kind === 'virus');
      if (!t.length) { say('There are no viruses here. Antivirals only work on viruses.'); return false; }
      for (const e of t) hurtEnemy(e, 12);
      say('Antivirals interrupt the viruses from copying themselves.');
      return true;
    }
  },
  antifungal: {
    name: 'Antifungal', icon: '\u{1F344}', w: 2,
    text: '14 damage to every fungus. Does nothing to other enemies.',
    note: 'Fungi are more closely related to us than bacteria are, so drugs that kill them must be chosen carefully to avoid harming our own cells.',
    use() {
      const t = foes().filter(e => e.kind === 'fungus');
      if (!t.length) { say('There are no fungi here. Antifungals only work on fungi.'); return false; }
      for (const e of t) hurtEnemy(e, 14);
      say('Antifungals damage the fungal cell walls.');
      return true;
    }
  },
  antiparasitic: {
    name: 'Antiparasitic', icon: '\u{1FAB1}', w: 2,
    text: '14 damage to every parasite. Does nothing to other enemies.',
    note: 'Antiparasitic drugs, like those against malaria and worms, target biology that parasites have but we do not.',
    use() {
      const t = foes().filter(e => e.kind === 'parasite');
      if (!t.length) { say('There are no parasites here. Antiparasitic drugs only work on parasites.'); return false; }
      for (const e of t) hurtEnemy(e, 14);
      say('The parasites are poisoned.');
      return true;
    }
  },
  ibuprofen: {
    name: 'Anti-inflammatory', icon: '\u{1F9CA}', w: 3,
    text: 'Heals every cell for 6 and cures poison.',
    note: 'Inflammation helps fight germs but can also damage healthy tissue. Anti-inflammatory drugs such as ibuprofen calm it down and ease pain and swelling.',
    use() {
      const a = alive();
      if (!a.some(x => x.hp < maxHp(x) || x.poison)) { say('Everyone is healthy and unpoisoned. Save it for later.'); return false; }
      for (const x of a) { heal(x, 6); x.poison = null; }
      say('Swelling goes down and your cells recover.');
      return true;
    }
  },
  immuno: {
    name: 'Immunotherapy', icon: '\u{1F3AF}', w: 1,
    text: 'Removes enemy camouflage and tags every enemy for 3 turns (+50% damage taken, -30% damage dealt).',
    note: 'Immunotherapy drugs help the immune system recognise and attack threats it was missing, such as tumors that hide behind do not attack me signals.',
    use() {
      for (const e of foes()) { e.camo = false; e.mark = 3; fx(eid(e), 'Exposed!', 'good'); }
      say('The enemies lose their disguise and are tagged for destruction.');
      return true;
    }
  }
};

/* ---------- data: relics (permanent boosts) ---------- */
const RELICS = {
  vaccine: { name: 'Vaccination', icon: '\u{1F489}',
    text: 'Pathogens you have already defeated this run start fights with 30% less HP.',
    note: 'A vaccine shows your immune system a harmless piece of a germ so that it remembers it and can respond much faster later.' },
  memory: { name: 'Memory Cells', icon: '\u{1F9E0}',
    text: 'Special abilities recharge 1 turn faster (minimum 2).',
    note: 'After an infection, some B and T cells stay behind as memory cells that react faster the next time.' },
  vitc: { name: 'Vitamin C', icon: '\u{1F34A}',
    text: '+8 max HP for every cell.',
    note: 'A well-fed body makes healthy immune cells. Vitamin C supports many immune functions, but it does not stop every cold.' },
  sleep: { name: 'Good Night\u2019s Sleep', icon: '\u{1F634}',
    text: 'After each fight, every cell heals 25% of its max HP.',
    note: 'During sleep the body releases cytokines and strengthens immune memory. People who sleep badly get sick more easily.' },
  diet: { name: 'Balanced Diet', icon: '\u{1F957}',
    text: '+1 attack for every cell.',
    note: 'Protein, vitamins and minerals give your body the building blocks it needs for immune cells and antibodies.' },
  fever: { name: 'Fever Response', icon: '\u{1F321}\uFE0F',
    text: '+25% damage against bacteria and viruses, but every cell loses 2 HP at the start of each fight.',
    note: 'A fever is not the illness but part of the defence. Many germs multiply more slowly when it is warmer, while immune cells work faster.' },
  probiotics: { name: 'Gut Flora', icon: '\u{1F9AB}',
    text: 'Every cell heals 2 HP at the start of each turn.',
    note: 'Friendly gut bacteria help train the immune system and crowd out harmful germs.' },
  hygiene: { name: 'Hand Washing', icon: '\u{1F9FC}',
    text: 'Enemies deal 1 less damage per hit (minimum 1).',
    note: 'Washing your hands removes germs before they ever get in. It is one of the cheapest health boosts there is.' }
};

/* ---------- state ---------- */
const MAXMEDS = 5, MAXSQUAD = 5;
const game = $('#game');
let screen = 'title';
let run = null;
let combat = null;
let mapState = null;
let rewardState = null;
let labOptions = [];
let startPick = [];
let codexTab = 'cells';
let pendingFx = [];
let uid = 0;

const hasRelic = id => !!run && run.relics.includes(id);
const maxHp = a => CELLS[a.id].hp + a.trainHp + (hasRelic('vitc') ? 8 : 0);
const atkOf = a => CELLS[a.id].atk + a.trainAtk + (hasRelic('diet') ? 1 : 0);
const alive = () => run.squad.filter(a => !a.dead);
const foes = () => combat.enemies.filter(e => e.hp > 0);
const aid = a => 'a' + run.squad.indexOf(a);
const eid = e => 'e' + e.uid;

function makeAlly(id) {
  const a = { id, trainAtk: 0, trainHp: 0, hp: 0, cd: 0, acted: false, shield: 0, buff: null, poison: null, dead: false };
  a.hp = maxHp(a);
  return a;
}

function newRun(ids) {
  run = { region: 0, step: 0, squad: [], meds: [], relics: [], abUses: 0, seen: [], facts: [], fights: 0, cleared: 0 };
  run.squad = ids.map(makeAlly);
}

function gainRelic(id) {
  run.relics.push(id);
  if (id === 'vitc') for (const a of run.squad) a.hp += 8;
}

function medPool() { return Object.keys(MEDS).flatMap(k => Array(MEDS[k].w).fill(k)); }
function pickMeds(n) {
  const out = [];
  let pool = medPool();
  while (out.length < n && pool.length) {
    const m = pick(pool);
    out.push(m);
    pool = pool.filter(x => x !== m);
  }
  return out;
}

/* ---------- map ---------- */
function genEncounter(r, step, elite) {
  const R = REGIONS[r];
  if (elite) return [pick(R.pool), pick(R.pool)];
  const n = 2 + (step > 0 ? 1 : 0) + (r >= 3 ? 1 : 0);
  return Array.from({ length: n }, () => pick(R.pool));
}

function genChoices() {
  const r = run.region, s = run.step;
  if (s === 2) return [{ type: 'boss', enemies: [REGIONS[r].boss] }];
  const bag = (r === 0 && s === 0) ? ['fight', 'fight', 'lab', 'rest'] : ['fight', 'fight', 'fight', 'rest', 'lab', 'elite'];
  let types;
  do { types = [pick(bag), pick(bag)]; }
  while (types.every(t => t === 'rest' || t === 'lab') || (types[0] === types[1] && types[0] !== 'fight'));
  return types.map(t => ({ type: t, enemies: (t === 'fight' || t === 'elite') ? genEncounter(r, s, t === 'elite') : null }));
}

function finishNode() {
  run.step++;
  if (run.step > 2) {
    run.step = 0;
    run.region++;
    run.cleared++;
    if (run.region >= REGIONS.length) { endRun(true); return; }
  }
  mapState = genChoices();
  screen = 'map';
  render();
}

function chooseNode(i) {
  const n = mapState[i];
  if (!n) return;
  if (n.type === 'rest') { screen = 'rest'; render(); }
  else if (n.type === 'lab') { labOptions = pickMeds(3); screen = 'lab'; render(); }
  else startCombat(n);
}

function endRun(won) {
  const best = store.get('best', { cleared: 0, wins: 0 });
  best.cleared = Math.max(best.cleared, run.cleared);
  if (won) best.wins++;
  store.set('best', best);
  screen = 'over';
  rewardState = { won };
  render();
}

/* ---------- combat ---------- */
function makeEnemy(id, elite) {
  const d = E[id];
  let hp = d.hp, atk = d.atk;
  hp = Math.round(hp * (1 + 0.07 * run.region) * (d.boss ? 1.08 : 1.05));
  atk += Math.floor(run.region / 2);
  if (elite) { hp = Math.round(hp * 1.7); atk += 1; }
  if (id === 'cdiff') hp += 12 * run.abUses;
  if (!d.boss && hasRelic('vaccine') && run.seen.includes(id)) hp = Math.ceil(hp * 0.7);
  return {
    uid: ++uid, id, name: (elite ? 'Elite ' : '') + d.name, kind: d.kind, shape: d.shape, color: d.color,
    boss: !!d.boss, camo: !!d.camo, resistAb: !!d.resistAb, pref: d.pref || null, moves: d.moves,
    hp, maxHp: hp, atk, elite: !!elite, block: 0, mark: 0, poison: null, intent: null, moveIdx: 0
  };
}

function startCombat(node) {
  const enemies = node.enemies.map((id, i) => makeEnemy(id, node.type === 'elite' && i === 0));
  for (const a of run.squad) {
    a.cd = 0; a.acted = false; a.shield = 0; a.buff = null; a.poison = null; a.dead = false;
    if (hasRelic('fever')) a.hp = Math.max(1, a.hp - 2);
  }
  combat = { enemies, turn: 0, sel: null, mode: null, busy: false, ended: false, node, msg: '', killed: [] };
  screen = 'combat';
  pendingFx = [];
  beginPlayerTurn(true);
  say(node.type === 'boss' ? 'A boss appears! Read its moves carefully.' : 'Pick a cell, choose an action, then pick a target.');
  render();
}

function pickTarget(e) {
  const al = alive();
  return (e.pref && al.find(a => a.id === e.pref)) || pick(al);
}

function chooseIntent(e) {
  let m = e.moves[e.moveIdx % e.moves.length];
  e.moveIdx++;
  if (m.t === 'rep' && foes().length >= (e.boss ? 6 : 4)) m = { t: 'atk' };
  const it = Object.assign({}, m);
  if (it.t === 'atk' || it.t === 'poison' || it.t === 'drain') it.target = pickTarget(e);
  e.intent = it;
}

function enemyDmg(e, it) {
  return Math.max(1, Math.round(e.atk * (it.m || 1) * (e.mark > 0 ? 0.7 : 1)) - (hasRelic('hygiene') ? 1 : 0));
}

function intentText(e) {
  const it = e.intent;
  if (!it || e.hp <= 0) return '';
  const d = enemyDmg(e, it);
  const tn = it.target ? (it.target.dead ? 'a cell' : CELLS[it.target.id].name) : '';
  switch (it.t) {
    case 'atk': return `\u2694 ${d} \u2192 ${tn}`;
    case 'all': return `\u2694 ${d} to all`;
    case 'poison': return `\u2620 ${d} + poison \u2192 ${tn}`;
    case 'drain': return `\u{1FA78} ${d} drain \u2192 ${tn}`;
    case 'rep': return 'Multiplies';
    case 'block': return `\u{1F6E1} Shield +${it.v}`;
    case 'mut': return 'Mutates';
    default: return '';
  }
}

function beginPlayerTurn(first) {
  combat.enemies = combat.enemies.filter(e => e.hp > 0);
  combat.turn++;
  for (const a of alive()) {
    a.acted = false; a.shield = 0;
    if (!first && a.cd > 0) a.cd--;
    if (hasRelic('probiotics')) heal(a, 2);
  }
  for (const e of foes()) chooseIntent(e);
  combat.sel = run.squad.findIndex(a => !a.dead);
  combat.mode = null;
  if (!first) say('Your turn.');
}

function say(t) {
  if (combat) combat.msg = t;
  const m = $('#msg');
  if (m) m.textContent = t;
}

function fx(id, text, cls) { pendingFx.push({ id, text, cls }); }

function flushFx() {
  const layer = $('#fx');
  let n = 0;
  for (const f of pendingFx) {
    const el = document.querySelector(`[data-id="${f.id}"]`);
    if (!el || !layer) continue;
    const r = el.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'float ' + (f.cls || '');
    s.textContent = f.text;
    s.style.left = (r.left + r.width / 2 + (n % 2 ? 22 : -22) * (n ? 1 : 0)) + 'px';
    s.style.top = (r.top + r.height * 0.28 - (n * 6)) + 'px';
    s.style.animationDelay = (n * 0.12) + 's';
    layer.appendChild(s);
    setTimeout(() => s.remove(), 1400);
    if (f.cls === 'dmg') el.classList.add('hit');
    n++;
  }
  pendingFx = [];
}

function heal(a, n, quiet) {
  if (a.dead) return;
  const h = Math.min(n, maxHp(a) - a.hp);
  if (h > 0) { a.hp += h; if (!quiet) fx(aid(a), '+' + h, 'heal'); }
}

function hurtAlly(a, d, pierce) {
  if (a.dead) return 0;
  if (!pierce && a.shield > 0) {
    const s = Math.min(a.shield, d);
    a.shield -= s; d -= s;
    if (s) fx(aid(a), '\u{1F6E1}' + s, 'blk');
  }
  if (d > 0) {
    a.hp = Math.max(0, a.hp - d);
    fx(aid(a), '-' + d, 'dmg');
    if (a.hp <= 0) { a.dead = true; fx(aid(a), 'Down', 'muted'); }
  }
  return d;
}

function onKill(e) {
  fx(eid(e), 'Defeated', 'good');
  combat.killed.push(e.id);
  if (!run.seen.includes(e.id)) run.seen.push(e.id);
  const cx = store.get('codex', {});
  if (!cx[e.id]) { cx[e.id] = 1; store.set('codex', cx); }
}

function hurtEnemy(e, d) {
  if (e.hp <= 0) return 0;
  if (e.block > 0) {
    const b = Math.min(e.block, d);
    e.block -= b; d -= b;
    if (b) fx(eid(e), '\u{1F6E1}' + b, 'blk');
  }
  if (d > 0) {
    e.hp = Math.max(0, e.hp - d);
    fx(eid(e), '-' + d, 'dmg');
    if (e.hp <= 0) onKill(e);
  }
  return d;
}

function dotEnemy(e, d) {
  if (e.hp <= 0) return;
  e.hp = Math.max(0, e.hp - d);
  fx(eid(e), '-' + d, 'dmg');
  if (e.hp <= 0) onKill(e);
}

function dmgTo(a, e, base) {
  let m = 1;
  if (CELLS[a.id].strong.includes(e.kind)) m *= 1.5;
  if (a.buff) m *= a.buff.mult;
  if (e.mark > 0) m *= 1.5;
  if (hasRelic('fever') && (e.kind === 'bacteria' || e.kind === 'virus')) m *= 1.25;
  if (e.camo && a.id !== 'nk' && a.id !== 'killerT') m *= 0.5;
  return Math.max(1, Math.round(base * m));
}

function special(a, t) {
  const nm = CELLS[a.id].name;
  switch (a.id) {
    case 'neutrophil':
      for (const e of foes()) hurtEnemy(e, dmgTo(a, e, 4));
      say(`${nm} casts NETs: sticky DNA nets hit every enemy.`); break;
    case 'macrophage':
      for (const x of alive()) x.buff = { mult: 1.4, turns: 2 };
      for (const x of alive()) fx(aid(x), '+40% dmg', 'good');
      say(`${nm} presents the enemy\u2019s antigens. Your team deals +40% damage for 2 turns.`); break;
    case 'helperT':
      for (const x of alive()) { if (x !== a) x.cd = Math.max(0, x.cd - 1); heal(x, 3); }
      say(`${nm} releases cytokines: everyone heals and recharges faster.`); break;
    case 'killerT':
      hurtEnemy(t, dmgTo(a, t, 12));
      say(`${nm} drills holes into ${t.name} with perforin.`); break;
    case 'bcell':
      t.mark = 3; fx(eid(t), 'Tagged', 'good');
      say(`${nm}\u2019s antibodies stick to ${t.name}. It takes more damage and hits weaker.`); break;
    case 'nk':
      if (!t.boss && t.hp <= Math.ceil(t.maxHp * 0.35)) {
        hurtEnemy(t, t.hp + t.block);
        say(`${nm} detects the missing ID tag and destroys ${t.name}.`);
      } else {
        hurtEnemy(t, dmgTo(a, t, t.boss ? 14 : 6));
        say(`${nm} strikes ${t.name}. It will finish weakened targets instantly.`);
      }
      break;
    case 'eosinophil':
      hurtEnemy(t, dmgTo(a, t, 8));
      if (t.hp > 0) t.poison = { d: 2, turns: 3 };
      say(`${nm} sprays toxic granules on ${t.name}.`); break;
    case 'rbc':
      heal(t, 12);
      say(`${nm} delivers oxygen to ${CELLS[t.id].name}.`); break;
    case 'platelet':
      for (const x of alive()) { x.shield += 5; fx(aid(x), '\u{1F6E1}5', 'blk'); }
      say(`${nm}s clump together into a protective barrier.`); break;
  }
}

function resolve(a, kind, t) {
  const def = CELLS[a.id];
  if (kind === 'attack') {
    hurtEnemy(t, dmgTo(a, t, atkOf(a)));
    if (a.id === 'macrophage') heal(a, 2);
    say(`${def.name} uses ${def.basic} on ${t.name}.`);
  } else {
    special(a, t);
    a.cd = Math.max(2, def.sp.cd - (hasRelic('memory') ? 1 : 0));
  }
  if (t && t.kind) {
    if (def.strong.includes(t.kind)) fx(eid(t), 'Effective!', 'good');
    else if (t.camo && a.id !== 'nk' && a.id !== 'killerT') fx(eid(t), 'Camouflaged', 'muted');
  }
  a.acted = true;
  combat.mode = null;
  afterAction();
}

function afterAction() {
  if (foes().length === 0) { winCombat(); render(); return; }
  const cur = combat.sel != null ? run.squad[combat.sel] : null;
  if (!cur || cur.dead || cur.acted) {
    const nxt = run.squad.findIndex(x => !x.dead && !x.acted);
    combat.sel = nxt >= 0 ? nxt : null;
  }
  render();
}

function chooseAction(kind) {
  if (!combat || combat.busy || combat.ended) return;
  const a = combat.sel != null ? run.squad[combat.sel] : null;
  if (!a || a.dead || a.acted) return;
  const d = CELLS[a.id];
  if (kind === 'attack') {
    const f = foes();
    if (f.length === 1) resolve(a, 'attack', f[0]);
    else { combat.mode = 'attack'; render(); }
    return;
  }
  if (a.cd > 0) return;
  const tt = d.sp.target;
  if (tt === 'enemy') {
    const f = foes();
    if (f.length === 1) resolve(a, 'special', f[0]);
    else { combat.mode = 'special'; render(); }
  } else if (tt === 'ally') {
    const al = alive();
    if (al.length === 1) resolve(a, 'special', al[0]);
    else { combat.mode = 'special'; render(); }
  } else {
    resolve(a, 'special', null);
  }
}

function clickAlly(i) {
  if (!combat || combat.busy || combat.ended) return;
  const a = run.squad[i];
  const sel = combat.sel != null ? run.squad[combat.sel] : null;
  if (combat.mode === 'special' && sel && CELLS[sel.id].sp.target === 'ally') {
    if (!a.dead) resolve(sel, 'special', a);
    return;
  }
  if (a.dead) return;
  combat.sel = i; combat.mode = null;
  render();
}

function clickEnemy(i) {
  if (!combat || combat.busy || combat.ended || !combat.mode) return;
  const a = combat.sel != null ? run.squad[combat.sel] : null;
  const e = combat.enemies[i];
  if (!a || !e || e.hp <= 0) return;
  const needsEnemy = combat.mode === 'attack' || CELLS[a.id].sp.target === 'enemy';
  if (needsEnemy) resolve(a, combat.mode, e);
}

function useMed(i) {
  if (!combat || combat.busy || combat.ended) return;
  const id = run.meds[i];
  if (!id) return;
  if (!MEDS[id].use()) { render(); return; }
  run.meds.splice(i, 1);
  afterAction();
}

function enemyAct(e) {
  const m = e.intent;
  if (!m) return;
  let t = m.target;
  if (t && t.dead) t = alive()[0] ? pick(alive()) : null;
  switch (m.t) {
    case 'atk': if (t) hurtAlly(t, enemyDmg(e, m)); break;
    case 'all': for (const a of alive()) hurtAlly(a, enemyDmg(e, m)); break;
    case 'poison':
      if (t) { hurtAlly(t, enemyDmg(e, m)); if (!t.dead) { t.poison = { d: Math.max(1, Math.round(e.atk * 0.3)), turns: 3 }; fx(aid(t), 'Poisoned', 'muted'); } }
      break;
    case 'drain':
      if (t) {
        const dealt = hurtAlly(t, enemyDmg(e, m));
        const h = Math.min(Math.ceil(dealt / 2), e.maxHp - e.hp);
        if (h > 0) { e.hp += h; fx(eid(e), '+' + h, 'heal'); }
      }
      break;
    case 'rep': {
      const id = m.id || e.id;
      const c = makeEnemy(id, false);
      c.hp = c.maxHp = Math.max(6, Math.ceil(c.maxHp / 2));
      combat.enemies.push(c);
      break;
    }
    case 'block': e.block += m.v; fx(eid(e), '\u{1F6E1}' + m.v, 'blk'); break;
    case 'mut': {
      e.mark = 0;
      const h = Math.min(Math.round(e.maxHp * 0.1), e.maxHp - e.hp);
      e.hp += h; fx(eid(e), 'Mutated!', 'muted'); break;
    }
  }
  e.intent = null;
}

async function endTurn() {
  if (!combat || combat.busy || combat.ended) return;
  combat.busy = true; combat.sel = null; combat.mode = null;
  say('The pathogens strike back\u2026');
  render();
  await sleep(350);
  for (const e of combat.enemies.slice()) {
    if (e.hp <= 0) continue;
    e.block = 0;
    const el = document.querySelector(`[data-id="e${e.uid}"]`);
    if (el) el.classList.add('acting');
    await sleep(420);
    enemyAct(e);
    render();
    await sleep(520);
    if (alive().length === 0) { lose(); return; }
  }
  for (const a of alive()) {
    if (a.poison) { hurtAlly(a, a.poison.d, true); a.poison.turns--; if (a.poison.turns <= 0) a.poison = null; }
    if (a.buff) { a.buff.turns--; if (a.buff.turns <= 0) a.buff = null; }
  }
  for (const e of foes()) {
    if (e.poison) { dotEnemy(e, e.poison.d); e.poison.turns--; if (e.poison.turns <= 0) e.poison = null; }
    if (e.mark > 0) e.mark--;
  }
  render();
  await sleep(450);
  if (alive().length === 0) { lose(); return; }
  if (foes().length === 0) { winCombat(); return; }
  combat.busy = false;
  beginPlayerTurn();
  render();
}

async function lose() {
  combat.busy = true; combat.ended = true;
  say('Every cell has fallen\u2026');
  render();
  await sleep(1000);
  endRun(false);
}

async function winCombat() {
  combat.busy = true; combat.ended = true;
  say('All pathogens defeated!');
  await sleep(750);
  const node = combat.node;
  for (const a of run.squad) {
    if (a.dead) { a.dead = false; a.hp = Math.max(1, Math.round(maxHp(a) * 0.35)); }
    else heal(a, Math.round(maxHp(a) * (node.type === 'boss' ? 0.3 : 0.1)), true);
    if (hasRelic('sleep')) heal(a, Math.round(maxHp(a) * 0.25), true);
    a.cd = 0; a.acted = false; a.shield = 0; a.buff = null; a.poison = null;
  }
  run.fights++;
  const kinds = [...new Set(combat.killed)];
  const fid = pick(kinds);
  const fact = fid ? E[fid].fact : '';
  if (fid && !run.facts.includes(fid)) run.facts.push(fid);
  for (const k of kinds) if (!run.facts.includes(k)) run.facts.push(k);
  rewardState = { options: genRewards(node.type), node, fact, won: true };
  combat = null;
  pendingFx = [];
  screen = 'reward';
  render();
}

/* ---------- rewards ---------- */
function genRewards(type) {
  const pool = [];
  const free = Object.keys(CELLS).filter(id => !run.squad.some(a => a.id === id));
  if (run.squad.length < MAXSQUAD && free.length) pool.push({ kind: 'cell', id: pick(free) });
  const rel = Object.keys(RELICS).filter(id => !hasRelic(id));
  if (rel.length) pool.push({ kind: 'relic', id: pick(rel) });
  for (const m of pickMeds(2)) pool.push({ kind: 'med', id: m });
  pool.push({ kind: 'train' });
  let opts = shuffle(pool).slice(0, 3);
  if (type !== 'fight') {
    const r = pool.find(o => o.kind === 'relic');
    if (r && !opts.includes(r)) opts[2] = r;
  }
  return opts;
}

function takeReward(i) {
  const o = rewardState.options[i];
  if (!o) return;
  if (o.kind === 'cell') { if (run.squad.length >= MAXSQUAD) return; run.squad.push(makeAlly(o.id)); finishNode(); }
  else if (o.kind === 'relic') { gainRelic(o.id); finishNode(); }
  else if (o.kind === 'med') { if (run.meds.length >= MAXMEDS) return; run.meds.push(o.id); finishNode(); }
  else { screen = 'train'; render(); }
}

function doTrain(i) {
  const a = run.squad[i];
  if (!a) return;
  a.trainAtk += 2; a.trainHp += 6; a.hp += 6;
  finishNode();
}

/* ---------- views ---------- */
function statusBar() {
  const squad = run.squad.map(a => `<span class="mini" title="${CELLS[a.id].name}"><span style="width:26px;height:26px;display:block">${cellSVG(a.id)}</span>${a.hp}/${maxHp(a)}</span>`).join('');
  const meds = run.meds.length
    ? run.meds.map(id => `<span class="chip" title="${MEDS[id].text}">${MEDS[id].icon} ${MEDS[id].name}</span>`).join('')
    : '<span class="muted">none</span>';
  const rel = run.relics.length
    ? run.relics.map(id => `<span class="chip" title="${RELICS[id].text}">${RELICS[id].icon} ${RELICS[id].name}</span>`).join('')
    : '<span class="muted">none</span>';
  return `<div class="status panel">
    <div class="line"><span class="label">Squad</span>${squad}</div>
    <div class="line"><span class="label">Medicines</span>${meds}<span class="muted">(${run.meds.length}/${MAXMEDS}, used in fights)</span></div>
    <div class="line"><span class="label">Boosts</span>${rel}</div>
  </div>`;
}

function enemyChips(n) {
  return n.enemies.map((id, i) => {
    const d = E[id];
    return `<span class="chip k-${d.kind}">${(n.type === 'elite' && i === 0) ? 'Elite ' : ''}${d.name}</span>`;
  }).join('');
}

function nodeCard(n, i) {
  let tag, title, body;
  switch (n.type) {
    case 'fight': tag = '<span class="tag">Fight</span>'; title = 'Skirmish'; body = `<div class="chips">${enemyChips(n)}</div><p class="muted">Reward: a cell, medicine, boost or training.</p>`; break;
    case 'elite': tag = '<span class="tag elite">Elite</span>'; title = 'Tough fight'; body = `<div class="chips">${enemyChips(n)}</div><p class="muted">Harder, but always offers a permanent boost.</p>`; break;
    case 'boss': tag = '<span class="tag boss">Boss</span>'; title = E[n.enemies[0]].name; body = `<div class="chips">${enemyChips(n)}</div><p class="muted">Clear it to move on to the next region.</p>`; break;
    case 'rest': tag = '<span class="tag good">Rest</span>'; title = 'Bone marrow'; body = '<p class="muted">Your bone marrow makes billions of new cells every day. Fully heal your squad, or train one cell.</p>'; break;
    default: tag = '<span class="tag good">Shop</span>'; title = 'Pharmacy'; body = '<p class="muted">Pick one of three medicines to carry into battle.</p>';
  }
  return `<button class="card" data-act="node" data-i="${i}" type="button">${tag}<h3>${title}</h3>${body}</button>`;
}

function viewMap() {
  const R = REGIONS[run.region];
  const steps = [0, 1, 2].map(s => `<span class="dot ${s < run.step ? 'done' : s === run.step ? 'now' : ''}">${s === 2 ? 'Boss' : 'Stop ' + (s + 1)}</span>`).join('');
  return `<section class="screen">
    <div class="region-head">
      <p class="eyebrow">Region ${run.region + 1} of ${REGIONS.length}</p>
      <h2>${R.name}<small>${R.tag}</small></h2>
      <p>${R.text}</p>
      <div class="steps">${steps}</div>
    </div>
    <h3 style="margin-top:16px">${run.step === 2 ? 'The region\u2019s boss awaits' : 'Choose your path'}</h3>
    <div class="choices">${mapState.map(nodeCard).join('')}</div>
    ${statusBar()}
  </section>`;
}

function badgesFor(x, isEnemy) {
  const b = [];
  if (isEnemy) {
    if (x.block > 0) b.push(`<span class="badge">\u{1F6E1} ${x.block}</span>`);
    if (x.mark > 0) b.push(`<span class="badge" title="Takes +50% damage, deals 30% less">\u{1F3AF} tagged ${x.mark}</span>`);
    if (x.poison) b.push(`<span class="badge">\u2620 ${x.poison.d}/turn</span>`);
    if (x.camo) b.push('<span class="badge" title="Takes half damage except from NK and killer T cells">camouflaged</span>');
  } else {
    if (x.shield > 0) b.push(`<span class="badge">\u{1F6E1} ${x.shield}</span>`);
    if (x.buff) b.push(`<span class="badge">\u2B06 +40%</span>`);
    if (x.poison) b.push(`<span class="badge">\u2620 ${x.poison.d}/turn</span>`);
    if (!x.dead) b.push(x.cd > 0 ? `<span class="badge cd">special in ${x.cd}</span>` : '<span class="badge rdy">special ready</span>');
  }
  return b.join('');
}

function enemyCard(e, i) {
  const c = combat;
  const sel = c.sel != null ? run.squad[c.sel] : null;
  const needs = c.mode === 'attack' || (c.mode === 'special' && sel && CELLS[sel.id].sp.target === 'enemy');
  const cls = ['unit', 'enemy', e.boss ? 'boss' : '', e.hp <= 0 ? 'dead' : '', needs && e.hp > 0 ? 'targetable' : ''].join(' ');
  const it = (!c.busy && e.hp > 0) ? intentText(e) : '';
  return `<div class="${cls}" data-id="e${e.uid}" data-act="enemy" data-i="${i}" title="${KIND[e.kind].label}. Weak to: ${KIND[e.kind].weak}">
    ${it ? `<div class="intent">${it}</div>` : ''}
    <div class="art">${pathogenSVG(e.shape, e.color)}</div>
    <div class="name">${e.name}</div>
    <div class="sub k-${e.kind}" style="border:0">${KIND[e.kind].label}</div>
    <div class="bar"><i style="width:${Math.max(0, e.hp / e.maxHp * 100)}%"></i><span>${e.hp}/${e.maxHp}</span></div>
    <div class="badges">${badgesFor(e, true)}</div>
  </div>`;
}

function allyCard(a, i) {
  const c = combat;
  const sel = c.sel != null ? run.squad[c.sel] : null;
  const needs = c.mode === 'special' && sel && CELLS[sel.id].sp.target === 'ally' && !a.dead;
  const cls = ['unit', 'ally', c.sel === i ? 'sel' : '', a.dead ? 'dead' : '', a.acted && !a.dead ? 'done' : '', needs ? 'targetable' : ''].join(' ');
  const d = CELLS[a.id];
  return `<div class="${cls}" data-id="a${i}" data-act="ally" data-i="${i}" title="${d.role}: ${d.sp.name} - ${d.sp.text}">
    <div class="art">${cellSVG(a.id)}</div>
    <div class="name">${d.name}</div>
    <div class="sub">${a.dead ? 'Fallen' : a.acted ? 'Done this turn' : d.role}</div>
    <div class="bar"><i style="width:${Math.max(0, a.hp / maxHp(a) * 100)}%"></i><span>${a.hp}/${maxHp(a)}</span></div>
    <div class="badges">${badgesFor(a, false)}</div>
  </div>`;
}

function actionPanel() {
  const c = combat;
  const a = c.sel != null ? run.squad[c.sel] : null;
  let left;
  if (c.busy) left = '<p class="muted">Please wait\u2026</p>';
  else if (!a) left = '<p>All cells have acted. End the turn when you are ready.</p>';
  else {
    const d = CELLS[a.id];
    if (c.mode) {
      const what = (c.mode === 'special' && d.sp.target === 'ally') ? 'cell' : 'enemy';
      left = `<p><strong>${d.name}</strong>: choose a target ${what}. <button class="btn small" data-act="cancel" type="button">Cancel</button></p>`;
    } else {
      left = `<div><strong>${d.name}</strong> <span class="muted">\u00B7 ${d.role}</span></div>
        <div class="btns">
          <button class="btn" data-act="attack" type="button" ${a.acted ? 'disabled' : ''}>${d.basic} <small>${atkOf(a)} dmg${d.basicNote ? ', ' + d.basicNote : ''}</small></button>
          <button class="btn special" data-act="special" type="button" ${(a.acted || a.cd > 0) ? 'disabled' : ''}>${d.sp.name} <small>${a.cd > 0 ? 'ready in ' + a.cd : 'ready'}</small></button>
        </div>
        <p class="muted">${d.sp.text}</p>`;
    }
  }
  const allDone = !c.busy && !a;
  const risk = Math.round(Math.min(0.6, 0.2 * run.abUses) * 100);
  const meds = run.meds.length
    ? run.meds.map((id, i) => `<button class="btn med small" data-act="med" data-i="${i}" type="button" ${c.busy ? 'disabled' : ''} title="${MEDS[id].text}">${MEDS[id].icon} ${MEDS[id].name}${id === 'antibiotic' ? ` <small>${risk}% resist</small>` : ''}</button>`).join('')
    : '<span class="muted">none. Find them in the pharmacy or as rewards.</span>';
  return `<div class="panel actions">
      <div class="left">${left}</div>
      <div><button class="btn primary ${allDone ? 'pulse' : ''}" data-act="end" type="button" ${c.busy ? 'disabled' : ''}>End turn</button></div>
    </div>
    <div class="panel meds"><span class="label">Medicines</span>${meds}</div>`;
}

function viewCombat() {
  const c = combat;
  return `<section class="screen combat">
    <div class="topline"><span>${REGIONS[run.region].name} \u00B7 Turn ${c.turn}</span><span class="resist" title="Each antibiotic you use gives bacteria a bigger chance to resist the next one.">Antibiotic resistance risk: ${Math.round(Math.min(0.6, 0.2 * run.abUses) * 100)}%</span></div>
    <div class="field enemies">${c.enemies.map(enemyCard).join('')}</div>
    <div class="field allies">${run.squad.map(allyCard).join('')}</div>
    ${actionPanel()}
    <p id="msg" class="msg">${c.msg || ''}</p>
  </section>`;
}

function rewardCard(o, i) {
  if (o.kind === 'cell') {
    const d = CELLS[o.id];
    return `<button class="card" data-act="reward" data-i="${i}" type="button"><div class="art">${cellSVG(o.id)}</div><span class="tag good">New cell</span><h3>${d.name}</h3><p class="muted">${d.role} \u00B7 ${d.hp} HP \u00B7 ${d.atk} atk</p><p>${d.info}</p><p><strong>${d.sp.name}:</strong> ${d.sp.text}</p></button>`;
  }
  if (o.kind === 'relic') {
    const d = RELICS[o.id];
    return `<button class="card" data-act="reward" data-i="${i}" type="button"><span class="tag elite">Boost</span><h3>${d.icon} ${d.name}</h3><p>${d.text}</p><p class="muted">${d.note}</p></button>`;
  }
  if (o.kind === 'med') {
    const d = MEDS[o.id];
    const full = run.meds.length >= MAXMEDS;
    return `<button class="card ${full ? 'off' : ''}" data-act="reward" data-i="${i}" type="button" ${full ? 'disabled' : ''}><span class="tag">Medicine</span><h3>${d.icon} ${d.name}</h3><p>${d.text}</p><p class="muted">${d.note}</p>${full ? '<p><strong>Medicine slots full.</strong></p>' : ''}</button>`;
  }
  return '<button class="card" data-act="reward" data-i="' + i + '" type="button"><span class="tag">Training</span><h3>Clonal expansion</h3><p>Pick one cell: +2 attack and +6 max HP.</p><p class="muted">When an immune cell recognises a threat, it divides rapidly to make an army of identical copies.</p></button>';
}

function viewReward() {
  const s = rewardState;
  const boss = s.node.type === 'boss';
  return `<section class="screen">
    <div class="banner win"><h2>${boss ? 'Region cleared!' : 'Victory!'}</h2><p>Fallen cells are quickly replaced from the bone marrow, and survivors recover a little.${boss ? ' Your squad rests after the boss fight.' : ''}</p></div>
    ${s.fact ? `<div class="fact"><strong>Did you know?</strong> ${s.fact}</div>` : ''}
    <h3>Choose a reward</h3>
    <div class="choices three">${s.options.map(rewardCard).join('')}</div>
    <div class="center"><button class="btn ghost" data-act="skip" type="button">Skip reward</button></div>
    ${statusBar()}
  </section>`;
}

function trainCards() {
  return run.squad.map((a, i) => {
    const d = CELLS[a.id];
    return `<button class="card" data-act="train" data-i="${i}" type="button"><div class="art">${cellSVG(a.id)}</div><h3>${d.name}</h3><p class="muted">${a.hp}/${maxHp(a)} HP \u00B7 ${atkOf(a)} atk</p><p>+2 attack, +6 max HP</p></button>`;
  }).join('');
}

function viewTrain() {
  return `<section class="screen">
    <div class="banner win"><h2>Clonal expansion</h2><p>Choose a cell to train. When a cell recognises its target, it multiplies into an army of identical copies.</p></div>
    <div class="choices three">${trainCards()}</div>
    ${statusBar()}
  </section>`;
}

function viewRest() {
  return `<section class="screen">
    <div class="banner win"><h2>Bone marrow</h2><p>Bone marrow is where most blood and immune cells are made, billions every day. Take a moment to recover.</p></div>
    <div class="choices">
      <button class="card" data-act="rest-heal" type="button"><span class="tag good">Recover</span><h3>Rest and heal</h3><p>Fully heal every cell.</p></button>
      <button class="card" data-act="rest-train" type="button"><span class="tag">Train</span><h3>Clonal expansion</h3><p>Pick one cell: +2 attack, +6 max HP.</p></button>
    </div>
    ${statusBar()}
  </section>`;
}

function viewLab() {
  const full = run.meds.length >= MAXMEDS;
  const cards = labOptions.map((id, i) => {
    const d = MEDS[id];
    return `<button class="card ${full ? 'off' : ''}" data-act="lab" data-i="${i}" type="button" ${full ? 'disabled' : ''}><span class="tag">Medicine</span><h3>${d.icon} ${d.name}</h3><p>${d.text}</p><p class="muted">${d.note}</p></button>`;
  }).join('');
  return `<section class="screen">
    <div class="banner win"><h2>Pharmacy</h2><p>Medicines help your cells, but each one only works on the right kind of germ. Choose one.${full ? ' <strong>Your medicine slots are full.</strong>' : ''}</p></div>
    <div class="choices three">${cards}</div>
    <div class="center"><button class="btn ghost" data-act="skip" type="button">Leave</button></div>
    ${statusBar()}
  </section>`;
}

function viewOver() {
  const won = rewardState.won;
  const facts = run.facts.map(id => `<li><strong>${E[id].name}:</strong> ${E[id].fact}</li>`).join('');
  return `<section class="screen">
    <div class="banner ${won ? 'win' : 'lose'}">
      <h2>${won ? 'The body is safe!' : 'The infection won this time'}</h2>
      <p>${won ? 'You cleared all five regions and kept the body healthy.' : 'Every cell fell. Real immune systems rely on teamwork and memory, so try a different squad.'}</p>
      <p class="muted">Regions cleared: ${run.cleared} of ${REGIONS.length} \u00B7 Fights won: ${run.fights}</p>
    </div>
    <div class="center"><button class="btn primary big" data-act="new" type="button">New run</button> <button class="btn big" data-act="codex" type="button">Codex</button></div>
    <details class="how" open>
      <summary>What you met on this run</summary>
      <ul>${facts || '<li>Nothing yet.</li>'}</ul>
    </details>
  </section>`;
}

function viewSquad() {
  const cards = STARTERS.map(id => {
    const d = CELLS[id];
    const on = startPick.includes(id);
    return `<button class="card ${on ? 'on' : ''}" data-act="pickstart" data-id="${id}" type="button"><div class="art">${cellSVG(id)}</div><h3>${d.name}</h3><p class="muted">${d.role} \u00B7 ${d.hp} HP \u00B7 ${d.atk} atk</p><p>${d.info}</p><p><strong>${d.sp.name}:</strong> ${d.sp.text}</p></button>`;
  }).join('');
  return `<section class="screen">
    <h2>Choose your starting squad</h2>
    <p class="muted">Pick 3 cells (${startPick.length}/3). You will recruit more along the way.</p>
    <div class="choices three">${cards}</div>
    <div class="center"><button class="btn primary big" data-act="begin" type="button" ${startPick.length === 3 ? '' : 'disabled'}>Begin</button></div>
  </section>`;
}

function viewTitle() {
  const best = store.get('best', { cleared: 0, wins: 0 });
  return `<section class="screen title">
    <div class="hero">${cellSVG('neutrophil')}${cellSVG('macrophage')}${cellSVG('rbc')}</div>
    <h1>Cell Defenders</h1>
    <p class="lead">You are the immune system. Lead your cells through five regions of the body, beat back bacteria, viruses, fungi, parasites and rogue cells, and learn how your body really defends itself.</p>
    <div class="row"><button class="btn primary big" data-act="new" type="button">Start a run</button><button class="btn big" data-act="codex" type="button">Codex</button></div>
    <p class="muted">Best run: ${best.cleared} of ${REGIONS.length} regions cleared${best.wins ? ` \u00B7 ${best.wins} win${best.wins > 1 ? 's' : ''}` : ''}</p>
    <details class="how">
      <summary>How to play</summary>
      <ol>
        <li>Pick 3 starting cells. Every cell has a role and a special ability.</li>
        <li>In a fight, click one of your cells, choose Attack or its Special, then click a target. Each cell acts once per turn.</li>
        <li>Enemy plans are shown above them. Use that to decide who to protect, then press End turn.</li>
        <li>Medicines are free to use, but each only works on the right kind of germ. The Codex tells you which.</li>
        <li>Win fights to recruit cells and find boosts. Clear all five regions to win. If every cell falls, the run ends.</li>
      </ol>
    </details>
  </section>`;
}

function renderHud() {
  const h = $('#hud');
  if (!h) return;
  h.textContent = (run && screen !== 'over' && screen !== 'title' && screen !== 'squad')
    ? `Region ${Math.min(run.region + 1, REGIONS.length)}/${REGIONS.length} \u00B7 ${REGIONS[Math.min(run.region, REGIONS.length - 1)].name}`
    : '';
}

function render() {
  const views = { title: viewTitle, squad: viewSquad, map: viewMap, combat: viewCombat, reward: viewReward, train: viewTrain, rest: viewRest, lab: viewLab, over: viewOver };
  game.innerHTML = views[screen]();
  renderHud();
  flushFx();
}

/* ---------- codex ---------- */
function renderCodex() {
  const cx = store.get('codex', {});
  const tabs = [['cells', 'Immune cells'], ['bugs', 'Pathogens'], ['meds', 'Medicines'], ['relics', 'Boosts']];
  let body = '';
  if (codexTab === 'cells') {
    body = Object.keys(CELLS).map(id => {
      const d = CELLS[id];
      return `<div class="entry"><div class="art">${cellSVG(id)}</div><h3>${d.name}</h3><div class="muted">${d.role} \u00B7 ${d.hp} HP \u00B7 ${d.atk} atk</div><p>${d.info}</p><p><strong>${d.sp.name}:</strong> ${d.sp.text}</p>${d.strong.length ? `<p class="muted">Strong against: ${d.strong.map(k => KIND[k].label.toLowerCase()).join(', ')}</p>` : ''}</div>`;
    }).join('');
  } else if (codexTab === 'bugs') {
    body = Object.keys(E).map(id => {
      const d = E[id];
      if (!cx[id]) return `<div class="entry locked"><div class="art">${pathogenSVG(d.shape, '#55608a')}</div><h3>???</h3><p>Defeat this pathogen to learn about it.</p></div>`;
      return `<div class="entry"><div class="art">${pathogenSVG(d.shape, d.color)}</div><h3>${d.name}</h3><div class="muted">${KIND[d.kind].label}${d.boss ? ' \u00B7 Boss' : ''}</div><p>${d.fact}</p><p class="muted">Weak to: ${KIND[d.kind].weak}</p></div>`;
    }).join('');
  } else if (codexTab === 'meds') {
    body = Object.keys(MEDS).map(id => `<div class="entry"><h3>${MEDS[id].icon} ${MEDS[id].name}</h3><p>${MEDS[id].text}</p><p class="muted">${MEDS[id].note}</p></div>`).join('');
  } else {
    body = Object.keys(RELICS).map(id => `<div class="entry"><h3>${RELICS[id].icon} ${RELICS[id].name}</h3><p>${RELICS[id].text}</p><p class="muted">${RELICS[id].note}</p></div>`).join('');
  }
  $('#overlay').innerHTML = `<div class="sheet">
    <div class="sheet-head"><h2>Codex</h2><button class="btn small" data-x="close" type="button">Close</button></div>
    <div class="tabs">${tabs.map(t => `<button class="btn small ${codexTab === t[0] ? 'on' : ''}" data-tab="${t[0]}" type="button">${t[1]}</button>`).join('')}</div>
    <div class="entries">${body}</div>
  </div>`;
}

function openCodex() { $('#overlay').hidden = false; renderCodex(); }
function closeCodex() { $('#overlay').hidden = true; }

/* ---------- events ---------- */
game.addEventListener('click', ev => {
  const t = ev.target.closest('[data-act]');
  if (!t || t.disabled) return;
  const i = Number(t.dataset.i);
  switch (t.dataset.act) {
    case 'new': startPick = []; run = null; screen = 'squad'; render(); break;
    case 'codex': openCodex(); break;
    case 'pickstart': {
      const id = t.dataset.id;
      if (startPick.includes(id)) startPick = startPick.filter(x => x !== id);
      else if (startPick.length < 3) startPick.push(id);
      render(); break;
    }
    case 'begin':
      if (startPick.length === 3) { newRun(startPick); mapState = genChoices(); screen = 'map'; render(); }
      break;
    case 'node': chooseNode(i); break;
    case 'ally': clickAlly(i); break;
    case 'enemy': clickEnemy(i); break;
    case 'attack': chooseAction('attack'); break;
    case 'special': chooseAction('special'); break;
    case 'cancel': if (combat) { combat.mode = null; render(); } break;
    case 'end': endTurn(); break;
    case 'med': useMed(i); break;
    case 'reward': takeReward(i); break;
    case 'skip': finishNode(); break;
    case 'train': doTrain(i); break;
    case 'rest-heal': for (const a of run.squad) a.hp = maxHp(a); finishNode(); break;
    case 'rest-train': screen = 'train'; render(); break;
    case 'lab':
      if (run.meds.length < MAXMEDS) { run.meds.push(labOptions[i]); finishNode(); }
      break;
  }
});

$('#overlay').addEventListener('click', ev => {
  if (ev.target.id === 'overlay' || ev.target.closest('[data-x="close"]')) { closeCodex(); return; }
  const tb = ev.target.closest('[data-tab]');
  if (tb) { codexTab = tb.dataset.tab; renderCodex(); }
});

$('#codex-btn').addEventListener('click', openCodex);

$('#logo').addEventListener('click', ev => {
  ev.preventDefault();
  if (run && screen !== 'over' && screen !== 'title') {
    if (!confirm('Abandon this run and return to the title screen?')) return;
  }
  combat = null; run = null; screen = 'title'; pendingFx = [];
  render();
});

document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeCodex(); });

render();

})();
