import {TYPES} from "./types";
import * as R from 'ramda';

export function initialize(id) {
    return async dispatch => await dispatch({type: TYPES.INITIALIZE, id});
}

export function downloadData(id, dummyId) {
    return async (dispatch, getState) => {
        await dispatch({type: TYPES.DOWNLOAD_DATA_START, id});
        await dispatch({type: TYPES.DOWNLOAD_DATA_COMPLETE, payload: R.clone(getState()).Dummy[dummyId].library.data, id});
    }
}

export function functionProcess(sequence = {}, id) {
    return async (dispatch, getState) => {
        const _buffer = R.clone(getState()).ControllerPanel[id].buffer;

        await dispatch({type: TYPES.PROCESSING_DATA_START});
        await (function () {
            Object.keys(sequence).map(foo => sequence[foo](_buffer))
        }());
        await dispatch({type: TYPES.PROCESSING_DATA_COMPLETE, payload: _buffer, id});
    }
}

export function makeOutput(id) {
    return async (dispatch, getState) => {
        await dispatch({type: TYPES.MAKE_OUTPUT_DATA_START, id});
        await dispatch({type: TYPES.MAKE_OUTPUT_DATA_COMPLETE, payload: R.clone(getState()).ControllerPanel[id].buffer, id});
    }
}
