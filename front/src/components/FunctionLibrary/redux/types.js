import {actionTemplate} from '../../reducers';

const defaultTypes = {
    INITIALIZE: "INITIALIZE",
    CHOSE: "CHOSE",
    FUNC_GET: "FUNC_GET"
};

const _sequence = ["name","root"];

const _template = {
    name: "FUNCTION_LIBRARY",
    root: {...defaultTypes}
};

const foo = (() =>{
    return actionTemplate(_sequence, _template, '__');
})();

export const TYPES = foo;