import {TYPES} from './types';
import {createReducer} from '../../reducers';
import * as R from 'ramda';

const INIT_STATE = {
    chosen: 0
};

const cases = (type) => {
    switch (type) {
        case TYPES.CHOSE: {
            return (draft, payload) => {
                draft.chosen = payload;
                return draft;
            };
        }
        case TYPES.INITIALIZE: {
            const _initClone = R.clone(INIT_STATE);
            return draft => {
                Object.keys(_initClone).map(d => {
                    draft[d] = _initClone[d];
                });
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