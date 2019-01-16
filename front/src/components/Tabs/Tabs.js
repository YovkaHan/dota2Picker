import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from "react-redux";
import PropTypes from 'prop-types';
import {handleChange} from './redux/actions';
import * as R from 'ramda';
import {ban, pick} from "../PickList/redux/actions";
import {filterData} from "../List/redux/actions";

class Tabs extends React.Component {

    render(){
        const {rootClass} = this.props;

        return(
            <div className={`${rootClass}__tabs tabs`}>
                <div className={`tabs__item`}>Possible Picks</div>
                <div className={`tabs__item`}>Stats</div>
            </div>
        )
    }
}

Tabs.propTypes = {
    rootClass: PropTypes.string,
    currentTab: PropTypes.string,
};

const mapStateToProps = (state, props) => {
    const currentTab = state.Components.Tabs[props.pcb.id].currentTab;

    return ({
        currentTab
    })
};

const mapDispatchers = (dispatch, props) => {
    return bindActionCreators({
        handleChange: (e) => handleChange(props.pcb.id, e.target)
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchers)(Tabs);