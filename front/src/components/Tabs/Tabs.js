import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from "react-redux";
import PropTypes from 'prop-types';
import {handleChange} from './redux/actions';
import {Tabs} from '../';
import * as R from 'ramda';
import {ban, pick} from "../PickList/redux/actions";
import {filterData} from "../List/redux/actions";

class _Tabs extends React.Component {

    constructor(props){
        super(props);

        this.prerendered = {};

        this.state = {
            renderedOptionKey: null,
            renderedOption: null
        };

        props.pcb.options.map(option=>{
            if(option.prerendered) {
                const _props = {...option.value.props, pcb: props.pcb.make(option.value.pcb.name)};
                this.prerendered[option.key] = option.value.node(_props)
            }
        })
    }

    componentDidUpdate(){
        const {currentTab, pcb} = this.props;

        // if(this.state.renderedOptionKey !== this.props.currentTab
        //     && !this.prerendered.hasOwnProperty(this.state.renderedOptionKey) /** Есть ли option в this.prerendere*/
        //     && pcb.options.find(option => option.key === this.state.renderedOptionKey && option.hasOwnProperty('prerendered') && option.prerendered) /** Если option указан как prerendered*/
        // ){
        //
        //     this.prerendered[this.state.renderedOptionKey] = this.state.renderedOption;
        // }
        if(this.state.renderedOptionKey !== this.props.currentTab){
            const _option = pcb.options.find(option => option.key === currentTab);

            if(_option && _option.hasOwnProperty('prerendered') && _option.prerendered){
                // const buff = this.prerendered[_option.key];
                //
                // delete this.prerendered[_option.key];

                this.setState({
                    renderedOptionKey: _option.key,
                     renderedOption: null
                })
            } else {
                const props = _option ? {..._option.value.props, pcb: pcb.make(_option.value.pcb.name)} : {};
                this.setState({
                    renderedOptionKey: _option ? _option.key : this.props.currentTab,
                    renderedOption: _option ? _option.value.node(props) : null
                })
            }
        }
    }

    render() {
        const {rootClass, currentTab, handleChange, pcb} = this.props;

        return (
            <React.Fragment>
                <div className={`${rootClass}__tabs tabs`}>
                    {
                        pcb.options.map(option => {
                            return (
                                <div
                                    key={option.key}
                                    className={`tabs__item ${currentTab === option.key ? 'tabs__item--active' : ''}`}
                                    onClick={() => handleChange(option.key)}
                                >{option.name}</div>
                            )
                        })
                    }
                </div>
                <div className={`${rootClass}__view view`}>
                    {
                        this.state.renderedOption
                    }
                    {
                        (() => Object.keys(this.prerendered).map(key => <div
                            key={key}
                            style={this.state.renderedOptionKey === key ? {display: 'flex', 'flexDirection': 'column'} : {display: 'none'}}
                        >{this.prerendered[key]}</div>))()
                    }
                </div>
            </React.Fragment>
        )
    }
}

_Tabs.propTypes = {
    rootClass: PropTypes.string,
    pcb: PropTypes.object
};

const mapStateToProps = (state, props) => {
    const currentTab = state.Components.Tabs[props.pcb.id].currentTab;

    return ({
        currentTab
    })
};

const mapDispatchers = (dispatch, props) => {
    return bindActionCreators({
        handleChange: (data) => handleChange(props.pcb.id, data)
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchers)(_Tabs);

/**
 * $$typeof: Symbol(react.element)
 key: null
 props: {rootClass: "counter-picker", pcb: {…}}
 ref: null
 type: "div"
 _owner: FiberNode {tag: 1, key: null, elementType: ƒ, type: ƒ, stateNode: _Tabs, …}
 _store: {validated: false}
 _self: null
 _source: null
 __proto__: Object
 * */