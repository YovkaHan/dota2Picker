import {TYPES} from './types';
import {createReducer} from '../../../../reducers';
import * as R from 'ramda';

const INIT_STATE = {
    a: 1,
    b: 10,
    c: 0,
    x: -20,
    y: 0,
    find: 'y',
    selector: {
        on: false,
        from: {value: 0, operator: '='},
        to: {value: 0, operator: '='},
        step: 1
    }
};

const cases = (type) => {
    switch (type) {
        case TYPES.INITIALIZE: {
            const _initClone = R.clone(INIT_STATE);
            return draft => {
                Object.keys(_initClone).map(d => {
                    draft[d] = _initClone[d];
                });
            };
        }
        case TYPES.CHANGE: {
            return (draft, payload) => {
                const target = payload;

                switch (target.name) {
                    case 'a' :
                    case 'b' :
                    case 'c' : {
                        draft[target.name] = target.value ? parseFloat(target.value) : 0;
                        break;
                    }
                    case 'x' :
                    case 'y' : {
                        draft[target.name] =  target.value ? parseFloat(target.value) : 0;
                        break;
                    }
                    case 'find' : {
                        draft[target.name] = target.value;
                        draft[target.value] = 0;
                        break;
                    }
                    case 'selector-on' : {
                        draft.selector.on = target.checked;
                        break;
                    }
                    case 'from' :
                    case 'to' : {
                        draft.selector[target.name].value = target.value ? parseFloat(target.value) : 0;
                        break;
                    }
                    case 'step' : {
                        draft.selector[target.name] = target.value ? parseFloat(target.value) : 0;
                        break;
                    }
                }
            };
        }
        default : {
            return () => {
            }
        }
    }
};

const reducer = function (id) {
    return createReducer(cases, INIT_STATE, id);
};

export default reducer;