import {CHARS, EMOJI} from '@adraffy/ensip-norm';

const HYPHEN = 0x2D;
const UNDERSCORE = 0x5F;

// create lookup tables
let {valid, mapped, ignored} = CHARS;
valid = new Set(valid);
ignored = new Set(ignored);
mapped = Object.fromEntries(mapped);

// create simple trie 
let emoji_root = {};
for (let emoji of EMOJI) {
	let node = emoji_root;
	for (let cp of emoji) {
		if (cp === 0xFE0F) {
			node.__fe0f = true;
			continue;
		}		
		let next = node[cp];
		if (!next) node[cp] = next = {};
		node = next;
	}
	node.__valid = emoji;
}

// given codepoints (backwards)
// find longest emoji match
// allow optional FE0F
// returns the full sequence
function consume_emoji(cps) {
	let emoji;
	let node = emoji_root;
	let pos = cps.length;
	while (pos) {
		let cp = cps[--pos];
		node = node[cp];
		if (!node) break;
		if (node.__fe0f && pos > 0 && cps[pos - 1] == 0xFE0F) pos--;
		if (node.__valid) { // this is a valid emoji (so far)
			emoji = node.__valid; // remember it
			cps.length = pos; // remove it from input
		}
	}
	return emoji;
}

// split string into codepoints
function explode_cp(s) {
	return [...s].map(c => c.codePointAt(0));
}

// check leading underscore
// check label extension (if ASCII)
function post_check(name) {
	for (let label of name.split('.')) {		
		let cps = explode_cp(label);
		try {
			for (let i = cps.lastIndexOf(UNDERSCORE) - 1; i >= 0; i--) {
				if (cps[i] !== UNDERSCORE) {
					throw new Error(`underscore only allowed at start`);
				}
			}
			if (cps.length >= 4 && cps.every(cp => cp < 0x80) && cps[2] === HYPHEN && cps[3] === HYPHEN) {
				throw new Error(`invalid label extension`);
			}
		} catch (err) {
			throw new Error(`Invalid label "${label}": ${err.message}`);
		}
	}
}

// follow ENSIP processing steps directly
function normalize(name, emoji_filter) {
	let input = explode_cp(name).reverse(); // flip so we can pop
	let output = [];
	while (input.length) {		
		let emoji = consume_emoji(input);
		if (emoji) {
			output.push(...emoji_filter(emoji));
			continue;
		}
		let cp = input.pop();
		if (valid.has(cp)) {
			output.push(cp);
			continue;
		} 
		if (ignored.has(cp)) {
			continue;
		}
		let cps = mapped[cp];
		if (cps) {
			output.push(...cps);
			continue;
		}
		throw new Error(`Disallowed codepoint: 0x${cp.toString(16).toUpperCase()}`);
	}
	let norm = String.fromCodePoint(...output).normalize('NFC');
	post_check(norm);
	return norm;
}

export function ens_normalize(name) {
	return normalize(name, e => e.filter(cp => cp != 0xFE0F));
}
export function ens_beautify(name) {
	return normalize(name, e => e);
}