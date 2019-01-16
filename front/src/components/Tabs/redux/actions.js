import {TYPES} from "./types";
import * as R from 'ramda';

export function initialize(id) {
    return async dispatch => await dispatch({type: TYPES.INITIALIZE, id});
}

export function handleChange(id, data) {
    return async dispatch => await dispatch({type: TYPES.CHANGE, payload: data, id});
}