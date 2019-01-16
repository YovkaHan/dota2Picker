import {TYPES} from './types';
import {createReducer} from '../../../../reducers';
import * as R from 'ramda';

const INIT_STATE = {
    a: 1,
    b: 10,
    c: 0,
    x: -20,
    y: 0,
    find: 'y',
    selector: {
        on: false,
        from: {value: 0, operator: '='},
        to: {value: 0, operator: '='},
        step: 1
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
                    case 'a' :
                    case 'b' :
                    case 'c' : {
                        draft[target.name] = target.value ? parseFloat(target.value) : 0;
                        break;
                    }
                    case 'x' :
                    case 'y' : {
                        draft[target.name] = target.value ? parseFloat(target.value) : 0;
                        break;
                    }
                    case 'find' : {
                        draft[target.name] = target.value;
                        draft[target.value] = 0;
                        break;
                    }
                    case 'selector-on' : {
                        draft.selector.on = target.checked;
                        break;
                    }
                    case 'from' :
                    case 'to' : {
                        draft.selector[target.name].value = target.value ? parseFloat(target.value) : 0;
                        break;
                    }
                    case 'step' : {
                        draft.selector[target.name] = target.value ? parseFloat(target.value) : 0;
                        break;
                    }
                }
            };
        }
        case TYPES.PROCESS: {
            return (draft, payload) => {

                const {a, b, c, x, y, find, selector} = draft;
                const xy = payload[0];

                while (payload.length) {
                    payload.pop();
                }

                if (selector.on) {

                    const count = Math.floor(Math.abs(selector.from.value - selector.to.value) / selector.step + 1);

                    if (find === 'y') {
                        const _innerBuffer = new Array(count).fill(0).map((item, index) => {
                            const _index = selector.from.value <= selector.to.value ? index * selector.step : index * selector.step * -1;

                            return {x: selector.from.value + _index, y: 0}
                        });

                        _innerBuffer.map(item => {
                            item.y = (Math.pow(item.x, 2) * a + c) / b;
                            payload.push(item);
                        })

                    } else if (find === 'x') {
                        const _innerBuffer = new Array(count * 2).fill(0);

                        for (let i = 0, index = 0; i < _innerBuffer.length; i++) {
                            const _index = Math.floor(selector.from.value <= selector.to.value ? index * selector.step : index * selector.step * -1);

                            _innerBuffer[i] = {x: 0, y: selector.from.value + _index};

                            if (i % 2) {
                                index++;
                            }
                        }

                        _innerBuffer.map((item, index) => {
                            item.x = index % 2 ? (Math.sqrt(b * item.y - c) / a) : (Math.sqrt(b * item.y - c) / a) * (-1);

                            check(payload[0]) ? payload.push(item) : {};
                        })
                    }

                } else {
                    if (find === 'y') {

                        xy.x = x;
                        xy.y = (Math.pow(x, 2) * a + c) / b;
                        payload.push(xy);

                    } else if (find === 'x') {
                        payload.push(xy);
                        payload[0].y = y;

                        if (payload.length <= 1) {
                            payload.push({x: 0, y: y})
                        }

                        payload[0].x = (Math.sqrt(b * y - c) / a);
                        payload[1].x = (Math.sqrt(b * y - c) / a) * (-1);

                        !check(payload[0]) ? payload.shift() : {};
                        !check(payload[1]) ? payload.pop() : {};
                    }
                }

                function check(object) {

                    const error = new Error();

                    try {
                        Object.keys(object).map(key => {
                            if (!object[key]) {
                                throw error;
                            }
                            console.log(object[key]);
                        });
                    } catch (e) {
                        return false
                    }
                    return true;
                }


            }
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