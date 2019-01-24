import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from "react-redux";
import {_Select} from '../';
import {setValues} from "./redux/actions";

class SelectR extends React.Component {
    render() {
        return(
            <React.Fragment>
                <_Select {...this.props} postValues={this.props.setValues}/>
            </React.Fragment>
        )
    }
}

const mapDispatchers = (dispatch, props) => {
    return bindActionCreators({
        setValues: (values) => setValues(props.pcb.id, values),
    }, dispatch);
};

export default connect(null, mapDispatchers)(SelectR);