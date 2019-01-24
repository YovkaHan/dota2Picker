import {TYPES} from './types';
import {createReducer} from '../../reducers/index'
import * as R from 'ramda';

const INIT_STATE = {
    values: []
};

const cases = (type) => {
    switch (type) {
        case TYPES.CHANGE: {
            return (draft, payload) => {
                draft.values = payload;
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
