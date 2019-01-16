import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from "react-redux";
import PropTypes from 'prop-types';
import {} from "./redux/actions";
import * as R from 'ramda';

const $scope = {
    SkillLevels: ['Normal', 'High', 'Very High'],
    skillLevel: 'High',
    heroesEnemy: [],
    heroPickScores: {},
    plusMinus: {},
    show: {
        winratemode: 'syn',
        cmmode: true
    }
};

function fn_min(score1,score2) {
    return score1 < score2 ? score1 : score2;
};
function fn_max(score1,score2) {
    return score1 > score2 ? score1 : score2;
};
function fn_abs(score) {
    return score > 0 ? score : -score;
};
function fn_sgn(score) {
    return score >= 0 ? 1 : -1;
};
function fn_ssqrt(val) {
    return val < 0 ? (0 - Math.sqrt(-val)) : Math.sqrt(val);
};
function fn_cnd(cond, lt0, eq0, gt0) {
    if (cond < 0) return lt0;
    else if (cond == 0) return eq0;
    else return gt0;
};

function fn_sqrt(val) {
    return Math.sqrt(val);
};
function fn_scale(score,scaleNeg, scalePos) {
    if (score < 0) return score * scaleNeg;
    else return score * scalePos;
};

function fnValuesAdded(arr) {
    let x = 0;
    for (let N = 0; N < arr.length; N++) x += arr[N];
    return x;
}
function fnValuesMultiplied(arr) {
    let x = 1;
    for (let N = 0; N < arr.length; N++) x *= arr[N];
    return x;
}

function GetCustomFunctionHandler(fn, variables, functions) {
    const aFnObj = {
        isValid: function () {
            return true;
        }
    };

    if (typeof(fn) == 'string') {
        //checking for security issues
        let variablesReg = '';
        for (var N = 0; N < variables.length; N++)
            variablesReg += variables[N] + '|';
        let functionsReg = '';
        for (var aKey in functions)
            functionsReg += aKey + '|';
        if (fn.match(new RegExp('^('+functionsReg+variablesReg+'[+-,0-9 .]|\\*|\\\/|\\)|\\()+$'))==null) {
            //function has unaccepted tokens
            aFnObj.exec = function() { return Number.NaN; }
            aFnObj.isValid = function(){ return false; }
            return aFnObj;
        }

        aFnObj.fnstr = fn;
        const replaces = {};
        for (var N = 0; N < variables.length; N++) {
            replaces[variables[N]] = 'WDPVAR'+N+'EWDPVAR';
            aFnObj.fnstr = aFnObj.fnstr.replace(new RegExp(variables[N], 'g'), 'WDPVAR'+N+'EWDPVAR');
        }
        var N = 0;
        for (var aKey in functions) {
            replaces[aKey] = 'WDPFN'+N+'EWDPFN';
            aFnObj.fnstr = aFnObj.fnstr.replace(new RegExp(aKey, 'g'), 'WDPFN'+N+'EWDPFN');
            N++;
        }
        for (var aKey in replaces) {
            aFnObj.fnstr = aFnObj.fnstr.replace(new RegExp(replaces[aKey], 'g'), 'this.'+aKey);
        }
    } else {
        aFnObj.fn = fn
    }


    aFnObj.varsArr = [];
    for (var N = 0; N < variables.length; N++)
        aFnObj.varsArr.push(variables[N]);
    for (var aKey in functions)
        aFnObj[aKey] = functions[aKey];

    aFnObj.exec = function(variables){
        for (let N = 0; N < this.varsArr.length; N++) {
            if (this.varsArr[N] in variables) aFnObj[this.varsArr[N]] = variables[this.varsArr[N]];
            else aFnObj[this.varsArr[N]] = 0;
        }
        if ('fnstr' in this) {
            try {
                return eval(this.fnstr);
            } catch (ex) {
                return Number.NaN;
            }
        } else {
            try {
                return aFnObj.fn();
            } catch (ex) {
                return Number.NaN;
            }
        }
    };
    return aFnObj;


    //function(){return this.ssqrt(this.scale(this.advantageScoreScaled,2, 1))}
}

function makeHeroData(props) {
    return new Promise((resolve, reject) => {
        const {heroes, radiantTeam, direTeam} = props;
        const result = {heroPickScores: {}};

        for(let hero in heroes){
            result.heroPickScores[heroes[hero].name]={
                showHeroes: {},
                showHeroesNoP: {},
                showHeroesBan: {},
                counterEnemyScore: 0,
                helpTeamScore: 0,
                vs: {},
                wt: {},
                banen: {},
                roles: heroes[hero].roles,
                atk: heroes[hero].atk,
                nem: {"Core": [], "Utility": [], "All": []},
                selected: false
            }
        }

        try{
//calculating suggestion scores
            let skill = 1;
            for (let N = 0; N < $scope.SkillLevels.length; N++)
                if ($scope.skillLevel === $scope.SkillLevels[N]) skill = N;
            $scope.skillLevelN = skill;

            function SSqrt(val) {
                return val < 0 ? (0 - Math.sqrt(-val)) : Math.sqrt(val)
            };

            const functionPointers = {
                ssqrt: fn_ssqrt,
                sqrt: fn_sqrt,
                scale: fn_scale,
                max: fn_max,
                min: fn_min,
                abs: fn_abs,
                sgn: fn_sgn,
                cnd: fn_cnd
            };

            function GetFNWinrate(syn, wr, prs) {
                if ($scope.show.winratemode === 'syn') return syn;
                else if ($scope.show.winratemode === 'wr') return wr;
                else return function(){ return Number.NaN; };
            }

            const functionHandles = {};

            functionHandles.heroAdvantageScore = GetCustomFunctionHandler(GetFNWinrate(
                function(){ return this.cnd(this.heroPlusMinus, 0.5, 1, 2.5) * this.ssqrt(this.scale(0.9*this.advantageScoreScaled+0.1*this.winrateScoreScaled,2, 1)); },
                function(){ return this.cnd(this.heroPlusMinus, 0.5, 1, 2.5) * this.ssqrt(this.scale(this.winrateScoreScaled,2, 1)); },
                'advantage'
            ), ['advantageScore', 'advantageScoreScaled', 'winrateScore', 'winrateScoreScaled', 'heroPlusMinus'], functionPointers);

            functionHandles.heroAdvantageScoreOp = fnValuesAdded;
            // if ($scope.show.winratemode === 'prs' && 'settingsPersonal' in $scope && 'formulas' in $scope.settingsPersonal && 'advantageOp' in $scope.settingsPersonal.formulas && $scope.settingsPersonal.formulas.advantageOp=='multiplied')
            //     functionHandles.heroAdvantageScoreOp = fnValuesMultiplied;

            functionHandles.heroSynergyScore = GetCustomFunctionHandler(GetFNWinrate(
                function(){ return this.cnd(this.heroPlusMinus, 0.5, 1, 2.5) * this.ssqrt(this.scale(this.synergyScoreScaled,1.5, 1)); },
                function(){ return this.cnd(this.heroPlusMinus, 0.5, 1, 2.5) * this.ssqrt(this.scale(this.winrateTeamScoreScaled,1.5, 1)); },
                'synergy'
            ), ['synergyScore', 'synergyScoreScaled', 'winrateTeamScore', 'winrateTeamScoreScaled', 'heroPlusMinus'], functionPointers);

            functionHandles.heroSynergyScoreOp = fnValuesAdded;
            // if ($scope.show.winratemode=='prs' && 'settingsPersonal' in $scope && 'formulas' in $scope.settingsPersonal && 'synergyOp' in $scope.settingsPersonal.formulas && $scope.settingsPersonal.formulas.synergyOp=='multiplied')
            //     functionHandles.heroSynergyScoreOp = fnValuesMultiplied;

            functionHandles.matchupScore = GetCustomFunctionHandler(GetFNWinrate(
                function(){ return this.heroAdvantageScore + this.heroSynergyScore; },
                function(){ return this.heroAdvantageScore + this.heroSynergyScore; },
                'matchup'
            ), ['heroAdvantageScore', 'heroSynergyScore'], functionPointers);

            functionHandles.eachPartBonusScore = GetCustomFunctionHandler(GetFNWinrate(
                function(){ return this.max(0.5 * this.abs(this.matchupScore), 0.5) * this.partBonus / this.nrPartsActive; },
                function(){ return this.max(0.5 * this.abs(this.matchupScore), 0.5) * this.partBonus / this.nrPartsActive; },
                'partBonus'
            ), ['partBonus', 'nrPartsActive', 'matchupScore', 'heroAdvantageScore', 'heroSynergyScore'], functionPointers);

            functionHandles.eachPartBonusScoreOp = fnValuesAdded;
            // if ($scope.show.winratemode=='prs' && 'settingsPersonal' in $scope && 'formulas' in $scope.settingsPersonal && 'partBonusOp' in $scope.settingsPersonal.formulas && $scope.settingsPersonal.formulas.partBonusOp=='multiplied')
            //     functionHandles.eachPartBonusScoreOp = fnValuesMultiplied;

            functionHandles.personalScore = GetCustomFunctionHandler(GetFNWinrate(
                function(){ return this.sgn(this.personalHeroScoreScaled) * this.min(this.abs(this.personalHeroScoreScaled), 0.75) * this.abs(this.matchupScore); },
                function(){ return this.sgn(this.personalHeroScoreScaled) * this.min(this.abs(this.personalHeroScoreScaled), 0.75) * this.abs(this.matchupScore); },
                'personal'
            ), ['personalHeroScore', 'personalHeroScoreScaled', 'matchupScore', 'heroAdvantageScore', 'heroSynergyScore'], functionPointers);

            functionHandles.computedScore = GetCustomFunctionHandler(GetFNWinrate(
                function(){ return this.matchupScore + this.partBonusScore + this.personalScore; },
                function(){ return this.matchupScore + this.partBonusScore + this.personalScore; },
                'finalScore'
            ), ['matchupScore', 'partBonusScore', 'personalScore','heroAdvantageScore', 'heroSynergyScore'], functionPointers);



            for (let aHN = 0; aHN < heroes.length; aHN++) {
                const aThisHeroScores = result.heroPickScores[heroes[aHN].name];
                for (let aEHN = 0; aEHN < direTeam.picks.length; aEHN++) {
                    aThisHeroScores.vs[direTeam.picks[aEHN].name] = {
                        advantage: 0,
                        winrate: 0,
                        advantageUnscaled: 0,
                        winrateUnscaled: 0,
                        synergy: 0,
                        winrateteam: 0,
                        synergyUnscaled: 0,
                        winrateteamUnscaled: 0,
                        plusMinus: 0
                    };

                    if ('advantage' in direTeam.picks[aEHN] && typeof(direTeam.picks[aEHN].advantage[heroes[aHN].id]) != 'undefined' && direTeam.picks[aEHN].advantage[heroes[aHN].id] != null)
                        aThisHeroScores.vs[direTeam.picks[aEHN].name].advantage = -direTeam.picks[aEHN].advantage[heroes[aHN].id][skill];
                    if ('advantageUnscaled' in direTeam.picks[aEHN] && typeof(direTeam.picks[aEHN].advantageUnscaled[heroes[aHN].id]) != 'undefined' && direTeam.picks[aEHN].advantageUnscaled[heroes[aHN].id] != null)
                        aThisHeroScores.vs[direTeam.picks[aEHN].name].advantageUnscaled = -direTeam.picks[aEHN].advantageUnscaled[heroes[aHN].id][skill];
                    if ('winrate' in direTeam.picks[aEHN] && typeof(direTeam.picks[aEHN].winrate[heroes[aHN].id]) != 'undefined' && direTeam.picks[aEHN].winrate[heroes[aHN].id] != null)
                        aThisHeroScores.vs[direTeam.picks[aEHN].name].winrate = -direTeam.picks[aEHN].winrate[heroes[aHN].id][skill];
                    if ('winrateUnscaled' in direTeam.picks[aEHN] && typeof(direTeam.picks[aEHN].winrateUnscaled[heroes[aHN].id]) != 'undefined' && direTeam.picks[aEHN].winrateUnscaled[heroes[aHN].id] != null)
                        aThisHeroScores.vs[direTeam.picks[aEHN].name].winrateUnscaled = -direTeam.picks[aEHN].winrateUnscaled[heroes[aHN].id][skill];
                    if ('synergy' in direTeam.picks[aEHN] && typeof(direTeam.picks[aEHN].synergy[heroes[aHN].id]) != 'undefined' && direTeam.picks[aEHN].advantage[heroes[aHN].id] != null)
                        aThisHeroScores.vs[direTeam.picks[aEHN].name].synergy = direTeam.picks[aEHN].synergy[heroes[aHN].id][skill];
                    if ('synergyUnscaled' in direTeam.picks[aEHN] && typeof(direTeam.picks[aEHN].synergyUnscaled[heroes[aHN].id]) != 'undefined' && direTeam.picks[aEHN].synergyUnscaled[heroes[aHN].id] != null)
                        aThisHeroScores.vs[direTeam.picks[aEHN].name].synergyUnscaled = direTeam.picks[aEHN].synergyUnscaled[heroes[aHN].id][skill];
                    if ('winrateteam' in direTeam.picks[aEHN] && typeof(direTeam.picks[aEHN].winrateteam[heroes[aHN].id]) != 'undefined' && direTeam.picks[aEHN].winrateteam[heroes[aHN].id] != null)
                        aThisHeroScores.vs[direTeam.picks[aEHN].name].winrateteam = direTeam.picks[aEHN].winrateteam[heroes[aHN].id][skill];
                    if ('winrateteamUnscaled' in direTeam.picks[aEHN] && typeof(direTeam.picks[aEHN].winrateteamUnscaled[heroes[aHN].id]) != 'undefined' && direTeam.picks[aEHN].winrateteamUnscaled[heroes[aHN].id] != null)
                        aThisHeroScores.vs[direTeam.picks[aEHN].name].winrateteamUnscaled = direTeam.picks[aEHN].winrateteamUnscaled[heroes[aHN].id][skill];
                    if (direTeam.picks[aEHN].name in $scope.plusMinus) {
                        if ($scope.plusMinus[direTeam.picks[aEHN].name] == 'plus')
                            aThisHeroScores.vs[direTeam.picks[aEHN].name].plusMinus = 1;
                        else if ($scope.plusMinus[direTeam.picks[aEHN].name] == 'minus')
                            aThisHeroScores.vs[direTeam.picks[aEHN].name].plusMinus = -1;
                    }
                }

                if ($scope.show.cmmode) for (var aEHN = 0; aEHN < direTeam.bans.length; aEHN++) {
                    aThisHeroScores.banen[direTeam.bans[aEHN].name] = {
                        advantage: 0,
                        winrate: 0,
                        advantageUnscaled: 0,
                        winrateUnscaled: 0,
                        plusMinus: 0
                    };

                    if ('advantage' in direTeam.bans[aEHN] && typeof(direTeam.bans[aEHN].advantage[heroes[aHN].id]) != 'undefined' && direTeam.bans[aEHN].advantage[heroes[aHN].id] != null)
                        aThisHeroScores.banen[direTeam.bans[aEHN].name].advantage = -direTeam.bans[aEHN].advantage[heroes[aHN].id][skill];
                    if ('advantageUnscaled' in direTeam.bans[aEHN] && typeof(direTeam.bans[aEHN].advantageUnscaled[heroes[aHN].id]) != 'undefined' && direTeam.bans[aEHN].advantageUnscaled[heroes[aHN].id] != null)
                        aThisHeroScores.banen[direTeam.bans[aEHN].name].advantageUnscaled = -direTeam.bans[aEHN].advantageUnscaled[heroes[aHN].id][skill];
                    if ('winrate' in direTeam.bans[aEHN] && typeof(direTeam.bans[aEHN].winrate[heroes[aHN].id]) != 'undefined' && direTeam.bans[aEHN].winrate[heroes[aHN].id] != null)
                        aThisHeroScores.banen[direTeam.bans[aEHN].name].winrate = -direTeam.bans[aEHN].winrate[heroes[aHN].id][skill];
                    if ('winrateUnscaled' in direTeam.bans[aEHN] && typeof(direTeam.bans[aEHN].winrateUnscaled[heroes[aHN].id]) != 'undefined' && direTeam.bans[aEHN].winrateUnscaled[heroes[aHN].id] != null)
                        aThisHeroScores.banen[direTeam.bans[aEHN].name].winrateUnscaled = -direTeam.bans[aEHN].winrateUnscaled[heroes[aHN].id][skill];
                }


                for (var aEHN = 0; aEHN < radiantTeam.picks.length; aEHN++) {
                    aThisHeroScores.wt[radiantTeam.picks[aEHN].name] = {
                        advantage: 0,
                        winrate: 0,
                        advantageUnscaled: 0,
                        winrateUnscaled: 0,
                        synergy: 0,
                        winrateteam: 0,
                        synergyUnscaled: 0,
                        winrateteamUnscaled: 0,
                        plusMinus: 0
                    };
                    if ('advantage' in radiantTeam.picks[aEHN] && typeof(radiantTeam.picks[aEHN].advantage[heroes[aHN].id]) != 'undefined' && radiantTeam.picks[aEHN].advantage[heroes[aHN].id] != null)
                        aThisHeroScores.wt[radiantTeam.picks[aEHN].name].advantage = -radiantTeam.picks[aEHN].advantage[heroes[aHN].id][skill];
                    if ('advantageUnscaled' in radiantTeam.picks[aEHN] && typeof(radiantTeam.picks[aEHN].advantageUnscaled[heroes[aHN].id]) != 'undefined' && radiantTeam.picks[aEHN].advantageUnscaled[heroes[aHN].id] != null)
                        aThisHeroScores.wt[radiantTeam.picks[aEHN].name].advantageUnscaled = -radiantTeam.picks[aEHN].advantageUnscaled[heroes[aHN].id][skill];
                    if ('winrate' in radiantTeam.picks[aEHN] && typeof(radiantTeam.picks[aEHN].winrate[heroes[aHN].id]) != 'undefined' && radiantTeam.picks[aEHN].winrate[heroes[aHN].id] != null)
                        aThisHeroScores.wt[radiantTeam.picks[aEHN].name].winrate = -radiantTeam.picks[aEHN].winrate[heroes[aHN].id][skill];
                    if ('winrateUnscaled' in radiantTeam.picks[aEHN] && typeof(radiantTeam.picks[aEHN].winrateUnscaled[heroes[aHN].id]) != 'undefined' && radiantTeam.picks[aEHN].winrateUnscaled[heroes[aHN].id] != null)
                        aThisHeroScores.wt[radiantTeam.picks[aEHN].name].winrateUnscaled = -radiantTeam.picks[aEHN].winrateUnscaled[heroes[aHN].id][skill];
                    if ('synergy' in radiantTeam.picks[aEHN] && typeof(radiantTeam.picks[aEHN].synergy[heroes[aHN].id]) != 'undefined' && radiantTeam.picks[aEHN].advantage[heroes[aHN].id] != null)
                        aThisHeroScores.wt[radiantTeam.picks[aEHN].name].synergy = radiantTeam.picks[aEHN].synergy[heroes[aHN].id][skill];
                    if ('synergyUnscaled' in radiantTeam.picks[aEHN] && typeof(radiantTeam.picks[aEHN].synergyUnscaled[heroes[aHN].id]) != 'undefined' && radiantTeam.picks[aEHN].synergyUnscaled[heroes[aHN].id] != null)
                        aThisHeroScores.wt[radiantTeam.picks[aEHN].name].synergyUnscaled = radiantTeam.picks[aEHN].synergyUnscaled[heroes[aHN].id][skill];
                    if ('winrateteam' in radiantTeam.picks[aEHN] && typeof(radiantTeam.picks[aEHN].winrateteam[heroes[aHN].id]) != 'undefined' && radiantTeam.picks[aEHN].winrateteam[heroes[aHN].id] != null)
                        aThisHeroScores.wt[radiantTeam.picks[aEHN].name].winrateteam = radiantTeam.picks[aEHN].winrateteam[heroes[aHN].id][skill];
                    if ('winrateteamUnscaled' in radiantTeam.picks[aEHN] && typeof(radiantTeam.picks[aEHN].winrateteamUnscaled[heroes[aHN].id]) != 'undefined' && radiantTeam.picks[aEHN].winrateteamUnscaled[heroes[aHN].id] != null)
                        aThisHeroScores.wt[radiantTeam.picks[aEHN].name].winrateteamUnscaled = radiantTeam.picks[aEHN].winrateteamUnscaled[heroes[aHN].id][skill];
                    if (radiantTeam.picks[aEHN].name in $scope.plusMinus) {
                        if ($scope.plusMinus[radiantTeam.picks[aEHN].name] == 'plus')
                            aThisHeroScores.wt[radiantTeam.picks[aEHN].name].plusMinus = 1;
                        else if ($scope.plusMinus[radiantTeam.picks[aEHN].name] == 'minus')
                            aThisHeroScores.wt[radiantTeam.picks[aEHN].name].plusMinus = -1;
                    }
                }


                //calculating team advantage and sinergy scores
                var aArr = [];
                for (var aHero in aThisHeroScores.vs) {
                    aArr.push(functionHandles.heroAdvantageScore.exec({
                        advantageScore: aThisHeroScores.vs[aHero].advantageUnscaled,
                        advantageScoreScaled: aThisHeroScores.vs[aHero].advantage,
                        winrateScore: aThisHeroScores.vs[aHero].winrateUnscaled,
                        winrateScoreScaled: aThisHeroScores.vs[aHero].winrate,
                        heroPlusMinus: aThisHeroScores.vs[aHero].plusMinus
                    }));
                }
                aThisHeroScores.counterEnemyScoreRaw = functionHandles.heroAdvantageScoreOp(aArr);

                if ($scope.show.cmmode) {
                    var aArr = [];
                    for (var aHero in aThisHeroScores.vs) {
                        aArr.push(functionHandles.heroSynergyScore.exec({
                            synergyScore: aThisHeroScores.vs[aHero].synergyUnscaled,
                            synergyScoreScaled: aThisHeroScores.vs[aHero].synergy,
                            winrateTeamScore: aThisHeroScores.vs[aHero].winrateteamUnscaled,
                            winrateTeamScoreScaled: aThisHeroScores.vs[aHero].winrateteam,
                        }));
                    }
                    aThisHeroScores.helpEnemyScoreRaw = functionHandles.heroSynergyScoreOp(aArr);

                    var aArr = [];
                    for (var aHero in aThisHeroScores.banen) {
                        aArr.push(functionHandles.heroAdvantageScore.exec({
                            advantageScore: aThisHeroScores.banen[aHero].advantageUnscaled,
                            advantageScoreScaled: aThisHeroScores.banen[aHero].advantage,
                            winrateScore: aThisHeroScores.banen[aHero].winrateUnscaled,
                            winrateScoreScaled: aThisHeroScores.banen[aHero].winrate,
                        }));
                    }
                    aThisHeroScores.counterBanScoreRaw = -functionHandles.heroAdvantageScoreOp(aArr);
                }

                var aArr = [];
                for (var aHero in aThisHeroScores.wt) {
                    aArr.push(functionHandles.heroSynergyScore.exec({
                        synergyScore: aThisHeroScores.wt[aHero].synergyUnscaled,
                        synergyScoreScaled: aThisHeroScores.wt[aHero].synergy,
                        winrateTeamScore: aThisHeroScores.wt[aHero].winrateteamUnscaled,
                        winrateTeamScoreScaled: aThisHeroScores.wt[aHero].winrateteam,
                        heroPlusMinus: aThisHeroScores.wt[aHero].plusMinus
                    }));
                }
                aThisHeroScores.helpTeamScoreRaw = functionHandles.heroSynergyScoreOp(aArr);

                if ($scope.show.cmmode) {
                    var aArr = [];
                    for (var aHero in aThisHeroScores.wt) {
                        aArr.push(functionHandles.heroAdvantageScore.exec({
                            advantageScore: aThisHeroScores.wt[aHero].advantageUnscaled,
                            advantageScoreScaled: aThisHeroScores.wt[aHero].advantage,
                            winrateScore: aThisHeroScores.wt[aHero].winrateUnscaled,
                            winrateScoreScaled: aThisHeroScores.wt[aHero].winrate,
                        }));
                    }
                    aThisHeroScores.counterTeamScoreRaw = functionHandles.heroAdvantageScoreOp(aArr);
                }

                aThisHeroScores.counterHelpTeamScoreRaw = functionHandles.matchupScore.exec({
                    heroAdvantageScore: aThisHeroScores.counterEnemyScoreRaw,
                    heroSynergyScore: aThisHeroScores.helpTeamScoreRaw
                });

                aThisHeroScores.counterHelpEnemyScoreRaw = functionHandles.matchupScore.exec({
                    heroAdvantageScore: aThisHeroScores.counterTeamScoreRaw,
                    heroSynergyScore: aThisHeroScores.helpEnemyScoreRaw
                });


                //calculating game part bonus
                const aPartBonuses = [];
                // if ($scope.show.bonusearly == 'yes') aPartBonuses.push(heroes[aHN].gamePart[skill].early);
                // if ($scope.show.bonusmid == 'yes') aPartBonuses.push(heroes[aHN].gamePart[skill].mid);
                // if ($scope.show.bonuslate == 'yes') aPartBonuses.push(heroes[aHN].gamePart[skill].late);

                var aArr = [];
                for (let aPN = 0; aPN < aPartBonuses.length; aPN++) {
                    aArr.push(functionHandles.eachPartBonusScore.exec({
                        partBonus: aPartBonuses[aPN],
                        nrPartsActive: aPartBonuses.length,
                        matchupScore: aThisHeroScores.counterHelpTeamScoreRaw,
                        heroAdvantageScore: aThisHeroScores.counterEnemyScoreRaw,
                        heroSynergyScore: aThisHeroScores.helpTeamScoreRaw
                    }));
                }
                aThisHeroScores.gamePartScoreRaw = functionHandles.eachPartBonusScoreOp(aArr);

                //calculating personal score
                aThisHeroScores.personalScoreRaw = 0;
                if ($scope.show.bonuspersonal == 'yes') {
                    aThisHeroScores.personalScoreRaw = functionHandles.personalScore.exec({
                        personalHeroScore: heroes[aHN].personalScores.usedScoreUnscaled,
                        personalHeroScoreScaled: heroes[aHN].personalScores.usedScore,
                        matchupScore: aThisHeroScores.counterHelpTeamScoreRaw,
                        heroAdvantageScore: aThisHeroScores.counterEnemyScoreRaw,
                        heroSynergyScore: aThisHeroScores.helpTeamScoreRaw
                    });
                }


                //calculating final score
                aThisHeroScores.computedScore = functionHandles.computedScore.exec({
                    matchupScore: aThisHeroScores.counterHelpTeamScoreRaw,
                    partBonusScore: aThisHeroScores.gamePartScoreRaw,
                    personalScore: aThisHeroScores.personalScoreRaw,
                    heroAdvantageScore: aThisHeroScores.counterEnemyScoreRaw,
                    heroSynergyScore: aThisHeroScores.helpTeamScoreRaw
                });
                aThisHeroScores.computedScoreNoPersonal = functionHandles.computedScore.exec({
                    matchupScore: aThisHeroScores.counterHelpTeamScoreRaw,
                    partBonusScore: aThisHeroScores.gamePartScoreRaw,
                    personalScore: 0,
                    heroAdvantageScore: aThisHeroScores.counterEnemyScoreRaw,
                    heroSynergyScore: aThisHeroScores.helpTeamScoreRaw
                });

                if ($scope.show.cmmode) {
                    aThisHeroScores.computedEnemyScoreRaw = functionHandles.computedScore.exec({
                        matchupScore: aThisHeroScores.counterHelpEnemyScoreRaw,
                        heroAdvantageScore: aThisHeroScores.helpEnemyScoreRaw,
                        heroSynergyScore: aThisHeroScores.counterTeamScoreRaw
                    });
                }

                //strings and stuff
                aThisHeroScores.counterEnemyScore = Math.floor(aThisHeroScores.counterEnemyScoreRaw * 10) / 10;
                aThisHeroScores.helpTeamScore = Math.floor(aThisHeroScores.helpTeamScoreRaw * 10) / 10;
                aThisHeroScores.counterHelpTeamScore = Math.floor(aThisHeroScores.counterHelpTeamScoreRaw * 10) / 10;

                aThisHeroScores.counterEnemyScoreStr = (aThisHeroScores.counterEnemyScore >= 0 ? '+' : '') + (Math.abs(aThisHeroScores.counterEnemyScore) > 10 ? Math.floor(aThisHeroScores.counterEnemyScore) : aThisHeroScores.counterEnemyScore);
                aThisHeroScores.helpTeamScoreStr = (aThisHeroScores.helpTeamScore >= 0 ? '+' : '') + (Math.abs(aThisHeroScores.helpTeamScore) > 10 ? Math.floor(aThisHeroScores.helpTeamScore) : aThisHeroScores.helpTeamScore);
                aThisHeroScores.counterHelpTeamScoreStr = (aThisHeroScores.counterHelpTeamScore >= 0 ? '+' : '') + (Math.abs(aThisHeroScores.counterHelpTeamScore) > 10 ? Math.floor(aThisHeroScores.counterHelpTeamScore) : aThisHeroScores.counterHelpTeamScore);

                aThisHeroScores.gamePartScore = Math.floor(aThisHeroScores.gamePartScoreRaw * 10) / 10;
                aThisHeroScores.gamePartScoreStr = (aThisHeroScores.gamePartScore >= 0 ? '+' : '') + (Math.abs(aThisHeroScores.gamePartScore) > 10 ? Math.floor(aThisHeroScores.gamePartScore) : aThisHeroScores.gamePartScore);

                aThisHeroScores.personalScore = Math.floor(aThisHeroScores.personalScoreRaw * 10) / 10;
                aThisHeroScores.personalScoreStr = (aThisHeroScores.personalScore >= 0 ? '+' : '') + (Math.abs(aThisHeroScores.personalScore) > 10 ? Math.floor(aThisHeroScores.personalScore) : aThisHeroScores.personalScore);

                aThisHeroScores.computedEnemyScore = Math.floor(aThisHeroScores.computedEnemyScoreRaw*10)/10;
                aThisHeroScores.computedEnemyScoreStr = (aThisHeroScores.computedEnemyScoreRaw >= 0 ? '+' : '') + (Math.abs(aThisHeroScores.computedEnemyScoreRaw) > 10 ? Math.floor(aThisHeroScores.computedEnemyScoreRaw) : Math.floor(aThisHeroScores.computedEnemyScoreRaw*10)/10);

                aThisHeroScores.counterBanScore = Math.floor(aThisHeroScores.counterBanScoreRaw*10)/10;
                aThisHeroScores.counterBanScoreStr = (aThisHeroScores.counterBanScoreRaw >= 0 ? '+' : '') + (Math.abs(aThisHeroScores.counterBanScoreRaw) > 10 ? Math.floor(aThisHeroScores.counterBanScoreRaw) : Math.floor(aThisHeroScores.counterBanScoreRaw*10)/10);

                aThisHeroScores.counterTeamScore = Math.floor(aThisHeroScores.counterTeamScoreRaw*10)/10;
                aThisHeroScores.counterTeamScoreStr = (aThisHeroScores.counterTeamScoreRaw >= 0 ? '+' : '') + (Math.abs(aThisHeroScores.counterTeamScoreRaw) > 10 ? Math.floor(aThisHeroScores.counterTeamScoreRaw) : Math.floor(aThisHeroScores.counterTeamScoreRaw*10)/10);

                aThisHeroScores.helpEnemyScore = Math.floor(aThisHeroScores.helpEnemyScoreRaw*10)/10;
                aThisHeroScores.helpEnemyScoreStr = (aThisHeroScores.helpEnemyScoreRaw >= 0 ? '+' : '') + (Math.abs(aThisHeroScores.helpEnemyScoreRaw) > 10 ? Math.floor(aThisHeroScores.helpEnemyScoreRaw) : Math.floor(aThisHeroScores.helpEnemyScoreRaw*10)/10);

                aThisHeroScores.computedScoreStr = (aThisHeroScores.computedScore >= 0 ? '+' : '') + (Math.abs(aThisHeroScores.computedScore) > 10 ? Math.floor(aThisHeroScores.computedScore) : Math.floor(aThisHeroScores.computedScore*10)/10);

                // aThisHeroScores.wrFull = Math.floor($scope.heroesJson[heroes[aHN].name].timewin[skill].pfull*1000)/10;
                // aThisHeroScores.wrFullStr = aThisHeroScores.wrFull+'';
                //
                // aThisHeroScores.wrLate = Math.floor($scope.heroesJson[heroes[aHN].name].timewin[skill].plate*1000)/10;
                // aThisHeroScores.wrLateStr = aThisHeroScores.wrLate+'';
                //
                // aThisHeroScores.wrMid = Math.floor($scope.heroesJson[heroes[aHN].name].timewin[skill].pmid*1000)/10;
                // aThisHeroScores.wrMidStr = aThisHeroScores.wrMid + '';
                //
                // aThisHeroScores.wrEarly = Math.floor($scope.heroesJson[heroes[aHN].name].timewin[skill].pearly*1000)/10;
                // aThisHeroScores.wrEarlyStr = aThisHeroScores.wrEarly + '';
            }

            resolve({data: result});
        }catch (e) {
            reject(e);
        }
    })
}

class CounterPicker extends React.Component {

    static defaultProps = {
        rootClass: 'xd-list',
        picks: [{name: null, value: null}],
        bans: [{name: null, value: null}]
    };

    constructor(props) {
        super(props);

        this.state = {
            initiated: false
        };

        this.initLoop = this.initLoop.bind(this);
    }

    async initLoop() {
        const {setData, functionProcess, makeOutput, filterData} = this.props;

        await setData(makeHeroData({
            heroes: this.props.dataFromHeroesAdvStorage,
            radiantTeam: this.props.radiantTeam,
            direTeam: this.props.direTeam
        }));
        // await functionProcess(this.props.sequence);
        // await makeOutput();
    };

    componentDidUpdate() {
        if (this.props.dataFromHeroesAdvStorageIsReady) {
            this.initLoop();
        }
    }

    shouldComponentUpdate(nextProps) {

        const oldOUpdate = {
            radiantTeam: this.props.radiantTeam,
            direTeam: this.props.direTeam,
        };
        const newOUpdate = {
            radiantTeam: nextProps.radiantTeam,
            direTeam: nextProps.direTeam
        };

        return !(JSON.stringify(oldOUpdate) === JSON.stringify(newOUpdate));
    }

    render() {
        return (
           <div className={`counter-picker`}>
               <div className={`counter-picker__content`}>
                   <div className={`counter-picker__tabs tabs`}>
                       <div className={`tabs__item`}>Possible Picks</div>
                       <div className={`tabs__item`}>Stats</div>
                   </div>
               </div>
           </div>
        )
    }
}

CounterPicker.propTypes = {
    name: PropTypes.string,
    handleChange: PropTypes.func,
    dataFromHeroesAdvStorage: PropTypes.object,
    dataFromHeroesAdvStorageIsReady: PropTypes.bool
};

const mapStateToProps = (state, props) => {
    return ({
        dataFromHeroesAdvStorage: state.Components.Core[props.pcb.relations.Storage1.id].buffer,
        dataFromHeroesAdvStorageIsReady: state.Components.Core[props.pcb.relations.Storage1.id].meta.flags.setting === 2,
        data: state.Components.Core[props.pcb.relations.Core.id].data,
        radiantTeam: state.Components.List[props.pcb.relations.Radiant.id],
        direTeam: state.Components.List[props.pcb.relations.Dire.id]
    })
};

const mapDispatchers = (dispatch, props) => {
    return bindActionCreators({
        // handleChange: (e) => handleChange(props.pcb.id, e.target),
        // filterData: () => filterData(props.pcb.id, props.pcb.relations.Core.id),
        // radiantPick: (name, value) => pick(props.pcb.relations.Radiant.id, name, value),
        // radiantBan: (name, value) => ban(props.pcb.relations.Radiant.id, name, value),
        // direPick: (name, value) => pick(props.pcb.relations.Dire.id, name, value),
        // direBan: (name, value) => ban(props.pcb.relations.Dire.id, name, value),
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchers)(CounterPicker);