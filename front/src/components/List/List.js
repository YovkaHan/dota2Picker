import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from "react-redux";
import PropTypes from 'prop-types';
import {handleChange, filterData} from './redux/actions';
import {pick, ban} from "../PickList/redux/actions";
import * as R from 'ramda';

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
        radiantPick: ()=>{},
        radiantBan: ()=>{},
        direPick: ()=>{},
        direBan: ()=>{}
    };

    /**Задержка что бы не забанить и не пикнуть сразу*/
    timer = {
      isGoing: false,
        count: 1500,
      go: function () {
          this.isGoing = true;
          setTimeout(()=>{
              this.isGoing = false;
          },this.count)
      }
    };

    clickHandle = (foo, e) => {
        if(!this.timer.isGoing){
            foo(e);
            this.timer.go();
        }
    };

    render(){
        const {clickHandle} = this;
        const {visible, radiantPick, radiantBan, direPick, direBan} = this.props;
        return(
            <div className={`item-hover ${visible ? 'item-hover--visible' : ''}`}>
                <div className={`item-hover__item item-hover__item--radiant`}>
                    <span className={`inner`} onClick={(e)=>clickHandle(radiantPick, e)}><span className={`team-name`}>Radiant</span> pick</span>
                    <span className={`inner`} onClick={(e)=>clickHandle(radiantBan, e)}><span className={`team-name`}>Radiant</span> ban</span>
                </div>
                <div className={`item-hover__item item-hover__item--dire`}>
                    <span className={`inner`} onClick={(e)=>clickHandle(direPick, e)}><span className={`team-name`}>Dire</span> pick</span>
                    <span className={`inner`} onClick={(e)=>clickHandle(direBan, e)}><span className={`team-name`}>Dire</span> ban</span>
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
        data: {},
        isPicked: false,
        isBaned: false
    };

    state = {
        hover: false
    };

    onMouseOver=(isOver)=>{
      this.setState({hover: isOver})
    };

    render(){

        const {
            filteredData,
            item,
            rootClass,
            data,
            radiantPick,
            radiantBan,
            direPick,
            direBan,
            isPicked,
            isBaned
        } = this.props;

        return(
            <div className={`${rootClass}__item list__item ${!filteredData.hasOwnProperty(item) ? 'list__item--hidden' : ''}`}
                 onMouseOver={()=>this.onMouseOver(true)}
                 onMouseLeave={()=>this.onMouseOver(false)}
            >
                <Image rootClass={`${rootClass}__image`}
                       propertyName={data[item].propertyName}
                       name={data[item].name}
                       inactive={isPicked || isBaned}
                />
                <ItemHover
                    visible={!isPicked && !isBaned && this.state.hover}
                    radiantPick={()=>!isPicked ? radiantPick(data[item]) : {}}
                    radiantBan={()=>!isBaned ? radiantBan(data[item]) : {}}
                    direPick={()=>!isPicked ? direPick(data[item]) : {}}
                    direBan={()=>!isBaned ? direBan(data[item]) : {}}
                />
            </div>
        )
    }
}

class List extends React.Component {

    static defaultProps = {
        rootClass: 'xd-list',
        picks: [{}],
        bans: [{}]
    };

    constructor(props) {
        super(props);

        this.state = {
            initiated: false
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
                initiated: true
            }, this.initLoop)
        }
    }

    inputHandle = (e) => {
        this.props.handleChange(e);
        this.props.filterData(); /** зачейнить = замедлится вывод */
    };

    render() {
        const {
            data,
            name,
            rootClass,
            dataIsReady,
            filteredData,
            radiantPick,
            radiantBan,
            direPick,
            direBan,
            picks,
            bans,
        } = this.props;

        return (
            <div className={rootClass}>
                <div className={`${rootClass}__selector input`}>
                    <input type={`text`} name={`name`} value={name} autoComplete={`off`} onChange={this.inputHandle}/>
                </div>
                <div className={`${rootClass}__main list`}>
                    {
                        dataIsReady ? Object.keys(data).map((item) => {
                                return (
                                    <ListItem
                                        key={data[item].name}
                                        filteredData={filteredData}
                                        item={item}
                                        rootClass={rootClass}
                                        data={data}
                                        radiantPick={radiantPick}
                                        radiantBan={radiantBan}
                                        direPick={direPick}
                                        direBan={direBan}
                                        isPicked={!!picks.find(pick=>pick.id === data[item].id)}
                                        isBaned={!!bans.find(ban=>ban.id === data[item].id)}
                                    />
                                )
                            }) : 'Loading ...'
                    }
                </div>
            </div>
        )
    }
}

List.propTypes = {
    dataFromStorage: PropTypes.object,
    name: PropTypes.string,
    handleChange: PropTypes.func,
    dataFromStorageIsReady: PropTypes.bool
};

const mapStateToProps = (state, props) => {
    const dataFromStorage = state.Components.Core[props.pcb.relations.Storage.id].buffer;
    const dataFromStorageIsReady = state.Components.Core[props.pcb.relations.Storage.id].meta.flags.setting === 2;
    const data = dataFromStorage;
    const dataIsReady = dataFromStorageIsReady;

    return ({
        dataFromStorage,
        data,
        dataFromStorageIsReady,
        dataIsReady,
        name: state.Components.List[props.pcb.id].name,
        filteredData: state.Components.List[props.pcb.id].filteredData,
        picks: [...state.Components.List[props.pcb.relations.Radiant.id].picks, ...state.Components.List[props.pcb.relations.Dire.id].picks],
        bans: [...state.Components.List[props.pcb.relations.Radiant.id].bans, ...state.Components.List[props.pcb.relations.Dire.id].bans]
    })
};

const mapDispatchers = (dispatch, props) => {
    return bindActionCreators({
        handleChange: (e) => handleChange(props.pcb.id, e.target),
        filterData: () => filterData(props.pcb.id, props.pcb.relations.Storage.id, 'buffer'),
        radiantPick: (value) => pick(props.pcb.relations.Radiant.id, value),
        radiantBan: (value) => ban(props.pcb.relations.Radiant.id, value),
        direPick: (value) => pick(props.pcb.relations.Dire.id, value),
        direBan: (value) => ban(props.pcb.relations.Dire.id, value),
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchers)(List);