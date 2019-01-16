import React from 'react';
import {connect} from "react-redux";
import PropTypes from "prop-types";

function compareNames(heroNames, heroAdv) {
    if(heroNames === heroAdv){
        return true;
    } else if(heroNames.match( /Nature's Prophet/ig) && heroAdv.match( /Natures Prophet/ig)){
        return true;
    }
}

function makeHeroData(heroNames, heroAdv) {
    return new Promise((resolve, reject) => {
        const result = {data: {}};
        const heroes = [];
        const skillLevels = [0,1,2];

        try {
            heroAdv.heronames.map((hero, id) => {
                for (let index in heroNames) {

                    if (compareNames(heroNames[index].name, hero)){
                        heroes[id] = {
                            advantage: null,
                            advantageUnscaled: null,
                            synergy: null,
                            synergyUnscaled: null,
                            name: heroNames[index].name, /**possible name trouble*/
                            propertyName: index,
                            atk: heroNames[index].atk,
                            roles: heroNames[index].roles,
                            id
                        };
                    }
                }
            });

            heroAdv.heronames.map((hero, name) => {
                heroes[name].advantage = heroAdv.adv_rates[name];
                heroes[name].advantageUnscaled = JSON.parse(JSON.stringify(heroAdv.adv_rates[name]));
                if ('adv_rates_scale' in heroAdv) {
                    for (var hvN = 0; hvN < heroes[name].advantage.length; hvN++) {
                        if (heroes[name].advantage[hvN] == null) continue;
                        for (var sN = 0; sN <skillLevels.length; sN++) {
                            heroes[name].advantage[hvN][sN] = Math.round(heroes[name].advantage[hvN][sN] / heroAdv.adv_rates_scale[sN] * 1000) / 100;
                            if (heroes[name].advantage[hvN][sN] > 10) heroes[name].advantage[hvN][sN] = 10;
                            if (heroes[name].advantage[hvN][sN] < -10) heroes[name].advantage[hvN][sN] = -10;
                        }
                    }
                }
                heroes[name].synergy = heroAdv.adv_rates_friends[name];
                heroes[name].synergyUnscaled = JSON.parse(JSON.stringify(heroAdv.adv_rates_friends[name]));
                if ('adv_rates_friends_scale' in heroAdv) {
                    for (var hvN = 0; hvN < heroes[name].synergy.length; hvN++) {
                        if (heroes[name].synergy[hvN] == null) continue;
                        for (var sN = 0; sN < skillLevels.length; sN++) {
                            heroes[name].synergy[hvN][sN] = Math.round(heroes[name].synergy[hvN][sN] / heroAdv.adv_rates_friends_scale[sN] * 1000) / 100;
                            if (heroes[name].synergy[hvN][sN] > 10) heroes[name].synergy[hvN][sN] = 10;
                            if (heroes[name].synergy[hvN][sN] < -10) heroes[name].synergy[hvN][sN] = -10;
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
            result.data = heroes;

            resolve(result);
        } catch (e) {
            reject(e);
        }
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
        await setData(makeHeroData(this.props.dataFromHeroesStorage, this.props.dataFromHeroesAdvStorage));
        // await functionProcess(this.props.sequence);
        // await makeOutput();
    };

    componentDidUpdate() {
        if (!this.state.initiated && this.props.dataFromHeroesStorageIsReady && this.props.dataFromHeroesAdvStorageIsReady) {
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
    })
};

export default connect(mapStateToProps)(Storage);