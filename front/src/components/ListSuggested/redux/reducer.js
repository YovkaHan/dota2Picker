import {TYPES} from './types';
import {createReducer} from '../../reducers'
import * as R from 'ramda';

export const criterias = {
    atk: ['', 'melee', 'ranged'],
    carry: [true, false],
    support: [true, false]
};

const INIT_STATE = {
    name: "",
    filteredData: {},
    criteriaList: {
        atk : "",
        carry: true,
        support: true
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
                draft.criteriaList[payload.key] = payload.value
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
