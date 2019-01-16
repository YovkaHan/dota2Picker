import React from 'react';
import {connect} from "react-redux";
import {bindActionCreators} from 'redux';
import {handleChange} from "./redux/actions";

class FooXequalsY extends React.Component {

    constructor(props) {
        super(props);

        this.specialProcessFunction = this.specialProcessFunction.bind(this);

        props.sequenceManage(props.parentId, this.specialProcessFunction)
    }

    specialProcessFunction() {
        return (_buffer) => {
            console.log('Processing XY');
            const {a, b, c, x, y, find, selector} = this.props;
            const xy = _buffer[0];

            while (_buffer.length) {
                _buffer.pop();
            }

            if (selector.on) {

                const count = Math.floor(Math.abs(selector.from.value - selector.to.value) / selector.step + 1);

                if (find === 'y') {
                    const _innerBuffer = new Array(count).fill(0).map((item, index) => {
                        const _index = selector.from.value <= selector.to.value ? index * selector.step : index * selector.step * -1;

                        return {x: selector.from.value + _index, y: 0}
                    });

                    _innerBuffer.map(item => {
                        item.y = (a*item.x + c) / b;
                        _buffer.push(item);
                    })

                } else if (find === 'x') {
                    const _innerBuffer = new Array(count).fill(0).map((item, index) => {
                        const _index = selector.from.value <= selector.to.value ? index * selector.step : index * selector.step * -1;

                        return {x: 0, y: selector.from.value + _index}
                    });

                    _innerBuffer.map(item => {
                        item.x = (c + b*item.y) / a;
                        _buffer.push(item);
                    })
                }

            } else {
                if (find === 'y') {

                    xy.x = x;
                    xy.y = (x * a + c) / b;
                    _buffer.push(xy);

                } else if (find === 'x') {

                    xy.y = y;
                    xy.x = (c + b * y) / a;
                    _buffer.push(xy);
                }
            }
        }
    }

    render() {

        const {a, b, c, x, y, find, selector, handleChange} = this.props;

        return (
            <div className={`foo`}>
                <div className={`foo__selector selector`}>
                    <div className={`selector__item selector__item--flag`}>
                        <div>Selector on :</div>
                        <input type={`checkbox`} name={'selector-on'} checked={selector.on}
                                            onChange={handleChange}/>
                    </div>
                    <div className={`selector__item`}>
                        <div>
                            <div>From</div>
                            <input className={`selector__input`} name="from" type={`text`} value={selector.from.value}
                                   onChange={handleChange}/>
                        </div>
                        <div>
                            <div>to</div>
                            <input className={`selector__input`} name="to" type={`text`} value={selector.to.value}
                                   onChange={handleChange}/>
                        </div>
                        <div>
                            <div>with step</div>
                            <input className={`selector__input`} name="step" type={`number`} value={selector.step}
                                   onChange={handleChange}/>
                        </div>
                    </div>
                </div>
                <div className={`foo__formula formula`}>
                    <div className={`formula__find`}>
                        Find : &nbsp;
                        <select name="find" value={find} onChange={handleChange}>
                            <option value={`x`}>X</option>
                            <option value={`y`}>Y</option>
                        </select>
                    </div>
                    <div className={`formula__text`}> A * X - B * Y + C</div>
                </div>
                <div className={`foo__function`}>
                    <div className={`foo-variable`}>
                        <div className={`foo-variable__name`}>A</div>
                        <input className={`foo-variable__value`} type="number" name={`a`} value={a}
                               onChange={handleChange}/>
                    </div>
                    <div className={`foo-variable`}>
                        <div className={`foo-variable__name`}>X<sup>2</sup></div>
                        <input className={`foo-variable__value`} type="number" name={`x`}
                               disabled={find === 'x' || selector.on} value={x}
                               onChange={handleChange}/>
                    </div>
                    <div className={`foo-variable`}>
                        <div className={`foo-variable__name`}>B</div>
                        <input className={`foo-variable__value`} type="number" name={`b`} value={b}
                               onChange={handleChange}/>
                    </div>
                    <div className={`foo-variable`}>
                        <div className={`foo-variable__name`}>Y</div>
                        <input className={`foo-variable__value`} type="number" name={`y`}
                               disabled={find === 'y' || selector.on} value={y}
                               onChange={handleChange}/>
                    </div>
                    <div className={`foo-variable`}>
                        <div className={`foo-variable__name`}>C</div>
                        <input className={`foo-variable__value`} type="number" name={`c`} value={c}
                               onChange={handleChange}/>
                    </div>
                </div>
                <div className={`foo__btn btn`}>
                    <span className={`btn__value`} onClick={this.props.fireRebuild}>Build</span>
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state, props) => {
    return({
        a: state.Function[props.pcb.id].a,
        b: state.Function[props.pcb.id].b,
        c: state.Function[props.pcb.id].c,
        x: state.Function[props.pcb.id].x,
        y: state.Function[props.pcb.id].y,
        find: state.Function[props.pcb.id].find,
        selector: state.Function[props.pcb.id].selector,
    })};
const mapDispatchers = (dispatch, props) => {
    return bindActionCreators({
        handleChange: (e)=> handleChange(e.target, props.pcb.id),
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchers)(FooXequalsY);