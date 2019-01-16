import {TYPES} from './types';
import {createReducer} from '../../reducers'
import * as R from 'ramda';

const INIT_STATE = {
    buffer: [],
    output: [],
    flags: {
        downloading: false,
        processing: false,
        outputReady: true,
    }
};

const cases = (type) => {
    switch (type) {
        case TYPES.DOWNLOAD_DATA_START: {
            return (draft) => {
                draft.flags.downloading = true;
            };
        }
        case TYPES.DOWNLOAD_DATA_COMPLETE: {
            return (draft, payload) => {
                draft.buffer = payload;
                draft.flags.downloading = false;
            };
        }
        case TYPES.PROCESSING_DATA_START: {
            return (draft) => {
                draft.flags.processing = true;
            };
        }
        case TYPES.PROCESSING_DATA_COMPLETE: {
            return (draft, payload) => {
                draft.buffer = payload;
                draft.flags.processing = false;
            };
        }
        case TYPES.MAKE_OUTPUT_DATA_START: {
            return (draft) => {
                draft.flags.outputReady = false;
            };
        }
        case TYPES.MAKE_OUTPUT_DATA_COMPLETE: {
            return (draft, payload) => {
                draft.output = payload;
                draft.flags.outputReady = true;
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
