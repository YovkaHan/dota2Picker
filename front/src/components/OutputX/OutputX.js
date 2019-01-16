import React from 'react';
import PropTypes from 'prop-types';

import './style.scss';

class OutputX extends React.Component {

    static defaultProps = {
        x: [0]
    };

    constructor(props) {
        super(props);

        this.state={
            xPartsNum: 9
        }
    }

    render() {

        const {x} = this.props;
        const {xPartsNum} = this.state;

        // console.log('RENDER X', x);

        return (
            <div className={`output-x`}>
                <div className={`output-x__content`}>
                    <div className={`coords`}>
                        <div className={`coords__x`}>
                            {
                                new Array(xPartsNum).fill(0).map((part, index)=>(
                                    <div key={index} className={`part part${index === 4 ? '--center' : ''}`} style={{left: `calc(${10*(index+1)}% - 1px)`}}></div>
                                ))
                            }
                        </div>
                        {
                            x.map((value, index)=>{
                                const _x = ((v)=>{
                                    return (v+200);
                                })(value);

                                return  x.find((fValue, fIndex) => index > fIndex && fValue === value) !== undefined ?
                                    null :
                                    !Number.isNaN(_x) ? <div key={`x-dot-${value}`} className={`dot`} style={{left: _x}}></div> : null
                            })
                        }
                    </div>
                </div>
            </div>
        )
    }
}

OutputX.propTypes = {
    x: PropTypes.array,
};

export default OutputX;