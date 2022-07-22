import {ens_normalize} from './index.js';
import {run_tests} from '@adraffy/ensip-norm';

let errors = run_tests(ens_normalize);
if (errors.length) {
	console.log(errors);
	console.log(`Errors: ${errors.length}`);
	process.exit(1);
} else {
	console.log('OK');
}