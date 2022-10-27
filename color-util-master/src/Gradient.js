
import _ from './Utils.js';
import Repeat from './Repeat.js';
import GradientData from './gradientData/GradientData.js';

export default new function() {

    const PI2 = Math.PI * 2;

    /**
     * Creates a gradient.
     *
     * @param      {Object}    options                              Options provided by user
     * @param      {Array}     options.colors                       Array of colors or instance of GradientData. There are multiple types of data structures. Data structure
     *                                                              defines whether the gradient is one or two dimensional.
     * @param      {string}    [options.type='linear']              Gradient type: linear | circular
     * @param      {boolean}   [options.verify=false]               Verify that each of the colors in colors property have valid data structure.
     *                                                              If set to true, createGradient will throw an error if data structure is not correct.
     *                                                              Data structure is tested from one sample to identify the data structure. This does not
     *                                                              affect that behavior.
     * @param      {boolean}   [options.validate=true]              Validate and add missing color stops and convert colors data structure to internal data structure
     * @param      {function}  [options.defaultColor={h:0,s:0,v:0,a:1}] Default color used to fill the missing color components in gradient colors.
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
     * @param      {function}  [options.repeatX=ColorUtil.repeat.repeat] X repetition of gradient when calculating a color that is out of normal range 0 to 1.
     * @param      {function}  [options.repeatY=ColorUtil.repeat.repeat] Y repetition of gradient when calculating a color that is out of normal range 0 to 1.
     *
     * @param      {Object}    typeOptions                          Options provided by the color type
     * @param      {Object}    typeOptions.defaultColor             Default color used to fill the missing color components in gradinet colors.
     *                                                              User options override this.
     * @param      {function}  typeOptions.mixColors                Function calculating the mix of two colors
     * @return     {function}  Function that calculates a color for a single point on gradient. Accepts x and y parameters.
     *                         Though the x and y may exceed the limit, but gradient repeat will take effect.
     * @private
     */
    this.createGradient = (options, typeOptions={}) => {

        options = options || {};

        let type = _.includes(['linear', 'circular'], options.type) ? options.type : 'linear';
        let verify = _.get(options, 'verify', false);
        let validate = _.get(options, 'validate', true);
        let onValidationComplete = options.onValidationComplete || _.noop;
        let fn = null;
        let gradientData = null;

        if (options.colors instanceof GradientData) {

            gradientData = options.colors;

        } else {

            let defaultColor = options.defaultColor || typeOptions.defaultColor;

            gradientData = new GradientData(options.colors, defaultColor);
        }

        if (verify) {

            gradientData.verify();
        }

        let colors = gradientData.matrix ? gradientData.object2d : gradientData.flat1d;

        onValidationComplete(colors);

        let centerX = 0;
        let centerY = 0;

        if (type === 'circular') {

            fn = gradientData.matrix ? this.circularMatrixGradient : this.circularGradient;

        } else {

            centerX = options.centerX || 0;
            centerY = options.centerY || 0;

            fn = gradientData.matrix ? this.linearMatrixGradient : this.linearGradient;
        }

        let width = options.width || 100;
        let height = options.height || 100;
        let scaleX = options.scaleX || options.scale || 1;
        let scaleY = options.scaleY || options.scale || 1;
        let sizeX = width * scaleX;
        let sizeY = height * scaleY;
        let translateX = options.translateX || 0;
        let translateY = options.translateY || 0;

        if (type === 'circular') {

            // circular gradient size is double compared to linear gradient
            // compensate to make a circle diameter fit insde the width and height
            scaleX = scaleX / 2;
            scaleY = scaleY / 2;
            sizeX = width * scaleX;
            sizeY = height * scaleY;
            translateX = translateX * 2;
            translateY = translateY * 2;
        }

        if (options.centralize) {

            if (type === 'linear') {

                // set center point to center of the gradient
                centerX = 0.5;
                centerY = 0.5;
            }

            // translate gradient to the center and adjust with scaling (0.5 / scale)
            // then translate normally
            translateX = (0.5 / scaleX + translateX) - centerX;
            translateY = (0.5 / scaleY + translateY) - centerY;

        } else {

            translateX = translateX - centerX;
            translateY = translateY - centerY;
        }

        let gradientFunctionOptions = {
            colors: colors,
            centerX: centerX || 0,
            centerY: centerY || 0,
            translateX: translateX,
            translateY: translateY,
            rotation: options.rotation || 0,
            repeatX: options.repeatX || Repeat.repeat,
            repeatY: options.repeatY || Repeat.repeat,
            mixColors: typeOptions.mixColors
        };

        return (x, y) => {

            return fn(x/sizeX, y/sizeY, gradientFunctionOptions);
        };
    };

    /**
     * Calculate two items from a gradient array and a relative position of
     * the gradient between those two items in an evenly distributed
     * gradient. The resulting values can be used calculate the final color.
     *
     * @example
     * // The example position 0.25 is in the middle of the first and
     * // second colors so new 2 point gradient array contains only those
     * // first and second colors. The given absolute position 0.25 is relatively
     * // 0.5 between those two values.
     * ColorUtil.convertTo2StopGradient([0xFF0000, 0x00FF00, 0x0000FF], 0.25);
     * // output: {array: [0xFF0000, 0x00FF00], position: 0.5}
     *
     * @param {Array} array     Array of colors. Content of the array does not matter.
     * @param {number} position Position on the whole gradient.
     * @return {Object} Relative position between two items and two items from gradient array
     *                           which are the closest to the point indicated by position argument
     *
     * @private
     */
    this.partialGradient = (array, position) => {

        let lastIndex = array.length - 1;
        let itemIndex = (position * lastIndex) | 0;
        let partSize = 1 / lastIndex * 1000;
        let positionBetweenItems = ((position*1000) % partSize) / partSize;

        // partSize and position are scaled in the above calculation to fix
        // a javascrip decimal rounding problem. The issue was seen in a gradient
        // in which there were exactly 6 colors. positionBetweenItems for the first
        // color of the 4th gradient stop was rounded to 0.9999... where the correct
        // value was 0 (0.6 % 0.2 = 0.1999.... should be 0)
        // That resulted to a weird vertical line in a gradient

        let item1 = array[itemIndex];
        let item2 = array[itemIndex+1] !== undefined ? array[itemIndex+1] : item1;

        return {
            item1: item1,
            item2: item2,
            position: positionBetweenItems
        }
    };

    /**
     * Calculate two items from a gradient array and a relative position of
     * the gradient between those two items in a gradient whichs has stop colors
     * The resulting values can be used calculate the final color.
     *
     * @example
     * // The example position 0.25 is in the middle of the first and
     * // second colors so new 2 point gradient array contains only those
     * // first and second colors. The given absolute position 0.25 is relatively
     * // 0.5 between those two values.
     * ColorUtil.convertTo2StopGradient([0xFF0000, 0x00FF00, 0x0000FF], 0.25);
     * // output: {array: [0xFF0000, 0x00FF00], position: 0.5}
     *
     * @param {Array} array      Array of colors. Array should have colors stops on x or y axis.
     * @param {number} position  Position on the whole gradient.
     * @return {Object} Relative position between two items and two items from gradient array
     *                           which are the closest to the point indicated by position argument
     *
     * @private
     */
    this.partialGradientWithStops = (array, position, axis) => {

        let i = 0;

        while (array[i][axis] < position) {
            i++;
        }

        let item1 = array[i-1] !== undefined ? array[i-1] : array[i];
        let item2 = array[i];
        let partSize = item2[axis] - item1[axis];

        return {
            item1: item1,
            item2: item2,
            position: ((position - item1[axis]) / partSize) || 0
        }
    };

    /**
     * Get color from gradient. Calculation is done in
     * rgb object notation so colors should be converted to object notation.
     *
     * @example
     * let gradient = ColorUtil.convert([0xFF0000, 0x00FF00, 0x0000FF], ColorUtil.int.toRgb);
     * ColorUtil.rgb.gradientColor(gradient, 0.5);
     * // output: {r: 0, g: 255, b: 0, a: 255}
     *
     * @param {Array} colors    Array of colors. Colors should be in rgb object notation.
     * @param {number} x        Horizontal position on the gradient. Value in range 0-1.
     * @param {number} y        Vertical position on the gradient. Value in range 0-1.
     * @param {number} centerX       Horizontal position of rotation center. Value in range 0-1.
     * @param {number} centerY       Vertical position of rotation center. Value in range 0-1.
     * @param {function} [repeatX=Repeat.stop]  Repeat function
     * @return {Object} rgb object
     *
     * @private
     */
    this.linearGradient = (x, y, options) => {
        let radian = options.rotation * PI2;
        let cos = Math.cos(radian);
        let sin = Math.sin(radian);
        let dx = (x - options.centerX) - options.translateX;
        let dy = (y - options.centerY) - options.translateY;

        x = options.repeatX(options.centerX + dx * cos - dy * sin);

        let parts = this.partialGradientWithStops(options.colors, x, 'x');

        return options.mixColors(
            parts.item1,
            parts.item2,
            parts.position);
    };

    /**
     * Get color from matrix. Calculation is done in
     * rgb object notation so colors should be converted to object notation.
     *
     * @example
     * let matrix = ColorUtil.convert([[0xFF0000, 0x00FF00], [0x0000FF]], ColorUtil.int.toRgb);
     * ColorUtil.rgb.matrixColor(matrix, 0.5, 0.5);
     * // output: {r: 63.75, g: 63.75, b: 127.5, a: 255}
     *
     * @param {Array} matrix    Array of gradient color arrays. Colors should be in rgb object notation.
     * @param {number} x        Horizontal position on the gradient. Value in range 0-1.
     * @param {number} y        Vertical position on the gradient. Value in range 0-1.
     * @param {number} centerX       Horizontal position of rotation center. Value in range 0-1.
     * @param {number} centerY       Vertical position of rotation center. Value in range 0-1.
     * @param {function} [repeatX=Repeat.stop]  Repeat function
     * @param {function} [repeatY=Repeat.stop]  Repeat function
     * @return {Object} rgb object
     *
     * @private
     */
    this.linearMatrixGradient = (x, y, options) => {

        let radian = options.rotation * PI2;
        let cos = Math.cos(radian);
        let sin = Math.sin(radian);
        let dx = (x - options.centerX) - options.translateX;
        let dy = (y - options.centerY) - options.translateY;

        x = options.repeatX(options.centerX + dx * cos - dy * sin);
        y = options.repeatY(options.centerY + dx * sin + dy * cos);

        // get gradients and y position between them
        let gradients = this.partialGradientWithStops(options.colors, y, 'y');
        let parts1 = this.partialGradientWithStops(gradients.item1.colors, x, 'x');
        let parts2 = this.partialGradientWithStops(gradients.item2.colors, x, 'x');

        let color1 = options.mixColors(parts1.item1, parts1.item2, parts1.position);
        let color2 = options.mixColors(parts2.item1, parts2.item2, parts2.position);

        return options.mixColors(color1, color2, gradients.position);
    };

    /**
     * Get color from circle gradient. Calculation is done in
     * rgb object notation so colors should be converted to object notation.
     *
     * @example
     * let colors = ColorUtil.rgb.hueColors();
     * ColorUtil.rgb.circleGradientColor(colors, 0.1, 0.1);
     * // output: {r: 0, g: 63.74999999999994, b: 255, a: 255}
     *
     * // keep center the same but rotatio 180 degrees
     * ColorUtil.rgb.circleGradientColor(colors, 0.1, 0.1, 0.5, 0.5, 0.5);
     * // output: {r: 255, g: 191.25, b: 0, a: 255}
     *
     * @param      {Array}   colors      Array of colors. Colors should be in rgb object notation.
     * @param      {number}  x           Horizontal position on the gradient. Value in range 0-1.
     * @param      {number}  y           Vertical position on the gradient. Value in range 0-1.
     * @param      {number}  centerX          Horizontal position of center point. Value in range 0-1.
     * @param      {number}  centerY          Vertical position of center point. Value in range 0-1.
     * @param      {number}  rotation    Rotation of the gradient. Value in range 0-1.
     * @param      {function}  [repeatX=Repeat.repeat]  Repeat function
     * @return     {Object}  rgb object
     *
     * @private
     */
    this.circularGradient = (x, y, options) => {

        let tx = options.translateX;
        let ty = options.translateY;

        let angle = options.repeatX(
            (Math.atan2(ty - y, tx - x) + Math.PI) / PI2 - options.rotation);
        let parts = this.partialGradientWithStops(options.colors, angle, 'x');

        return options.mixColors(parts.item1, parts.item2, parts.position);
    }

    /**
     * Get color from circle matrix. Calculation is done in
     * rgb object notation so colors should be converted to object notation.
     *
     * @example
     * // center is white, outer edge has hue colors
     * let matrix = [[{r:255, g: 255, b: 255, a: 255}], ColorUtil.rgb.hueColors()];
     * ColorUtil.rgb.circleMatrixColor(matrix, 0.1, 0.1);
     * // output: {r: 110.75021663794428, g: 146.81266247845818, b: 255, a: 255}
     *
     * @param      {Array}   matrix      Matrix of colors. Colors should be in rgb object notation.
     * @param      {number}  x           Horizontal position on the gradient. Value in range 0-1.
     * @param      {number}  y           Vertical position on the gradient. Value in range 0-1.
     * @param      {number}  centerX          Horizontal position of center. Value in range 0-1.
     * @param      {number}  centerY          Vertical position of center. Value in range 0-1.
     * @param      {number}  rotation    Rotation of the gradient. Value in range 0-1.
     * @param      {function}  [repeatX=Repeat.repeat]  Repeat function
     * @param      {function}  [repeatY=Repeat.repeat]  Repeat function
     * @return     {Object}  rgb object
     *
     * @private
     */
    this.circularMatrixGradient = (x, y, options) => {

        let tx = options.translateX;
        let ty = options.translateY;
        let dx = tx - x;
        let dy = ty - y;
        let distance = options.repeatY(Math.sqrt(dx * dx + dy * dy));
        let angle = options.repeatX((Math.atan2(dy, dx) + Math.PI) / PI2 - options.rotation);

        // get gradients and y position between them
        let gradients = this.partialGradientWithStops(options.colors, distance, 'y');
        let parts1 = this.partialGradientWithStops(gradients.item1.colors, angle, 'x');
        let parts2 = this.partialGradientWithStops(gradients.item2.colors, angle, 'x');

        let color1 = options.mixColors(parts1.item1, parts1.item2, parts1.position);
        let color2 = options.mixColors(parts2.item1, parts2.item2, parts2.position);

        return options.mixColors(color1, color2, gradients.position);
    }

}();