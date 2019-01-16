import * as TYPES from './types';
import {createReducer} from '../../reducers';
import * as R from 'ramda';

const INIT_STATE = {
    count: 0,
    objects: [
        {
            text: 'Hi,',
            inner: {
                text: 1
            }
        },
        {
            text: 'I',
            inner: {
                text: 2
            }
        },
        {
            text: 'am',
            inner: {
                text: 2
            }
        },
        {
            text: 'Dummy',
            inner: {
                text: 3
            }
        }
    ],
    library: {
        data: [{x:20, y:0}]
    }
};

const cases = (type) => {
    switch (type) {
        case TYPES.INCREMENT: {
            return draft => draft.count < 3 ? draft.count += 1 : null;
        }
        case TYPES.DECREMENT: {
            return draft => draft.count > 0 ? draft.count -= 1 : null;
        }
        case TYPES.RESET: {
            return draft => draft.count = 0;
        }
        case TYPES.INITIALIZE: {
            const _initClone = R.clone(INIT_STATE);
            return draft => {
                Object.keys(_initClone).map(d => {
                    draft[d] = _initClone[d];
                });
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
