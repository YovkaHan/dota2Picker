import React from 'react';

import OutputXY from './OutputXY';

class OutputXYWrap extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            xy: []
        }
    }

    shouldComponentUpdate(nextProps, nextState){

        return !(JSON.stringify(this.props.data) === JSON.stringify(nextProps.data));
    }

    static getDerivedStateFromProps(props, state){
        const {data} = props;

        return {
            ...state,
            xy: data ? data.map(dot => {return {x: dot.x, y: dot.y}}) : []
        }
    }

    render(){
        const {xy} = this.state;

        return(<OutputXY xy={xy}/>)
    }
}

export default OutputXYWrap;