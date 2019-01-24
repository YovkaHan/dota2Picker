import {TYPES} from './types';
import {createReducer} from '../../reducers'
import * as R from 'ramda';

export const criterias = {
    atk: ['melee', 'ranged'],
    roles: ['Carry', 'Support', 'Nuker',
        'Disabler', 'Jungler', 'Durable',
        'Escape', 'Pusher', 'Initiator',
        'Hard-carry', 'Semi-carry', 'Ganker',
        'Roamer', 'Offlaner'],
};

export const INIT_STATE = {
    name: "",
    filteredData: {},
    criteriaList: {
        atk: criterias.atk.map(a=>{
            return {
                name: a,
                status: 1, /** 0 - исключение, 1 - дефолт, 2 - включение*/
            }
        }),
        roles: []
        // roles: criterias.roles.map(role=>{
        //     return {
        //         name: role,
        //         status: 1, /** 0 - исключение, 1 - дефолт, 2 - включение*/
        //         value: 1
        //     }
        // })
    }
};

const cases = (type) => {
    switch (type) {
        case TYPES.INITIALIZE: {
            const _initClone = R.clone(INIT_STATE);
            return draft => {
                Object.keys(_initClone).map(d => {
                    draft[d] = _initClone[d];
                });
            };
        }
        case TYPES.CHANGE: {
            return (draft, payload) => {
                const target = payload;

                switch (target.name) {
                    case 'name' : {
                        draft[target.name] = target.value;
                        break;
                    }
                }
            };
        }
        case TYPES.FILTER: {
            return (draft, payload) => {
                draft.filteredData = payload;
            };
        }
        case TYPES.FILTER_CRITERIA_MANAGE: {
            return (draft, payload) => {
                draft.criteriaList[payload.key] = payload.values
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
