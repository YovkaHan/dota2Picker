import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from "react-redux";
import PropTypes from 'prop-types';
import {handleChange, filterData} from './redux/actions';
// import {pick, ban} from "../PickList/redux/actions";
import * as R from 'ramda';
import {ban, pick} from "../PickList/redux/actions";

// import { createSelector } from 'reselect';

class Image extends React.Component {
    static defaultProps = {
        rootClass: '',
        inactive: false,
        hidden: false
    };

    render() {
        const {name, propertyName, rootClass, inactive, hidden} = this.props;

        const style = {
            backgroundImage: `url(http://cdn.dota2.com/apps/dota2/images/heroes/${propertyName}_full.png)`,
        };

        return (
            <div
                className={`${rootClass} ${inactive ? `${rootClass}--inactive` : ''} ${hidden ? `${rootClass}--hidden` : ''} image`}
                style={style}
            >
                {name}
            </div>
        )
    }
}

class ItemHover extends React.Component {

    static defaultProps = {
        radiantPick: () => {
        },
        radiantBan: () => {
        },
        direPick: () => {
        },
        direBan: () => {
        }
    };

    render() {
        const {visible, radiantPick, radiantBan, direPick, direBan} = this.props;
        return (
            <div className={`item-hover ${visible ? 'item-hover--visible' : ''}`}>
                <div className={`item-hover__item item-hover__item--radiant`}>
                    <span className={`inner`} onClick={radiantPick}><span
                        className={`team-name`}>Radiant</span> pick</span>
                    <span className={`inner`} onClick={radiantBan}><span
                        className={`team-name`}>Radiant</span> ban</span>
                </div>
                <div className={`item-hover__item item-hover__item--dire`}>
                    <span className={`inner`} onClick={direPick}><span className={`team-name`}>Dire</span> pick</span>
                    <span className={`inner`} onClick={direBan}><span className={`team-name`}>Dire</span> ban</span>
                </div>
            </div>
        )
    }
}

class ListItem extends React.Component {

    static defaultProps = {
        filteredData: {},
        item: '',
        rootClass: '',
        data: {}
    };

    state = {
        hover: false
    };

    onMouseOver = (isOver) => {
        this.setState({hover: isOver})
    };

    render() {

        const {
            filteredData,
            item,
            rootClass,
            data,
            radiantPick,
            radiantBan,
            direPick,
            direBan
        } = this.props;

        return (
            <div
                className={`${rootClass}__item list__item ${!filteredData.hasOwnProperty('h' + data[item].id) ? 'list__item--hidden' : ''}`}
                onMouseOver={() => this.onMouseOver(true)}
                onMouseLeave={() => this.onMouseOver(false)}
            >
                <Image rootClass={`${rootClass}__image`}
                       propertyName={data[item].propertyName}
                       name={data[item].name}
                />
                <ItemHover
                    visible={this.state.hover}
                    radiantPick={() => radiantPick(data[item])}
                    radiantBan={() => radiantBan(data[item])}
                    direPick={() => direPick(data[item])}
                    direBan={() => direBan(data[item])}
                />
            </div>
        )
    }
}

class ListSuggested extends React.Component {

    static defaultProps = {
        rootClass: 'xd-list',
        suggestionSet: 'suggestionsRadiant'
    };

    constructor(props) {
        super(props);

        this.state = {
            initiated: false,
            dataStatus: props.dataStatus,
        };

        this.initLoop = this.initLoop.bind(this);
    }

    /**В initLoop нам не нужны
     * setData
     * functionProcess и соответствеено makeOutput так как данные в данном компоненте только отображаются и фильтруются
     * */

    async initLoop() {
        const {setData, functionProcess, makeOutput, filterData} = this.props;

        // await setData(this.props.dataFromStorage);
        // await functionProcess(this.props.sequence);
        // await makeOutput();
        await filterData();
    };

    componentDidUpdate() {
        if (!this.state.initiated && this.props.dataFromStorageIsReady) {
            this.setState({
                dataStatus: this.props.dataStatus,
                initiated: true
            }, this.initLoop)
        } else if (this.props.dataStatus !== this.state.dataStatus) {
            this.setState({
                dataStatus: this.props.dataStatus,
            }, () => {
                this.state.dataStatus === 2 ? this.props.filterData() : {}
            })
        }
    }

    shouldComponentUpdate(nextProps) {

        const oldO = {
            data: this.props.data,
            dataFromStorageIsReady: this.props.dataFromStorageIsReady,
            dataStatus: this.props.dataStatus,
            filteredData: this.props.filteredData
        };
        const newO = {
            data: nextProps.data,
            dataFromStorageIsReady: nextProps.dataFromStorageIsReady,
            dataStatus: nextProps.dataStatus,
            filteredData: nextProps.filteredData
        };

        return !(JSON.stringify(oldO) === JSON.stringify(newO));
    }

    render() {
        const {
            data,
            rootClass,
            dataIsReady,
            filteredData,
            radiantPick,
            radiantBan,
            direPick,
            direBan
        } = this.props;

        const _herosGet = (()=>{
            const result = {carries:[], supports:[]};

            Object.keys(filteredData).map((hero) => {
                const _hero = data[Object.keys(data).find((item) => data[item].id == hero.slice(1))];

                if(_hero && _hero.roles.indexOf('Carry') >= 0){
                    result.carries.push(_hero.name)
                }
                if(_hero && _hero.roles.indexOf('Support') >= 0){
                    result.supports.push(_hero.name)
                }
            });
            return result;
        })();

        return (
            <div className={rootClass}>
                <div className={`${rootClass}__item`}>
                    <div className={`${rootClass}__title`}>Carries</div>
                    <div className={`heroes`}>
                        <div className={`${rootClass}__main list`}>
                            {
                                dataIsReady ? _herosGet.carries.map((hero) => {
                                    return (
                                        <React.Fragment>{
                                            hero ? <ListItem
                                                key={hero}
                                                filteredData={filteredData}
                                                item={hero}
                                                rootClass={rootClass}
                                                data={data}
                                                radiantPick={radiantPick}
                                                radiantBan={radiantBan}
                                                direPick={direPick}
                                                direBan={direBan}
                                            /> : null}</React.Fragment>
                                    )
                                }) : 'Loading ...'
                            }
                        </div>
                    </div>
                </div>
                <div className={`${rootClass}__item`}>
                    <div className={`${rootClass}__title`}>Supports</div>
                    <div className={`heroes`}>
                        <div className={`${rootClass}__main list`}>
                            {
                                dataIsReady ? _herosGet.supports.map((hero) => {
                                    return (
                                        <React.Fragment>{
                                            hero ? <ListItem
                                                key={hero}
                                                filteredData={filteredData}
                                                item={hero}
                                                rootClass={rootClass}
                                                data={data}
                                                radiantPick={radiantPick}
                                                radiantBan={radiantBan}
                                                direPick={direPick}
                                                direBan={direBan}
                                            /> : null}</React.Fragment>
                                    )
                                }) : 'Loading ...'
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

ListSuggested.propTypes = {
    suggestionSet: PropTypes.string,
    dataFromStorage: PropTypes.object,
    name: PropTypes.string,
    handleChange: PropTypes.func,
    dataFromStorageIsReady: PropTypes.bool,
    dataStatus: PropTypes.number,
    filteredData: PropTypes.object
};

const mapStateToProps = (state, props) => {
    const dataFromStorageIsReady = state.Components.Core[props.pcb.relations.Storage.id].meta.flags.setting === 2;
    const dataFromStorage = dataFromStorageIsReady ? state.Components.Core[props.pcb.relations.Storage.id].buffer.heroPickScores : state.Components.Core[props.pcb.relations.Storage.id].buffer;
    const dataIsReady = dataFromStorageIsReady;
    const data = dataFromStorage;

    return ({
        dataFromStorage,
        data,
        dataFromStorageIsReady,
        dataIsReady,
        dataStatus: state.Components.Core[props.pcb.relations.Storage.id].meta.flags.setting,
        name: state.Components.List[props.pcb.id].name,
        filteredData: state.Components.List[props.pcb.id].filteredData
    })
};

const mapDispatchers = (dispatch, props) => {
    return bindActionCreators({
        handleChange: (e) => handleChange(props.pcb.id, e.target),
        filterData: () => filterData(
            props.pcb.id,
            props.pcb.relations.Storage.id,
            ['buffer', 'heroPickScores'],
            props.suggestionSet
        ),
        radiantPick: (value) => pick(props.pcb.relations.Radiant.id, value),
        radiantBan: (value) => ban(props.pcb.relations.Radiant.id, value),
        direPick: (value) => pick(props.pcb.relations.Dire.id, value),
        direBan: (value) => ban(props.pcb.relations.Dire.id, value),
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchers)(ListSuggested);