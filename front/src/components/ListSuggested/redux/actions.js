import {TYPES} from "./types";
import * as R from 'ramda';
import {criterias} from './reducer';

export function initialize(id) {
    return async dispatch => await dispatch({type: TYPES.INITIALIZE, id});
}

export function handleChange(id, index) {
    return async dispatch => await dispatch({type: TYPES.CHANGE, payload: index, id});
}

export function filterCriteriaAtk(id, value){
    const _key = 'atk';
    const _value = criterias[_key].indexOf(value) >= 0 ? value : criterias[_key][0];
    return async dispatch => await dispatch({type: TYPES.FILTER_CRITERIA_MANAGE, payload: {key: _key, value: _value}, id});
}

export function filterCriteria(id, key, value) {
    const cList = getState().Components.List[id].criteriaList;

    if(criterias.hasOwnProperty(key)){
        if(value === undefined){
            return async dispatch => await dispatch({type: TYPES.FILTER_CRITERIA_DELETE, payload: {key}, id});
        }
        return async dispatch => await dispatch({type: TYPES.FILTER_CRITERIA_MANAGE, payload: {key, value}, id});
    } else {
        return async dispatch => await dispatch({type: 'ERROR'});
    }
}

export function filterData(id, dataStorageId, path = 'data', criteria) {
    return async (dispatch, getState) => {
        const dataFromList = R.path(path, getState().Components.Core[dataStorageId]);
        const result = {};

        if (criteria === 'name') {
            const name = getState().Components.List[id].name;


            Object.keys(dataFromList).map(key => {
                if (dataFromList[key].name.toLowerCase().indexOf(name.toLowerCase()) >= 0) {
                    result[key] = {};
                }
            });
        } else if (criteria === 'suggestionsRadiant') {
            /** (   counterEnemy / helpTeam )*/
            const array = [];
            const picksBans = (() => {
                const radiantList = getState().Components.List['list1'];
                const direList = getState().Components.List['list2'];

                return [
                    ...radiantList.picks.filter(pick => pick.hasOwnProperty('name')),
                    ...radiantList.bans.filter(ban => ban.hasOwnProperty('name')),
                    ...direList.picks.filter(pick => pick.hasOwnProperty('name')),
                    ...direList.bans.filter(ban => ban.hasOwnProperty('name'))
                ]
            })();
            if(picksBans.length){
                Object.keys(dataFromList).map(key => {
                    if (!picksBans.find(hero => hero.id === dataFromList[key].id))
                        array.push({
                            id: dataFromList[key].id,
                            sum: dataFromList[key].counterEnemyScore + dataFromList[key].helpTeamScore
                        });
                });
                array.sort((heroA, heroB) => heroB.sum - heroA.sum);
                array.map(hero => {
                    result["h" + hero.id] = {sum: hero.sum}
                });
            }
        } else if (criteria === 'suggestionsDire') {
            const array = [];
            const picksBans = (() => {
                const radiantList = getState().Components.List['list1'];
                const direList = getState().Components.List['list2'];

                return [
                    ...radiantList.picks.filter(pick => pick.hasOwnProperty('name')),
                    ...radiantList.bans.filter(ban => ban.hasOwnProperty('name')),
                    ...direList.picks.filter(pick => pick.hasOwnProperty('name')),
                    ...direList.bans.filter(ban => ban.hasOwnProperty('name'))
                ]
            })();
            if(picksBans.length){
                Object.keys(dataFromList).map(key => {
                    if (!picksBans.find(hero => hero.id === dataFromList[key].id))
                        array.push({
                            id: dataFromList[key].id,
                            sum: dataFromList[key].counterTeamScore + dataFromList[key].helpEnemyScoreRaw
                        });
                });
                array.sort((heroA, heroB) => heroB.sum - heroA.sum);
                array.map(hero => {
                    result["h" + hero.id] = {sum: hero.sum}
                });
            }
        }

        await dispatch({type: TYPES.FILTER, payload: result, id})
    };
}


function suggestionsRadiant(list) {

}