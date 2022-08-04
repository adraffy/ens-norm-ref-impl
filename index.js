import {CHARS, EMOJI} from '@adraffy/ensip-norm';

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

export function ens_normalize(name, beautify = false) {
	let input = [...name].map(s => s.codePointAt(0)).reverse(); // flip so we can pop
	let output = [];
	while (input.length) {		
		let emoji = consume_emoji(input);
		if (emoji) {
			output.push(...(beautify ? emoji : emoji.filter(cp => cp != 0xFE0F)));
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
	return String.fromCodePoint(...output).normalize('NFC');
}