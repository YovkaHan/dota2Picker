import React from 'react';

import OutputY from './OutputY';

class OutputYWrap extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            y: []
        }
    }

    shouldComponentUpdate(nextProps, nextState){

        return !(JSON.stringify(this.props.data) === JSON.stringify(nextProps.data));
    }

    static getDerivedStateFromProps(props, state){
        const {data} = props;

        return {
            ...state,
            y: data ? data.map(dot => dot.y) : []
        }
    }

    render(){
        const {y} = this.state;

        return(<OutputY y={y}/>)
    }
}
export default OutputYWrap;