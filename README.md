# ENS Normalize Reference Implementation
No frills implementation of [@adraffy/ensip-norm](https://github.com/adraffy/ensip-norm)

![Warning](./warning.png)

## Example

```Javascript
import {ens_normalize} from '@adraffy/ens-norm-ref-impl'; 
// npm i @adraffy/ens-norm-ref-impl
// browser: https://unpkg.com/@adraffy/ens-norm-ref-impl.js@latest/dist/index.min.js

let normalized = ens_normalize('🚴‍♂️.eth'); // throws if invalid
```

## Build

* `npm run test` &mdash; run validation tests
* `npm run build` &mdash; create `/dist/`