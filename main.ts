// The Ninth Meridian Archive — a curiosity engine.
//
// Running this program materialises a small archive about an object that
// should not exist: a brass orrery recovered from a ship's locker, engraved
// with a coastline no chart has ever shown, wound — impossibly — still
// ticking. The archive is built to make a reader curious and to reward the
// curiosity it creates:
//
//   * START-HERE.txt poses three questions nobody has answered.
//   * Five exhibits each explain one thing and withhold another; every
//     exhibit ends in a question and points at a different file.
//   * Two exhibits contradict each other about a date, and a margin note
//     accuses one of them of being a forgery. Both cannot be right.
//   * Each exhibit carries an ARCHIVE MARK — one word. In exhibit order the
//     five words are the key that unseals SEALED.txt.
//   * SEALED.txt, once opened, answers the archive's central question —
//     and replaces it with a larger one.
//   * INDEX-OF-ABSENCES.txt lists the documents that should exist but do
//     not. What is missing is part of the exhibit.
//
// The output is deterministic: same files, same bytes, every run.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// ---------------------------------------------------------------------------
// The seal. The key is the five ARCHIVE MARK words, in exhibit order, joined
// with single spaces, lower case. The sealed text is XORed with the key's
// bytes (repeated) and base64-encoded — no tools beyond this file and any
// base64 decoder are needed to open it, only the patience to gather the
// marks.
// ---------------------------------------------------------------------------

const SEALED_PLAIN =
  'FROM THE HAND OF THE CARTOGRAPHER, UNFINISHED:\n' +
  'The coastline on the orrery is not a place that was lost. It is a place\n' +
  'that has not happened yet. I charted it the way you chart a harbour from\n' +
  'a dream of the tide: by listening to the instrument count backwards.\n' +
  'Every meridian on it is real except the ninth. Ask, instead, why the\n' +
  'instrument needed a ninth meridian at all — and who wound it, the night\n' +
  'before the ship that had not yet sailed came home.\n';

function seal(plain: string, key: string): string {
  const kb = Buffer.from(key, 'utf8');
  const pb = Buffer.from(plain, 'utf8');
  const out = Buffer.alloc(pb.length);
  for (let i = 0; i < pb.length; i++) out[i] = pb[i] ^ kb[i % kb.length];
  return out.toString('base64');
}

// ---------------------------------------------------------------------------
// The exhibits. Each: a title, a body that explains one thing and withholds
// another, a closing question, and an ARCHIVE MARK.
// ---------------------------------------------------------------------------

interface Exhibit {
  n: string;
  title: string;
  mark: string;
  body: string[];
  question: string;
  pointer: string;
}

const EXHIBITS: Exhibit[] = [
  {
    n: '01',
    title: 'THE RECOVERY',
    mark: 'tide',
    body: [
      'On 3 March 1962 the trawler SAN MERIDIAN came into harbour at',
      'Vesthavn with her hold empty and her crew of six unable to agree on',
      'how long they had been at sea. The harbour log says eleven days.',
      'The ship\'s chronometer, stopped at the moment of docking, says',
      'forty-one years.',
      '',
      'In the captain\'s locker, wrapped in oilcloth that was dry to the',
      'touch though the locker stood in bilge water, searchers found a',
      'brass orrery: a mechanical model of the sun and nine planets, of a',
      'workmanship no living instrument-maker will claim. It was warm.',
      'It was, and at the time of writing still is, ticking.',
    ],
    question: 'Why was the oilcloth dry?',
    pointer: 'For the instrument itself, see EXHIBIT-02. For the crew, see EXHIBIT-04 — if you believe it.',
  },
  {
    n: '02',
    title: 'THE INSTRUMENT',
    mark: 'counts',
    body: [
      'The orrery is 41 cm across, brass and black glass. Its nine planets',
      'orbit in periods that match the true ones to one part in a million —',
      'except the outermost, which completes a circuit every 40 years, 11',
      'months and 4 days, and which corresponds to no known body.',
      '',
      'Engraved around the rim, in a hand no two experts read the same way,',
      'is a coastline: a harbour, a river bending twice, a lighthouse on a',
      'headland. The coastline matches no shore on any chart in the',
      'Hydrographic Office. It matches, the Office admits in a memorandum',
      'it later withdrew, "the shore as it would be, if the dredging',
      'proposed in 1911 had been carried out." The dredging was never',
      'carried out.',
      '',
      'There is a winding key. It has never been turned by the archive\'s',
      'staff. The instrument has never needed it.',
    ],
    question: 'What is the tenth body on the rim — the small one, scratched out?',
    pointer: 'The withdrawn memorandum is EXHIBIT-03. Handle it as evidence, not as truth.',
  },
  {
    n: '03',
    title: 'THE WITHDRAWN MEMORANDUM',
    mark: 'backwards',
    body: [
      'MEMORANDUM, Hydrographic Office, 14 May 1962. Withdrawn 15 May 1962.',
      '',
      '"The coastline engraved on the recovered instrument is the Vesthavn',
      'shore as surveyed in the dredging proposal of 1911, a document held',
      'in this Office and never published. No member of the crew of the',
      'SAN MERIDIAN had access to it. The engraving is nevertheless the',
      'older of the two: the proposal\'s surveyor copied it, in part, from',
      'a rubbing taken from an instrument in this Office\'s store in 1909.',
      'That instrument was melted down in 1917. This Office has no further',
      'comment."',
      '',
      'The memorandum is signed with initials only: E.V. No officer with',
      'those initials appears on the Office roll for 1962 — or, the',
      'archivist notes, for any year at all.',
    ],
    question: 'Who was E.V., and how did they sign a memorandum in an office they never worked in?',
    pointer: 'EXHIBIT-05 is a second account of this document. It disagrees with this one about the year.',
  },
  {
    n: '04',
    title: 'THE COOK\'S STATEMENT',
    mark: 'toward',
    body: [
      'Statement of A. Lindqvist, cook, taken 9 March 1962. The other five',
      'crew members declined to give statements, then or ever.',
      '',
      '"We were never lost. That is the part nobody writes down. The sea',
      'was ordinary, the work was ordinary. It is only that on the fourth',
      'night the stars were in the wrong order — not wrong like a man',
      'misremembers them, wrong like a page reprinted with the lines',
      'shifted. The captain looked up a long time. Then he went below and',
      'brought up the brass thing, which I had never seen in eleven years',
      'aboard, and he set it on the chart table, and it was already',
      'running. He said: it is counting us home. I did not ask from where."',
      '',
      'Lindqvist left Vesthavn in 1963 and has not been traced. The',
      'statement is the archive\'s only first-hand account.',
    ],
    question: 'Eleven years aboard — and he had never seen the instrument that was kept in the captain\'s locker?',
    pointer: 'The harbour log excerpt is EXHIBIT-05. Compare its dates with EXHIBIT-03 before you trust either.',
  },
  {
    n: '05',
    title: 'THE HARBOUR LOG, WITH A MARGIN NOTE',
    mark: 'harbour',
    body: [
      'Harbour log, Vesthavn. Extract.',
      '',
      '  3 March 1921 — SAN MERIDIAN in, from the north grounds. Crew six.',
      '                 Cargo none. One item to the Office: a brass',
      '                 instrument, warm, ticking. Item declined.',
      '',
      '  3 March 1962 — SAN MERIDIAN in, from the north grounds. Crew six.',
      '                 Cargo none. One item received from the Office.',
      '',
      'The two entries are in the same hand. The logkeeper of 1921 retired',
      'in 1938 and died in 1944. In the margin of the second entry, in a',
      'different ink, someone has written: "Second verse, same as the',
      'first. Ask the tide what it counts." Below that, fainter: "Do not',
      'wind it."',
    ],
    question: 'EXHIBIT-03 dates the memorandum to 1962 and the recovery with it. If the ship first came in in 1921, which document is the forgery — or is it the log?',
    pointer: 'You now hold all five marks. SEALED.txt is waiting.',
  },
];

// ---------------------------------------------------------------------------
// The documents.
// ---------------------------------------------------------------------------

const START_HERE = [
  'THE NINTH MERIDIAN ARCHIVE',
  '==========================',
  '',
  'You are looking at the complete public archive of a single object: a',
  'brass orrery that came into the harbour at Vesthavn aboard a ship whose',
  'crew could not agree on how long they had been gone.',
  '',
  'Three questions nobody has answered:',
  '',
  '  1. The instrument shows a coastline that does not exist — drawn from',
  '     a survey of a dredging that was never carried out, copied from an',
  '     instrument melted down before the survey was made.',
  '  2. The ship that carried it home appears in the harbour log twice,',
  '     forty-one years apart, in the same hand, with the cargo reversed.',
  '  3. It is still ticking. Nobody has ever wound it.',
  '',
  'Read the exhibits in order. Each one explains something and withholds',
  'something; each ends with the question its author could not answer, and',
  'each carries an ARCHIVE MARK — a single word, set apart at the end.',
  'The five marks, in exhibit order, are the key to SEALED.txt.',
  '',
  'INDEX-OF-ABSENCES.txt lists what this archive does not contain. Read it',
  'last, or first. It changes what the exhibits mean either way.',
  '',
].join('\n');

const ABSENCES = [
  'INDEX OF ABSENCES',
  '=================',
  '',
  'Documents that should exist, and do not:',
  '',
  '  * The 1911 dredging proposal itself. Cited by the memorandum,',
  '    shelved in the Hydrographic Office, missing since 1962.',
  '  * Any photograph of the orrery. Three are listed in the 1962',
  '    inventory. The inventory page survives; the photographs do not.',
  '  * The statements of the other five crew members. The harbour log',
  '    records that statements were "taken and filed". Only the cook\'s',
  '    was ever in the file.',
  '  * The SAN MERIDIAN\'s own logbook for the voyage — all voyages.',
  '    The shelfmark exists. The shelf is empty.',
  '  * The 1909 rubbing of the earlier instrument. The memorandum\'s',
  '    whole account rests on it. It has never been produced.',
  '  * A record of who wrote the margin note in the harbour log,',
  '    or when, or in what ink the second line was written —',
  '    the fainter one, the one that says do not wind it.',
  '',
  'An archive is a story told by what survived. This one is also told by',
  'what did not.',
  '',
].join('\n');

const ADDENDUM = [
  'CONSERVATOR\'S ADDENDUM, 1987',
  '============================',
  '',
  'In 1987, preparing the orrery for a loan exhibition that was later',
  'cancelled, the conservator opened the case — the first time it had',
  'been opened in the archive\'s custody. Her report is three lines long:',
  '',
  '  "The winding key described in EXHIBIT-02 is kept inside the case.',
  '   It is warm, like the rest. It turns, slowly, on its own, once each',
  '   time the outermost planet completes a circuit — once every 40',
  '   years, 11 months and 4 days. Something is winding the instrument',
  '   from inside, on schedule. I have closed the case. I recommend',
  '   that the loan not proceed, and that this page not be catalogued."',
  '',
  'The page was catalogued anyway, as an addendum, by an archivist who',
  'left no name. The loan exhibition never took place. No reason is',
  'recorded. Note the date the key next turns, if the conservator was',
  'right: add 40 years, 11 months and 4 days to the docking of the',
  'SAN MERIDIAN — either docking. Both sums land on a 3rd of March.',
  '',
].join('\n');

function exhibitText(e: Exhibit): string {
  return [
    `EXHIBIT-${e.n} — ${e.title}`,
    '='.repeat(10 + e.n.length + e.title.length),
    '',
    ...e.body,
    '',
    `Unanswered: ${e.question}`,
    e.pointer,
    '',
    `ARCHIVE MARK: ${e.mark}`,
    '',
  ].join('\n');
}

function main(): void {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(join(OUT, 'exhibits'), { recursive: true });

  writeFileSync(join(OUT, 'START-HERE.txt'), START_HERE);
  for (const e of EXHIBITS) {
    writeFileSync(join(OUT, 'exhibits', `EXHIBIT-${e.n}.txt`), exhibitText(e));
  }

  const key = EXHIBITS.map((e) => e.mark).join(' ');
  const sealed = [
    'SEALED',
    '======',
    '',
    'This file is sealed with the five ARCHIVE MARKs, in exhibit order,',
    'joined with single spaces, lower case. XOR the base64-decoded bytes',
    'with the key\'s bytes, repeated. What is inside answers the archive\'s',
    'first question. It will not be what you expect, and it ends — as',
    'everything here ends — with a question.',
    '',
    seal(SEALED_PLAIN, key),
    '',
  ].join('\n');
  writeFileSync(join(OUT, 'SEALED.txt'), sealed);

  writeFileSync(join(OUT, 'INDEX-OF-ABSENCES.txt'), ABSENCES);
  writeFileSync(join(OUT, 'CONSERVATORS-ADDENDUM.txt'), ADDENDUM);

  const manifest = [
    'MANIFEST',
    '========',
    '',
    'START-HERE.txt ............ the three questions',
    'exhibits/EXHIBIT-01.txt ... the recovery (mark 1 of 5)',
    'exhibits/EXHIBIT-02.txt ... the instrument (mark 2 of 5)',
    'exhibits/EXHIBIT-03.txt ... the withdrawn memorandum (mark 3 of 5)',
    'exhibits/EXHIBIT-04.txt ... the cook\'s statement (mark 4 of 5)',
    'exhibits/EXHIBIT-05.txt ... the harbour log, with a margin note (mark 5 of 5)',
    'SEALED.txt ................ sealed with the five marks',
    'INDEX-OF-ABSENCES.txt ..... what is not here',
    'CONSERVATORS-ADDENDUM.txt . the page that was not to be catalogued',
    '',
  ].join('\n');
  writeFileSync(join(OUT, 'MANIFEST.txt'), manifest);

  console.log('The Ninth Meridian Archive has been deposited in ' + OUT + '.');
  console.log('Begin with START-HERE.txt. The instrument is still ticking.');
}

main();
