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
        const {rootClass, currentTab, handleChange} = this.props;

        return(
            <div className={`${rootClass}__tabs tabs`}>
                <div
                    className={`tabs__item ${currentTab === 'Possible Picks' ? 'tabs__item--active' : ''}`}
                    onClick={()=>handleChange('Possible Picks')}
                >Possible Picks</div>
                <div
                    className={`tabs__item ${currentTab === 'Stats' ? 'tabs__item--active' : ''}`}
                    onClick={()=>handleChange('Stats')}
                >Stats</div>
            </div>
        )
    }
}

Tabs.propTypes = {
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

export default connect(mapStateToProps, mapDispatchers)(Tabs);