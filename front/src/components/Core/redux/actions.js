import {TYPES} from "./types";
import * as R from 'ramda';

export function initialize(id) {
    return async dispatch => await dispatch({type: TYPES.INITIALIZE, id});
}

/**id - String, data - object, Promise*/
export function setData(id, data) {
    return async dispatch => {
        await dispatch({type: TYPES.SET_DATA_START, id});
        const _data = await (function(){
            return new Promise((resolve, reject) => {
                if(typeof data === 'object' && typeof data.then === 'function'){
                    console.log('SET_DATA_START 1 '+ id);
                    data.then((result, error)=>{
                        console.log('SET_DATA_START 2 '+ id);
                        resolve(result.data);
                        reject([]);
                    })
                } else if (Array.isArray(data)){
                    const _data = {};

                    data.map((item, index)=>{
                        _data[index] = item;
                    });

                    resolve(_data);
                } else if (typeof data === 'object'){
                    resolve(data);
                } else {
                    resolve([]);
                }
            });
        })();
        await dispatch({type: TYPES.SET_DATA_COMPLETE, payload: _data, id});
    }
}

export function functionProcess(id, sequence = {}) {
    return async (dispatch, getState) => {
        const _buffer = R.clone(getState()).Components.Core[id].buffer;

        await dispatch({type: TYPES.PROCESSING_DATA_START, id});
        await (async function () {
            for (const foo in  sequence){
                await sequence[foo](_buffer);
            }
        }());
        await dispatch({type: TYPES.PROCESSING_DATA_COMPLETE, payload: _buffer, id});
    }
}

export function makeOutput(id) {
    return async (dispatch, getState) => {
        await dispatch({type: TYPES.MAKE_DATA_START, id});
        await dispatch({type: TYPES.MAKE_DATA_COMPLETE, payload: R.clone(getState()).Components.Core[id].buffer, id});
    }
}
