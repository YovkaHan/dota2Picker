import {TYPES} from "./types";
import * as R from 'ramda';

export function initialize(id) {
    return async dispatch => await dispatch({type: TYPES.INITIALIZE, id});
}

/**(id, name, value) => from getState() get index and index+1*/
/**(id, name, value, index)*/
export function pick(id, value, index) {
    return async (dispatch, getState) => {
        const pickList = getState().Components.List[id].picks;
        const pLLength = pickList.length;
        let _index = index ? index : 0;

        if(index === undefined){
            _index = pickList.find((item, itemIndex)=>{
                if(!item.hasOwnProperty('id')){
                    _index = itemIndex;
                    return true;
                }
            }) === undefined ? pLLength+1 : _index;
        }

        if(_index >= 0 && _index < pLLength){
            await dispatch({type: TYPES.PICK, payload: {index: _index , value}, id});
        } else {
            console.log('Wring index!')
        }
    }
}

export function unpick(id, index) {
    return async (dispatch, getState) => {
        const pickList = getState().Components.List[id].picks;
        const pLLength = pickList.length;

        if(index >= 0 && index < pLLength){
            await dispatch({type: TYPES.UNPICK, payload: {index}, id});
        } else {
            console.log('Wring index!')
        }
    }
}

export function ban(id, value, index) {
    return async (dispatch, getState) => {
        const bankList = getState().Components.List[id].bans;
        const bLLength = bankList.length;
        let _index = index ? index : 0;

        if(index === undefined){
            _index = bankList.find((item, itemIndex)=>{
                if(!item.hasOwnProperty('id')){
                    _index = itemIndex;
                    return true;
                }
            }) === undefined ? bLLength+1 : _index;
        }

        if(_index >= 0 && _index < bLLength) {
            await dispatch({type: TYPES.BAN, payload: {index: _index, value}, id});
        } else {
            console.log('Wring index!')
        }
    }
}

export function unban(id, index) {
    return async (dispatch, getState) => {
        const bankList = getState().Components.List[id].bans;
        const bLLength = bankList.length;

        if(index >= 0 && index < bLLength) {
            await dispatch({type: TYPES.UNBAN, payload: {index}, id});
        } else {
            console.log('Wring index!')
        }

    }
}