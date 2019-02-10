import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from "react-redux";
import PropTypes from 'prop-types';
import {handleChange, filterData, filterCriteriaAtk, filterCriteriaRole, filterCriteriaRoleChange} from './redux/actions';
// import {pick, ban} from "../PickList/redux/actions";
import * as R from 'ramda';
import {ban, pick} from "../PickList/redux/actions";
import {criterias} from './redux/reducer';
import {_Select, _SelectR} from '../';
import Switch from "react-switch";
import { IoIosRadioButtonOn, IoIosRadioButtonOff } from 'react-icons/io';

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

class Filter extends React.Component {

    handleChange = (name, values) => {

        if(name === 'atk'){
            this.props.filterCriteriaAtk(values);
        }
        if(name === 'roles'){
            this.props.filterCriteriaRole(values);
        }
        if(name === 'subRole'){

        }
    };

    render(){
        const {rootClass, criteriaList, pcb} = this.props;
        return(
            <div className={`${rootClass}__filter filter`}>
                {/*<div className={`atk`}>*/}
                    {/*<select name={`atk`} onChange={this.handleChange} value={criteriaList.atk}>*/}
                        {/*<option value={'all'}>All</option>*/}
                        {/*<option value={'melee'}>Melee</option>*/}
                        {/*<option value={'ranged'}>Ranged</option>*/}
                    {/*</select>*/}
                {/*</div>*/}
                <div className={`filter__item atk`}>
                    <_Select
                        rootClass="filter-select"
                        label="Attack Type"
                        placeholder="Select attack type"
                        values={criteriaList.atk.filter(value => value.status === '2').map(value => value.name)}
                        options={[
                            { value: 'melee', text: 'Melee'},
                            { value: 'ranged', text: 'Ranged' }
                        ]}
                        multiple
                        postValues={(values)=>{this.handleChange('atk',values)}}
                    />
                </div>
                <div className={`filter__item role`}>
                    <_SelectR
                        pcb={pcb.make(pcb.children['Select'].name)}
                        rootClass="filter-select"
                        label="Role Type"
                        placeholder="Select role type"
                        /**values={criteriaList.roles.filter(value => value.status === '2').map(value => value.name)}*/
                        options={criterias.roles.map(role=>{return { value: role, text: role}})}
                        multiple
                    />
                </div>
            </div>
        )
    }
}

class RoleList extends React.Component {

    handleChange(names, props){
        const _names = Array.isArray(names) ? names : [names];
        this.props.filterCriteriaRoleChange(_names, props);
    }

    render(){

        const {criteriaList} = this.props;

        return(
            <div className={`role-list`}>
                {criteriaList.roles.map(role => {
                    return(
                        <React.Fragment>
                            {role.status !== 1 ?<div className={`role-list__item role`}>
                            <div className={`role__switcher`}>
                                <Switch
                                    onChange={()=>this.handleChange( [role.name],{[role.name]:{status: role.status === 2 ? 0 : 2}})}
                                    checked={role.status === 2}
                                    offColor={'#FF0000'}
                                />
                            </div>
                            <div className={`role__main`}>
                                <div className={`role__name`}>{role.name}</div>
                                <div className={`role__value`}>
                                    <div
                                        className={`role__value-point ${role.value >= 1 ? 'role__value-point--active': ''}`}
                                        onClick={()=>this.handleChange(
                                            [role.name],{[role.name]:{status:role.status, value: 1}}
                                        )}
                                    >
                                        {role.value >= 1 ? <IoIosRadioButtonOn/> : <IoIosRadioButtonOff/>}
                                    </div>
                                    <div
                                        className={`role__value-point ${role.value >= 2 ? 'role__value-point--active': ''}`}
                                        onClick={()=>this.handleChange(
                                            [role.name],{[role.name]:{status:role.status, value: 2}}
                                        )}
                                    >
                                        {role.value >= 2 ? <IoIosRadioButtonOn/> : <IoIosRadioButtonOff/>}
                                        </div>
                                    <div
                                        className={`role__value-point ${role.value >= 3 ? 'role__value-point--active': ''}`}
                                        onClick={()=>this.handleChange(
                                            [role.name],{[role.name]:{status:role.status, value: 3}}
                                        )}
                                    >
                                        {role.value >= 3 ? <IoIosRadioButtonOn/> : <IoIosRadioButtonOff/>}
                                    </div>
                                </div>
                            </div>
                        </div> : null}
                        </React.Fragment>
                    )
                })}
            </div>
        )
    }
}

class ListSuggested extends React.Component {

    static defaultProps = {
        rootClass: 'xd-list',
        suggestionSet: 'suggestionsRadiant',
        criteriaList: {}
    };

    constructor(props) {
        super(props);

        this.state = {
            initiated: false,
            dataStatus: props.dataStatus,
        };

        this.initLoop = this.initLoop.bind(this);

        if(props.dataFromStorageIsReady) {
            this.state.initiated = true;
            this.initLoop();
        }

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
            filteredData: this.props.filteredData,
            criteriaList: this.props.criteriaList
        };
        const newO = {
            data: nextProps.data,
            dataFromStorageIsReady: nextProps.dataFromStorageIsReady,
            dataStatus: nextProps.dataStatus,
            filteredData: nextProps.filteredData,
            criteriaList: nextProps.criteriaList
        };

        if(JSON.stringify(this.props.criteriaList) !== JSON.stringify(nextProps.criteriaList)){
            this.props.filterData();
        }

        if(JSON.stringify(this.props.selectValues) !== JSON.stringify(nextProps.selectValues)){
            this.props.filterCriteriaRole(nextProps.selectValues)
        }

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
                <div className={`${rootClass}__header`}>
                    <Filter {...this.props}/>
                </div>
                <div className={`${rootClass}__body`}>
                    <div className={`${rootClass}__item`}>
                        <div className={`${rootClass}__title`}>Carries</div>
                        <div className={`${rootClass}__list heroes`}>
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
                        <div className={`${rootClass}__list heroes`}>
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
                    <div className={`${rootClass}__item ${rootClass}__item--left`}>
                        <RoleList {...this.props}/>
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
    filteredData: PropTypes.object,
    criteriaList: PropTypes.object
};

const mapStateToProps = (state, props) => {
    const dataFromStorageIsReady = state.Components.Core[props.pcb.relations.Storage.id].meta.flags.setting === 2;
    const dataFromStorage = dataFromStorageIsReady ? state.Components.Core[props.pcb.relations.Storage.id].buffer.heroPickScores : state.Components.Core[props.pcb.relations.Storage.id].buffer;
    const dataIsReady = dataFromStorageIsReady;
    const data = dataFromStorage;
    const criteriaList = state.Components.List[props.pcb.id].criteriaList;
    const selectValues = state.Components.Select[props.pcb.children['Select'].id].values;

    return ({
        dataFromStorage,
        data,
        dataFromStorageIsReady,
        dataIsReady,
        criteriaList,
        dataStatus: state.Components.Core[props.pcb.relations.Storage.id].meta.flags.setting,
        name: state.Components.List[props.pcb.id].name,
        filteredData: state.Components.List[props.pcb.id].filteredData,
        selectValues
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
        filterCriteriaAtk: (values) => filterCriteriaAtk(props.pcb.id, values),
        filterCriteriaRole: (values, _props) => filterCriteriaRole(props.pcb.id, values, _props),
        filterCriteriaRoleChange: (values, _props) => filterCriteriaRoleChange(props.pcb.id, values, _props),
        radiantPick: (value) => pick(props.pcb.relations.Radiant.id, value),
        radiantBan: (value) => ban(props.pcb.relations.Radiant.id, value),
        direPick: (value) => pick(props.pcb.relations.Dire.id, value),
        direBan: (value) => ban(props.pcb.relations.Dire.id, value),
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchers)(ListSuggested);