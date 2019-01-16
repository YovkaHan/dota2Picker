import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from "react-redux";
import PropTypes from 'prop-types';
import {unban, unpick} from './redux/actions';
import * as R from 'ramda';

// import { createSelector } from 'reselect';

class ImagePick extends React.Component {
    static defaultProps = {
        rootClass: '',
        inactive: false,
        hidden: false,
        onClose: ()=>{}
    };

    render() {

        const {name, propertyName, rootClass, inactive, hidden, onClose} = this.props;

        const style = {
            backgroundImage: `url(http://cdn.dota2.com/apps/dota2/images/heroes/${propertyName}_vert.jpg)`,
        };

        return (
            <div className={`${rootClass} ${inactive? `${rootClass}--inactive`: ''} ${hidden ? `${rootClass}--hidden`: '' } image`} style={style}>
                <i className="material-icons close" onClick={onClose}>close</i>
            </div>
        )
    }
}

class ImageBan extends React.Component {
    static defaultProps = {
        rootClass: '',
        inactive: false,
        hidden: false,
        onClose: ()=>{}
    };

    render() {

        const {name, propertyName, rootClass, inactive, hidden, onClose} = this.props;

        const style = {
            backgroundImage: `url(http://cdn.dota2.com/apps/dota2/images/heroes/${propertyName}_full.png)`,
        };

        return (
            <div
                className={`${rootClass} ${inactive? `${rootClass}--inactive`: ''} ${hidden ? `${rootClass}--hidden`: '' } image`}
                style={style}
                onClick={onClose}
            />
        )
    }
}

class PickList extends React.Component {

    static defaultProps = {
        rootClass: 'xd-list'
    };

    constructor(props) {
        super(props);

        this.state = {
            initiated: false
        };

    }

    componentDidUpdate() {
        if (!this.state.initiated && this.props.dataFromStorageIsReady) {
            this.setState({
                initiated: true
            })
        }
    }

    render() {
        const {rootClass, picks, bans, unban, unpick} = this.props;

        return (
            <div className={rootClass}>
                {
                    this.state.initiated ?
                        <React.Fragment>
                            <div className={`${rootClass}__bans ban-list`}>
                                {
                                   bans.map((item, index) => {
                                            return (
                                                <div key={index} className={`ban-list__item`}>
                                                    {item.hasOwnProperty('id') ?
                                                        <ImageBan
                                                            rootClass={`${rootClass}__image`}
                                                            propertyName={item.propertyName}
                                                            inactive={true}
                                                            name={item.name}
                                                            onClose={()=>unban(index)}
                                                        /> : null}
                                                </div>)
                                        })
                                }
                            </div>
                            <div className={`${rootClass}__picks pick-list`}>
                                {
                                    picks.map((item, index) => {
                                            return (
                                                <div key={index} className={`pick-list__item`}>
                                                    {item.hasOwnProperty('id') ?
                                                        <ImagePick
                                                            rootClass={`${rootClass}__image`}
                                                            propertyName={item.propertyName}
                                                            inactive={false}
                                                            name={item.name}
                                                            onClose={()=>unpick(index)}
                                                        /> : null}
                                                </div>)
                                        })
                                }
                            </div>
                        </React.Fragment> : null
                }
            </div>
        )
    }
}

PickList.propTypes = {
    dataFromStorage: PropTypes.object,
    name: PropTypes.string,
    handleChange: PropTypes.func,
    dataFromStorageIsReady: PropTypes.bool
};

const mapStateToProps = (state, props) => {
    return ({
        data: state.Components.Core[props.pcb.relations.Data.id].buffer,
        dataFromStorageIsReady: state.Components.Core[props.pcb.relations.Data.id].meta.flags.setting === 2,
        picks: state.Components.List[props.pcb.id].picks,
        bans: state.Components.List[props.pcb.id].bans
    })
};

const mapDispatchers = (dispatch, props) => {
    return bindActionCreators({
        unban: (index) => unban(props.pcb.id, index),
        unpick: (index) => unpick(props.pcb.id, index)
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchers)(PickList);