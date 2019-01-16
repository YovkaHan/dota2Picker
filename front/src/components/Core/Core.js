import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from "react-redux";
 import * as R from 'ramda';
// import { createSelector } from 'reselect';

import {setData, makeOutput, functionProcess} from './redux/actions';

class Core extends React.Component {

    constructor(props) {
        super(props);

        this.sequence = {
            'first': ()=>{
                return new Promise((resolve, reject) => {
                    console.log('Launch Processing');
                    resolve();
                })
            },
            'last': ()=>{
                return new Promise((resolve, reject) => {
                    console.log('Stop Processing');
                    resolve();
                })
            },
        };

        this.sequenceManage = this.sequenceManage.bind(this);
    }

    sequenceManage(id, foo) {
        return new Promise((resolve, reject) => {
            this.sequence[id] = foo;
            resolve();
        });
    }

    render() {
        const {store, pcb, children, setData, makeOutput, functionProcess} = this.props;

        const childrenWithProps = React.Children.map(children, child =>
            React.cloneElement(child, {
                sequence: this.sequence,
                sequenceManage: this.sequenceManage,
                pcb,
                setData,
                makeOutput,
                functionProcess
            })
        );

        return (
            <React.Fragment>
                {childrenWithProps}
            </React.Fragment>
        )
    }
}

// const mapStateToProps = (state, props) => {
//     return ({
//         store: state.Core[props.pcb.id]
//     })
// };
const mapDispatchers = (dispatch, props) => {
    const id = props.pcb.relations.Core.id;

    return bindActionCreators({
        setData: (data) => setData(id, data),
        makeOutput: () => makeOutput(id),
        functionProcess: (sequence) => functionProcess(id, sequence),
    }, dispatch);
};

export default connect(undefined, mapDispatchers)(Core);