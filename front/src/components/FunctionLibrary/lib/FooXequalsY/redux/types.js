import {actionTemplate} from '../../../../reducers';

const defaultTypes = {
    INITIALIZE: "INITIALIZE",
    CHANGE: "CHANGE"
};

const _sequence = ["name","root"];

const _template = {
    name: "FUNCTION_XY",
    root: {...defaultTypes}
};

const foo = (() =>{
    return actionTemplate(_sequence, _template, '__');
})();

export const TYPES = foo;