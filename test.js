import {TESTS} from '@adraffy/ensip-norm';
import {ens_normalize} from './index.js';
//import {ens_normalize} from './dist/index.js';
//import {ens_normalize} from './dist/index.min.js';

let errors = [];
for (let test of TESTS) {
    let {name, norm, error} = test;
    if (typeof norm !== 'string') norm = name;
    try {
        let result = ens_normalize(name);
        if (error) {	
            errors.push({fail: 'expected error', result, ...test});
        } else if (result != norm) {
            errors.push({fail: 'wrong norm', result, ...test});
        }
    } catch (err) {
        if (!error) {
            errors.push({fail: 'unexpected error', result: err.message, ...test});
        }
    }
}
if (errors.length > 0) {
    console.log(errors);
    console.log(`Errors: ${errors.length}`);
    process.exit(1);
}

console.log('OK');