/**
 * Deterministic checks for shift-request.html.
 *
 * Runs the page's real script against a minimal fake DOM, then asserts the two
 * behaviours that matter: routes appear as soon as a start time has one, and
 * everything stays blank when a contract has none.
 *
 * Run with:  node verify.mjs
 */

import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./shift-request.html', import.meta.url), 'utf8');
const scriptMatch = /<script>([\s\S]*?)<\/script>/.exec(html);
if (!scriptMatch) {
  console.error('FAIL: no inline script found in shift-request.html');
  process.exit(1);
}

// ---------- minimal fake DOM ----------

const registry = new Map();

function makeEl(tag = 'div') {
  const el = {
    tagName: String(tag).toUpperCase(),
    children: [],
    _innerHTML: '',
    _listeners: {},
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    value: '',
    hidden: false,
    files: [],
    textContent: '',
    scope: '',
    type: '',
    className: '',
    placeholder: '',
    setAttribute() {},
    getAttribute() { return null; },
    removeAttribute() {},
    addEventListener(type, fn) {
      (el._listeners[type] = el._listeners[type] || []).push(fn);
    },
    removeEventListener() {},
    appendChild(child) {
      el.children.push(child);
      // A real <select> adopts its first option as its value.
      if (el.value === '' && el.children.length === 1 && typeof child.value === 'string') {
        el.value = child.value;
      }
      return child;
    },
    insertBefore(child) { el.children.unshift(child); return child; },
    removeChild() {},
    remove() {},
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    click() {},
    select() {},
    setSelectionRange() {},
    scrollIntoView() {},
    focus() {},
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._innerHTML; },
    set(value) { el._innerHTML = value; el.children.length = 0; },
  });
  return el;
}

function el(id) {
  if (!registry.has(id)) registry.set(id, makeEl('div'));
  return registry.get(id);
}

function fire(id, type) {
  const listeners = el(id)._listeners[type] || [];
  listeners.forEach((fn) => fn({}));
}

const store = new Map();

globalThis.document = {
  getElementById: el,
  createElement: (tag) => makeEl(tag),
  body: makeEl('body'),
};
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
try {
  Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true, writable: true });
} catch (err) {
  // Node ships its own navigator; the page only reads navigator.clipboard on click.
}
globalThis.Blob = class {};
globalThis.URL = { createObjectURL: () => 'blob:test', revokeObjectURL() {} };
globalThis.FileReader = class {};
globalThis.confirm = () => true;

// ---------- run the real script ----------

try {
  new Function(scriptMatch[1])();
} catch (err) {
  console.error('FAIL: the page script threw on load:', err && err.message);
  process.exit(1);
}

// ---------- assertions ----------

const results = [];

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ name, ok, actual, expected });
}

function routeCount() { return el('d-routes').children.length; }

check('contract dropdown lists every contract plus All', el('d-contract').children.length, 6);
check('start time dropdown lists every slot', el('d-time').children.length, 1);
check('routes show on load from the available slot', routeCount(), 1);
check('count line names the slot', String(el('d-count').textContent).includes('04:15'), true);

el('d-contract').value = 'WICKES';
fire('d-contract', 'change');
check('contract with no routes stays blank', routeCount(), 0);
check('and the count line stays blank too', el('d-count').textContent, '');

el('d-contract').value = 'TK MAXX';
fire('d-contract', 'change');
check('contract with a route shows it', routeCount(), 1);

el('d-time').value = '05:00';
fire('d-time', 'change');
check('slot with nothing running stays blank', routeCount(), 0);
check('and its count line stays blank too', el('d-count').textContent, '');

el('d-time').value = '04:15';
fire('d-time', 'change');
check('switching back restores the route', routeCount(), 1);

check('coverage grid has one row per contract', el('coverage-body').children.length, 5);
check('coverage grid has one column per slot plus the label', el('coverage-head').children.length, 2);

const rows = el('coverage-body').children;
const rowFor = (name) => rows.find((r) => r.children[0].textContent === name);
check('coverage cell shows the route count', rowFor('TK MAXX').children[1].children[0].textContent, '1');
check('coverage cell is blank with no route', rowFor('WICKES').children[1].children[0].children.length, 0);

check('contract list shows all five', el('contract-list').children.length, 5);
check('time list shows the one slot', el('time-list').children.length, 1);
check('route list shows the one route', el('route-list').children.length, 1);

// ---------- session and submit ----------

function fireEl(node, type) {
  (node._listeners[type] || []).forEach((fn) => fn({}));
}

const barText = el('session-bar').children[1] || makeEl('span');
const codeMatch = /<code>([A-Z0-9]{4})<\/code>/.exec(String(barText.innerHTML));
check('device session shows a four character code', codeMatch ? codeMatch[1].length : 0, 4);
check('session bar is visible', el('session-bar').hidden, false);

check('submit starts disabled until a route is picked', el('submit-btn').disabled, true);

fireEl(el('d-routes').children[0].children[0], 'click');
check('tapping a route enables the submit button', el('submit-btn').disabled, false);
check('the picked route is named back', String(el('selected-line').textContent).includes('396 YEOVIL > 441 BARNSTAPLE'), true);

el('req-name').value = 'ABDI ABDIRAHMAN';
fire('submit-btn', 'click');
check('submitting records one request for the planner', el('planner-requests').children.length, 1);
check('and one under the driver', el('recent-list').children.length, 1);

const plannerMeta = String(el('planner-requests').children[0].children[0].children[1].textContent);
check('planner row names the driver', plannerMeta.includes('ABDI ABDIRAHMAN'), true);
check('planner row carries the device code', plannerMeta.includes(codeMatch ? codeMatch[1] : '####'), true);

const submitted = String(el('req-text').value);
check('submitted text carries a reference', submitted.includes('Reference: REQ-'), true);
check('submitted text names the route', submitted.includes('396 YEOVIL > 441 BARNSTAPLE'), true);
check('submitting does not hide the button', el('submit-btn').hidden, false);

// ---------- report ----------

const failed = results.filter((r) => !r.ok);
results.forEach((r) => {
  if (!r.ok) console.log('FAIL  ' + r.name + '\n      expected ' + JSON.stringify(r.expected) + ', got ' + JSON.stringify(r.actual));
});

console.log((results.length - failed.length) + '/' + results.length + ' checks passed');
process.exit(failed.length ? 1 : 0);
