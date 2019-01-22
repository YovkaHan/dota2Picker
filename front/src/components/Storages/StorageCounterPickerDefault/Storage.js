import React from 'react';
import {connect} from "react-redux";
import PropTypes from "prop-types";
import axios from "axios/index";

function req(options) {
    return axios({
        ...options,
        withCredentials: true
    }).then(
        (response) => response.data,
        (error) => { console.log(error) }
    );
}

function compareNames(heroNames, heroAdv) {
    if(heroNames === heroAdv){
        return true;
    } else if(heroNames.match( /Nature's Prophet/ig) && heroAdv.match( /Natures Prophet/ig)){
        return true;
    }
}

function makeHeroData(heroNames, heroAdv, heroWin) {
    return new Promise((resolve, reject) => {
        const result = {data: {}};
        const heroes = [];
        const skillLevels = [0,1,2];

        const options = {
            url: '/heroes/roles',
            method: 'get',
            baseURL: 'http://10.101.11.162:4010',
        };

        req(options).then((heroesRoles)=>{
            const {heroRole, heronames, rolesId} = heroesRoles;

            try {
                heroAdv.heronames.map((hero, id) => {
                    for (let index in heroNames) {

                        if (compareNames(heroNames[index].name, hero)){
                            heroes[id] = {
                                advantage: null,
                                advantageUnscaled: null,
                                synergy: null,
                                synergyUnscaled: null,
                                winrate: null,
                                winrateUnscaled: null,
                                winrateteam: null,
                                winrateteamUnscaled: null,
                                name: heroNames[index].name, /**possible name trouble*/
                                propertyName: index,
                                atk: heroNames[index].atk,
                                roles: heroNames[index].roles,
                                rolesIndex: null,
                                id
                            };
                        }
                    }
                });

                heroAdv.heronames.map((hero, name) => {
                    heroes[name].advantage = heroAdv.adv_rates[name];
                    heroes[name].advantageUnscaled = JSON.parse(JSON.stringify(heroAdv.adv_rates[name]));
                    if ('adv_rates_scale' in heroAdv) {
                        for (let hvN = 0; hvN < heroes[name].advantage.length; hvN++) {
                            if (heroes[name].advantage[hvN] == null) continue;
                            for (let sN = 0; sN <skillLevels.length; sN++) {
                                heroes[name].advantage[hvN][sN] = Math.round(heroes[name].advantage[hvN][sN] / heroAdv.adv_rates_scale[sN] * 1000) / 100;
                                if (heroes[name].advantage[hvN][sN] > 10) heroes[name].advantage[hvN][sN] = 10;
                                if (heroes[name].advantage[hvN][sN] < -10) heroes[name].advantage[hvN][sN] = -10;
                            }
                        }
                    }
                    heroes[name].synergy = heroAdv.adv_rates_friends[name];
                    heroes[name].synergyUnscaled = JSON.parse(JSON.stringify(heroAdv.adv_rates_friends[name]));
                    if ('adv_rates_friends_scale' in heroAdv) {
                        for (let hvN = 0; hvN < heroes[name].synergy.length; hvN++) {
                            if (heroes[name].synergy[hvN] == null) continue;
                            for (let sN = 0; sN < skillLevels.length; sN++) {
                                heroes[name].synergy[hvN][sN] = Math.round(heroes[name].synergy[hvN][sN] / heroAdv.adv_rates_friends_scale[sN] * 1000) / 100;
                                if (heroes[name].synergy[hvN][sN] > 10) heroes[name].synergy[hvN][sN] = 10;
                                if (heroes[name].synergy[hvN][sN] < -10) heroes[name].synergy[hvN][sN] = -10;
                            }
                        }
                    }
                    heroes[name].winrate = heroWin.win_rates[name];
                    heroes[name].winrateUnscaled = JSON.parse(JSON.stringify(heroWin.win_rates[name]));
                    if ('win_rates_scale' in heroWin) {
                        for (let hvN = 0; hvN < heroes[name].winrate.length; hvN++) {
                            if (heroes[name].winrate[hvN] == null) continue;
                            for (let sN = 0; sN < skillLevels.length; sN++) {
                                heroes[name].winrate[hvN][sN] = Math.round(heroes[name].winrate[hvN][sN] / heroWin.win_rates_scale[sN] * 1000) / 100;
                                if (heroes[name].winrate[hvN][sN] > 10) heroes[name].winrate[hvN][sN] = 10;
                                if (heroes[name].winrate[hvN][sN] < -10) heroes[name].winrate[hvN][sN] = -10;
                            }
                        }
                    }
                    heroes[name].winrateteam = heroWin.win_rates_friends[name];
                    heroes[name].winrateteamUnscaled = JSON.parse(JSON.stringify(heroWin.win_rates_friends[name]));
                    if ('win_rates_friends_scale' in heroWin) {
                        for (let hvN = 0; hvN < heroes[name].winrateteam.length; hvN++) {
                            if (heroes[name].winrateteam[hvN] == null) continue;
                            for (let sN = 0; sN < skillLevels.length; sN++) {
                                heroes[name].winrateteam[hvN][sN] = Math.round(heroes[name].winrateteam[hvN][sN] / heroWin.win_rates_friends_scale[sN] * 1000) / 100;
                                if (heroes[name].winrateteam[hvN][sN] > 10) heroes[name].winrateteam[hvN][sN] = 10;
                                if (heroes[name].winrateteam[hvN][sN] < -10) heroes[name].winrateteam[hvN][sN] = -10;
                            }
                        }
                    }
                });
                // if ('adv_rates_scale' in heroAdv)
                //     aSingleton.all.advantageScaleHigh = heroAdv.adv_rates_scale;
                // else console.log("WARNING no adv_rates_scale");
                // if ('adv_rates_friends_scale' in heroAdv)
                //     aSingleton.all.synergyScaleHigh = heroAdv.adv_rates_friends_scale;
                // else console.log("WARNING no adv_rates_friends_scale");

                Object.keys(heronames).map(id=>{
                    heroes[id].roles = (() => Object.keys(heroRole[id]).map(role=>rolesId[role]))();
                    heroes[id].rolesIndex = (() => {
                        const result = {};

                        Object.keys(heroRole[id]).map(role=>{
                            result[rolesId[role]] = heroRole[id][role];
                        });

                        return result;
                    })();
                });

                result.data = heroes;

                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    })
}

class Storage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            initiated: false
        };

        this.initLoop = this.initLoop.bind(this);
    }

    /**В initLoop нам не нужны
     * functionProcess и соответствеено makeOutput так как данный компонент не меняет изначальные данные по ходу а всего лишь хранит их
     * */

    async initLoop() {
        const {setData, functionProcess, makeOutput, sequenceManage} = this.props;
        await setData(makeHeroData(this.props.dataFromHeroesStorage, this.props.dataFromHeroesAdvStorage, this.props.dataFromHeroesWinStorage));
        // await functionProcess(this.props.sequence);
        // await makeOutput();
    };

    componentDidUpdate() {
        if (
            !this.state.initiated
            && this.props.dataFromHeroesStorageIsReady
            && this.props.dataFromHeroesAdvStorageIsReady
            && this.props.dataFromHeroesWinStorageIsReady
        ) {
            this.setState({
                initiated: true
            }, this.initLoop)
        }
    }

    render() {
        return null
    }
}

Storage.propTypes = {
    dataFromHeroesStorage: PropTypes.object,
    dataFromHeroesStorageIsReady: PropTypes.bool,
    dataFromHeroesAdvStorage: PropTypes.object,
    dataFromHeroesAdvStorageIsReady: PropTypes.bool
};

const mapStateToProps = (state, props) => {
    return ({
        dataFromHeroesStorage: state.Components.Core[props.pcb.relations.Storage0.id].buffer,
        dataFromHeroesStorageIsReady: state.Components.Core[props.pcb.relations.Storage0.id].meta.flags.setting === 2,
        dataFromHeroesAdvStorage: state.Components.Core[props.pcb.relations.Storage1.id].buffer,
        dataFromHeroesAdvStorageIsReady: state.Components.Core[props.pcb.relations.Storage1.id].meta.flags.setting === 2,
        dataFromHeroesWinStorage: state.Components.Core[props.pcb.relations.Storage2.id].buffer,
        dataFromHeroesWinStorageIsReady: state.Components.Core[props.pcb.relations.Storage2.id].meta.flags.setting === 2,
    })
};

export default connect(mapStateToProps)(Storage);