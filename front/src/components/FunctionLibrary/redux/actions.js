import {TYPES} from "./types";
import * as R from 'ramda';

export function initialize(id) {
    return async dispatch => await dispatch({type: TYPES.INITIALIZE, id});
}

export function choseFunction(index, id) {
    return async dispatch => await dispatch({type: TYPES.CHOSE, payload: index, id});
}

export function functionGetter(buffer, id) {
    return async (dispatch, getState) => {
        await (()=>{
            R.clone(getState())
        })();
        await dispatch({type: TYPES.FUNC_GET, payload: index, id});
    }
}