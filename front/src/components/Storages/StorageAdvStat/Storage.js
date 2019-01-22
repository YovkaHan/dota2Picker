import React from 'react';
import axios from 'axios';
import {Socket} from "../../index";

class Storage extends React.Component {
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
        await setData(new Promise((resolve, reject) => {
            this.state.socket.heroesAdvStatGet(resolve, reject)
        }));
        // await functionProcess(this.props.sequence);
        // await makeOutput();
        await this.state.socket.onDisconnect()
    };

    render(){
        return null
    }
}

export default Storage;