
import Rgb from './Rgb.js';
import Int from './Int.js';
import Hex from './Hex.js';
import Cssrgb from './Cssrgb.js';
import Cssrgba from './Cssrgba.js';
import Hsl from './Hsl.js';
import Csshsl from './Csshsl.js';
import Csshsla from './Csshsla.js';
import Hsv from './Hsv.js';

import Intabgr from './Intabgr.js';
import Intrgba from './Intrgba.js';

const TYPES = [
    Rgb,
    Int,
    Hex,
    Hsl,
    Hsv,
    Cssrgba,
    Cssrgb,
    Csshsla,
    Csshsl
];

const TYPES_ALL = TYPES.concat([
    Intabgr,
    Intrgba
]);

export { TYPES, TYPES_ALL };