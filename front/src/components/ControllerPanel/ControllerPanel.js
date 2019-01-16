import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from "react-redux";
// import * as R from 'ramda';
// import { createSelector } from 'reselect';

import {OutputX, OutputY, OutputXY, DotsList, FunctionLibrary} from '../';

import {downloadData, makeOutput, functionProcess} from './redux/actions';

class ControllerPanel extends React.Component {

    static defaultProps = {
        output: [{x: -10, y: 0}, {x: 10, y: 0}]
    };

    constructor(props) {
        super(props);

        this.state = {
            rebuild: false
        };

        this.sequence = {
            'first': ()=>{
              console.log('Launch Processing')
            },
            [props.pcb.children['FunctionLibrary'].id] : ()=>{},
            'last': ()=>{
                console.log('Stop Processing')
            },
        };

        this.initLoop = this.initLoop.bind(this);
        this.secondaryLoop = this.secondaryLoop.bind(this);
        this.sequenceManage = this.sequenceManage.bind(this);

        this.initLoop();
    }

    sequenceManage(id, foo) {
        this.sequence[id] = foo();
    }

    fireRebuild = () => {
        this.setState({rebuild: true});
    };

    async initLoop() {
        await this.props.downloadData();
        await this.props.functionProcess(this.sequence, this.props.pcb.id);
        await this.props.makeOutput();
    }

    async secondaryLoop() {
        await this.props.functionProcess(this.sequence, this.props.pcb.id);
        await this.props.makeOutput();
    }

    componentDidUpdate() {
        if (this.state.rebuild) {
            this.secondaryLoop();
            this.setState({rebuild: false})
        }
    }

    render() {
        const {output, pcb} = this.props;

        // console.log('RENDER CONTROLLER', this.state);

        return (
            <div className={`panel`}>
                <div className={`panel-content`}>
                    <div className={`panel-section panel-section--graphs`}>
                        <div className={`panel__x`}>
                            <OutputX data={output}/>
                        </div>
                        <div className={`panel__y`}>
                            <OutputY data={output}/>
                        </div>
                        <div className={`panel__xy`}>
                            <OutputXY data={output}/>
                        </div>
                    </div>
                    <div className={`panel-section`}>
                        <div className={`panel__dots`}>
                            <DotsList data={output}/>
                        </div>
                    </div>
                    <div className={`panel-section`}>
                        <FunctionLibrary
                            pcb={pcb.children['FunctionLibrary']}
                            sequenceManage={this.sequenceManage}
                            fireRebuild={this.fireRebuild}
                        />
                    </div>
                </div>
            </div>
        )
    }
}

// const rootSelector = R.prop('ControllerPanel');
//
// const outputSelector = createSelector(
//     rootSelector,
//     (root) => R.path(['output'], root)
// );

const mapStateToProps = (state, props) => {
    return ({
        output: state.ControllerPanel[props.pcb.id].output,
    })
};
// const mapDispatchers = {
//     downloadData,
//     makeOutput,
//     functionProcess
// };
const mapDispatchers = (dispatch, props) => {
    return bindActionCreators({
        downloadData: () => downloadData(props.pcb.id, props.pcb.relations['Dummy'].id),
        makeOutput: () => makeOutput(props.pcb.id),
        functionProcess
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchers)(ControllerPanel);