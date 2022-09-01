import {CHARS, EMOJI} from '@adraffy/ensip-norm';

const HYPHEN = 0x2D;
const UNDERSCORE = 0x5F;
const FE0F = 0xFE0F;

// create lookup tables
let {valid, mapped, ignored, cm} = CHARS;
valid = new Set(valid);
ignored = new Set(ignored);
mapped = Object.fromEntries(mapped);
cm = new Set(cm);

// create simple trie 
let emoji_root = {};
for (let emoji of EMOJI) {
	let node = emoji_root;
	for (let cp of emoji) {
		if (cp === FE0F) {
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
function consume_emoji_reversed(cps) {
	let emoji;
	let node = emoji_root;
	let pos = cps.length;
	while (pos) {
		let cp = cps[--pos];
		node = node[cp];
		if (!node) break;
		if (node.__fe0f && pos > 0 && cps[pos - 1] == FE0F) pos--;
		if (node.__valid) { // this is a valid emoji (so far)
			emoji = node.__valid; // remember it
			cps.length = pos; // remove it from input
		}
	}
	return emoji;
}

function explode_cp(s) {
	return [...s].map(c => c.codePointAt(0));
}

function process(name, emoji_filter) {
	let input = explode_cp(name).reverse(); // flip so we can pop
	let output = [];
	while (input.length) {
		let emoji = consume_emoji_reversed(input);
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
	return String.fromCodePoint(...output);
}

function post_check(name, emoji_filter) {
	let norm = process(name, emoji_filter).normalize('NFC');
	for (let label of norm.split('.')) {
		try {
			let nfc = explode_cp(label);
			for (let i = nfc.lastIndexOf(UNDERSCORE) - 1; i >= 0; i--) {
				if (nfc[i] !== UNDERSCORE) {
					throw new Error(`underscore only allowed at start`);
				}
			}
			if (nfc.length >= 4 && nfc[2] === HYPHEN && nfc[3] === HYPHEN && nfc.every(cp => cp < 0x80)) {
				throw new Error(`invalid label extension`);
			}			
			let nfd = explode_cp(process(label, () => [FE0F]).normalize('NFD'));
			for (let i = 0, j = -1; i < nfd.length; i++) {
				if (cm.has(nfd[i])) {
					if (i == 0) {
						throw new Error(`leading combining mark`);
					} else if (i == j) {
						throw new Error(`adjacent combining marks`);
					} else if (nfd[i - 1] == FE0F) {
						throw new Error(`emoji + combining mark`);
					}	
					j = i + 1;
				}
			}
		} catch (err) {
			throw new Error(`Invalid label "${label}": ${err.message}`);
		}
	}
	return norm;
}

export function ens_beautify(name) {
	return post_check(name, emoji => emoji);
}
export function ens_normalize(name) {
	return post_check(name, emoji => emoji.filter(cp => cp != FE0F));
}