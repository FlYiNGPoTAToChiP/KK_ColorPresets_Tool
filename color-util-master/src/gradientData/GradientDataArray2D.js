
import _ from '../Utils.js';
import GradientDataUtil from './GradientDataUtil.js';

/*
Two dimensional self scaling matrix data structure
[
    [
        {},
        {}
    ],
    [
        {},
        {x: ...}
    ].y = ...
];
*/
export default class {

    static get name () {

        return 'array2d';
    }

    static get matrix() {

        return true;
    }

    static testStructure(colors) {

        let sample = _.get(colors, '0');

        return this.testStructureSingleSample(sample);
    }

    static verify(colors) {

        return GradientDataUtil.verify(colors, this);
    }

    static testStructureSingleSample(sample) {

        let subSamples = sample;
        let isValid = Array.isArray(sample) && subSamples.length > 0;

        if (!isValid) {

            return false;
        }

        for (let i = 0; i < subSamples.length; i++) {

            let subSample = subSamples[i];

            isValid = _.isObject(subSample);

            if (!isValid) {

                return false;
            }
        }

        return true;
    }

    static toObject2d(colors, defaultColor) {

        let data = colors.map((item) => {

            let newItem = {}

            if (_.isNumber(item.y)) {

                newItem.y = item.y;
            }

            newItem.colors = item;

            return newItem;
        });

        data = GradientDataUtil.addMissingStopsXY(data);

        GradientDataUtil.addDefaultColorsForMatrix(data, defaultColor);

        return data;
    }
}