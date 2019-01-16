import {TYPES} from "./types";
import * as R from 'ramda';

export function initialize(id) {
    return async dispatch => await dispatch({type: TYPES.INITIALIZE, id});
}

export function handleChange(id, index) {
    return async dispatch => await dispatch({type: TYPES.CHANGE, payload: index, id});
}

export function filterData(id, dataStorageId, path = 'data') {
    return async (dispatch, getState) => {
        const dataFromList = getState().Components.Core[dataStorageId][path];
        const name = getState().Components.List[id].name;
        const result = {};

        Object.keys(dataFromList).map(key=>{
            if(dataFromList[key].name.toLowerCase().indexOf(name.toLowerCase()) >= 0){
                result[key] = {};
            }
        });

        await dispatch({type: TYPES.FILTER, payload: result, id})
    };
}