import React from 'react';

import OutputX from './OutputX';

class OutputXWrap extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            x: []
        }
    }

    shouldComponentUpdate(nextProps, nextState){

        return !(JSON.stringify(this.props.data) === JSON.stringify(nextProps.data));
    }

    static getDerivedStateFromProps(props, state){
        const {data} = props;

        return {
            ...state,
            x: data ? data.map(dot => dot.x) : []
        }
    }

    render(){
        const {x} = this.state;

        return(<OutputX x={x}/>)
    }
}

export default OutputXWrap;