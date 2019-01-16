import React from 'react';
import PropTypes from 'prop-types';

import './style.scss';

class OutputY extends React.Component {
    static defaultProps = {
        y: [0]
    };

    constructor(props) {
        super(props);

        this.state={
            yPartsNum: 9
        }
    }

    render() {

        const {y} = this.props;
        const {yPartsNum} = this.state;

        // console.log('RENDER Y', y);

        return (
            <div className={`output-y`}>
                <div className={`output-y__content`}>
                    <div className={`coords`}>
                        <div className={`coords__y`}>
                            {
                                new Array(yPartsNum).fill(0).map((part, index)=>(
                                    <div key={index} className={`part part${index === 4 ? '--center' : ''}`} style={{top: `calc(${10*(index+1)}% - 1px)`}}></div>
                                ))
                            }
                        </div>
                        {
                            y.map((value, index)=>{
                                const _y = ((v)=>{
                                    return (200 - v);
                                })(value);

                                return  y.find((fValue, fIndex) => index > fIndex && fValue === value) !== undefined ?
                                    null : !Number.isNaN(_y) ? <div key={`y-dot-${value}`} className={`dot`} style={{top: _y}}></div> :null
                            })
                        }
                    </div>
                </div>
            </div>
        )
    }
}

OutputY.propTypes = {
    y: PropTypes.array,
};

export default OutputY;