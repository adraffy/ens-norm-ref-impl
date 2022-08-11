import {run_tests} from '@adraffy/ensip-norm';
import {ens_normalize} from './index.js';
//import {ens_normalize} from './dist/index.js';
//import {ens_normalize} from './dist/index.min.js';

let errors = run_tests(ens_normalize);
if (errors.length) {
	console.log(errors);
	console.log(`Errors: ${errors.length}`);
	process.exit(1);
}

console.log('OK');