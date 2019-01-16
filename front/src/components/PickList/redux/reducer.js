import {TYPES} from './types';
import {createReducer} from '../../reducers'
import * as R from 'ramda';

const INIT_STATE = {
    picks: [
        {},
        {},
        {},
        {},
        {}
    ],
    bans: [
        {},
        {},
        {},
        {},
        {},
        {},
    ]
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
        case TYPES.PICK: {
            return (draft, payload) => {
                const {index, value} = payload;

                draft.picks[index] =  R.clone(value);
            };
        }
        case TYPES.UNPICK: {
            return (draft, payload) => {
                const {index} = payload;

                draft.picks = draft.picks.map((pick, picksIndex) => picksIndex === index ? {} : pick);
            };
        }
        case TYPES.BAN: {
            return (draft, payload) => {
                const {index, value} = payload;

                draft.bans[index] =  R.clone(value);
            };
        }
        case TYPES.UNBAN: {
            return (draft, payload) => {
                const {index} = payload;

                draft.bans = draft.bans.map((pick, banIndex) => banIndex === index ? {} : pick);
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
