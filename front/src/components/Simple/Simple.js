import React from 'react';
import {connect} from "react-redux";
import {Socket} from '../';

class List extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            socket: Socket(this),
        };

        this.initLoop = this.initLoop.bind(this);

        this.initLoop();
    }

    async initLoop() {
        const {setData, functionProcess, makeOutput, sequenceManage} = this.props;
        //await setData([{details: '1', name: '1'}, {details: '2', name: '2'}]);
        await functionProcess({
            first: this.props.sequence['first'],
            last: this.props.sequence['last']
        });
        await makeOutput();
    };

    render() {
        const {output} = this.props;

        return (
            <div className={`simple`}>
                {output.map(item=><div key={item.details}>{item.name}</div>)}
            </div>
        )
    }
}

const mapStateToProps = (state, props) => {
    return ({
        output: state.Core[props.pcb.id].output
    })
};

export default connect(mapStateToProps)(List);