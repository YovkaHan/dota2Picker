import React from 'react';
import PropTypes from 'prop-types';
import * as R from 'ramda';

import './style.scss';

class OutputXY extends React.Component {
    static defaultProps = {
        xy: [{x:0, y:0}]
    };


    constructor(props) {
        super(props);

        this.state = {
            xPartsNum: 9,
            yPartsNum: 9,
        };
    }

    render() {
        const {xPartsNum, yPartsNum} = this.state;
        const {xy} = this.props;

        // console.log('RENDER XY', xy);

        return (
            <div className={`output-xy`}>
                <div className={`output-xy__content`}>
                    <div className={`coords`}>
                        <div className={`coords__x`}>
                            {
                                new Array(xPartsNum).fill(0).map((part, index) => (
                                    <div key={index} className={`part part${index === 4 ? '--center' : ''}`}
                                         style={{left: `calc(${10 * (index + 1)}% - 1px)`}}></div>
                                ))
                            }
                        </div>
                        <div className={`coords__y`}>
                            {
                                new Array(yPartsNum).fill(0).map((part, index) => (
                                    <div key={index} className={`part part${index === 4 ? '--center' : ''}`}
                                         style={{top: `calc(${10 * (index + 1)}% - 1px)`}}></div>
                                ))
                            }
                        </div>
                        <div className={`coords__center`}></div>
                        {
                            xy.map((dot, index) => {
                                const _x = ((v) => {
                                    return (v + 200);
                                })(dot.x);

                                const _y = ((v) => {
                                    return (200 - v);
                                })(dot.y);

                                return !(Number.isNaN(_y) || Number.isNaN(_x)) ?
                                    <div key={`dot__${index}__x${_x}__y${_y}`} className={`dot`} style={{top: _y, left: _x}}></div> : null
                            })
                        }
                    </div>
                </div>
            </div>
        )
    }
}

OutputXY.propTypes = {
    xy: PropTypes.array
};

export default OutputXY;