
import _ from '../Utils.js';

import GradientDataFlat1D from './GradientDataFlat1D.js';
import GradientDataObject2D from './GradientDataObject2D.js';
import GradientDataArray2D from './GradientDataArray2D.js';
import GradientDataFlat2D from './GradientDataFlat2D.js';

const GRADIENT_DATA_TYPES = [
    GradientDataFlat1D,
    GradientDataObject2D,
    GradientDataArray2D,
    GradientDataFlat2D
];

export default class GradientData {

    static get types() {

        return GRADIENT_DATA_TYPES;
    }

    get typeName() {

        return this.dataType.name;
    }

    get matrix() {

        return this.dataType.matrix;
    }

    get flat1d() {

        if (!_.has(this.dataType, 'toFlat1d')) {

            let data = this.dataType.toObject2d(this.data, this.defaultColor);
            let gradientData = new GradientData(data, this.defaultColor);

            return gradientData.flat1d;
        }

        return this.dataType.toFlat1d(this.data, this.defaultColor);
    }

    get flat2d() {

        if (!_.has(this.dataType, 'toFlat2d')) {

            let data = this.dataType.toObject2d(this.data, this.defaultColor);
            let gradientData = new GradientData(data, this.defaultColor);

            return gradientData.flat2d;
        }

        return this.dataType.toFlat2d(this.data, this.defaultColor);
    }

    get array2d() {

        if (!_.has(this.dataType, 'toArray2d')) {

            let data = this.dataType.toObject2d(this.data, this.defaultColor);
            let gradientData = new GradientData(data, this.defaultColor);

            return gradientData.array2d;
        }

        return this.dataType.toArray2d(this.data, this.defaultColor);
    }

    get object2d() {

        return this.dataType.toObject2d(this.data, this.defaultColor);
    }

    constructor(data, defaultColor) {

        if (!Array.isArray(data) || !data.length) {

            throw new Error('GradientData: Argument should be and array with at least one item.');
        }

        this.dataType = this._getDataTypeFromFirstSample(data);

        if (!this.dataType) {

            throw new Error('GradientData: One sample was tested and it did not match any supported data structures.');
        }

        this.data = data;
        this.defaultColor = defaultColor;
    }

    verify() {

        return this.dataType.verify(this.data);
    }

    _getDataTypeFromFirstSample(data) {

        return _.find(GRADIENT_DATA_TYPES, (dataType) => {

            return dataType.testStructure(data);
        });
    }
};