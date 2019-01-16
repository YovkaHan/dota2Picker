import React from 'react';
import {FooX2equalsY, FooXequalsY} from './lib';
import {connect} from "react-redux";
import {bindActionCreators} from 'redux';
import {choseFunction} from "../FunctionLibrary/redux/actions";

class FunctionLibrary extends React.Component {

    static defaultProps = {
        chosen: 0
    };

    constructor(props){
        super(props);

        this.state = {
            fList: [
                {title:'X2 = Y', value: <FooX2equalsY {...props} parentId={props.pcb.id} pcb={props.pcb.children['FooX2equalsY']} />},
                {title:'X = Y', value: <FooXequalsY {...props} parentId={props.pcb.id} pcb={props.pcb.children['FooXequalsY']}/>}
                ]
        }
    }

    render(){

        const {chosen, choseFunction} = this.props;
        const {fList} = this.state;

        return(
            <div className={`function-library`}>
              <div className={`function-library__content`}>
                  <div className={`function-library__view`}>
                      {fList[chosen] ? fList[chosen].value : null}
                  </div>
                  <div className={`function-library__list functions-list`}>
                      {
                          fList.map((item, index) =>
                              <div key={item.title} onClick={()=>choseFunction(index)} className={`functions-list__item ${index === chosen ? 'functions-list__item--active' : ''}`}>{item.title}</div>)
                      }
                  </div>
              </div>
            </div>
        )
    }
}

const mapStateToProps = (state, props) => {
    return({
        chosen: state.FunctionLibrary[props.pcb.id].chosen,
    })};
const mapDispatchers = (dispatch, props) => {
    return bindActionCreators({
        choseFunction: (index)=> choseFunction(index, props.pcb.id),
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchers)(FunctionLibrary);