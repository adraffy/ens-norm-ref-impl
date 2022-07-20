import {ens_normalize} from './ens-normalize.js';
import {TESTS} from '@adraffy/ensip-norm';

let errors = 0;
for (let test of TESTS) {
	let {name, norm, error} = test;
	if (typeof norm !== 'string') norm = name;
	try {
		let result = ens_normalize(name);
		if (error) {	
			console.log({fail: 'expected error', result, ...test});
			errors++;
		} else if (result != norm) {
			console.log({fail: 'wrong norm', result, ...test});
			errors++;
		}
	} catch (err) {
		if (!error) {
			console.log({fail: 'unexpected error', result: err.toString(), ...test});
			errors++;
		}
	}
}

if (errors > 0) {
	console.log(`Errors: ${errors}`);
	process.exit(1);
}

console.log('OK');