import React from 'react';

import DotsList from './DotsList';

class DotsListWrap extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            dots: []
        }
    }

    static getDerivedStateFromProps(props, state){
        const {data} = props;

        return {
            ...state,
            dots: data ? data.map(dot => {return {x: dot.x, y: dot.y}}) : []
        }
    }

    render(){
        const {dots} = this.state;

        return(<DotsList dots={dots}/>)
    }
}

export default DotsListWrap;