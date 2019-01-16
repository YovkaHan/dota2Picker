import {actionTemplate} from '../../reducers';

const defaultTypes = {
    INITIALIZE: "INITIALIZE",
    SET_DATA_START: "SET_DATA_START",
    SET_DATA_COMPLETE: "SET_DATA_COMPLETE",
    PROCESSING_DATA_START: "PROCESSING_DATA_START",
    PROCESSING_DATA_COMPLETE: "PROCESSING_DATA_COMPLETE",
    MAKE_DATA_START: "MAKE_DATA_START",
    MAKE_DATA_COMPLETE: "MAKE_DATA_COMPLETE"
};

const _sequence = ["name","root"];

const _template = {
  name: "CORE",
  root: {...defaultTypes}
};

const foo = (() =>{
    return actionTemplate(_sequence, _template, '__');
})();

export const TYPES = foo;
