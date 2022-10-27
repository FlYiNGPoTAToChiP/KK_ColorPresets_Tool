
import Rgb from './Rgb.js';
import Gradient from '../Gradient.js';
import GradientData from '../gradientData/GradientData.js';
import { getCanvasGradient, getCanvasTarget } from './shared.js';

const DEFAULT_COLOR = {
    h: 0,
    s: 0,
    l: 0,
    a: 1
};

/**
 * Hsl conversion functions
 *
 * Hsl notation is `{h:H, s:S, l:L, a:A}` where each component (hue, saturation,
 * luminosity, alpha) is in range 0-1.
 *
 * @namespace hsl
 * @memberof colorutil
 */
let Hsl = new function() {

    this.name = 'hsl';
    this.className = 'Hsl';
    this.parent = null;

    /**
     * Test validity of a color whether it is in correct notation for this class.
     *
     * @memberof colorutil.hsl
     *
     * @param      {*}          color   The color
     * @return     {boolean}    True if valid, False otherwise.
     */
    this.test = color => {
        return color !== null &&
            typeof color === 'object' &&
            color.hasOwnProperty('h') &&
            color.hasOwnProperty('s') &&
            color.hasOwnProperty('l') &&
            (color.h >= 0 && color.h <= 1) &&
            (color.s >= 0 && color.s <= 1) &&
            (color.l >= 0 && color.l <= 1) &&
            (color.hasOwnProperty('a') ? (color.a >= 0 && color.a <= 1) : true);
    };

    /**
     * Creates a gradient.
     *
     * @memberof colorutil.hsl
     *
     * @param      {Object}    options                              Options provided by user
     * @param      {Array|GradientData}     options.colors          Array of colors or instance of GradientData. There are multiple types of data structures. Data structure
     *                                                              defines whether the gradient is one or two-dimensional.
     * @param      {string}    [options.type='linear']              Gradient type: linear | circular
     * @param      {boolean}   [options.verify=false]               Verify that each of the colors in colors property have valid data structure.
     *                                                              If set to true, createGradient will throw an error if data structure is not correct.
     *                                                              Data structure is tested from one sample to identify the data structure. This does not
     *                                                              affect that behavior.
     * @param      {boolean}   [options.validate=true]              Validate and add missing color stops and convert colors data structure to internal data structure
     * @param      {function}  [options.defaultColor={h:0,s:0,l:0,a:1}] Default color used to fill the missing color components in gradient colors.
     *                                                              If options.colors is GradientData, specify the defaultColor for GradientData instead.
     * @param      {number}    [options.width=100]                  Set size of the gradient in pixels.
     * @param      {number}    [options.height=100]                 Set size of the gradient in pixels.
     * @param      {number}    [options.centerX=0]                  Center position of a gradient. Value in range 0 to 1 where 0 is the left edge of the gradient and 1 is the right edge.
     *                                                              centerX can be used with linear type of gradients to set point of rotation.
     * @param      {number}    [options.centerY=0]                  Center position of a gradient. Value in range 0 to 1 where 0 is the top edge of the gradient and 1 is the bottom edge.
     *                                                              centerY can be used with linear type of gradients to set point of rotation.
     * @param      {number}    [options.scale=1]                    Scale of the gradient. Value in range 0 to 1.
     * @param      {number}    [options.scaleX=1]                   Scale of the gradient on x axis. Value in range 0 to 1.
     * @param      {number}    [options.scaleY=1]                   Scale of the gradient on y axis. Value in range 0 to 1.
     * @param      {number}    [options.translateX=0]               Translate gradient along x axis. Value in range 0 to 1.
     * @param      {number}    [options.translateY=0]               Translate gradient along y axis. Value in range 0 to 1.
     * @param      {boolean}   [options.centralize=false]           Overrides translate values and automatically adjusts the positioning to the center.
     * @param      {number}    [options.rotation=0]                 Rotation of the gradient. Value in range 0 to 1.
     * @param      {function}  [options.repeatX=colorutil.repeat.repeat] X repetition of gradient when calculating a color that is out of normal range 0 to 1.
     * @param      {function}  [options.repeatY=colorutil.repeat.repeat] Y repetition of gradient when calculating a color that is out of normal range 0 to 1.
     *
     * @return     {function}  Function that calculates a color for a single point on gradient. Accepts x and y parameters.
     *                         Though the x and y may exceed the limit, but gradient repeat will take effect.
     */
    this.gradient = options => {

        return Gradient.createGradient(options, {

            mixColors: mixColors,
            defaultColor: DEFAULT_COLOR
        });
    };

    /**
     * Create a gradient data object which allows conversion
     * between the supported data structures
     *
     * @memberof colorutil.hsl
     *
     * @param      {Array}          data            Array of colors. There are multiple types of data structures.
     * @param      {Object}         [defaultColor={h:0,s:0,l:0,a:1}]  The default color
     * @return     {GradientData}
     */
    this.gradientData = (data, defaultColor) => {

        defaultColor = defaultColor || DEFAULT_COLOR;

        return new GradientData(data, defaultColor);
    };

    /**
     * Draw a gradient on canvas
     *
     * @param      {HTMLCanvasElement|string}   target   The canvas on which gradient is drawn. Target may be canvas or css selector to canvas (evaluated with querySelector)
     * @param      {Object|Function}            options  Options of gradient or gradient function
     */
    this.draw = (target, options) => {

        let gradient = getCanvasGradient(this, options);
        let canvas = getCanvasTarget(target);

        if (canvas && gradient) {

            let width = canvas.width;
            let height = canvas.height;
            let ctx = canvas.getContext('2d');
            let imageData  = ctx.createImageData(width, height);
            let buffer = imageData.data.buffer;
            let uint32View = new Uint32Array(buffer);
            let uint8CView = new Uint8ClampedArray(buffer);

            for(let x = 0; x < width; x++) {

                for(let y = 0; y < height; y++) {

                    let hsl = gradient(x, y);
                    let rgb = this.to.rgb(hsl);

                    uint32View[y * width + x] = Rgb.to.intabgr(rgb);
                }
            }

            imageData.data.set(uint8CView);

            ctx.putImageData(imageData, 0, 0);
        }
    };

    /**
     * @namespace to
     * @memberof colorutil.hsl
     */
    this.to = {

        /**
         * Hsl object `{h:H, s:S, l:L, a:A}` to rgb object `{r:RRR, g:GGG, b:BBB, a:AAA}`
         *
         * @example
         * colorutil.hsl.to.rgb({h: 1/6, s: 0.5, l: 0.5});
         * // output: {r: 191, g: 191, b: 64, a: 255}
         *
         * colorutil.hsl.to.rgb({h: 1/6, s: 0.5, l: 0.5, a: 0.5});
         * // output: {r: 191, g: 191, b: 64, a: 128}
         *
         * @memberof colorutil.hsl.to
         *
         * @param      {Object}  hsl        Hsl object
         * @return     {Object}
         */
        rgb: hsl => {
            let {h:h, s:s, l:l, a:a} = hsl;
            let c = (1 - Math.abs(2 * l - 1)) * s
            let x = c * (1 - Math.abs(h * 6 % 2 - 1));
            let m = l - c / 2;
            let r, g, b;

            if (h < 1/6) {
                [r, g, b] = [c, x, 0];

            } else if (h < 2/6) {
                [r, g, b] = [x, c, 0];

            } else if (h < 3/6) {
                [r, g, b] = [0, c, x];

            } else if (h < 4/6) {
                [r, g, b] = [0, x, c];

            } else if (h < 5/6) {
                [r, g, b] = [x, 0, c];

            } else {
                [r, g, b] = [c, 0, x];
            }

            return {
                r: (r + m) * 0xFF,
                g: (g + m) * 0xFF,
                b: (b + m) * 0xFF,
                a: a === undefined ? 0xFF : a * 0xFF
            };
        },

        /**
         * Hsl object `{h:H, s:S, l:L, a:A}` to hsv object `{h:H, s:S, v:V, a:A}`
         *
         * @example
         * colorutil.hsl.to.hsv({h: 1/6, s: 0.5, l: 0.5});
         * // output: {h: 0.16666666666666666, s: 0.6666666666666666, v: 0.75, a: 1}
         *
         * @memberof colorutil.hsl.to
         *
         * @param      {Object}  hsl        Hsl object
         * @return     {Object}
         */
        hsv: hsl => {
            let {h:h, s:s, l:l, a:a} = hsl;

            let v = (2 * l + s * (1 - Math.abs(2 * l - 1))) / 2;
            s = (2 * (v - l)) / v;

            return {
                h: h,
                s: s,
                v: v,
                a: a === undefined ? 1 : a
            };
        },

        /**
         * Convert hsl object `{h:H, s:S, l:L}` to hsl functional notation string `'hsl(HHH,SSS%,LLL%)'`.
         *
         * @example
         * colorutil.hsl.to.cssHsl({h:2/6, s:0.5, l:0.5});
         * // output: "hsl(120,50%,50%)"
         *
         * @memberof colorutil.hsl.to
         *
         * @param      {Object}    hsl
         * @return     {string}
         */
        csshsl: hsl => {
            return `hsl(${Math.round(hsl.h*360)},${Math.round(hsl.s*100)}%,${Math.round(hsl.l*100)}%)`;
        },

        /**
         * Convert hsl object `{h:H, s:S, l:L, a:A}` to hsl functional notation string `'hsla(HHH,SSS%,LLL%,A)'`.
         *
         * @example
         * colorutil.hsl.to.csshsla({h:2/6, s:0.5, l:0.5, a:0.5});
         * // output: "hsla(120,50%,50%,0.5)"
         *
         * @memberof colorutil.hsl.to
         *
         * @param      {Object}    hsl
         * @return     {string}
         */
        csshsla: hsl => {
            return `hsla(${Math.round(hsl.h*360)},${Math.round(hsl.s*100)}%,${Math.round(hsl.l*100)}%,${hsl.a})`;
        }
    };
};

function mixColors(color1, color2, position) {

    return {
        h: color1.h - position * (color1.h - color2.h),
        s: color1.s - position * (color1.s - color2.s),
        l: color1.l - position * (color1.l - color2.l),
        a: color1.a - position * (color1.a - color2.a)
    }
}

export default Hsl;