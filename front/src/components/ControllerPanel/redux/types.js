import {actionTemplate} from '../../reducers';

const defaultTypes = {
    INITIALIZE: "INITIALIZE",
    DOWNLOAD_DATA_COMPLETE: "DOWNLOAD_DATA_COMPLETE",
    DOWNLOAD_DATA_START: "DOWNLOAD_DATA_START",
    PROCESSING_DATA_START: "PROCESSING_DATA_START",
    PROCESSING_DATA_COMPLETE: "PROCESSING_DATA_COMPLETE",
    MAKE_OUTPUT_DATA_START: "MAKE_OUTPUT_DATA_START",
    MAKE_OUTPUT_DATA_COMPLETE: "MAKE_OUTPUT_DATA_COMPLETE"
};

const _sequence = ["name","root"];

const _template = {
  name: "CNTRLR_PNL",
  root: {...defaultTypes}
};

const foo = (() =>{
    return actionTemplate(_sequence, _template, '__');
})();

export const TYPES = foo;
