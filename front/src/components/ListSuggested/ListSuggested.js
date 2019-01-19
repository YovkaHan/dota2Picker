import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from "react-redux";
import PropTypes from 'prop-types';
import {handleChange, filterData} from './redux/actions';
// import {pick, ban} from "../PickList/redux/actions";
import * as R from 'ramda';

// import { createSelector } from 'reselect';

// class Image extends React.Component {
//     static defaultProps = {
//         rootClass: '',
//         inactive: false,
//         hidden: false
//     };
//
//     render() {
//         const {name, propertyName, rootClass, inactive, hidden} = this.props;
//
//         const style = {
//             backgroundImage: `url(http://cdn.dota2.com/apps/dota2/images/heroes/${propertyName}_full.png)`,
//         };
//
//         return (
//             <div
//                 className={`${rootClass} ${inactive ? `${rootClass}--inactive` : ''} ${hidden ? `${rootClass}--hidden` : ''} image`}
//                 style={style}
//             >
//                 {name}
//             </div>
//         )
//     }
// }
//
// class ItemHover extends React.Component {
//
//     static defaultProps = {
//         radiantPick: ()=>{},
//         radiantBan: ()=>{},
//         direPick: ()=>{},
//         direBan: ()=>{}
//     };
//
//     render(){
//         const {visible, radiantPick, radiantBan, direPick, direBan} = this.props;
//         return(
//             <div className={`item-hover ${visible ? 'item-hover--visible' : ''}`}>
//                 <div className={`item-hover__item item-hover__item--radiant`}>
//                     <span className={`inner`} onClick={radiantPick}><span className={`team-name`}>Radiant</span> pick</span>
//                     <span className={`inner`} onClick={radiantBan}><span className={`team-name`}>Radiant</span> ban</span>
//                 </div>
//                 <div className={`item-hover__item item-hover__item--dire`}>
//                     <span className={`inner`} onClick={direPick}><span className={`team-name`}>Dire</span> pick</span>
//                     <span className={`inner`} onClick={direBan}><span className={`team-name`}>Dire</span> ban</span>
//                 </div>
//             </div>
//         )
//     }
// }
//
// class ListItem extends React.Component {
//
//     static defaultProps = {
//         filteredData: {},
//         item: '',
//         rootClass: '',
//         data: {},
//         isPicked: false,
//         isBaned: false
//     };
//
//     state = {
//         hover: false
//     };
//
//     onMouseOver=(isOver)=>{
//       this.setState({hover: isOver})
//     };
//
//     render(){
//
//         const {
//             filteredData,
//             item,
//             rootClass,
//             data,
//             radiantPick,
//             radiantBan,
//             direPick,
//             direBan,
//             isPicked,
//             isBaned
//         } = this.props;
//
//         return(
//             <div className={`${rootClass}__item list__item ${!filteredData.hasOwnProperty(item) ? 'list__item--hidden' : ''}`}
//                  onMouseOver={()=>this.onMouseOver(true)}
//                  onMouseLeave={()=>this.onMouseOver(false)}
//             >
//                 <Image rootClass={`${rootClass}__image`}
//                        propertyName={data[item].propertyName}
//                        name={data[item].name}
//                        inactive={isPicked || isBaned}
//                 />
//                 <ItemHover
//                     visible={!isPicked && !isBaned && this.state.hover}
//                     radiantPick={()=>!isPicked ? radiantPick(data[item]) : {}}
//                     radiantBan={()=>!isBaned ? radiantBan(data[item]) : {}}
//                     direPick={()=>!isPicked ? direPick(data[item]) : {}}
//                     direBan={()=>!isBaned ? direBan(data[item]) : {}}
//                 />
//             </div>
//         )
//     }
// }

class ListSuggested extends React.Component {

    static defaultProps = {
        rootClass: 'xd-list'
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
        }else if(this.props.dataStatus !== this.state.dataStatus){
            this.setState({
                dataStatus: this.props.dataStatus,
            }, ()=>{
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

    inputHandle = (e) => {
        this.props.handleChange(e)
            .then(() => this.props.filterData())
    };

    render() {
        const {
            data,
            name,
            rootClass,
            dataIsReady,
            filteredData,
        } = this.props;

        return (
            <div className={rootClass}>
                {/*<div className={`${rootClass}__selector input`}>*/}
                    {/*<input type={`text`} name={`name`} value={name} autoComplete={`off`} onChange={this.inputHandle}/>*/}
                {/*</div>*/}
                <div className={`${rootClass}__main list`}>
                    {
                        dataIsReady ? Object.keys(data).map((item) => {
                                return (
                                    <div
                                        key={data[item].name}
                                    >{data[item].name}</div>
                                )
                            }) : 'Loading ...'
                    }
                </div>
            </div>
        )
    }
}

ListSuggested.propTypes = {
    dataFromStorage: PropTypes.object,
    name: PropTypes.string,
    handleChange: PropTypes.func,
    dataFromStorageIsReady: PropTypes.bool,
    dataStatus: PropTypes.number
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
        dataStatus: state.Components.Core[props.pcb.relations.Storage.id].meta.flags.setting,
        name: state.Components.List[props.pcb.id].name,
        filteredData: state.Components.List[props.pcb.id].filteredData
    })
};

const mapDispatchers = (dispatch, props) => {
    return bindActionCreators({
        handleChange: (e) => handleChange(props.pcb.id, e.target),
        filterData: () => filterData(props.pcb.id, props.pcb.relations.Storage.id, ['buffer','heroPickScores'], 'suggestionsRadiant')
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchers)(ListSuggested);