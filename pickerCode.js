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

/**
 * advscores - пик по преймуществам
 * winscores - пик по винрейту
 *
 * Формируются списки противостояния возможным противникам и помощь возможным союзникам
 * Так же если синергия с противником сильна в сумме то противник возможно сможет пикунть этого героя
 *
 * counterEnemyScoreRaw - контра противнику
 * helpEnemyScoreRaw - синергия с противником
 * counterBanScoreRaw - законтрено банами противника
 * helpTeamScoreRaw - синергия с командой
 * counterTeamScoreRaw - контра тиме
 * counterHelpTeamScore - важно в бане
 *
 *
 * - Добавить роли для каждого героя (нужно для двойного списка отображения)
 * - Добавить разделение на список для возможного пика Radiant и Dire отдельно
 * - Добавить все роди и подроли для фильтра
 *
 *
 * 2453 вывод статистики
 * */