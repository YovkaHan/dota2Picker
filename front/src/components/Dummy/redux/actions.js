import * as TYPES from "./types";

export function initialize(id) {
    return async dispatch => await dispatch({type: TYPES.INITIALIZE, id});
}

export function increment(id) {
    return async dispatch => await dispatch({type: TYPES.INCREMENT, id});
}

export function decrement(id) {
    return async dispatch => await dispatch({type: TYPES.DECREMENT, id});
}

