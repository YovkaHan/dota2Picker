import {actionTemplate} from '../../reducers';

const defaultTypes = {
    INITIALIZE: "INITIALIZE",
    PICK: "PICK",
    UNPICK: "UNPICK",
    BAN: "BAN",
    UNBAN: "UNBAN"
};

const _sequence = ["name","root"];

const _template = {
  name: "LIST",
  root: {...defaultTypes}
};

const foo = (() =>{
    return actionTemplate(_sequence, _template, '__');
})();

export const TYPES = foo;
