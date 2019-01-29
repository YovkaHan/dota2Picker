import {TYPES} from "./types";
import * as R from 'ramda';
import {criterias, INIT_STATE} from './reducer';

export function initialize(id) {
    return async dispatch => await dispatch({type: TYPES.INITIALIZE, id});
}

export function handleChange(id, index) {
    return async dispatch => await dispatch({type: TYPES.CHANGE, payload: index, id});
}

export function filterCriteriaAtk(id, values) {
    const _key = 'atk';
    const _values = values.filter(value => criterias[_key].indexOf(value) >= 0);
    return async dispatch =>
        await dispatch(
            {
                type: TYPES.FILTER_CRITERIA_MANAGE,
                payload: {
                    key: _key, values: _values.length ? _values.map(value => {
                        return {name: value, status: 2}
                    }) : R.clone(INIT_STATE.criteriaList.atk)
                },
                id
            });
}

export function filterCriteriaRoleChange(id, names, props) {
    return async (dispatch, getState) => {
        const _key = 'roles';
        const rolesFromStore = R.clone(getState().Components.List[id].criteriaList.roles);
        const _names = names.filter(name => criterias[_key].indexOf(name) >= 0);

        await dispatch(
            {
                type: TYPES.FILTER_CRITERIA_MANAGE,
                payload: {
                    key: _key,
                    values: rolesFromStore.map(role => {

                        const _role = _names.indexOf(role.name) >= 0;

                        if(_role && props[role.name]){
                            for(let i in props[role.name]){
                                role[i] = props[role.name][i]
                            }
                        }
                        return role;
                    })
                },
                id
            });
    }
}

export function filterCriteriaRole(id, names, props) {
    return async (dispatch, getState) => {
        const _key = 'roles';
        const rolesFromStore = R.clone(getState().Components.List[id].criteriaList.roles);
        const _names = names.filter(name => criterias[_key].indexOf(name) >= 0);

        await dispatch(
            {
                type: TYPES.FILTER_CRITERIA_MANAGE,
                payload: {
                    key: _key,
                    values:
                        _names.length ?
                            _names.map((name) => {
                                const result = rolesFromStore.find(role => role.name === name);
                                console.log(names, props);
                                return result ?
                                    {
                                        name,
                                        status: props ? props[name] ? props[name].status : result.status : result.status,
                                        value: props ? props[name] ? props[name].value : result.value : result.value
                                    }
                                    :
                                    {
                                        name,
                                        status: props ? props[name] ? props[name].status : 2 : 2,
                                        value: props ? props[name] ? props[name].value : 1 : 1
                                    }
                            })
                            :
                            []
                },
                id
            });
    }
}

export function filterCriteria(id, key, values) {
    const cList = getState().Components.List[id].criteriaList;

    if (criterias.hasOwnProperty(key)) {
        if (value === undefined) {
            return async dispatch => await dispatch({type: TYPES.FILTER_CRITERIA_DELETE, payload: {key}, id});
        }
        return async dispatch => await dispatch({type: TYPES.FILTER_CRITERIA_MANAGE, payload: {key, values}, id});
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
            const criteriaList = getState().Components.List[id].criteriaList;
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
            if (picksBans.length) {
                Object.keys(dataFromList).map(key => {
                    if (!picksBans.find(hero => hero.id === dataFromList[key].id))
                        array.push({
                            id: dataFromList[key].id,
                            sum: dataFromList[key].counterEnemyScore + dataFromList[key].helpTeamScore
                        });
                });
                array.sort((heroA, heroB) => heroB.sum - heroA.sum);

                for(let i in array){
                    const hero = array[i];
                    const _hero = dataFromList[Object.keys(dataFromList).find(key => hero.id === dataFromList[key].id)];

                    const filters = [
                        filterFunctionHeroByAtk(_hero, criteriaList.atk),
                        filterFunctionHeroByRole(_hero, criteriaList.roles)
                    ];

                    if(filters.every(f => f)){
                        result["h" + hero.id] = {sum: hero.sum}
                    }
                }
            }
        } else if (criteria === 'suggestionsDire') {
            const array = [];
            const criteriaList = getState().Components.List[id].criteriaList;
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
            if (picksBans.length) {
                Object.keys(dataFromList).map(key => {
                    if (!picksBans.find(hero => hero.id === dataFromList[key].id))
                        array.push({
                            id: dataFromList[key].id,
                            sum: dataFromList[key].counterTeamScore + dataFromList[key].helpEnemyScoreRaw
                        });
                });
                array.sort((heroA, heroB) => heroB.sum - heroA.sum);


                for(let i in array){
                    const hero = array[i];
                    const _hero = dataFromList[Object.keys(dataFromList).find(key => hero.id === dataFromList[key].id)];

                    const filters = [
                        filterFunctionHeroByAtk(_hero, criteriaList.atk),
                        filterFunctionHeroByRole(_hero, criteriaList.roles)
                    ];

                    if(filters.every(f => f)){
                        result["h" + hero.id] = {sum: hero.sum}
                    }
                }
            }
        }

        await dispatch({type: TYPES.FILTER, payload: result, id})
    };
}

function filterFunctionHeroByAtk(hero, atk) {
    return atk.map(a=>{
        if(a.status === 2){
            return hero.atk.indexOf(a.name) >= 0
        } else  if(a.status === 0){
            return hero.atk.indexOf(a.name) === -1
        } else {
            return true;
        }
    }).every(r => r);
}

function filterFunctionHeroByRole(hero, role) {
    return role.map(r=>{
        if(r.status === 2){
            return hero.roles.indexOf(r.name) >= 0 && hero.rolesIndex[r.name] >= r.value
        } else  if(r.status === 0){
            return hero.roles.indexOf(r.name) === -1
        } else {
            return true;
        }
    }).every(r => r);
}


function suggestionsRadiant(list) {

}