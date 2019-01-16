import {TYPES} from './types';
import {createReducer} from '../../reducers'
import * as R from 'ramda';

const INIT_STATE = {
    meta: {
        flags: {
            setting: 0,
            processing: 0,
            making: 0,
        }
    },
    buffer: {},
    data: {}
};

const cases = (type) => {
    switch (type) {
        case TYPES.SET_DATA_START: {
            return (draft) => {
                draft.meta.flags.setting = 1;
            };
        }
        case TYPES.SET_DATA_COMPLETE: {
            return (draft, payload) => {
                draft.buffer = payload;
                draft.meta.flags.setting = 2;
            };
        }
        case TYPES.PROCESSING_DATA_START: {
            return (draft) => {
                draft.meta.flags.processing = 1;
            };
        }
        case TYPES.PROCESSING_DATA_COMPLETE: {
            return (draft, payload) => {
                draft.buffer = payload;
                draft.meta.flags.processing = 2;
            };
        }
        case TYPES.MAKE_DATA_START: {
            return (draft) => {
                draft.meta.flags.making = 1;
            };
        }
        case TYPES.MAKE_DATA_COMPLETE: {
            return (draft, payload) => {
                draft.data = payload;
                draft.meta.flags.making = 2;
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
