let aLastDebug = +new Date();
const TimeCache = {};

function Debug(msg) {
return;
	if (!(msg in TimeCache)) TimeCache[msg] = 0;
    const aNow = +new Date();
    TimeCache[msg] += aNow-aLastDebug;
	console.log((aNow-aLastDebug)+' ('+ TimeCache[msg] +') '+msg);
        aLastDebug = aNow;
}
function DebugScope(start, msg) {
return;
    const aNow = +new Date();
    console.log('sc '+(aNow-aLastDebug)+ ' '+msg);
        aLastDebug = aNow;
}

if (typeof(GetCacheParam)=='undefined') {
	GetCacheParam = function() { return 'cv=0';}
}

const popupInterval = 0;
if (typeof(AngularModules) == 'undefined') AngularModules = ['ngCookies']; //default
const pickerApp = angular.module('pickerApp', AngularModules);
pickerApp.config(function($interpolateProvider) {
     $interpolateProvider.startSymbol('<%');
     $interpolateProvider.endSymbol('%>');
  });



pickerApp.factory('pickerData', ['$http', function($http) {
/*
options:
  optimizeSameTime (default false) - if a query is already underway, it will just wait for that answer
*/
    const OptimizeSameTimeCb = {};
    return function(data, options){
    return new Promise(function(resolve, reject) {
        let aPath = '';
        switch (data) {
      case 'heroinfo':
        aPath = '/assets/json/data/heroinfo.json?'+GetCacheParam('assets/json/data/heroinfo.json');
        break;
      case 'heroadvscores':
        aPath = '/assets/json/data/heroadvscores.json?'+GetCacheParam('assets/json/data/heroadvscores.json');
        break;
      case 'herowinscores':
        aPath = '/assets/json/data/herowinscores.json?'+GetCacheParam('assets/json/data/herowinscores.json');
        break;
      case 'herotimeadv':
        aPath = '/assets/json/data/herotimeadv.json?'+GetCacheParam('assets/json/data/herotimeadv.json');
        break;
      default:
        reject(new Error('Unknown pickerData '+data));
        return;
      }
      if (options && options.optimizeSameTime) {
        if (!(data in OptimizeSameTimeCb)) OptimizeSameTimeCb[data] = [];
        OptimizeSameTimeCb[data].push({resolve: resolve, reject: reject});
        if (OptimizeSameTimeCb[data].length > 1) return;
      }

      console.log('Data request ' + data);
      $http.get(aPath).
      then(function (success) {
        if (options && options.optimizeSameTime) {
          for (let N = 0; N < OptimizeSameTimeCb[data].length; N++)
            OptimizeSameTimeCb[data][N].resolve(success.data);
          OptimizeSameTimeCb[data] = [];
        } else
          resolve(success.data);
      }, function(error) {
        if (options && options.optimizeSameTime) {
          for (let N = 0; N < OptimizeSameTimeCb[data].length; N++)
            OptimizeSameTimeCb[data][N].reject(error);
          OptimizeSameTimeCb[data] = [];
        } else
          reject(error);
      });
    });
  };
}]);


const aJustOnceCbs = {};

function PromiseJustOnce(name, fnPromiseOnce, fnPromiseEveryAfter) {
  if (!(name in aJustOnceCbs)) {
    aJustOnceCbs[name] = [];
    return new Promise(function(resolve, reject) {
      aJustOnceCbs[name].push({resolve: resolve, reject: reject});
      new Promise(fnPromiseOnce).
      then(function(success){
          const aCallAfter = aJustOnceCbs[name];
          aJustOnceCbs[name] = null;
        aCallAfter.forEach(function(val, N) {
          new Promise(fnPromiseEveryAfter).
          then (function(success) { aCallAfter[N].resolve(success); }).
          catch (function(error){ aCallAfter[N].reject(error);});
        });
      }).
      catch(function(error){
        reject(error);
        for (let N = 0; N < aJustOnceCbs[name].length; N++) aJustOnceCbs[name][N].reject(error);
        aJustOnceCbs[name] = error;
      });
    })
  } else if (aJustOnceCbs[name] === null) {
    //fnPromiseOnce with success
    return new Promise(fnPromiseEveryAfter);
  } else if (Array.isArray(aJustOnceCbs[name])) {
    //fnPromiseOnce pending
    return new Promise(function(resolve, reject) { aJustOnceCbs[name].push({resolve: resolve, reject: reject}) });
  } else {
    //fnPromiseOnce failed
    return Promise.reject(aJustOnceCbs[name]);
  }
}

pickerApp.factory('heroes', ['pickerData', function(pickerData) {

    const aSingleton = {
        array: [],
        json: {},
        loaded: {
            heroinfo: false,
            heroadvscores: false,
            herowinscores: false,
            herotimeadv: false,
        },
        skillLevels: [],
        all: {},
    };
    const AddHeroesInfo = function () {
        return PromiseJustOnce('heroinfo', function (resolve, reject) {
            pickerData('heroinfo', {optimizeSameTime: true}).then(function (data) {
                aSingleton.array = [];
                const hn = data.heronames;
                for (var N = 0; N < hn.length; N++) {
                    aSingleton.array.push({
                        name: hn[N],
                        nameshow: hn[N],
                        url: hn[N].replace(/ /g, '_'),
                        id: N,
                        heropedia: data.description[hn[N]].heropedia,
                        vid: data.valveids[hn[N]],
                        img: location.protocol == 'http:' ? ('http://img.dotapicker.net/' + data.images[hn[N]].img) : data.images[hn[N]].img,
                        imgsmall: location.protocol == 'http:' ? ('http://img.dotapicker.net/' + data.images[hn[N]].imgsmall) : data.images[hn[N]].imgsmall,
                        imglarge: location.protocol == 'http:' ? ('http://img.dotapicker.net/' + data.images[hn[N]].imglarge) : data.images[hn[N]].imglarge,
                        atk: data.description[hn[N]].atk,
                        roles: data.description[hn[N]].roles,
                        canRoles: data.description[hn[N]].canRoles,
                        pos: data.gridposition[hn[N]],
                        searchTerms: data.lookup[hn[N]],
                        stars: data.description[hn[N]].stars,
                    });

                    if ('icon' in data.images[hn[N]]) aSingleton.array[aSingleton.array.length - 1].icon = data.images[hn[N]].icon;
                    else aSingleton.array[aSingleton.array.length - 1].icon = '/assets/img/heroicons/default_icon.png';

                    if ('spritelarge' in data.images[hn[N]]) aSingleton.array[aSingleton.array.length - 1].spritelarge = {
                        img: data.sprites.heroeslarge.img,
                        width: data.sprites.heroeslarge.width,
                        height: data.sprites.heroeslarge.height,
                        widthtotal: data.sprites.heroeslarge.widthtotal,
                        heighttotal: data.sprites.heroeslarge.heighttotal,
                        x: data.images[hn[N]].spritelarge.x,
                        y: data.images[hn[N]].spritelarge.y
                    }

                    aSingleton.array[aSingleton.array.length - 1].searchTerms.push(hn[N].toLowerCase());
                }
                aSingleton.json = {};
                aSingleton.valveIds = {};
                for (var N = 0; N < aSingleton.array.length; N++) {
                    aSingleton.json[aSingleton.array[N].name] = aSingleton.array[N];
                    aSingleton.valveIds[aSingleton.array[N].vid] = aSingleton.array[N];
                }
                aSingleton.CMUnavailable = data.cmunavailable;
                aSingleton.skillLevels = data.skilllevels;
                for (var N = 0; N < aSingleton.array.length; N++) {
                    aSingleton.array[N].rolesJSON = {};
                    for (var R = 0; R < aSingleton.array[N].roles.length; R++)
                        aSingleton.array[N].rolesJSON[aSingleton.array[N].roles[R]] = true;
                    delete aSingleton.array[N].roles;
                    aSingleton.array[N].rolesJSONDefault = JSON.parse(JSON.stringify(aSingleton.array[N].rolesJSON));

                    aSingleton.array[N].canRolesJSON = {};
                    for (var R = 0; R < aSingleton.array[N].canRoles.length; R++)
                        aSingleton.array[N].canRolesJSON[aSingleton.array[N].canRoles[R]] = true;
                    delete aSingleton.array[N].canRoles;
                    aSingleton.array[N].canRolesJSONDefault = JSON.parse(JSON.stringify(aSingleton.array[N].canRolesJSON));
                }
                aSingleton.availableRoleTypes = data.availableRoleTypes;
                aSingleton.availableRoles = data.availableRoles;
                aSingleton.availableRolesJSON = {};
                for (var N = 0; N < aSingleton.availableRoles.length; N++) aSingleton.availableRolesJSON[aSingleton.availableRoles[N].role] = aSingleton.availableRoles[N];

                if (gup('language') != '' && (gup('language') == 'zh-cn')) {
                    $http.get('/assets/json/data/heroinfo_' + gup('language') + '.json?' + GetCacheParam('assets/json/data/heroinfo.json')).then(function (success) {
                        const data = success.data;
                        for (let N = 0; N < hn.length; N++) {
                            aSingleton.array[N].nameshow = data.heronames[N];
                            if (aSingleton.array[N].nameshow != aSingleton.array[N].name) aSingleton.array[N].searchTerms.push(data.heronames[N]);
                        }

                        aSingleton.loaded.heroinfo = true;
                        resolve();
                    }, function (err) {
                        aSingleton.loaded.heroinfo = true;
                        resolve();
                    });
                } else {
                    aSingleton.loaded.heroinfo = true;
                    resolve();
                }
            }, reject);
        }, function (resolve, reject) {
            resolve(aSingleton);
        });
    };
    const AddHeroesAdvScores = function () {
        return PromiseJustOnce('heroadvscores', function (resolve, reject) {
            AddHeroesInfo().then(function () {
                return pickerData('heroadvscores', {optimizeSameTime: true});
            }).then(function (data) {
                return new Promise(function (resolve, reject) {
                    for (let N = 0; N < data.heronames.length; N++) {
                        aSingleton.json[data.heronames[N]].advantage = data.adv_rates[N];
                        aSingleton.json[data.heronames[N]].advantageUnscaled = JSON.parse(JSON.stringify(data.adv_rates[N]));
                        if ('adv_rates_scale' in data) {
                            for (var hvN = 0; hvN < aSingleton.json[data.heronames[N]].advantage.length; hvN++) {
                                if (aSingleton.json[data.heronames[N]].advantage[hvN] == null) continue;
                                for (var sN = 0; sN < aSingleton.skillLevels.length; sN++) {
                                    aSingleton.json[data.heronames[N]].advantage[hvN][sN] = Math.round(aSingleton.json[data.heronames[N]].advantage[hvN][sN] / data.adv_rates_scale[sN] * 1000) / 100;
                                    if (aSingleton.json[data.heronames[N]].advantage[hvN][sN] > 10) aSingleton.json[data.heronames[N]].advantage[hvN][sN] = 10;
                                    if (aSingleton.json[data.heronames[N]].advantage[hvN][sN] < -10) aSingleton.json[data.heronames[N]].advantage[hvN][sN] = -10;
                                }
                            }
                        }
                        aSingleton.json[data.heronames[N]].synergy = data.adv_rates_friends[N];
                        aSingleton.json[data.heronames[N]].synergyUnscaled = JSON.parse(JSON.stringify(data.adv_rates_friends[N]));
                        if ('adv_rates_friends_scale' in data) {
                            for (var hvN = 0; hvN < aSingleton.json[data.heronames[N]].synergy.length; hvN++) {
                                if (aSingleton.json[data.heronames[N]].synergy[hvN] == null) continue;
                                for (var sN = 0; sN < aSingleton.skillLevels.length; sN++) {
                                    aSingleton.json[data.heronames[N]].synergy[hvN][sN] = Math.round(aSingleton.json[data.heronames[N]].synergy[hvN][sN] / data.adv_rates_friends_scale[sN] * 1000) / 100;
                                    if (aSingleton.json[data.heronames[N]].synergy[hvN][sN] > 10) aSingleton.json[data.heronames[N]].synergy[hvN][sN] = 10;
                                    if (aSingleton.json[data.heronames[N]].synergy[hvN][sN] < -10) aSingleton.json[data.heronames[N]].synergy[hvN][sN] = -10;
                                }
                            }
                        }
                    }
                    if ('adv_rates_scale' in data)
                        aSingleton.all.advantageScaleHigh = data.adv_rates_scale;
                    else console.log("WARNING no adv_rates_scale");
                    if ('adv_rates_friends_scale' in data)
                        aSingleton.all.synergyScaleHigh = data.adv_rates_friends_scale;
                    else console.log("WARNING no adv_rates_friends_scale");
                    if ("map_version" in data) aSingleton.all.heroAdvScoresMapVersion = data.map_version;
                    if ("last_update" in data) {
                        aSingleton.all.heroAdvScoresLastUpdate = data.last_update;
                        const updDate = new Date(data.last_update * 1000);
                        aSingleton.all.heroAdvScoresLastUpdateStr = (updDate.getUTCMonth() + 1) + '/' + updDate.getUTCDate() + '/' + updDate.getUTCFullYear();
                        aSingleton.all.heroAdvScoresLastUpdateStrLong = updDate.toUTCString();
                    }
                    aSingleton.loaded.heroadvscores = true;
                    resolve();
                })
            }).then(resolve, reject);
        }, function (resolve, reject) {
            resolve(aSingleton);
        });
    };
    const AddHeroesWinScores = function () {
        return PromiseJustOnce('herowinscores', function (resolve, reject) {
            AddHeroesInfo().then(function () {
                return pickerData('herowinscores', {optimizeSameTime: true});
            }).then(function (data) {
                return new Promise(function (resolve, reject) {
                    for (let N = 0; N < data.heronames.length; N++) {
                        aSingleton.json[data.heronames[N]].winrate = data.win_rates[N];
                        aSingleton.json[data.heronames[N]].winrateUnscaled = JSON.parse(JSON.stringify(data.win_rates[N]));
                        if ('win_rates_scale' in data) {
                            for (var hvN = 0; hvN < aSingleton.json[data.heronames[N]].winrate.length; hvN++) {
                                if (aSingleton.json[data.heronames[N]].winrate[hvN] == null) continue;
                                for (var sN = 0; sN < aSingleton.skillLevels.length; sN++) {
                                    aSingleton.json[data.heronames[N]].winrate[hvN][sN] = Math.round(aSingleton.json[data.heronames[N]].winrate[hvN][sN] / data.win_rates_scale[sN] * 1000) / 100;
                                    if (aSingleton.json[data.heronames[N]].winrate[hvN][sN] > 10) aSingleton.json[data.heronames[N]].winrate[hvN][sN] = 10;
                                    if (aSingleton.json[data.heronames[N]].winrate[hvN][sN] < -10) aSingleton.json[data.heronames[N]].winrate[hvN][sN] = -10;
                                }
                            }
                        }
                        aSingleton.json[data.heronames[N]].winrateteam = data.win_rates_friends[N];
                        aSingleton.json[data.heronames[N]].winrateteamUnscaled = JSON.parse(JSON.stringify(data.win_rates_friends[N]));
                        if ('win_rates_friends_scale' in data) {
                            for (var hvN = 0; hvN < aSingleton.json[data.heronames[N]].winrateteam.length; hvN++) {
                                if (aSingleton.json[data.heronames[N]].winrateteam[hvN] == null) continue;
                                for (var sN = 0; sN < aSingleton.skillLevels.length; sN++) {
                                    aSingleton.json[data.heronames[N]].winrateteam[hvN][sN] = Math.round(aSingleton.json[data.heronames[N]].winrateteam[hvN][sN] / data.win_rates_friends_scale[sN] * 1000) / 100;
                                    if (aSingleton.json[data.heronames[N]].winrateteam[hvN][sN] > 10) aSingleton.json[data.heronames[N]].winrateteam[hvN][sN] = 10;
                                    if (aSingleton.json[data.heronames[N]].winrateteam[hvN][sN] < -10) aSingleton.json[data.heronames[N]].winrateteam[hvN][sN] = -10;
                                }
                            }
                        }
                    }
                    if ('win_rates_scale' in data)
                        aSingleton.all.winrateScaleHigh = data.win_rates_scale;
                    else console.log("WARNING no win_rates_scale");
                    if ('win_rates_friends_scale' in data)
                        aSingleton.all.winrateteamScaleHigh = data.win_rates_friends_scale;
                    else console.log("WARNING no win_rates_friends_scale");
                    aSingleton.loaded.herowinscores = true;
                    resolve();
                })
            }).then(resolve, reject);
        }, function (resolve, reject) {
            resolve(aSingleton);
        });
    };
    const AddHeroesTimeAdv = function () {
        return PromiseJustOnce('herotimeadv', function (resolve, reject) {
            AddHeroesInfo().then(function () {
                return pickerData('herotimeadv', {optimizeSameTime: true});
            }).then(function (data) {
                return new Promise(function (resolve, reject) {
                    for (let N = 0; N < aSingleton.array.length; N++)
                        aSingleton.array[N].timewin = [data.timeadv[0][aSingleton.array[N].name], data.timeadv[1][aSingleton.array[N].name], data.timeadv[2][aSingleton.array[N].name]];

                    const aValues = [[], [], []];
                    for (var hN = 0; hN < aSingleton.array.length; hN++) {
                        aSingleton.array[hN].gamePart = [{}, {}, {}];
                        for (var sN = 0; sN < aSingleton.skillLevels.length; sN++) {
                            const aAvg = (aSingleton.array[hN].timewin[sN].hearly + aSingleton.array[hN].timewin[sN].hmid + aSingleton.array[hN].timewin[sN].hlate) / 3;
                            aSingleton.array[hN].gamePart[sN].early = (aSingleton.array[hN].timewin[sN].hearly - aAvg) * 100;
                            aSingleton.array[hN].gamePart[sN].mid = (aSingleton.array[hN].timewin[sN].hmid - aAvg) * 100;
                            aSingleton.array[hN].gamePart[sN].late = (aSingleton.array[hN].timewin[sN].hlate - aAvg) * 100;
                            aValues[sN].push(Math.abs(aSingleton.array[hN].gamePart[sN].early));
                            aValues[sN].push(Math.abs(aSingleton.array[hN].gamePart[sN].mid));
                            aValues[sN].push(Math.abs(aSingleton.array[hN].gamePart[sN].late));
                        }
                    }
                    const scaleFrom = 0.85;
                    const aMaxScore = 1;
                    const aScale = [];
                    for (var sN = 0; sN < aSingleton.skillLevels.length; sN++) {
                        aValues[sN].sort();
                        aScale.push(aValues[sN][Math.round(aValues[sN].length * scaleFrom)]);
                    }
                    for (var hN = 0; hN < aSingleton.array.length; hN++) {
                        for (var sN = 0; sN < aSingleton.skillLevels.length; sN++) {
                            let aLocalScale = aScale[sN];
                            if (aSingleton.array[hN].gamePart[sN].early > aLocalScale) aLocalScale = aSingleton.array[hN].gamePart[sN].early;
                            if (aSingleton.array[hN].gamePart[sN].mid > aLocalScale) aLocalScale = aSingleton.array[hN].gamePart[sN].mid;
                            if (aSingleton.array[hN].gamePart[sN].late > aLocalScale) aLocalScale = aSingleton.array[hN].gamePart[sN].late;
                            aSingleton.array[hN].gamePart[sN].early = Math.round(aSingleton.array[hN].gamePart[sN].early / aLocalScale * aMaxScore * 100) / 100;
                            aSingleton.array[hN].gamePart[sN].mid = Math.round(aSingleton.array[hN].gamePart[sN].mid / aLocalScale * aMaxScore * 100) / 100;
                            aSingleton.array[hN].gamePart[sN].late = Math.round(aSingleton.array[hN].gamePart[sN].late / aLocalScale * aMaxScore * 100) / 100;
                        }
                    }
                    aSingleton.loaded.herotimeadv = true;
                    resolve();
                })
            }).then(resolve, reject);
        }, function (resolve, reject) {
            resolve(aSingleton);
        });
    };


//  AddHeroesTimeAdv().
//  then(function(success){ console.log('suc'); }).
//  catch(function(err) {console.log(err);});

  aSingleton.AddHeroesInfo = AddHeroesInfo;
  aSingleton.AddHeroesAdvScores = AddHeroesAdvScores;
  aSingleton.AddHeroesWinScores = AddHeroesWinScores;
  aSingleton.AddHeroesTimeAdv = AddHeroesTimeAdv;
  return aSingleton;
}]);


function gup(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    const regexS = "[\\?&]" + name + "=([^&#]*)";
    const regex = new RegExp(regexS);
    const results = regex.exec(window.location.href);
    if (results == null)
        return "";
    else
        return results[1];
}

function HtmlSafeEncode(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function PingCustomAd (str) {
  $.get( "/api/count/"+str+"/1", function( data ) { });
}

function RefferCustomAd (refurl, str) {
  $.get( "/api/count/"+str+"/1", function( data ) {
	setTimeout(function() { window.location.assign(refurl); }, 0);
  });
}

function MakeStringShort(str, cnt) {
  if (cnt < 4) cnt = 4;
  if (str.length > cnt)
    return str.substr(0,cnt-3)+'...';
  else return str;
}

function RoundDec(nr, mult) {
  if (typeof(mult) == 'undefined') {
    var mult = 100;
  }
  return Math.round(nr * mult) / mult;
}

function W8() {
    let count = 0;
    let exec = false;
    let callback = function () {
    };
    this.run = function( _callback ) {
    callback=_callback;
    exec = true;
    if ( count === 0 )
      callback();
  }
  this.queue = function() {
    count++;
    return this.getfn();
  }
  this.getfn = function() {
    return function() {
      count--;
      if ( exec && ( count === 0 ) )
        callback();
    }
  }
  this.execfn = function() {
    count--;
    if ( exec && ( count === 0 ) )
      callback();
  }
}

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

KeypressObservers = [];
jQuery(document).on('keypress', function(e){
	for (let N = 0; N < KeypressObservers.length; N++)
		KeypressObservers[N](e.which || e.charCode);
});


//windows resize observers
//on add gets called with current window info
const WindowInfo = {};

function UpdateWindowInfo() {
  WindowInfo.windowHeight = $( window ).height();
};
UpdateWindowInfo();
WindowsResizeObservers = {
  push: function(fn) { this.arrFn.push(fn); setTimeout(function(){ fn(WindowInfo); },0); },
  arrFn: []
}
let winLastCall = -1;
$( window ).resize(function() {
    const now = +new Date();
    winLastCall = now;
  setTimeout(function(){
    if (now != winLastCall) return;
	UpdateWindowInfo();
	for (let N = 0; N < WindowsResizeObservers.arrFn.length; N++)
		WindowsResizeObservers.arrFn[N](WindowInfo);
  }, 150);
});


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


function UpdateTutorialPopupsNow() {
        Debug('UpdateTutorialPopupsNowStart');
	//Update Tutorial Popups
    const items = $(".tutorialPopup");
    for (let i = 0; i < items.length; i++) {
		if ($(items[i]).attr("popped")) continue;
		$(items[i]).popover({
			html : true, 
			//container: 'body',
			trigger: 'hover',
			template: '<div class="popover" style="min-width: '+((typeof($(items[i]).attr("pwidth"))=='undefined')?'250':$(items[i]).attr("pwidth"))+'px; color: #BDBDBD;"><div class="arrow"></div><div class="popover-title"></div><div class="popover-content"></div></div>',
			title: '<center>' + $(items[i]).attr("tutorialTitle").replace('bluecolor', 'style=" color: #2a9fd6; "') + '</center>',
			content: $(items[i]).attr("tutorialText")
		});
		$(items[i]).attr('popped', "done");
		
		//console.log($(items[i]).attr("pwidth"));
	}
        Debug('UpdateTutorialPopupsNowEnd');
}

function UpdateTutorialPopups() {
	setTimeout(function() {
		//Update Tutorial Popups
	   UpdateTutorialPopupsNow();
	}, 0);
}



function AddHeroesInfo($scope, heroesLib, cb) {
  if (!('loaded' in $scope)) $scope.loaded = {};
  if (!('heroInfo' in $scope.loaded)) $scope.loaded.heroInfo = false;

  heroesLib.AddHeroesInfo().then(function(hInfo){
    if ($scope.loaded.heroInfo == false) {
      $scope.heroes = hInfo.array;
      $scope.heroesJson = hInfo.json;
      $scope.valveIds = hInfo.valveIds;
      $scope.CMUnavailable = hInfo.CMUnavailable;
      $scope.SkillLevels = hInfo.skillLevels;
      $scope.availableRoleTypes = hInfo.availableRoleTypes;
      $scope.availableRoles = hInfo.availableRoles;
      $scope.availableRolesJSON = hInfo.availableRolesJSON;
      $scope.loaded.heroInfo = true;
    }
    cb();
  }).catch(function(error){console.log(error);});
  return;
}

function AddHeroesAdvScores($scope, heroesLib, cb) {
  if (!('loaded' in $scope)) $scope.loaded = {};
  if (!('allHeroes' in $scope)) $scope.allHeroes = {};
  if (!('heroAdvScores' in $scope.loaded))  $scope.loaded.heroAdvScores = false;

  heroesLib.AddHeroesAdvScores().then(function(hInfo){
    if ($scope.loaded.heroAdvScores == false) {
      $scope.loaded.heroAdvScores = true;
      $scope.allHeroes.advantageScaleHigh = hInfo.all.advantageScaleHigh;
      $scope.allHeroes.synergyScaleHigh = hInfo.all.synergyScaleHigh;
      $scope.heroAdvScoresMapVersion = hInfo.all.heroAdvScoresMapVersion;
      $scope.heroAdvScoresLastUpdate = hInfo.all.heroAdvScoresLastUpdate;
      $scope.heroAdvScoresLastUpdateStr = hInfo.all.heroAdvScoresLastUpdateStr;
      $scope.heroAdvScoresLastUpdateStrLong = hInfo.all.heroAdvScoresLastUpdateStrLong;
    }
    cb();
  }).catch(function(error){console.log(error);});
	
}

function AddHeroesWinScores($scope, heroesLib, cb) {
  if (!('loaded' in $scope)) $scope.loaded = {};
  if (!('allHeroes' in $scope)) $scope.allHeroes = {};
  if (!('heroWinScores' in $scope.loaded))  $scope.loaded.heroWinScores = false;

  heroesLib.AddHeroesWinScores().then(function(hInfo){
    if ($scope.loaded.heroWinScores == false) {
      $scope.loaded.heroWinScores = true;
      $scope.allHeroes.winrateScaleHigh = hInfo.all.winrateScaleHigh;
      $scope.allHeroes.winrateteamScaleHigh = hInfo.all.winrateteamScaleHigh;
    }
    cb();
  }).catch(function(error){console.log(error);});
}



function AddHeroesTimeAdv($scope, heroesLib, cb) {
  if (!('loaded' in $scope)) $scope.loaded = {};
  if (!('heroTimeAdv' in $scope.loaded)) $scope.loaded.heroTimeAdv = false;
  heroesLib.AddHeroesTimeAdv().then(function(hInfo){
    if (!$scope.loaded.heroTimeAdv) {
      $scope.loaded.heroTimeAdv = true;
    }
    cb();
  }).catch(function(error){console.log(error);});
}

let heroWinratesAdvCb = [];

function AddHeroWinrates($http, $scope, time, cb) {
    if (!('loaded' in $scope)) $scope.loaded = {};
    if (typeof(heroes) != 'undefined') {
		$scope.loaded.heroWinratesAdv = true;
		setTimeout(function(){ cb(); $scope.$apply(); } ,0);
        return;
    }
    if (heroWinratesAdvCb == null) {
        setTimeout(function(){ cb(); $scope.$apply(); } ,0);
        return;
    }
    heroWinratesAdvCb.push(cb);
    if (heroWinratesAdvCb.length != 1)
        return;
    $scope.loaded.heroWinratesAdv = false;
    //assets/dynamic/winrates10d.json
	$http.get('/assets/dynamic/winrates'+time+'.json?'+GetCacheParam('/assets/dynamic/winrates'+time+'.json')).
	then(function (success){
        const data = success.data, status = success.status, headers = success.headers, config = success.config;
        for (var N = 0; N < $scope.heroes.length; N++) {
			$scope.heroes[N]['wrinfo'+time]= data['h'+$scope.heroes[N].vid];
		}
		$scope.loaded.heroWinratesAdv = true;
		for (var N = 0; N < heroWinratesAdvCb.length; N++) heroWinratesAdvCb[N]();
		heroWinratesAdvCb = null;
	}, function(err) {});
    
}


let heroTimeAdvAllCb = [];

function AddHeroesTimeAdvAll($http, $scope, cb) {
    if (!('loaded' in $scope)) $scope.loaded = {};
    if (typeof(heroes) != 'undefined') {
		$scope.loaded.heroTimeAdvAll = true;
		setTimeout(function(){ cb(); $scope.$apply(); } ,0);
        return;
    }
    if (heroTimeAdvAllCb == null) {
        setTimeout(function(){ cb(); $scope.$apply(); } ,0);
        return;
    }
    heroTimeAdvAllCb.push(cb);
    if (heroTimeAdvAllCb.length != 1)
        return;
    $scope.loaded.heroTimeAdvAll = false;
    
	$http.get('/assets/json/data/herotimeadvall.json?'+GetCacheParam('assets/json/data/herotimeadvall.json')).
	then(function (success){
        const data = success.data, status = success.status, headers = success.headers, config = success.config;
        $scope.herotimeadvall = data.versions;
		$scope.herotimeadvallversions = [];
		for (var N = 0; N < data.versions.length; N++) {
		  $scope.herotimeadvallversions.push(data.versions[N].map_version);
		}
		$scope.loaded.heroTimeAdvAll = true;
		for (var N = 0; N < heroTimeAdvAllCb.length; N++) heroTimeAdvAllCb[N]();
		heroTimeAdvAllCb = null;
	}, function(err) {});
}

let getFriendsCb = [];

function AddFriends($http, $scope, cb) {
		
	//needs $scope.userId
    if (!('loaded' in $scope)) $scope.loaded = {};
    if (getFriendsCb == null) {
        setTimeout(function(){ cb(); $scope.$apply(); } ,0);
        return;
    }
    getFriendsCb.push(cb);
    if (getFriendsCb.length != 1)
        return;
    $scope.loaded.getFriends = false;
    
	$http.get('/api/friends/'+$scope.userId).
	then(function (success){
        const data = success.data, status = success.status, headers = success.headers, config = success.config;
        $scope.friends = data;

        $scope.friends.sort(function(a, b){
          if (!('count' in a) || !('count' in b)) return 0;
          return b.count-a.count;
        });
		for (var N = 0; N < $scope.friends.length; N++) $scope.friends[N].name10 = HtmlSafeEncode(MakeStringShort($scope.friends[N].name,15));
		
		$scope.loaded.getFriends = true;
		for (var N = 0; N < getFriendsCb.length; N++) getFriendsCb[N]();
		getFriendsCb = null;
	}, function(err) {
		$scope.friends = [];
/*$scope.friends = [{steamid: "76561198074738338",name: "bugger29",wins: "64",count: "127",indexed: true},{steamid: "76561198097120023",name: "t0mmy",wins: 0,count: "0",indexed: true},{steamid: "76561198074148333",name: "GHX",wins: "5",count: "14",indexed: true}];
for (var N = 0; N < 100; N++) $scope.friends.push({steamid: "76561198074738338",name: "bugger29",wins: "64",count: "127",indexed: true});
for (var N = 0; N < $scope.friends.length; N++) $scope.friends[N].name10 = HtmlSafeEncode(MakeStringShort($scope.friends[N].name,15));*/
		for (let N = 0; N < getFriendsCb.length; N++) getFriendsCb[N]();
		getFriendsCb = null;
	});
}

let heroPersonalCb = [];

function AddHeroesPersonal($http, $scope, force, cb) {
    if (!('loaded' in $scope)) $scope.loaded = {};
    if (heroPersonalCb == null) {
        setTimeout(function(){ cb(); DebugScope(true, 'AddHeroesPersonal'); $scope.$apply(); DebugScope(false, 'AddHeroesPersonal');} ,0);
        return;
    }
    heroPersonalCb.push(cb);
    if (heroPersonalCb.length != 1)
        return;
    $scope.loaded.heroPersonal = false;

    let persScoresUrl = '/api/personalscores/' + (force ? 'stats' : 'picker');
    if (gup('account')!='')
		persScoresUrl += '/'+gup('account');
	
	$http.get(persScoresUrl).
	then(function (success){
        const data = success.data, status = success.status, headers = success.headers, config = success.config;
        if ('selfid' in data) {
			$scope.userId = data.selfid;
			$scope.loggedIn = true;
			if ($scope.userId == 0)
				$scope.loggedIn = false;
		} else {
			$scope.loggedIn = false;
		}
		if ('id' in data) {
		  $scope.personalFor = data.id;
		} else {
			$scope.personalFor = $scope.userId;
		}
		if ('overloaded' in data && data.overloaded)
			$scope.personalScoresOverloaded = true;
		if ('tts' in data) {
			$scope.personalTts = data.tts;
			if (data.tts!=-1) {
				$tmp = Math.floor(data.tts * 1440); //minutes
				$scope.personalTtsMin = $tmp % 60;
				$tmp = Math.floor($tmp/60);
				$scope.personalTtsHrs = $tmp % 24;
				$scope.personalTtsDays = Math.floor($tmp/24);
			}
		}
		if ('enabled' in data && data.enabled)
			$scope.personalEnabled = true;
		if ('allowedAccess' in data) $scope.personalScoresAccess = data.allowedAccess;
		else $scope.personalScoresAccess = true;
		if ('name' in data) $scope.personalScoresUsernameSafe = HtmlSafeEncode(data.name);
		if ('personalHeroScores' in data) {
			$scope.personalScoresEnabled = true;
			for (var N = 0; N < data.personalHeroScores.length; N++) {
				if (!(data.personalHeroScores[N].hid in $scope.valveIds))
					continue;
				$scope.valveIds[data.personalHeroScores[N].hid].personalScores = {
					scoreAll: Math.round(data.personalHeroScores[N].score*100)/100,
					score10: Math.round(data.personalHeroScores[N].score10*100)/100,
					scoreMon: Math.round(data.personalHeroScores[N].scoreMon*100)/100,
					score3Mon: Math.round(data.personalHeroScores[N].score3Mon*100)/100,
					wrAll: Math.round(data.personalHeroScores[N].wr*100)/100,
					wr10: Math.round(data.personalHeroScores[N].wr10*100)/100,
					wrMon: Math.round(data.personalHeroScores[N].wrMon*100)/100,
					wr3Mon: Math.round(data.personalHeroScores[N].wr3Mon*100)/100,
					cntAll: Math.round(data.personalHeroScores[N].cnt*100)/100,
					cnt10: Math.round(data.personalHeroScores[N].cnt10*100)/100,
					cntMon: Math.round(data.personalHeroScores[N].cntMon*100)/100,
					cnt3Mon: Math.round(data.personalHeroScores[N].cnt3Mon*100)/100,
				}
				$scope.valveIds[data.personalHeroScores[N].hid].personalScores.usedScore = (data.personalHeroScores[N].score * 1.5 + data.personalHeroScores[N].score10) / 4.5 * data.personalHeroScores[N].scaling + data.personalHeroScores[N].scoreMon / 4.5 * data.personalHeroScores[N].scalingMon + data.personalHeroScores[N].score3Mon / 4.5 * data.personalHeroScores[N].scaling3Mon;
				$scope.valveIds[data.personalHeroScores[N].hid].personalScores.usedScore = Math.round($scope.valveIds[data.personalHeroScores[N].hid].personalScores.usedScore*100)/100;
				$scope.valveIds[data.personalHeroScores[N].hid].personalScores.usedScoreUnscaled = $scope.valveIds[data.personalHeroScores[N].hid].personalScores.usedScore;
			}
		}
		if ('steamDataEnabled' in data) $scope.steamDataEnabled = data.steamDataEnabled;
		if ('personalMatchesIndexed' in data)
			$scope.personalMatchesIndexed = data.personalMatchesIndexed;
		for (var N = 0; N < $scope.heroes.length; N++) {
			if (!('personalScores' in $scope.heroes[N]))
				$scope.heroes[N].personalScores = {scoreAll: 0, score10: 0, scoreMon: 0, score3Mon: 0, usedScore: 0, wrAll: 0, wr10: 0, wrMon: 0, wr3Mon: 0, cntAll: 0, cnt10: 0, cntMon: 0, cnt3Mon: 0};
		}
		$scope.loaded.heroPersonal = true;
		Debug('AddHeroesPersonalEnd');
		for (var N = 0; N < heroPersonalCb.length; N++) heroPersonalCb[N]();
		heroPersonalCb = null;
	}, function(err) {});
}

function HeroesScalePersonalScores($scope){
	if ('personalScoresScaled' in $scope) return;
	var max = 0.3;
	for (var N = 0; N < $scope.heroes.length; N++) 
		if (Math.abs($scope.heroes[N].personalScores.usedScore) > max)
			max = Math.abs($scope.heroes[N].personalScores.usedScore);
	var max = 1 / max;
	for (var N = 0; N < $scope.heroes.length; N++)  {
		$scope.heroes[N].personalScores.usedScore = $scope.heroes[N].personalScores.usedScore * max;
	}
	$scope.personalScoresScaled = true;
}

let heroTipsCb = [];

function AddHeroTips($http, $scope, cb) {
    if (!('loaded' in $scope)) $scope.loaded = {};
    if (typeof(heroes) != 'undefined') {
		$scope.tips = {interactionenemyes: hinteractionenemyes, enemy: htipsenemy};
		$scope.loaded.heroTips = true;
		setTimeout(function(){ cb(); $scope.$apply(); } ,0);
        return;
    }
    if (heroTipsCb == null) {
        setTimeout(function(){ cb(); $scope.$apply(); } ,0);
        return;
    }
    heroTipsCb.push(cb);
    if (heroTipsCb.length != 1)
        return;
    $scope.loaded.heroTips = false;
    
        $http.get('/assets/json/data/herotips.json?'+GetCacheParam('assets/json/data/herotips.json')).
	then(function (success){
            const data = success.data, status = success.status, headers = success.headers, config = success.config;
            $scope.tips = data;
            $scope.loaded.heroTips = true;
            for (let N = 0; N < heroTipsCb.length; N++) heroTipsCb[N]();
            heroTipsCb = null;
        }, function(err) {});
    
}

let heroSpellsCb = [];

function AddHeroSpells($http, $scope, cb) {
    if (!('loaded' in $scope)) $scope.loaded = {};

    if (heroSpellsCb == null) {
        setTimeout(function(){ cb(); $scope.$apply(); } ,0);
        return;
    }
    heroSpellsCb.push(cb);
    if (heroSpellsCb.length != 1)
        return;
    $scope.loaded.heroSpells = false;
    
	$http.get('/assets/json/data/herospells.json?'+GetCacheParam('assets/json/data/herospells.json')).
	then(function (success){
        const data = success.data, status = success.status, headers = success.headers, config = success.config;
        $scope.spells = data;
		for (let aName in data.heroes) {
			for (let aSpell in data.heroes[aName]) {
				//data.heroes[aName][aSpell].name = data.heroes[aName][aSpell].img.substr(0,data.heroes[aName][aSpell].img.length-4);
				for (let aLN = 0; aLN < data.heroes[aName][aSpell].labels.length; aLN++) {
					if ('piercespellimmunity'==data.heroes[aName][aSpell].labels[aLN])
						data.heroes[aName][aSpell].piercespellimmunity = true;
					if ('ultimate'==data.heroes[aName][aSpell].labels[aLN])
						data.heroes[aName][aSpell].ultimate = true;
					if ('scepter'==data.heroes[aName][aSpell].labels[aLN])
						data.heroes[aName][aSpell].scepter = true;	
				}
				data.heroes[aName][aSpell].hname = aName;
				data.heroes[aName][aSpell].sname = aSpell;
			}
		}
		$scope.loaded.heroSpells = true;
		for (let N = 0; N < heroSpellsCb.length; N++) heroSpellsCb[N]();
		heroSpellsCb = null;
	}, function(err) {});
    
}

let heroBioCb = [];

function AddHeroBio($http, $scope, cb) {
    if (!('loaded' in $scope)) $scope.loaded = {};

    if (heroBioCb == null) {
        setTimeout(function(){ cb(); $scope.$apply(); } ,0);
        return;
    }
    heroBioCb.push(cb);
    if (heroBioCb.length != 1)
        return;
    $scope.loaded.heroBio = false;
    
	$http.get('/assets/json/data/hero_bio.json?'+GetCacheParam('assets/json/data/hero_bio.json')).
	then(function (success){
        const data = success.data, status = success.status, headers = success.headers, config = success.config;

        for (let aName in data) {
			$scope.heroesJson[aName].bio = data[aName].bio
		}
		$scope.loaded.heroBio = true;
		for (let N = 0; N < heroBioCb.length; N++) heroBioCb[N]();
		heroBioCb = null;
	}, function(err) {});
    
}

let personalSettingsCb = [];

function AddPersonalSettings($http, $scope, cb) {
	$scope.settings = {};
    if (!('loaded' in $scope)) $scope.loaded = {};
    if (personalSettingsCb == null) {
        setTimeout(function(){ cb(); DebugScope(true, 'AddPersonalSettings'); $scope.$apply(); DebugScope(false, 'AddPersonalSettings'); } ,0);
        return;
    }
    personalSettingsCb.push(cb);
    if (personalSettingsCb.length != 1)
        return;
    $scope.loaded.personalSettings = false;
	
	for (var N = 0; N < $scope.heroes.length; N++)
		$scope.heroes[N].personalSettings = { favorite: false, disliked: false };
	
	$http.get('/api/settings/get').
        then(function (success){
        const data = success.data, status = success.status, headers = success.headers, config = success.config;
        $scope.personalEnabled = data.personalEnabled;
		$scope.loggedIn = data.id!=0;
		if ('personalSettings' in data && 'heroSettings' in data.personalSettings) {
			for (var N = 0; N < $scope.heroes.length; N++) {
				if ($scope.heroes[N].name in data.personalSettings.heroSettings) {
					$scope.heroes[N].personalSettings = data.personalSettings.heroSettings[$scope.heroes[N].name];
					if ('roles' in $scope.heroes[N].personalSettings && $scope.heroes[N].personalSettings.roles != 'default') {
						$scope.heroesJson[$scope.heroes[N].name].rolesJSON = $scope.heroes[N].personalSettings.roles;
						if (Array.isArray && Array.isArray($scope.heroes[N].personalSettings.roles))
							$scope.heroesJson[$scope.heroes[N].name].rolesJSON = {};
						if ('canRoles' in $scope.heroes[N].personalSettings) {
							$scope.heroesJson[$scope.heroes[N].name].canRolesJSON = $scope.heroes[N].personalSettings.canRoles;
							if (Array.isArray && Array.isArray($scope.heroes[N].personalSettings.canRoles))
								$scope.heroesJson[$scope.heroes[N].name].canRolesJSON = {};
						} else $scope.heroesJson[$scope.heroes[N].name].canRolesJSON = {};
					}
				}
			}
		}
		if ('generalSettings' in data) $scope.settings = data.generalSettings;

		$scope.settingsPersonal = {};
		if ('personalSettings' in data && 'generalSettings' in data.personalSettings)
			$scope.settingsPersonal = data.personalSettings.generalSettings;
		if (!('formulas' in $scope.settingsPersonal)) $scope.settingsPersonal.formulas = {};
		if (!('advantage' in $scope.settingsPersonal.formulas)) $scope.settingsPersonal.formulas.advantage = 'default';
		if (!('advantageOp' in $scope.settingsPersonal.formulas)) $scope.settingsPersonal.formulas.advantageOp = 'default';
		if (!('synergy' in $scope.settingsPersonal.formulas)) $scope.settingsPersonal.formulas.synergy = 'default';
		if (!('synergyOp' in $scope.settingsPersonal.formulas)) $scope.settingsPersonal.formulas.synergyOp = 'default';
		if (!('matchup' in $scope.settingsPersonal.formulas)) $scope.settingsPersonal.formulas.matchup = 'default';
		if (!('partBonus' in $scope.settingsPersonal.formulas)) $scope.settingsPersonal.formulas.partBonus = 'default';
		if (!('partBonusOp' in $scope.settingsPersonal.formulas)) $scope.settingsPersonal.formulas.partBonusOp = 'default';
		if (!('personal' in $scope.settingsPersonal.formulas)) $scope.settingsPersonal.formulas.personal = 'default';
		if (!('finalScore' in $scope.settingsPersonal.formulas)) $scope.settingsPersonal.formulas.finalScore = 'default';
		
		
		$scope.loaded.personalSettings = true;
		Debug('AddPersonalSettingsEnd');
		for (var N = 0; N < personalSettingsCb.length; N++) personalSettingsCb[N]();
		personalSettingsCb = null;
	}, function(err) {});
    
}

function HeroesAddGamePartScores($scope) {
	if (!('operations' in $scope)) $scope.operations = {};
	if ('AddGamePartScores' in $scope.operations && $scope.operations.AddGamePartScores) return;
    const aValues = [
        [],
        [],
        []
    ];
    for (var hN = 0; hN < $scope.heroes.length; hN++) {
        if (!('timewin' in $scope.heroes[hN])) {
            console.log('HeroesAddGamePartScores no timewins in heroes');
            return;
        }
        $scope.heroes[hN].gamePart = [{}, {}, {}];
        for (var sN = 0; sN < $scope.SkillLevels.length; sN++) {
            const aAvg = ($scope.heroes[hN].timewin[sN].hearly + $scope.heroes[hN].timewin[sN].hmid + $scope.heroes[hN].timewin[sN].hlate) / 3;
            $scope.heroes[hN].gamePart[sN].early = ($scope.heroes[hN].timewin[sN].hearly - aAvg) * 100;
            $scope.heroes[hN].gamePart[sN].mid = ($scope.heroes[hN].timewin[sN].hmid - aAvg) * 100;
            $scope.heroes[hN].gamePart[sN].late = ($scope.heroes[hN].timewin[sN].hlate - aAvg) * 100;
            aValues[sN].push(Math.abs($scope.heroes[hN].gamePart[sN].early));
            aValues[sN].push(Math.abs($scope.heroes[hN].gamePart[sN].mid));
            aValues[sN].push(Math.abs($scope.heroes[hN].gamePart[sN].late));
        }
    }
    const scaleFrom = 0.85;
    const aMaxScore = 1;
    const aScale = [];
    for (var sN = 0; sN < $scope.SkillLevels.length; sN++) {
        aValues[sN].sort();
        aScale.push(aValues[sN][Math.round(aValues[sN].length * scaleFrom)]);
    }
    for (var hN = 0; hN < $scope.heroes.length; hN++) {
        for (var sN = 0; sN < $scope.SkillLevels.length; sN++) {
            let aLocalScale = aScale[sN];
            if ($scope.heroes[hN].gamePart[sN].early > aLocalScale) aLocalScale = $scope.heroes[hN].gamePart[sN].early;
            if ($scope.heroes[hN].gamePart[sN].mid > aLocalScale) aLocalScale = $scope.heroes[hN].gamePart[sN].mid;
            if ($scope.heroes[hN].gamePart[sN].late > aLocalScale) aLocalScale = $scope.heroes[hN].gamePart[sN].late;
            $scope.heroes[hN].gamePart[sN].early = Math.round($scope.heroes[hN].gamePart[sN].early / aLocalScale * aMaxScore * 100) / 100;
            $scope.heroes[hN].gamePart[sN].mid = Math.round($scope.heroes[hN].gamePart[sN].mid / aLocalScale * aMaxScore * 100) / 100;
            $scope.heroes[hN].gamePart[sN].late = Math.round($scope.heroes[hN].gamePart[sN].late / aLocalScale * aMaxScore * 100) / 100;
        }
    }
	$scope.operations.AddGamePartScores = true;
}

function SaveSetting(http,setObj) {
	http.post('/api/settings/set', setObj).
	then(function (success){}, function(err) {});
}


pickerApp.controller('PickerCtrl', ['$scope', '$cookies', '$location', '$rootScope', '$http', 'heroes', function($scope, $cookieStore, $location, $rootScope, $http, heroesLib) {
    {
        function InitHeroesSuggested() {
          if (typeof($scope.heroesSuggested) == 'undefined') {
            $scope.heroesSuggested = [{
                role: "Core",
                name: "Core",
                types: ['coreutil', 'bcoreutil'],
                skip: 0,
                heroes: [],
				heroesBan: []
				
            },{
                role: "Utility",
                name: "Utility",
                types: ['coreutil', 'bcoreutil'],
                skip: 0,
                heroes: [],
				heroesBan: []
            },{
                role: "SafelaneCarry",
                name: "Carry",
                types: ['lanes', 'blanes'],
                skip: 0,
                heroes: [],
				heroesBan: [],
				copypaste: true,
				heroesNoP: []
            }, {
                role: "LaneSupport",
                name: "Support",
                types: ['lanes', 'blanes'],
                skip: 0,
                heroes: [],
				heroesBan: [],
				copypaste: true,
				heroesNoP: []
            }, {
                role: "Mid",
                name: "Mid",
                types: ['lanes', 'blanes'],
                skip: 0,
                heroes: [],
				heroesBan: [],
				copypaste: true,
				heroesNoP: []
            }, {
                role: "Offlane",
                name: "Offlane",
                types: ['lanes', 'blanes'],
                skip: 0,
                heroes: [],
				heroesBan: [],
				copypaste: true,
				heroesNoP: []
            }, {
                role: "Jungler",
                name: "Jungle",
                types: ['lanes', 'blanes'],
                skip: 0,
                heroes: [],
				heroesBan: [],
				copypaste: true,
				heroesNoP: []
            }, {
                role: "Roamer",
                name: "Roamer",
                types: ['lanes', 'blanes'],
                skip: 0,
                heroes: [],
				heroesBan: [],
				copypaste: true,
				heroesNoP: []
            }, {
                role: "RoleCarry",
                name: "Carry",
                types: ['roles', 'broles'],
                skip: 0,
                heroes: [],
				heroesBan: []
            }, {
                role: "Disabler",
                name: "Disabler",
                types: ['roles', 'broles'],
                skip: 0,
                heroes: [],
				heroesBan: []
            }, {
                role: "Initiator",
                name: "Initiator",
                types: ['roles', 'broles'],
                skip: 0,
                heroes: [],
				heroesBan: []
            }, {
                role: "Nuker",
                name: "Nuker",
                types: ['roles', 'broles'],
                skip: 0,
                heroes: [],
				heroesBan: []
            }, {
                role: "Pusher",
                name: "Pusher",
                types: ['roles', 'broles'],
                skip: 0,
                heroes: [],
				heroesBan: []
            }, {
                role: "RoleSupport",
                name: "Support",
                types: ['roles', 'broles'],
                skip: 0,
                heroes: [],
				heroesBan: []
            }, {
                role: "Ganker",
                name: "Ganker",
                types: ['roles', 'broles'],
                skip: 0,
                heroes: [],
				heroesBan: []
            }, {
                role: "Durable",
                name: "Durable",
                types: ['roles', 'broles'],
                skip: 0,
                heroes: [],
		heroesBan: []
            }, ];
          } else {
            for (var aRN = 0; aRN < $scope.heroesSuggested.length; aRN++) {
              $scope.heroesSuggested[aRN].skip = 0;
            } 
          }
            if (typeof($scope.heroPickScores)=='undefined') {
              $scope.heroPickScores = {};
              for (var N = 0; N < $scope.heroes.length; N++) {
                $scope.heroPickScores[$scope.heroes[N].name] = {
                  name: $scope.heroes[N].name,
                  showHeroes: {},
                  showHeroesNoP: {},
                  showHeroesBan: {},
                  counterEnemyScore: 0,
                  helpTeamScore: 0,
                  vs: {},
                  wt: {},
                  banen: {},
                  nem: {"Core":[], "Utility":[], "All": []},
                  selected: false //picked or banned
                }
              
                for (var aRN = 0; aRN < $scope.heroesSuggested.length; aRN++) {
                  $scope.heroesSuggested[aRN].heroes.push($scope.heroPickScores[$scope.heroes[N].name]);
                  $scope.heroesSuggested[aRN].heroesBan.push($scope.heroPickScores[$scope.heroes[N].name]);
                  if ('heroesNoP' in $scope.heroesSuggested[aRN]) $scope.heroesSuggested[aRN].heroesNoP.push($scope.heroPickScores[$scope.heroes[N].name]);
                }
              }
            } else {
              for (var N = 0; N < $scope.heroes.length; N++) {
                $scope.heroPickScores[$scope.heroes[N].name].showHeroes = {};
                $scope.heroPickScores[$scope.heroes[N].name].showHeroesNoP = {};
                $scope.heroPickScores[$scope.heroes[N].name].showHeroesBan = {};
                $scope.heroPickScores[$scope.heroes[N].name].counterEnemyScore = 0;
                $scope.heroPickScores[$scope.heroes[N].name].helpTeamScore = 0;
                $scope.heroPickScores[$scope.heroes[N].name].vs = {};
                $scope.heroPickScores[$scope.heroes[N].name].wt = {};
                $scope.heroPickScores[$scope.heroes[N].name].banen = {};
                $scope.heroPickScores[$scope.heroes[N].name].nem = {"Core":[], "Utility":[], "All": []};
                $scope.heroPickScores[$scope.heroes[N].name].selected = false;
              }
            }
            $scope.getStars = function(n) {
                if (n <= 0) return [];
                const x = [];
                for (let N = 0; N < n; N++) x.push(N);
                return x;
            };
            $scope.positionStars = [{
                position: 'RoleCarry',
                name: "Carry",
                starsEnemy: 0,
                starsTeam: 0,
                starsPick: 0
            }, {
                position: 'Disabler',
                name: "Disabler",
                starsEnemy: 0,
                starsTeam: 0,
                starsPick: 0
            }, {
                position: 'Initiator',
                name: "Initiator",
                starsEnemy: 0,
                starsTeam: 0,
                starsPick: 0
            }, {
                position: 'Nuker',
                name: "Nuker",
                starsEnemy: 0,
                starsTeam: 0,
                starsPick: 0
            }, {
                position: 'Pusher',
                name: "Pusher",
                starsEnemy: 0,
                starsTeam: 0,
                starsPick: 0
            }, {
                position: 'RoleSupport',
                name: "Support",
                starsEnemy: 0,
                starsTeam: 0,
                starsPick: 0
            }, {
                position: 'LaneSupport',
                name: "Lane Support",
                starsEnemy: 0,
                starsTeam: 0,
                starsPick: 0
            }, ]
            $scope.observations = {
                enemy: [],
                team: [],
                enemyFinal: [],
                teamFinal: []
            };
			
        }

        function UpdateSkillLevel() {
            //$cookieStore.put('skillLevel', $scope.skillLevel);
            const skill = 1;
            for (let N = 0; N < $scope.SkillLevels.length; N++)
                if ($scope.skillLevel == $scope.SkillLevels[N]) $scope.show.skillLevelN = N;
        }

        //http://dota.local/#/E_Luna/T_Mirana
        function GenerateFromPath() {
            const arrHeroes = $location.path().split('/').filter(function (x) {
                return x != '';
            });
            if (arrHeroes.length == 0 && $scope.showInitialScreen) return;
            //	$scope.selfHeroSelected = null;
            $scope.heroesEnemy = [];
            $scope.heroesTeam = [];

            const checkDupes = {};
            for (let N = 0; N < arrHeroes.length; N++) {
                if (arrHeroes[N].substr(0, 2) == 'T_') {
                    var aHName = arrHeroes[N].substr(2).replace(/_/g, ' ');
                    if (aHName in checkDupes) continue;
                    checkDupes[aHName] = true;
                    AddHeroes(aHName, false);
                } else if (arrHeroes[N].substr(0, 2) == 'E_') {
                    var aHName = arrHeroes[N].substr(2).replace(/_/g, ' ');
                    if (aHName in checkDupes) continue;
                    checkDupes[aHName] = true;
                    AddHeroes(aHName, true);
                } else if (arrHeroes[N].substr(0, 3) == 'BT_') {
                    var aHName = arrHeroes[N].substr(3).replace(/_/g, ' ');
                    if (aHName in checkDupes) continue;
                    checkDupes[aHName] = true;
                    BanHeroes(aHName, false);
                } else if (arrHeroes[N].substr(0, 3) == 'BE_') {
                    var aHName = arrHeroes[N].substr(3).replace(/_/g, ' ');
                    if (aHName in checkDupes) continue;
                    checkDupes[aHName] = true;
                    BanHeroes(aHName, true);
		} else if (arrHeroes[N].substr(0, 3) == 'BA_') {
			var aHName = arrHeroes[N].substr(3).replace(/_/g, ' ');
			if (aHName in checkDupes) continue;
			checkDupes[aHName] = true;
			UnavailableHeroes(aHName);
                } else if (arrHeroes[N].substr(0, 2) == 'S_') {
                    const aSel = arrHeroes[N].substr(2).split('_');
                    if (aSel.length == 2 && aSel[0] in $scope.show.showtabs) {
						$scope.show.showtabs[aSel[0]] = aSel[1];
						if (aSel[0] == 1) $scope.show.extended = true;
						if (aSel[0] == 2) {
							$scope.show.extended = true;
							$scope.show.extendedSecondary = true;
						}
					}
                } else if (arrHeroes[N] == 'M_cm')
                    $scope.show.cmmode = true;
				else if (arrHeroes[N] == 'No_Heroes')
                    $scope.showInitialScreen = false;
				else {
                    var aHName = arrHeroes[N].replace(/_/g, ' ');
					console.log(aHName);
                    if (aHName in checkDupes) continue;
                    checkDupes[aHName] = true;
                    AddHeroes(aHName, true);
                }
            }
        }

        $scope.ShowTutorial = function() {
            $scope.show.tutorial = true;
        }
        $scope.HideTutorial = function() {
            $scope.show.tutorial = false;
        }
        $scope.TogleTutorial = function() {
            $scope.show.tutorial = !$scope.show.tutorial;
            UpdateTutorialPopups();
        }
        $scope.ShouldShowTutorial = function() {
            return $scope.show.tutorial;
        }

        $scope.SetShowHeroPool = function(what) {
            if (what != 'auto') $scope.show.heroPool = what;
            $cookieStore.put('showHeroPool', $scope.show.heroPool,{expires: new Date(now.getFullYear()+2, now.getMonth(), now.getDate())});
            if ($scope.show.heroPool == 'grid')
                $scope.heroes.sort(function(a, b) {
                    return a.heropedia - b.heropedia;
                });
            else if ($scope.show.heroPool == 'list')
                $scope.heroes.sort(function(a, b) {
                    return a.name.localeCompare(b.name);
                });
        }
        $scope.GetShowHeroPool = function() {
            return $scope.show.heroPool;
        }

		
		function HeroIsSearched(item, lowSearchText) {
			for (let N = 0; N < item.searchTerms.length; N++)
				if (item.searchTerms[N].indexOf(lowSearchText) != -1)
					return true;
			return false;
		}

		function HeroIsSearchedStrict(item, lowSearchText) {
			for (let N = 0; N < item.searchTerms.length; N++)
				if (item.searchTerms[N] == lowSearchText)
					return true;
			return false;
		}
		
		function RecalculateUltimatePickerScrolls(){
			if (!('UltimatePicker' in $scope) && !('CompletePicker' in $scope)) return;
            const topBannerSize = 100;
            let fixedLeftSize = 0;
            let fixedCenterSize = 0;
            let fixedRightSize = 0;
            $('.leftContainerFixedSize').each(function(){ fixedLeftSize += $(this).outerHeight(true) });
			$('.leftContainerFixedSizeOuter').each(function(){fixedLeftSize += $(this).outerHeight(true) - $(this).height() });
			$('.centerContainerFixedSize').each(function(){ fixedCenterSize += $(this).outerHeight(true); });
			$('.centerContainerFixedSizeOuter').each(function(){ fixedCenterSize += $(this).outerHeight(true) - $(this).height(); });
			$('.rightContainerFixedSize').each(function(){ fixedRightSize += $(this).outerHeight(true); });
			$('.rightContainerFixedSizeOuter').each(function(){ fixedRightSize += $(this).outerHeight(true) - $(this).height(); });
			if ('UltimatePicker' in $scope) {
				$scope.UltimatePicker.HeroSearchHeight = Math.max($scope.windowHeight-fixedLeftSize-topBannerSize, 250);  
				$scope.UltimatePicker.HeroSuggestionsHeight = Math.max($scope.windowHeight-fixedCenterSize-topBannerSize, 300);
				if ($scope.show.extendedSecondary)
					$scope.UltimatePicker.HeroSuggestionsRightHeight = Math.max(($scope.windowHeight-fixedRightSize-topBannerSize) / 2, 300);
				else
					$scope.UltimatePicker.HeroSuggestionsRightHeight = Math.max($scope.windowHeight-fixedRightSize-topBannerSize, 300);
				
				$scope.UltimatePicker.HeroSuggestionsRightExtended = Math.max(($scope.windowHeight-fixedRightSize-topBannerSize) / 2, 300);
			} else {
				$scope.CompletePicker.HeroSearchHeight = Math.max($scope.windowHeight-fixedLeftSize-topBannerSize, 250);  
				$scope.CompletePicker.HeroSuggestionsHeight = Math.max($scope.windowHeight-fixedCenterSize-topBannerSize, 300);
			}
		}
		RecalculateUltimatePickerScrolls();
		$scope.RecalculateUltimatePickerScrollsAsync = function() {
			setTimeout(function(){
				RecalculateUltimatePickerScrolls();
				$scope.$apply();
			},10);
		}
		
		KeypressObservers.push(function(charCode) {
			if (charCode == 13) {
				//enter ads the first hero to enemy and clears
				if ($scope.heroesSearched.length > 0)
					$scope.addHeroes($scope.heroesSearched[0].hero.name, true);
				$scope.SetSearchText('');
			}
			$('#setautofocus').focus();
		});
		
		WindowsResizeObservers.push(
			function(wnd){$scope.windowHeight = wnd.windowHeight; RecalculateUltimatePickerScrolls(); $scope.$apply();}
		);
		
		$scope.SetSearchText = function(txt) {
			$scope.searchText = txt;
			$scope.ProcessSearch('setauto');
		}
		
        $scope.ProcessSearch = function(from) {
			$('#setautofocus').focus();

            let lastChar = '';

            if ($scope.searchText.length>0) lastChar = $scope.searchText.charAt($scope.searchText.length-1);
			if (lastChar == '[') {
				$scope.searchText = $scope.searchText.substr(0,$scope.searchText.length-1);
				if ($scope.show.searchedHero != null) {
					if (!$scope.show.teamRadiant)
						$scope.addHeroes($scope.show.searchedHero, true);
					else
						$scope.addHeroes($scope.show.searchedHero, false);
				}
				$scope.searchText = "";
			} else if (lastChar == ']') {
				$scope.searchText = $scope.searchText.substr(0,$scope.searchText.length-1);
				if ($scope.show.searchedHero != null) {
					if (!$scope.show.teamRadiant)
						$scope.addHeroes($scope.show.searchedHero, false);
					else
						$scope.addHeroes($scope.show.searchedHero, true);
				}
				$scope.searchText = "";
			} else if (lastChar == ';' || lastChar == ':') {
				$scope.searchText = $scope.searchText.substr(0,$scope.searchText.length-1);
				if ($scope.show.searchedHero != null) {
					if (!$scope.show.cmmode) $scope.unavailableHeroes($scope.show.searchedHero)
					else if (!$scope.show.teamRadiant)
						$scope.banHeroes($scope.show.searchedHero, true);
					else
						$scope.banHeroes($scope.show.searchedHero, false);
				}
				$scope.searchText = "";
			} else if (lastChar == '\'' || lastChar == '"') {
				$scope.searchText = $scope.searchText.substr(0,$scope.searchText.length-1);
				if ($scope.show.searchedHero != null) {
					if (!$scope.show.cmmode) $scope.unavailableHeroes($scope.show.searchedHero)
					else if (!$scope.show.teamRadiant)
						$scope.banHeroes($scope.show.searchedHero, false);
					else
						$scope.banHeroes($scope.show.searchedHero, true);
				}
				$scope.searchText = "";
			} else if (lastChar == '\\' || lastChar == '|' || lastChar == '`' || lastChar == '~') {
				$scope.searchText = $scope.searchText.substr(0,$scope.searchText.length-1);
				if ($scope.show.searchedHero != null)
					$scope.removeHeroesName($scope.show.searchedHero);
				return;
			} else if (lastChar == '<' || lastChar == ',') {
				$scope.searchText = $scope.searchText.substr(0,$scope.searchText.length-1);
				if ($scope.heroesSearched.length == 0) return;
				var primaryN = null;
				for (var N = 0; N < $scope.heroesSearched.length; N++)
					if ($scope.heroesSearched[N].hero.name == $scope.show.searchedHero) {
						primaryN = N;
						break;
					}
				if (primaryN == 0 || primaryN == null) return;
				$scope.show.searchedHero = $scope.heroesSearched[primaryN-1].hero.name;
				if (!$scope.heroesSearched[primaryN-1].show) {
					$scope.heroesSearched[primaryN-1].show = true;
					for (var N = primaryN; N<$scope.heroesSearched.length&&$scope.heroesSearched[N].show;N++);
					$scope.heroesSearched[N-1].show = false;
				}
				return;
			} else if (lastChar == '>' || lastChar == '.') {
				$scope.searchText = $scope.searchText.substr(0,$scope.searchText.length-1);
				if ($scope.heroesSearched.length == 0) return;
				var primaryN = null;
				for (var N = 0; N < $scope.heroesSearched.length; N++)
					if ($scope.show.searchedHero == $scope.heroesSearched[N].hero.name) {
						primaryN = N;
						break;
					}
				if (primaryN == $scope.heroesSearched.length - 1 || primaryN == null) return;
				$scope.show.searchedHero = $scope.heroesSearched[primaryN+1].hero.name;
				if (!$scope.heroesSearched[primaryN+1].show) {
					$scope.heroesSearched[primaryN+1].show = true;
					for (var N = primaryN; N>=0&&$scope.heroesSearched[N].show;N--);
					$scope.heroesSearched[N+1].show = false;
				}
				return;
			} else if (lastChar == '=' || lastChar == '+') {
				$scope.searchText = $scope.searchText.substr(0,$scope.searchText.length-1);
				JumpSuggestionsToSearched();
				return;
			} else if (lastChar == '1' || lastChar == '!') {
				//nothing, autopicker special case
				$scope.searchText = $scope.searchText.substr(0,$scope.searchText.length-1);
				return;
			} else if (/[^a-zA-Z]/.test( lastChar ) && lastChar.charCodeAt(0)<256) {
				$scope.searchText = "";
			}

if ($scope.heroesSearched.length == 0) {
//TODO move initial generation from here
  $scope.heroesSearchedJSON = {};
  for (var hN = 0; hN < $scope.heroes.length; hN++) {
    $scope.heroesSearched.push({hero: $scope.heroes[hN], show: false, searchPrio: -1});
      const aLast = $scope.heroesSearched[$scope.heroesSearched.length - 1];
      $scope.heroesSearchedJSON[aLast.hero.name] = aLast;
  }
  $scope.heroesSearched.sort(function(a,b){return a.hero.name.localeCompare(b.hero.name)});
  for (var N = 0; N < $scope.heroesSearched.length; N++) {
    $scope.heroesSearched[N].searchPrio = $scope.heroesSearched.length - N;
    $scope.heroesSearched[N].searchPrioDefault = $scope.heroesSearched[N].searchPrio;
  }
  for (var N = 0; N < 4; N++) $scope.heroesSearched[N].show = true;
}

			$scope.show.searchedHero = null;

            const aSearchRes = [[], [], [], [], [], [], [], [], [], [], [], []];

            if (typeof($scope.searchText) == 'undefined' || $scope.searchText == '') {
				for (var N = 0; N < $scope.heroes.length; N++)
					aSearchRes[0].push($scope.heroes[N]);
			} else {
                const lowSearchText = $scope.searchText.toLowerCase();

                for (var hN = 0; hN < $scope.heroes.length; hN++) {

                    let foundPriority = -1;


                    function AddIfMatch(match) {
						indPriority++;
						if (match && (foundPriority == -1 || foundPriority > indPriority ))
							foundPriority = indPriority;
					}
					
					for (var N = 0; N < $scope.heroes[hN].searchTerms.length; N++) {
						hname = $scope.heroes[hN].searchTerms[N];
						var indPriority = -1;
						AddIfMatch(lowSearchText == hname);
						AddIfMatch(lowSearchText == hname.substr(0, lowSearchText.length));
						AddIfMatch(hname.indexOf(lowSearchText)!=-1);
					}
							
					if (foundPriority != -1) aSearchRes[foundPriority].push($scope.heroes[hN]);
					
				}

			}

            let aCumulSearch = [];
            for (var N = 0; N < aSearchRes.length; N++) {
				aSearchRes[N].sort(function(a,b) { return a.name.localeCompare(b.name); });
				aCumulSearch = aCumulSearch.concat(aSearchRes[N]);
			}
			
			for (var N = 0; N < $scope.heroesSearched.length; N++) {
				$scope.heroesSearched[N].searchPrio = $scope.heroesSearched[N].searchPrioDefault-1000;
				$scope.heroesSearched[N].show = false;
			}
			for (var N = 0; N < aCumulSearch.length; N++) {
				$scope.heroesSearchedJSON[aCumulSearch[N].name].searchPrio = aCumulSearch.length - N;
				if (N<4) $scope.heroesSearchedJSON[aCumulSearch[N].name].show = true;
			}
			$scope.heroesSearched.sort(function(a,b){return b.searchPrio - a.searchPrio});
//			for (var N = 0; N < aCumulSearch.length; N++)
//				$scope.heroesSearched.push({hero: aCumulSearch[N], show: N<4});
			
			if (aCumulSearch.length == 0)
				$scope.show.searchedHero = null;
			else if (aCumulSearch.length < 15)
				$scope.show.searchedHero = aCumulSearch[0].name;
        }
		
		function JumpSuggestionsToSearched(){
			if ($scope.heroesSearched.length == 0) return;
            let primaryN = null;
            for (let N = 0; N < $scope.heroesSearched.length; N++)
				if ($scope.heroesSearched[N].hero.name == $scope.show.searchedHero) {
					primaryN = N;
					break;
				}
			for (let roleN=0; roleN < $scope.heroesSuggested.length; roleN++) {
				for (let heroN = 0; heroN < $scope.heroesSuggested[roleN].heroes.length; heroN++) {
					if ($scope.heroesSuggested[roleN].heroes[heroN].name == $scope.heroesSearched[primaryN]) {
						if ($scope.heroesSuggested[roleN].heroes.length - heroN < 3) $scope.heroesSuggested[roleN].skip = $scope.heroesSuggested[roleN].heroes.length - 6;
						else $scope.heroesSuggested[roleN].skip = heroN - 2;
						if ($scope.heroesSuggested[roleN].skip < 0) $scope.heroesSuggested[roleN].skip = 0;
						break;
					}
				}
			}
			UpdateHeroInfoPopups()
		}
		
        $scope.addHeroes = function(name, enemy) {
            AddHeroes(name, enemy);
            RecalculateAfterSelection();
        }

        function AddHeroes(name, enemy) {
			RemoveHeroesNameNoRecalculate(name);
            if (!(name in $scope.heroesJson)) return;
			if (!enemy && 'CompletePicker' in $scope) return;
            $scope.showInitialScreen = false;
            let ind;
            for (let N = 0; N < $scope.heroes.length; N++)
                if ($scope.heroes[N].name == name) {
                    ind = N;
                    break;
                }

            if (enemy) {
                if ($scope.heroesEnemy.length >= 5) return;
                $scope.heroesEnemy.push($scope.heroes[ind]);
				$scope.heroesPicked[name].pickedEnemy = true;
            } else {
                if ($scope.heroesTeam.length >= 5) return;
                $scope.heroesTeam.push($scope.heroes[ind]);
				$scope.heroesPicked[name].pickedTeam = true;
            }
			$scope.heroesPicked[name].removedPool = true;
			if (name in $scope.plusMinus) $scope.plusMinus[name] = 'none';

        }
		
		$scope.banHeroes = function(name, enemy) {
			BanHeroes(name, enemy);
            RecalculateAfterSelection();
		}


		
        function BanHeroes(name, enemy) {
			RemoveHeroesNameNoRecalculate(name);
            if (!(name in $scope.heroesJson)) return;
            $scope.showInitialScreen = false;
            let ind;
            for (let N = 0; N < $scope.heroes.length; N++)
                if ($scope.heroes[N].name == name) {
                    ind = N;
                    break;
                }

            if (enemy) {
                if ($scope.banEnemy.length >= 6) return;
                $scope.banEnemy.push($scope.heroes[ind]);
				$scope.heroesPicked[name].bannedEnemy = true;
            } else {
                if ($scope.banTeam.length >= 6) return;
                $scope.banTeam.push($scope.heroes[ind]);
				$scope.heroesPicked[name].bannedTeam = true;
            }
			$scope.heroesPicked[name].removedPool = true;
			if (name in $scope.plusMinus) $scope.plusMinus[name] = 'none';
        }

		$scope.unavailableHeroes = function(name) {
			UnavailableHeroes(name);
			RecalculateAfterSelection();
		}

		function UnavailableHeroes(name) {
			RemoveHeroesNameNoRecalculate(name);
			if (!(name in $scope.heroesJson)) return;
			$scope.showInitialScreen = false;
            let ind;
            for (let N = 0; N < $scope.heroes.length; N++)
				if ($scope.heroes[N].name == name) {
					ind = N;
					break;
			}
			$scope.banAll.unshift($scope.heroes[ind]);
			$scope.heroesPicked[name].bannedAll = true;
			$scope.heroesPicked[name].removedPool = true;
			if (name in $scope.plusMinus) $scope.plusMinus[name] = 'none';
		}

		$scope.resetCMMode = function() {
			for (let aHero in $scope.CMUnavailable) {
				$scope.removeHeroesName(aHero);
			}
		}

		//obsolete, used maybe in old pickers
        $scope.removeHeroesEnemy = function(ind) {
			$scope.removeHeroesName($scope.heroesEnemy[ind].name);
        }
		//obsolete, used maybe in old pickers
        $scope.removeHeroesTeam = function(ind) {
			$scope.removeHeroesName($scope.heroesTeam[ind].name);
        }
		
		
		$scope.plusHeroesEnemy = function(ind) {
			if (!($scope.heroesEnemy[ind].name in $scope.plusMinus) || $scope.plusMinus[$scope.heroesEnemy[ind].name] != 'plus') $scope.plusMinus[$scope.heroesEnemy[ind].name] = 'plus';
			else $scope.plusMinus[$scope.heroesEnemy[ind].name] = 'none';
            RecalculateAfterSelection();
        }
        $scope.plusHeroesTeam = function(ind) {
			if (!($scope.heroesTeam[ind].name in $scope.plusMinus) || $scope.plusMinus[$scope.heroesTeam[ind].name] != 'plus') $scope.plusMinus[$scope.heroesTeam[ind].name] = 'plus';
			else $scope.plusMinus[$scope.heroesTeam[ind].name] = 'none';
            RecalculateAfterSelection();
        }
		$scope.minusHeroesEnemy = function(ind) {
			if (!($scope.heroesEnemy[ind].name in $scope.plusMinus) || $scope.plusMinus[$scope.heroesEnemy[ind].name] != 'minus') $scope.plusMinus[$scope.heroesEnemy[ind].name] = 'minus';
			else $scope.plusMinus[$scope.heroesEnemy[ind].name] = 'none';
            RecalculateAfterSelection();
        }
        $scope.minusHeroesTeam = function(ind) {
			if (!($scope.heroesTeam[ind].name in $scope.plusMinus) || $scope.plusMinus[$scope.heroesTeam[ind].name] != 'minus') $scope.plusMinus[$scope.heroesTeam[ind].name] = 'minus';
			else $scope.plusMinus[$scope.heroesTeam[ind].name] = 'none';
            RecalculateAfterSelection();
        }
        $scope.removeHeroesName = function(name) {
			RemoveHeroesNameNoRecalculate(name);
            RecalculateAfterSelection();
        }
		RemoveHeroesNameNoRecalculate = function(name) {
			if (!(name in $scope.heroesJson)) return;
			if (name in $scope.plusMinus) $scope.plusMinus[name] = 'none';
			for (var N = 0; N < $scope.heroesEnemy.length; N++)
				if ($scope.heroesEnemy[N].name == name)
					$scope.heroesEnemy.splice(N, 1);
			for (var N = 0; N < $scope.heroesTeam.length; N++)
				if ($scope.heroesTeam[N].name == name)
					$scope.heroesTeam.splice(N, 1);
			for (var N = 0; N < $scope.banEnemy.length; N++)
				if ($scope.banEnemy[N].name == name)
					$scope.banEnemy.splice(N, 1);
			for (var N = 0; N < $scope.banTeam.length; N++)
				if ($scope.banTeam[N].name == name)
					$scope.banTeam.splice(N, 1);
			for (var N = 0; N < $scope.banAll.length; N++)
				if ($scope.banAll[N].name == name)
					$scope.banAll.splice(N, 1);
			$scope.heroesPicked[name] = {pickedTeam: false, pickedEnemy: false, bannedTeam: false, bannedEnemy: false, bannedAll: false, removedPool: false};
        }

        $scope.resetAll = function() {
			while ($scope.heroesEnemy.length) $scope.heroesEnemy.pop();
			while ($scope.heroesTeam.length) $scope.heroesTeam.pop();
			while ($scope.banEnemy.length) $scope.banEnemy.pop();
			while ($scope.banTeam.length) $scope.banTeam.pop();
			while ($scope.banAll.length) $scope.banAll.pop();
			
			$scope.plusMinus = {};
			for (let N = 0; N < $scope.heroes.length; N++)
				$scope.heroesPicked[$scope.heroes[N].name] = {pickedTeam: false, pickedEnemy: false, bannedTeam: false, bannedEnemy: false, removedPool: false};
			$scope.ClearShowOnly();
            RecalculateAfterSelection();
        }
		
		$scope.HeroIsSelectedEnemy = function (name) {
			return (name in $scope.heroesPicked && $scope.heroesPicked[name].pickedEnemy);
		}
		$scope.HeroIsSelectedTeam = function (name) {
			return (name in $scope.heroesPicked && $scope.heroesPicked[name].pickedTeam);
		}
		
		$scope.HeroIsBannedEnemy = function (name) {
			return (name in $scope.heroesPicked && $scope.heroesPicked[name].bannedEnemy);;
		}
		$scope.HeroIsBannedTeam = function (name) {
			return (name in $scope.heroesPicked && $scope.heroesPicked[name].bannedTeam);
		}
		$scope.HeroIsBannedAll = function (name) {
			return (name in $scope.heroesPicked && $scope.heroesPicked[name].bannedAll);
		}
		$scope.HeroIsSelected = function (name) {
			return (name in $scope.heroesPicked && ($scope.heroesPicked[name].pickedEnemy || $scope.heroesPicked[name].pickedTeam || $scope.heroesPicked[name].bannedEnemy || $scope.heroesPicked[name].bannedTeam || $scope.heroesPicked[name].bannedAll));
		}

        $scope.SwapHeroes = function() {
			var aTmp = [];
			while ($scope.heroesEnemy.length != 0)
				aTmp.push($scope.heroesEnemy.pop());
			while ($scope.heroesTeam.length != 0)
				$scope.heroesEnemy.unshift($scope.heroesTeam.pop());
			while (aTmp.length != 0)
				$scope.heroesTeam.push(aTmp.pop());
			var aTmp = [];
			while ($scope.banEnemy.length != 0)
				aTmp.push($scope.banEnemy.pop());
			while ($scope.banTeam.length != 0)
				$scope.banEnemy.unshift($scope.banTeam.pop());
			while (aTmp.length != 0)
				$scope.banTeam.push(aTmp.pop());
            RecalculateAfterSelection();
        }
		
		$scope.LiniarScale = function(val, min, max) {
			if (val < min) val = min;
			if (val > max) val = max;
			return (val - min) / (max - min);
		}

        

        function RecalculateAfterSelection() {
			Debug('RecalculateAfterSelection');
			$scope.firstScreen = $scope.heroesEnemy.length == 0 && $scope.heroesTeam.length == 0 && ($scope.banEnemy.length == 0 && $scope.banTeam.length == 0) && $scope.banAll.length == 0;
//			UpdateTutorialPopups();
            UpdateSkillLevel();
			AddPersonalSettings($http, $scope, function(){
				if ($scope.personalEnabled == true) {
					if ($scope.show.onlyfavorites=='disabled')
						$scope.show.onlyfavorites = 'no';
					if ($scope.show.nodisliked=='disabled')
						$scope.show.nodisliked = 'no';
					if ($scope.show.personalformula=='disabled')
						$scope.show.personalformula = 'no';
				}
			});
/*
 0 AddPersonalSettingsEndCache
picker-angular.js?cv=146&language=en:4 0 RecalculateAfterSelectionStep0
picker-angular.js?cv=146&language=en:4 0 AddHeroesPersonalStart
picker-angular.js?cv=146&language=en:4 0 AddHeroesPersonalCache
picker-angular.js?cv=146&language=en:4 231 RecalculateAfterSelectionStep1
picker-angular.js?cv=146&language=en:4 0 RecalculateAfterSelectionStep2
picker-angular.js?cv=146&language=en:4 9 RecalculateAfterSelectionWData
picker-angular.js?cv=146&language=en:4 0 RecalculateTeamScores
*/
Debug('RecalculateAfterSelectionStep0');
			AddHeroesPersonal($http, $scope, false, function(){
Debug('RecalculateAfterSelectionStep1');
				HeroesScalePersonalScores($scope);
Debug('RecalculateAfterSelectionStep2');
				if ($scope.show.winratemode == 'wr') {
					AddHeroesWinScores($scope, heroesLib, function(){
						AddHeroesTimeAdv($scope, heroesLib, function(){
							RecalculateAfterSelectionWData(); 
						})
					});
					AddHeroesTimeAdv($scope, heroesLib, function(){}); //paralelize
				} else if ($scope.show.winratemode == 'syn'){
					AddHeroesAdvScores($scope, heroesLib, function(){
						AddHeroesWinScores($scope, heroesLib, function(){
							AddHeroesTimeAdv($scope, heroesLib, function(){
								RecalculateAfterSelectionWData(); 
							})
						});
					});
					AddHeroesWinScores($scope, heroesLib, function(){}); //paralelize
					AddHeroesTimeAdv($scope, heroesLib, function(){}); //paralelize
				} else {
					AddHeroesWinScores($scope, heroesLib, function(){
						AddHeroesAdvScores($scope, heroesLib, function(){
							AddHeroesTimeAdv($scope, heroesLib, function(){
								RecalculateAfterSelectionWData(); 
							});
						});
					});
					AddHeroesAdvScores($scope, heroesLib, function(){}); //paralelize
					AddHeroesTimeAdv($scope, heroesLib, function(){}); //paralelize
				}
			});

		}
		$scope.RecalculateAfterSelection = RecalculateAfterSelection;
		function RecalculateAfterSelectionWData() {	
			Debug('RecalculateAfterSelectionWData');
			/* CAPTAINS MODE make heroes unavailable*/
			if ($scope.show.cmmode == true) {
				for (var aHero in $scope.CMUnavailable) UnavailableHeroes(aHero);
			}

            InitHeroesSuggested();
            const suggestedJson = {};
            for (var N = 0; N < $scope.heroesSuggested.length; N++)
                suggestedJson[$scope.heroesSuggested[N].role] = $scope.heroesSuggested[N];


            RecalculateTeamScores();

            if ($scope.firstScreen) {
				UpdateTutorialPopups();
                return;
			}

			//calculating suggestion scores
            let skill = 1;
            for (var N = 0; N < $scope.SkillLevels.length; N++)
                if ($scope.skillLevel == $scope.SkillLevels[N]) skill = N;
            $scope.skillLevelN = skill;

            function SSqrt(val) {
				//return val;
				//if (val <= 1 && val >= -1) return val;
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
				if ($scope.show.winratemode == 'syn') return syn;
				else if ($scope.show.winratemode == 'wr') return wr
				else if ('settingsPersonal' in $scope && 'formulas' in $scope.settingsPersonal && prs in $scope.settingsPersonal.formulas && $scope.settingsPersonal.formulas[prs]!='default') return $scope.settingsPersonal.formulas[prs];
				else if ('settingsPersonal' in $scope && 'formulas' in $scope.settingsPersonal && prs in $scope.settingsPersonal.formulas && $scope.settingsPersonal.formulas[prs]=='default') return syn;
				else return function(){ return Number.NaN; };
			}

            const functionHandles = {};

            functionHandles.heroAdvantageScore = GetCustomFunctionHandler(GetFNWinrate(
				function(){ return this.cnd(this.heroPlusMinus, 0.5, 1, 2.5) * this.ssqrt(this.scale(0.9*this.advantageScoreScaled+0.1*this.winrateScoreScaled,2, 1)); },
				function(){ return this.cnd(this.heroPlusMinus, 0.5, 1, 2.5) * this.ssqrt(this.scale(this.winrateScoreScaled,2, 1)); },
				'advantage'
				), ['advantageScore', 'advantageScoreScaled', 'winrateScore', 'winrateScoreScaled', 'heroPlusMinus'], functionPointers);
		
			functionHandles.heroAdvantageScoreOp = fnValuesAdded;
			if ($scope.show.winratemode=='prs' && 'settingsPersonal' in $scope && 'formulas' in $scope.settingsPersonal && 'advantageOp' in $scope.settingsPersonal.formulas && $scope.settingsPersonal.formulas.advantageOp=='multiplied')
				functionHandles.heroAdvantageScoreOp = fnValuesMultiplied;
			
			functionHandles.heroSynergyScore = GetCustomFunctionHandler(GetFNWinrate(
				function(){ return this.cnd(this.heroPlusMinus, 0.5, 1, 2.5) * this.ssqrt(this.scale(this.synergyScoreScaled,1.5, 1)); },
				function(){ return this.cnd(this.heroPlusMinus, 0.5, 1, 2.5) * this.ssqrt(this.scale(this.winrateTeamScoreScaled,1.5, 1)); },
				'synergy'
				), ['synergyScore', 'synergyScoreScaled', 'winrateTeamScore', 'winrateTeamScoreScaled', 'heroPlusMinus'], functionPointers);
			
			functionHandles.heroSynergyScoreOp = fnValuesAdded;
			if ($scope.show.winratemode=='prs' && 'settingsPersonal' in $scope && 'formulas' in $scope.settingsPersonal && 'synergyOp' in $scope.settingsPersonal.formulas && $scope.settingsPersonal.formulas.synergyOp=='multiplied')
				functionHandles.heroSynergyScoreOp = fnValuesMultiplied;
			
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
			if ($scope.show.winratemode=='prs' && 'settingsPersonal' in $scope && 'formulas' in $scope.settingsPersonal && 'partBonusOp' in $scope.settingsPersonal.formulas && $scope.settingsPersonal.formulas.partBonusOp=='multiplied')
				functionHandles.eachPartBonusScoreOp = fnValuesMultiplied;
				
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
				
			
			
			for (let aHN = 0; aHN < $scope.heroes.length; aHN++) {
                const aThisHeroScores = $scope.heroPickScores[$scope.heroes[aHN].name];
                for (var aEHN = 0; aEHN < $scope.heroesEnemy.length; aEHN++) {
					aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name] = {
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
			
					if ('advantage' in $scope.heroesEnemy[aEHN] && typeof($scope.heroesEnemy[aEHN].advantage[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesEnemy[aEHN].advantage[$scope.heroes[aHN].id] != null)
						aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name].advantage = -$scope.heroesEnemy[aEHN].advantage[$scope.heroes[aHN].id][skill];
					if ('advantageUnscaled' in $scope.heroesEnemy[aEHN] && typeof($scope.heroesEnemy[aEHN].advantageUnscaled[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesEnemy[aEHN].advantageUnscaled[$scope.heroes[aHN].id] != null)
						aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name].advantageUnscaled = -$scope.heroesEnemy[aEHN].advantageUnscaled[$scope.heroes[aHN].id][skill];
					if ('winrate' in $scope.heroesEnemy[aEHN] && typeof($scope.heroesEnemy[aEHN].winrate[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesEnemy[aEHN].winrate[$scope.heroes[aHN].id] != null)
						aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name].winrate = -$scope.heroesEnemy[aEHN].winrate[$scope.heroes[aHN].id][skill];
					if ('winrateUnscaled' in $scope.heroesEnemy[aEHN] && typeof($scope.heroesEnemy[aEHN].winrateUnscaled[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesEnemy[aEHN].winrateUnscaled[$scope.heroes[aHN].id] != null)
						aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name].winrateUnscaled = -$scope.heroesEnemy[aEHN].winrateUnscaled[$scope.heroes[aHN].id][skill];
					if ('synergy' in $scope.heroesEnemy[aEHN] && typeof($scope.heroesEnemy[aEHN].synergy[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesEnemy[aEHN].advantage[$scope.heroes[aHN].id] != null)
						aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name].synergy = $scope.heroesEnemy[aEHN].synergy[$scope.heroes[aHN].id][skill];
					if ('synergyUnscaled' in $scope.heroesEnemy[aEHN] && typeof($scope.heroesEnemy[aEHN].synergyUnscaled[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesEnemy[aEHN].synergyUnscaled[$scope.heroes[aHN].id] != null)
						aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name].synergyUnscaled = $scope.heroesEnemy[aEHN].synergyUnscaled[$scope.heroes[aHN].id][skill];
					if ('winrateteam' in $scope.heroesEnemy[aEHN] && typeof($scope.heroesEnemy[aEHN].winrateteam[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesEnemy[aEHN].winrateteam[$scope.heroes[aHN].id] != null)
						aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name].winrateteam = $scope.heroesEnemy[aEHN].winrateteam[$scope.heroes[aHN].id][skill];
					if ('winrateteamUnscaled' in $scope.heroesEnemy[aEHN] && typeof($scope.heroesEnemy[aEHN].winrateteamUnscaled[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesEnemy[aEHN].winrateteamUnscaled[$scope.heroes[aHN].id] != null)
						aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name].winrateteamUnscaled = $scope.heroesEnemy[aEHN].winrateteamUnscaled[$scope.heroes[aHN].id][skill];
					if ($scope.heroesEnemy[aEHN].name in $scope.plusMinus) {
						if ($scope.plusMinus[$scope.heroesEnemy[aEHN].name] == 'plus')
							aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name].plusMinus = 1;
						else if ($scope.plusMinus[$scope.heroesEnemy[aEHN].name] == 'minus')
							aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name].plusMinus = -1;
					}
				}
				
				if ($scope.show.cmmode) for (var aEHN = 0; aEHN < $scope.banEnemy.length; aEHN++) {
					aThisHeroScores.banen[$scope.banEnemy[aEHN].name] = {
						advantage: 0,
						winrate: 0,
						advantageUnscaled: 0,
						winrateUnscaled: 0,
						plusMinus: 0
					};
			
					if ('advantage' in $scope.banEnemy[aEHN] && typeof($scope.banEnemy[aEHN].advantage[$scope.heroes[aHN].id]) != 'undefined' && $scope.banEnemy[aEHN].advantage[$scope.heroes[aHN].id] != null)
						aThisHeroScores.banen[$scope.banEnemy[aEHN].name].advantage = -$scope.banEnemy[aEHN].advantage[$scope.heroes[aHN].id][skill];
					if ('advantageUnscaled' in $scope.banEnemy[aEHN] && typeof($scope.banEnemy[aEHN].advantageUnscaled[$scope.heroes[aHN].id]) != 'undefined' && $scope.banEnemy[aEHN].advantageUnscaled[$scope.heroes[aHN].id] != null)
						aThisHeroScores.banen[$scope.banEnemy[aEHN].name].advantageUnscaled = -$scope.banEnemy[aEHN].advantageUnscaled[$scope.heroes[aHN].id][skill];
					if ('winrate' in $scope.banEnemy[aEHN] && typeof($scope.banEnemy[aEHN].winrate[$scope.heroes[aHN].id]) != 'undefined' && $scope.banEnemy[aEHN].winrate[$scope.heroes[aHN].id] != null)
						aThisHeroScores.banen[$scope.banEnemy[aEHN].name].winrate = -$scope.banEnemy[aEHN].winrate[$scope.heroes[aHN].id][skill];
					if ('winrateUnscaled' in $scope.banEnemy[aEHN] && typeof($scope.banEnemy[aEHN].winrateUnscaled[$scope.heroes[aHN].id]) != 'undefined' && $scope.banEnemy[aEHN].winrateUnscaled[$scope.heroes[aHN].id] != null)
						aThisHeroScores.banen[$scope.banEnemy[aEHN].name].winrateUnscaled = -$scope.banEnemy[aEHN].winrateUnscaled[$scope.heroes[aHN].id][skill];
				}
	

				for (var aEHN = 0; aEHN < $scope.heroesTeam.length; aEHN++) {
					aThisHeroScores.wt[$scope.heroesTeam[aEHN].name] = {
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
					if ('advantage' in $scope.heroesTeam[aEHN] && typeof($scope.heroesTeam[aEHN].advantage[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesTeam[aEHN].advantage[$scope.heroes[aHN].id] != null)
						aThisHeroScores.wt[$scope.heroesTeam[aEHN].name].advantage = -$scope.heroesTeam[aEHN].advantage[$scope.heroes[aHN].id][skill];
					if ('advantageUnscaled' in $scope.heroesTeam[aEHN] && typeof($scope.heroesTeam[aEHN].advantageUnscaled[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesTeam[aEHN].advantageUnscaled[$scope.heroes[aHN].id] != null)
						aThisHeroScores.wt[$scope.heroesTeam[aEHN].name].advantageUnscaled = -$scope.heroesTeam[aEHN].advantageUnscaled[$scope.heroes[aHN].id][skill];
					if ('winrate' in $scope.heroesTeam[aEHN] && typeof($scope.heroesTeam[aEHN].winrate[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesTeam[aEHN].winrate[$scope.heroes[aHN].id] != null)
						aThisHeroScores.wt[$scope.heroesTeam[aEHN].name].winrate = -$scope.heroesTeam[aEHN].winrate[$scope.heroes[aHN].id][skill];
					if ('winrateUnscaled' in $scope.heroesTeam[aEHN] && typeof($scope.heroesTeam[aEHN].winrateUnscaled[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesTeam[aEHN].winrateUnscaled[$scope.heroes[aHN].id] != null)
						aThisHeroScores.wt[$scope.heroesTeam[aEHN].name].winrateUnscaled = -$scope.heroesTeam[aEHN].winrateUnscaled[$scope.heroes[aHN].id][skill];
					if ('synergy' in $scope.heroesTeam[aEHN] && typeof($scope.heroesTeam[aEHN].synergy[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesTeam[aEHN].advantage[$scope.heroes[aHN].id] != null)
						aThisHeroScores.wt[$scope.heroesTeam[aEHN].name].synergy = $scope.heroesTeam[aEHN].synergy[$scope.heroes[aHN].id][skill];
					if ('synergyUnscaled' in $scope.heroesTeam[aEHN] && typeof($scope.heroesTeam[aEHN].synergyUnscaled[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesTeam[aEHN].synergyUnscaled[$scope.heroes[aHN].id] != null)
						aThisHeroScores.wt[$scope.heroesTeam[aEHN].name].synergyUnscaled = $scope.heroesTeam[aEHN].synergyUnscaled[$scope.heroes[aHN].id][skill];
					if ('winrateteam' in $scope.heroesTeam[aEHN] && typeof($scope.heroesTeam[aEHN].winrateteam[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesTeam[aEHN].winrateteam[$scope.heroes[aHN].id] != null)
						aThisHeroScores.wt[$scope.heroesTeam[aEHN].name].winrateteam = $scope.heroesTeam[aEHN].winrateteam[$scope.heroes[aHN].id][skill];
					if ('winrateteamUnscaled' in $scope.heroesTeam[aEHN] && typeof($scope.heroesTeam[aEHN].winrateteamUnscaled[$scope.heroes[aHN].id]) != 'undefined' && $scope.heroesTeam[aEHN].winrateteamUnscaled[$scope.heroes[aHN].id] != null)
						aThisHeroScores.wt[$scope.heroesTeam[aEHN].name].winrateteamUnscaled = $scope.heroesTeam[aEHN].winrateteamUnscaled[$scope.heroes[aHN].id][skill];
					if ($scope.heroesTeam[aEHN].name in $scope.plusMinus) {
						if ($scope.plusMinus[$scope.heroesTeam[aEHN].name] == 'plus')
							aThisHeroScores.wt[$scope.heroesTeam[aEHN].name].plusMinus = 1;
						else if ($scope.plusMinus[$scope.heroesTeam[aEHN].name] == 'minus')
							aThisHeroScores.wt[$scope.heroesTeam[aEHN].name].plusMinus = -1;
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
                if ($scope.show.bonusearly == 'yes') aPartBonuses.push($scope.heroes[aHN].gamePart[skill].early);
				if ($scope.show.bonusmid == 'yes') aPartBonuses.push($scope.heroes[aHN].gamePart[skill].mid);
				if ($scope.show.bonuslate == 'yes') aPartBonuses.push($scope.heroes[aHN].gamePart[skill].late);
				
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
						personalHeroScore: $scope.heroes[aHN].personalScores.usedScoreUnscaled,
						personalHeroScoreScaled: $scope.heroes[aHN].personalScores.usedScore,
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
				
				aThisHeroScores.gamePartScore = Math.floor(aThisHeroScores.gamePartScoreRaw * 10) / 10;;
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

				aThisHeroScores.wrFull = Math.floor($scope.heroesJson[$scope.heroes[aHN].name].timewin[skill].pfull*1000)/10;
				aThisHeroScores.wrFullStr = aThisHeroScores.wrFull+'';

				aThisHeroScores.wrLate = Math.floor($scope.heroesJson[$scope.heroes[aHN].name].timewin[skill].plate*1000)/10;
				aThisHeroScores.wrLateStr = aThisHeroScores.wrLate+'';

				aThisHeroScores.wrMid = Math.floor($scope.heroesJson[$scope.heroes[aHN].name].timewin[skill].pmid*1000)/10;
				aThisHeroScores.wrMidStr = aThisHeroScores.wrMid + '';

				aThisHeroScores.wrEarly = Math.floor($scope.heroesJson[$scope.heroes[aHN].name].timewin[skill].pearly*1000)/10;
				aThisHeroScores.wrEarlyStr = aThisHeroScores.wrEarly + '';


			}
			
			//calculating nemeses
			for (var aHN1 = 0; aHN1 < $scope.heroes.length; aHN1++) {
				for (var aHN2 = 0; aHN2 < $scope.heroes.length; aHN2++) {
					if (typeof($scope.heroes[aHN1].advantage[$scope.heroes[aHN2].id]) == 'undefined' || $scope.heroes[aHN1].advantage[$scope.heroes[aHN2].id] == null) continue;
					if ($scope.heroesPicked[$scope.heroes[aHN2].name].removedPool) continue;
					if ($scope.heroes[aHN1].advantage[$scope.heroes[aHN2].id][skill] < -7) {
						if ("Utility" in $scope.heroes[aHN2].rolesJSON)
							$scope.heroPickScores[$scope.heroes[aHN1].name].nem.Utility.push($scope.heroes[aHN2].name);
						if ("Core" in $scope.heroes[aHN2].rolesJSON)
							$scope.heroPickScores[$scope.heroes[aHN1].name].nem.Core.push($scope.heroes[aHN2].name);
						$scope.heroPickScores[$scope.heroes[aHN1].name].nem.All.push($scope.heroes[aHN2].name);
					}
				}
			}
			
            //Calculating team advantages
			$scope.matchup = {heroes: {}};
            const aEnemyCounter = [];
            const aTeamCounter = [];
            const aEnemySynergy = [];
            const aTeamSynergy = [];

            for (var aEHN = 0; aEHN < $scope.heroesEnemy.length; aEHN++)
				$scope.matchup.heroes[$scope.heroesEnemy[aEHN].name] = {vs:{}, vswins: 0, vsavg: 0};
				
			for (var aTHN = 0; aTHN < $scope.heroesTeam.length; aTHN++)
				$scope.matchup.heroes[$scope.heroesTeam[aTHN].name] = {vs:{}, vswins: 0, vsavg: 0};
				
            for (var aEHN = 0; aEHN < $scope.heroesEnemy.length; aEHN++)
                for (var aTHN = 0; aTHN < $scope.heroesTeam.length; aTHN++) {
                    const aVarT = {
                        advantageScore: 0,
                        advantageScoreScaled: 0,
                        winrateScore: 0,
                        winrateScoreScaled: 0,
                        heroPlusMinus: 0
                    };
                    if ('advantageUnscaled' in $scope.heroesEnemy[aEHN]) aVarT.advantageScore = -$scope.heroesEnemy[aEHN].advantageUnscaled[$scope.heroesTeam[aTHN].id][skill];
					if ('advantage' in $scope.heroesEnemy[aEHN]) aVarT.advantageScoreScaled = -$scope.heroesEnemy[aEHN].advantage[$scope.heroesTeam[aTHN].id][skill];
					if ('winrateUnscaled' in $scope.heroesEnemy[aEHN]) aVarT.winrateScore = -$scope.heroesEnemy[aEHN].winrateUnscaled[$scope.heroesTeam[aTHN].id][skill];
					if ('winrate' in $scope.heroesEnemy[aEHN]) aVarT.winrateScoreScaled = -$scope.heroesEnemy[aEHN].winrate[$scope.heroesTeam[aTHN].id][skill];
                    const resTeamCounter = functionHandles.heroAdvantageScore.exec(aVarT);
                    aTeamCounter.push(resTeamCounter);
					
					$scope.matchup.heroes[$scope.heroesTeam[aTHN].name].vs[$scope.heroesEnemy[aEHN].name] = {
						enemy: true,
						advantage: resTeamCounter,
						win: false
					};
					if (resTeamCounter > 0.5) {
						$scope.matchup.heroes[$scope.heroesTeam[aTHN].name].vs[$scope.heroesEnemy[aEHN].name].win = true;
						$scope.matchup.heroes[$scope.heroesTeam[aTHN].name].vswins++;
					}

                    const aVarE = {
                        advantageScore: 0,
                        advantageScoreScaled: 0,
                        winrateScore: 0,
                        winrateScoreScaled: 0,
                        heroPlusMinus: 0
                    };
                    if ('advantageUnscaled' in $scope.heroesTeam[aTHN]) aVarE.advantageScore = -$scope.heroesTeam[aTHN].advantageUnscaled[$scope.heroesEnemy[aEHN].id][skill];
					if ('advantage' in $scope.heroesTeam[aTHN]) aVarE.advantageScoreScaled = -$scope.heroesTeam[aTHN].advantage[$scope.heroesEnemy[aEHN].id][skill];
					if ('winrateUnscaled' in $scope.heroesTeam[aTHN]) aVarE.winrateScore = -$scope.heroesTeam[aTHN].winrateUnscaled[$scope.heroesEnemy[aEHN].id][skill];
					if ('winrate' in $scope.heroesTeam[aTHN]) aVarE.winrateScoreScaled = -$scope.heroesTeam[aTHN].winrate[$scope.heroesEnemy[aEHN].id][skill];
                    const resEnemyCounter = functionHandles.heroAdvantageScore.exec(aVarE);
                    aEnemyCounter.push(resEnemyCounter);
					
					
					$scope.matchup.heroes[$scope.heroesEnemy[aEHN].name].vs[$scope.heroesTeam[aTHN].name] = {
						enemy: true,
						advantage: resEnemyCounter,
						win: false
					};
					if (resEnemyCounter > 0.5) {
						$scope.matchup.heroes[$scope.heroesEnemy[aEHN].name].vs[$scope.heroesTeam[aTHN].name].win = true;
						$scope.matchup.heroes[$scope.heroesEnemy[aEHN].name].vswins++;
					}
                }
				
            for (var aHN1 = 0; aHN1 < $scope.heroesTeam.length; aHN1++)
                for (var aHN2 = 0; aHN2 < $scope.heroesTeam.length; aHN2++) {
					if (aHN1 == aHN2) continue;
					var aVar = {
						synergyScore: 0,
						synergyScoreScaled: 0,
						winrateTeamScore: 0,
						winrateTeamScoreScaled: 0,
						heroPlusMinus: 0
					}
					if ('synergyUnscaled' in $scope.heroesTeam[aHN1]) aVar.synergyScore = $scope.heroesTeam[aHN1].synergyUnscaled[$scope.heroesTeam[aHN2].id][skill];
					if ('synergy' in $scope.heroesTeam[aHN1]) aVar.synergyScoreScaled = $scope.heroesTeam[aHN1].synergy[$scope.heroesTeam[aHN2].id][skill];
					if ('winrateteamUnscaled' in $scope.heroesTeam[aHN1]) aVar.winrateTeamScore = $scope.heroesTeam[aHN1].winrateteamUnscaled[$scope.heroesTeam[aHN2].id][skill];
					if ('winrateteam' in $scope.heroesTeam[aHN1]) aVar.winrateTeamScoreScaled = $scope.heroesTeam[aHN1].winrateteam[$scope.heroesTeam[aHN2].id][skill];
					aTeamSynergy.push(functionHandles.heroSynergyScore.exec(aVar));
                }
            for (var aHN1 = 0; aHN1 < $scope.heroesEnemy.length; aHN1++)
                for (var aHN2 = 0; aHN2 < $scope.heroesEnemy.length; aHN2++) {
					if (aHN1 == aHN2) continue;
					var aVar = {
						synergyScore: 0,
						synergyScoreScaled: 0,
						winrateTeamScore: 0,
						winrateTeamScoreScaled: 0,
						heroPlusMinus: 0
					}
					if ('synergyUnscaled' in $scope.heroesEnemy[aHN1]) aVar.synergyScore = $scope.heroesEnemy[aHN1].synergyUnscaled[$scope.heroesEnemy[aHN2].id][skill];
					if ('synergy' in $scope.heroesEnemy[aHN1]) aVar.synergyScoreScaled = $scope.heroesEnemy[aHN1].synergy[$scope.heroesEnemy[aHN2].id][skill];
					if ('winrateteamUnscaled' in $scope.heroesEnemy[aHN1]) aVar.winrateTeamScore = $scope.heroesEnemy[aHN1].winrateteamUnscaled[$scope.heroesEnemy[aHN2].id][skill];
					if ('winrateteam' in $scope.heroesEnemy[aHN1]) aVar.winrateTeamScoreScaled = $scope.heroesEnemy[aHN1].winrateteam[$scope.heroesEnemy[aHN2].id][skill];
					aEnemySynergy.push(functionHandles.heroSynergyScore.exec(aVar));
                }

			
            $scope.matchup.enemyCounter = Math.round(functionHandles.heroAdvantageScoreOp(aEnemyCounter) * 100) / 100; /** Конечные значения*/
            $scope.matchup.teamCounter = Math.round(functionHandles.heroAdvantageScoreOp(aTeamCounter) * 100) / 100;
            $scope.matchup.enemySynergy = Math.round(functionHandles.heroSynergyScoreOp(aEnemySynergy) * 100) / 100;
            $scope.matchup.teamSynergy = Math.round(functionHandles.heroSynergyScoreOp(aTeamSynergy) * 100) / 100;
			
			for (var aTHN = 0; aTHN < $scope.heroesTeam.length; aTHN++) {
				var aTmpArr = [];
				for (var aVs in $scope.matchup.heroes[$scope.heroesTeam[aTHN].name].vs)
					 aTmpArr.push($scope.matchup.heroes[$scope.heroesTeam[aTHN].name].vs[aVs].advantage);
				$scope.matchup.heroes[$scope.heroesTeam[aTHN].name].vsavg = functionHandles.heroAdvantageScoreOp(aTmpArr);
			}
			
			for (var aEHN = 0; aEHN < $scope.heroesEnemy.length; aEHN++) {
				var aTmpArr = [];
				for (var aVs in $scope.matchup.heroes[$scope.heroesEnemy[aEHN].name].vs)
					aTmpArr.push($scope.matchup.heroes[$scope.heroesEnemy[aEHN].name].vs[aVs].advantage);
				$scope.matchup.heroes[$scope.heroesEnemy[aEHN].name].vsavg = functionHandles.heroSynergyScoreOp(aTmpArr);
			}
			
			$scope.enemyCounter = $scope.matchup.enemyCounter;
			$scope.teamCounter = $scope.matchup.teamCounter;
			$scope.enemySynergy = $scope.matchup.enemySynergy;
			$scope.teamSynergy = $scope.matchup.teamSynergy;
			//adding to different suggestion arrays
            for (var N = 0; N < $scope.heroes.length; N++) {
                const aHeroRoles = [];
                for (var aRoleIs in $scope.heroes[N].rolesJSON) if (aRoleIs in suggestedJson) aHeroRoles.push(aRoleIs);
                if ($scope.show.extroles == 'yes')
                  for (var aRoleIs in $scope.heroes[N].canRolesJSON) if (aRoleIs in suggestedJson && !(aRoleIs in $scope.heroes[N].rolesJSON)) aHeroRoles.push(aRoleIs);
                for (let aRN = 0; aRN < aHeroRoles.length; aRN++) { var aRoleIs = aHeroRoles[aRN];
                    let alreadySelected = false;
                    if ($scope.HeroIsSelectedEnemy($scope.heroes[N].name)) alreadySelected = true;
						if ($scope.HeroIsSelectedTeam($scope.heroes[N].name)) alreadySelected = true;
						if ($scope.HeroIsBannedEnemy($scope.heroes[N].name)) alreadySelected = true;
						if ($scope.HeroIsBannedTeam($scope.heroes[N].name)) alreadySelected = true;
						if ($scope.HeroIsBannedAll($scope.heroes[N].name)) alreadySelected = true;
                        for (var aEHN = 0; aEHN < $scope.heroesTeam.length; aEHN++)
                            if ($scope.heroesTeam[aEHN].name == $scope.heroes[N].name) alreadySelected = true;
                    let skip = false;
                    for (let rN = 0; rN < $scope.availableRoles.length; rN++)
							if ($scope.show['only'+$scope.availableRoles[rN].role] == 'yes' && !
								($scope.availableRoles[rN].role in $scope.heroes[N].rolesJSON || ($scope.show.extroles == 'yes' && $scope.availableRoles[rN].role in $scope.heroes[N].canRolesJSON))
							) skip = true;

						//for old picker
						if ($scope.show.onlydisablers == 'yes' && !('Disabler' in $scope.heroes[N].rolesJSON)) skip = true;
						if ($scope.show.onlyinitiators == 'yes' && !('Initiator' in $scope.heroes[N].rolesJSON)) skip = true;
						if ($scope.show.onlygankers == 'yes' && !('Ganker' in $scope.heroes[N].rolesJSON)) skip = true;
						if ($scope.show.onlycounterpushers == 'yes' && !('CounterPusher' in $scope.heroes[N].rolesJSON)) skip = true;
						if ($scope.show.onlypushers == 'yes' && !('Pusher' in $scope.heroes[N].rolesJSON)) skip = true;
						//end for old picker

						if ($scope.show.onlyfavorites == 'yes' && !($scope.heroes[N].personalSettings.favorite)) skip = true;
						if ($scope.show.nodisliked == 'yes' && $scope.heroes[N].personalSettings.disliked) skip = true;
						if (!alreadySelected && !skip) {
							$scope.heroPickScores[$scope.heroes[N].name].showHeroes[aRoleIs] = 1000;
							if ('heroesNoP' in suggestedJson[aRoleIs]) $scope.heroPickScores[$scope.heroes[N].name].showHeroesNoP[aRoleIs] = 1000;
							if ($scope.show.cmmode && 'heroesBan' in suggestedJson[aRoleIs]) $scope.heroPickScores[$scope.heroes[N].name].showHeroesBan[aRoleIs] = 1000;
						}
                }
            }
            for (var N = 0; N < $scope.heroesSuggested.length; N++) {
              $scope.heroesSuggested[N].heroes.sort(function(b, a) {
                return a.computedScore - b.computedScore;
              });
              var aPos = 1;
              for (var hSN = 0; hSN < $scope.heroesSuggested[N].heroes.length; hSN++) {
                if ($scope.heroesSuggested[N].role in $scope.heroesSuggested[N].heroes[hSN].showHeroes) {
                  $scope.heroesSuggested[N].heroes[hSN].showHeroes[$scope.heroesSuggested[N].role] = aPos;
                  aPos++;
                }
              }
              if ('heroesNoP' in $scope.heroesSuggested[N]) {
                $scope.heroesSuggested[N].heroesNoP.sort(function(b, a) {
                  return a.computedScoreNoPersonal - b.computedScoreNoPersonal;
                });
                var aPos = 1;
                for (var hSN = 0; hSN < $scope.heroesSuggested[N].heroesNoP.length; hSN++) {
                  if ($scope.heroesSuggested[N].role in $scope.heroesSuggested[N].heroesNoP[hSN].showHeroesNoP) {
                    $scope.heroesSuggested[N].heroesNoP[hSN].showHeroesNoP[$scope.heroesSuggested[N].role] = aPos;
                    aPos++;
                  }
                }
              }
              if ($scope.show.cmmode && 'heroesBan' in $scope.heroesSuggested[N]) {
                $scope.heroesSuggested[N].heroesBan.sort(function(b, a) {
                    const diff = a.computedEnemyScoreRaw - b.computedEnemyScoreRaw;
                    if (diff != 0) return diff;
                  return a.counterBanScoreRaw - b.counterBanScoreRaw;
                });
                var aPos = 1;
                for (var hSN = 0; hSN < $scope.heroesSuggested[N].heroesBan.length; hSN++) {
                  if ($scope.heroesSuggested[N].role in $scope.heroesSuggested[N].heroesBan[hSN].showHeroesBan) {
                    $scope.heroesSuggested[N].heroesBan[hSN].showHeroesBan[$scope.heroesSuggested[N].role] = aPos;
                    aPos++;
                  }
                }
              }
            }
			
			//calculating lane presences
			$scope.lanes = {
				'SafelaneCarry': {heroes: []},
				'LaneSupport': {heroes: []},
				'Mid': {heroes: []},
				'Offlane': {heroes: []},
				'Jungler': {heroes: []},
				'Roamer': {heroes: []}
			}
			function GetMapLanesCertain(lane, enemy) {
                const aResult = [];
                for (let aN = 0; aN < $scope.lanes[lane].heroes.length; aN++) if (enemy == $scope.lanes[lane].heroes[aN].enemy && $scope.lanes[lane].heroes[aN].certainty==1) aResult.push($scope.lanes[lane].heroes[aN]);
				return aResult;
			}
			function GetMapHeroCertain(hero, enemy) {
                const aResult = [];
                for (let lane in $scope.lanes) for (let aN = 0; aN < $scope.lanes[lane].heroes.length; aN++) if (hero == $scope.lanes[lane].heroes[aN].name && enemy == $scope.lanes[lane].heroes[aN].enemy && $scope.lanes[lane].heroes[aN].certainty==1) aResult.push({lane: lane, hero:$scope.lanes[lane].heroes[aN]});
				return aResult;
			}
			for (var aEHN = 0; aEHN < $scope.heroesEnemy.length; aEHN++)
				for (var aRole in $scope.lanes) {
					if (aRole in $scope.heroesEnemy[aEHN].rolesJSON && $scope.heroesEnemy[aEHN].rolesJSON[aRole] == true)
						$scope.lanes[aRole].heroes.push({name: $scope.heroesEnemy[aEHN].name, enemy: true, certainty: 1});
				}
			for (var aEHN = 0; aEHN < $scope.heroesTeam.length; aEHN++)
				for (var aRole in $scope.lanes) {
					if (aRole in $scope.heroesTeam[aEHN].rolesJSON && $scope.heroesTeam[aEHN].rolesJSON[aRole] == true)
						$scope.lanes[aRole].heroes.push({name: $scope.heroesTeam[aEHN].name, enemy: false, certainty: 1});
				}

			//$scope.lanes.SafelaneCarry.heroes[0].certainty = 0.5;
			function RemoveFromOtherLanes(hname, allLanes, thisLane, cert) {
                let aChange = false;
                for (let aLane in allLanes) {
					if (aLane == thisLane) continue;
					for (let aN = 0; aN < allLanes[aLane].heroes.length; aN++)
						if (allLanes[aLane].heroes[aN].name == hname && allLanes[aLane].heroes[aN].certainty != cert) {
							allLanes[aLane].heroes[aN].certainty = cert;
							aChange = true;
						}
				}
				return aChange;
			}

            const aMainLanes = ['SafelaneCarry', 'Mid', 'LaneSupport', 'Offlane'];
            const aMainLanesJSON = { //bool- can have multiple (2) of same kind
                SafelaneCarry: false,
                Mid: false,
                LaneSupport: true,
                Offlane: true
            };
            let aEnemy = true, aCntDoi = 0;
            for (; aCntDoi < 2; aCntDoi++, aEnemy=false) {
//break;
				while (true) {
					var aChange = false;

					//if a main lane doesn't have a hero we're adding all the heroes which have that lane as a secondary
					//this only happens only if no more heroes can be picked
					if (true && ((aEnemy && $scope.heroesEnemy.length==5) || (!aEnemy && $scope.heroesTeam.length==5))) {
						for (var aMLN = 0; aMLN < aMainLanes.length; aMLN++) {
							var aLaneHeroes = GetMapLanesCertain(aMainLanes[aMLN], aEnemy);
							if (aLaneHeroes.length == 0) {
                                const aHeroesTeam = (aEnemy ? $scope.heroesEnemy : $scope.heroesTeam);
                                for (var aEHN = 0; aEHN < aHeroesTeam.length; aEHN++)
									if (aMainLanes[aMLN] in aHeroesTeam[aEHN].canRolesJSON && aHeroesTeam[aEHN].canRolesJSON[aMainLanes[aMLN]] == true) {
										$scope.lanes[aMainLanes[aMLN]].heroes.push({name: aHeroesTeam[aEHN].name, enemy: aEnemy, certainty: 1});
										aChange = true;
									}

							}
						}

						if (aChange) continue;
					}

					//if on a main lane there is only one hero and the other lanes (that this hero can go to) are already covered, mark as uncertain
					//this only happens only if no more heroes can be picked
					if (true && ((aEnemy && $scope.heroesEnemy.length==5) || (!aEnemy && $scope.heroesTeam.length==5))) {
						for (var aMLN = 0; aMLN < aMainLanes.length; aMLN++) {
							var aLaneHeroes = GetMapLanesCertain(aMainLanes[aMLN], aEnemy);
							if (aLaneHeroes.length == 1) {
                                const aHeroOtherLanes = GetMapHeroCertain(aLaneHeroes[0].name, aEnemy);
                                if (aHeroOtherLanes.length > 1) {
									for (var aN = 0; aN < aHeroOtherLanes.length; aN++) if (aHeroOtherLanes[aN].lane != aMainLanes[aMLN]) {
										if (!(aHeroOtherLanes[aN].lane in aMainLanesJSON) || GetMapLanesCertain(aHeroOtherLanes[aN].lane, aEnemy).length >= 2) {//there is a replacement
											aHeroOtherLanes[aN].hero.certainty = 0.5;
											aChange = true;
										}
									}
									if (aChange) break;
								}
							}
						}
					}
					//if a hero (or group of heroes) can only go to certain main lanes, noone else can go there if the lane can't have multiple of same kind
					if (true) {
						for (var aMLN = 0; aMLN < aMainLanes.length; aMLN++) {
							if (aMainLanesJSON[aMainLanes[aMLN]] == true) continue;
							var aLaneHeroes = GetMapLanesCertain(aMainLanes[aMLN], aEnemy);
							for (let aLHN = 0; aLHN < aLaneHeroes.length; aLHN++) {
								if (GetMapHeroCertain(aLaneHeroes[aLHN].name, aEnemy).length==1) {
									for (let aLHN2 = 0; aLHN2 < aLaneHeroes.length; aLHN2++) if (aLHN2!=aLHN && GetMapHeroCertain(aLaneHeroes[aLHN2].name, aEnemy).length>1)
										aLaneHeroes[aLHN2].certainty = 0.5;
								}
							}
						}
					}
					//there are heroes that, if possible, prefer to go alone on a lane (darkseer, underlord)

					//if there is noone on a certain role, do something!
					if (aChange) continue;
					break;
				}
			}

//			for (var aRole in $scope.lanes) for (var N = 0; N < 2; N++) $scope.lanes[aRole].heroes.push({name: 'Abaddon', enemy: false});
//			for (var aRole in $scope.lanes) for (var N = 0; N < 5; N++) $scope.lanes[aRole].heroes.push({name: 'Anti-Mage', enemy: true});
//console.log($scope.lanes);			
				

            //calculating Tips and Tricks
			/*
            $scope.heroesEnemyTips = {};
			if (($scope.heroesEnemy.length == 5 && $scope.heroesTeam.length == 5) || ($scope.heroesEnemy.length!=0 && ($scope.show.showtabs[0]=='enherotips' || ($scope.show.showtabs[1]=='enherotips' && $scope.show.extended) ||($scope.show.showtabs[2]=='enherotips' && $scope.show.extended && $scope.show.extendedSecondary)))) AddHeroTips($http, $scope, function(){
			
				for (var aEHN = 0; aEHN < $scope.heroesEnemy.length; aEHN++) {
					$scope.heroesEnemyTips[$scope.heroesEnemy[aEHN].name] = [];
					if ($scope.heroesEnemy[aEHN].name in $scope.tips.enemy) {
						for (var N = 0; N < $scope.tips.enemy[$scope.heroesEnemy[aEHN].name].general.length; N++) {
							$scope.heroesEnemyTips[$scope.heroesEnemy[aEHN].name].push($scope.tips.enemy[$scope.heroesEnemy[aEHN].name].general[N]);
						}
					}
					for (var aTHN = 0; aTHN < $scope.heroesTeam.length; aTHN++) {
						if (($scope.heroesTeam[aTHN].name + '_' + $scope.heroesEnemy[aEHN].name) in $scope.tips.interactionenemyes)
							for (var N = 0; N < $scope.tips.interactionenemyes[$scope.heroesTeam[aTHN].name + '_' + $scope.heroesEnemy[aEHN].name].length; N++) {
								$scope.heroesEnemyTips[$scope.heroesEnemy[aEHN].name].push($scope.tips.interactionenemyes[$scope.heroesTeam[aTHN].name + '_' + $scope.heroesEnemy[aEHN].name][N]);
							}
						if (($scope.heroesEnemy[aEHN].name + '_' + $scope.heroesTeam[aTHN].name) in $scope.tips.interactionenemyes)
							for (var N = 0; N < $scope.tips.interactionenemyes[$scope.heroesEnemy[aEHN].name + '_' + $scope.heroesTeam[aTHN].name].length; N++) {
								$scope.heroesEnemyTips[$scope.heroesEnemy[aEHN].name].push($scope.tips.interactionenemyes[$scope.heroesEnemy[aEHN].name + '_' + $scope.heroesTeam[aTHN].name][N]);
							}
					}


					if ($scope.heroesEnemyTips[$scope.heroesEnemy[aEHN].name].length == 0)
						$scope.heroesEnemyTips[$scope.heroesEnemy[aEHN].name] = ["tips coming soon"];
				}
			});*/
			
            //calculating Spells		
/*			AddHeroSpells($http, $scope, function(){			
				$scope.heroesSpells=[];
				for (var N = 0; N < $scope.heroesEnemy.length; N++)
					$scope.heroesSpells.push({name: $scope.heroesEnemy[N].name, team: false})
				for (var N = 0; N < $scope.heroesTeam.length; N++)
					$scope.heroesSpells.push({name: $scope.heroesTeam[N].name, team: true})
				for (var N = 0; N < $scope.heroesSpells.length; N++)
					if ($scope.heroesSpells[N].name in $scope.spells.heroes)
						$scope.heroesSpells[N].spells = $scope.spells.heroes[$scope.heroesSpells[N].name];
				var ignoreLabel = {
				  stun: ['ministun'],
				  silence: ['mute']
				}
				$scope.spellCategories = {team:{}, enemy:{}, order: [

				{name: "nukes", list: [
				  {name: "nuke", label: "nuke",},
				]},

				{name: "disables",  list: [ 
				  {name: "disarm", label: "disarm",},
				  {name: "bash", label: "bash",},
				  {name: "ministun", label: "ministun",},
				  {name: "mute", label: "mute",},
				  {name: "root", label: "root",},
				  {name: "silence", label: "silence",},
				  {name: "stun", label: "stun",},
				  {name: "taunt", label: "taunt",},
				  {name: "trap", label: "trap",},
				]},

				{name: "mobility",  list: [ 
				  {name: "blink", label: "blink",},
				  {name: "force move", label: "forcedmovement",},
				  {name: "slow", label: "slow",},
				  {name: "speed", label: "speedup",},
				  {name: "teleport", label: "teleport",},
				]},

				{name: "restore",  list: [ 
				  {name: "CDR", label: "cdreduction",},
				  {name: "heal", label: "heal",},
				  {name: "+mana", label: "plusmana",},
				]},

				{name: "damage",  list: [ 
				  {name: "AoE", label: "aoe",},
				  {name: "DoT", label: "dot",},
				  {name: "splash", label: "splash",},
				]},

				{name: "pierces spell immunity", list: [
				  {name: "pierce BKB", label: "piercespellimmunity",},
				]},

				{name: "offensive",  list: [ 
				  {name: "+attack", label: "batspeed",},
				  {name: "break", label: "break",},
				  {name: "crit", label: "crit",},
				  {name: "-attrib", label: "minusattribute",},
				  {name: "-armor", label: "minusarmor",},
				  {name: "-mana", label: "minusmana",},
				  {name: "-resist", label: "minusresist",},
				  {name: "+damage", label: "plusdamage",},
				]},

				{name: "defensive",  list: [ 
				  {name: "-attack", label: "batslow",},
				  {name: "blind", label: "blind",},
				  {name: "evade", label: "evasion",},
				  {name: "invuln", label: "invuln",},
				  {name: "-damage", label: "minusdamage",},
				  {name: "+armor", label: "plusarmor",},
				  {name: "+attrib", label: "plusattribute",},
				  {name: "+resist", label: "plusresist",},
				  {name: "spell immune", label: "spellimmunity",},
				]},

				{name: "utility",  list: [ 
				  {name: "dispel", label: "dispel",},
				  {name: "illusion", label: "illusion",},
				  {name: "invis", label: "invis",},
				  {name: "summons", label: "summons",},
				  {name: "truesight", label: "truesight",},
				  {name: "vision", label: "vision",},
				]},

				{name: "other",  list: [ 
				  {name: "channel", label: "channel",},
				  {name: "global", label: "global",},
				  {name: "passive", label: "passive",},
				  {name: "tree", label: "tree",},
				  {name: "scepter", label: "scepter",},
				]}

				]};
				
				for (var aCatN = 0; aCatN < $scope.spellCategories.order.length; aCatN++) {
					var agsList = [];
					for (var aLN = 0; aLN < $scope.spellCategories.order[aCatN].list.length; aLN++) {
						agsList.push({name: 'aghs' + $scope.spellCategories.order[aCatN].list[aLN].name, label: 'ags'+$scope.spellCategories.order[aCatN].list[aLN].label});
					}
					$scope.spellCategories.order[aCatN].list = $scope.spellCategories.order[aCatN].list.concat(agsList);
				}
				
				for (var N = 0; N < $scope.heroesSpells.length; N++) {
					var addTo = $scope.heroesSpells[N].team ? $scope.spellCategories.team : $scope.spellCategories.enemy;
					for (var aSpell in $scope.heroesSpells[N].spells) {
						for (var aLN = 0; aLN < $scope.heroesSpells[N].spells[aSpell].labels.length;aLN++) {
							if ($scope.heroesSpells[N].spells[aSpell].labels[aLN] in ignoreLabel) {
								var found = false;
								for (var aIL = 0; aIL < ignoreLabel[$scope.heroesSpells[N].spells[aSpell].labels[aLN]].length; aIL++) {
									for (var aLN1 = 0; aLN1 < $scope.heroesSpells[N].spells[aSpell].labels.length;aLN1++) {
										if ($scope.heroesSpells[N].spells[aSpell].labels[aLN1] == ignoreLabel[$scope.heroesSpells[N].spells[aSpell].labels[aLN]][aIL]) {
											found = true;
											break;
										}
									}
									if (found) break;
								}
								if (found) break;
							}
							if (!($scope.heroesSpells[N].spells[aSpell].labels[aLN] in addTo))
								addTo[$scope.heroesSpells[N].spells[aSpell].labels[aLN]] = [];
							addTo[$scope.heroesSpells[N].spells[aSpell].labels[aLN]].push($scope.heroesSpells[N].spells[aSpell]);
						}
					}
					
				}
				
				
				//check to see if there are spells in any list
				for (var N = 0; N < $scope.spellCategories.order.length; N++) {
					$scope.spellCategories.order[N].teamHasSpells = false;
					$scope.spellCategories.order[N].enemyHasSpells = false;
					for (var aLN = 0; aLN < $scope.spellCategories.order[N].list.length;aLN++) {
						var aLabel = $scope.spellCategories.order[N].list[aLN].label;
						if (aLabel in $scope.spellCategories.enemy)
							$scope.spellCategories.order[N].enemyHasSpells = true;
						if (aLabel in $scope.spellCategories.team)
							$scope.spellCategories.order[N].teamHasSpells = true;
					}
				}
				
				//console.log($scope.spellCategories);
			});
*/


			
			//calculating timers
			if (!('timers' in $scope)) {
				$scope.timers = [
					{id: 'roshan', time: 660, split: [{perc: 27, start: 0, class: "progress-bar-warning"}, {perc: 73, start: 27, class: ""}], img: 'assets/img/heroes/roshan.png'},
					{id: 'aegis', time: 300, split: [{perc: 100, start: 0, class: ""}], img: 'assets/img/items/aegis_lg.png'},
//					{id: "enigma_black_hole", time: 200, img: "http://cdn.dota2.com/apps/dota2/images/abilities/enigma_black_hole_hp1.png"},
//					{id: 'roshan2', time: 10, split: [{perc: 27, start: 0, class: "progress-bar-warning"}, {perc: 73, start: 27, class: ""}], img: 'assets/img/heroes/roshan.png'},
				];
				$scope.timersJSON = {};
				$scope.timersReadable = function (sec) {
                    const aMin = Math.floor(sec / 60);
                    const aSec = sec - aMin * 60;
                    let aRet = '';
                    aRet += aMin + ':';
					if (aSec<10)
						aRet += '0';
					aRet+= aSec;
					return aRet;
				}				
				for (var N = 0; N < $scope.timers.length; N++) {
					$scope.timers[N].perc = 100;
					$scope.timers[N].left = $scope.timers[N].time;
					$scope.timers[N].sint = null;
					$scope.timersJSON[$scope.timers[N].id] = $scope.timers[N];
				}
			}
			//todo: check if hero with timer spell was added or removed
			$scope.timersStart = function(which) {
				if (which in $scope.timersJSON)
					if ($scope.timersJSON[which].sint != null) {
						clearInterval($scope.timersJSON[which].sint)
						$scope.timersJSON[which].sint = null;
					}
					$scope.timersJSON[which].perc = 100;
					$scope.timersJSON[which].left = $scope.timersJSON[which].time;
					$scope.timersJSON[which].startTS = + new Date();
					$scope.timersJSON[which].sint = setInterval(function(){
						$scope.timersJSON[which].left = $scope.timersJSON[which].time - Math.round((+new Date() - $scope.timersJSON[which].startTS)/1000);
						if ($scope.timersJSON[which].left < 0)
							$scope.timersJSON[which].left = 0;
						$scope.timersJSON[which].perc = Math.round(100*$scope.timersJSON[which].left / $scope.timersJSON[which].time);
						if ('split' in $scope.timersJSON[which]) {
							$('.timer'+which+':first-child').each(function(i){$(this).children().each(function(i){
								$(this).css('width', Math.max(0, $scope.timersJSON[which].split[i].perc - Math.max(0,$scope.timersJSON[which].split[i].start + $scope.timersJSON[which].split[i].perc - $scope.timersJSON[which].perc))+'%');
							})});
						}
						
						$('.timerleft'+which).html($scope.timersReadable($scope.timersJSON[which].left));
						if ($scope.timersJSON[which].left <= 0)
							clearInterval($scope.timersJSON[which].sint)
					}, 1000);
			}
			
			

            //calculating observations
            if ((function() {
                let nrFarmers = 0;
                for (let aEHN = 0; aEHN < $scope.heroesEnemy.length; aEHN++)
                        if ('RoleCarry' in $scope.heroesEnemy[aEHN].rolesJSON) nrFarmers++;
                    if (nrFarmers >= 3)
                        return true;
                    else
                        return false;
                })()) $scope.observations.enemy.push({
                observation: 'has many farmers',
                suggestion: 'get fast push lineup & some initiation'
            });
            if ((function() {
                    if ($scope.heroesEnemy.length < 4) return false;
                    for (let aEHN = 0; aEHN < $scope.heroesEnemy.length; aEHN++)
                        if ('Durable' in $scope.heroesEnemy[aEHN].rolesJSON) return false;
                    return true;
                })()) $scope.observations.enemy.push({
                observation: 'is squishy',
                suggestion: 'getting nuke & burst damage can help'
            });
            if ((function() {
                let pushScore = 0;
                for (let aEHN = 0; aEHN < $scope.heroesEnemy.length; aEHN++)
                        pushScore += $scope.heroesEnemy[aEHN].stars.Pusher;
                    if (pushScore >= 5)
                        return true;
                    else
                        return false;
                })()) $scope.observations.enemy.push({
                observation: 'has pushing lineup',
                suggestion: 'get some wave clearing heroes'
            });
            if ((function() {
                    if ($scope.heroesTeam.length < 3) return false;
                    for (let aEHN = 0; aEHN < $scope.heroesTeam.length; aEHN++)
                        if ('RoleSupport' in $scope.heroesTeam[aEHN].rolesJSON) return false;
                    return true;
                })()) $scope.observations.team.push({
                observation: 'has no support',
                suggestion: 'you may have to pick one'
            });
            if ((function() {
                    if ($scope.heroesTeam.length < 3) return false;
                    for (let aEHN = 0; aEHN < $scope.heroesTeam.length; aEHN++)
                        if ('Initiator' in $scope.heroesTeam[aEHN].rolesJSON) return false;
                    return true;
                })()) $scope.observations.team.push({
                observation: 'has no initiation',
                suggestion: 'you may have to pick one'
            });
            if ((function() {
                    if ($scope.heroesTeam.length < 3) return false;
                    for (let aEHN = 0; aEHN < $scope.heroesTeam.length; aEHN++)
                        if ('Disabler' in $scope.heroesTeam[aEHN].rolesJSON) return false;
                    return true;
                })()) $scope.observations.team.push({
                observation: 'has no disabler',
                suggestion: 'you may have to pick one'
            });
            if ((function() {
                    if ($scope.heroesTeam.length < 3) return false;
                    for (let aEHN = 0; aEHN < $scope.heroesTeam.length; aEHN++)
                        if ('Ganker' in $scope.heroesTeam[aEHN].rolesJSON) return false;
                    return true;
                })()) $scope.observations.team.push({
                observation: 'has no ganker',
                suggestion: 'you may have to pick one'
            });
            if ((function() {
                    if ($scope.heroesTeam.length < 3) return false;
                    for (let aEHN = 0; aEHN < $scope.heroesTeam.length; aEHN++)
                        if ('RoleCarry' in $scope.heroesTeam[aEHN].rolesJSON) return false;
                    return true;
                })()) $scope.observations.team.push({
                observation: 'has no carry',
                suggestion: 'who thought this can happen'
            });
            if ((function() {
                    if ($scope.heroesTeam.length < 4) return false;
                    for (let aEHN = 0; aEHN < $scope.heroesTeam.length; aEHN++)
                        if ('Durable' in $scope.heroesTeam[aEHN].rolesJSON) return false;
                    return true;
                })()) $scope.observations.team.push({
                observation: 'is squishy',
                suggestion: 'pick something to boost the health of your team'
            });
            if ((function() {
                let nrFarmers = 0;
                for (let aEHN = 0; aEHN < $scope.heroesEnemy.length; aEHN++)
                        if ('RoleCarry' in $scope.heroesEnemy[aEHN].rolesJSON) nrFarmers++;
                    if (nrFarmers >= 3)
                        return true;
                    else
                        return false;
                })()) $scope.observations.enemyFinal.push({
                observation: 'has many potential farmers',
                suggestion: 'ward and don\'t let them farm, don\'t let it gate to the late game'
            });
            if ((function() {
                    if ($scope.heroesEnemy.length < 3) return false;
                    for (let aEHN = 0; aEHN < $scope.heroesEnemy.length; aEHN++)
                        if ('Ganker' in $scope.heroesEnemy[aEHN].rolesJSON) return true;
                    return false;
                })()) $scope.observations.enemyFinal.push({
                observation: 'has ganker',
                suggestion: 'ward! have tps to countergank!'
            });
            if ((function() {
                let nrFarmers = 0;
                for (let aEHN = 0; aEHN < $scope.heroesTeam.length; aEHN++)
                        if ('RoleCarry' in $scope.heroesTeam[aEHN].rolesJSON) nrFarmers++;
                    if (nrFarmers >= 3)
                        return true;
                    else
                        return false;
                })()) $scope.observations.teamFinal.push({
                observation: 'has many potential farmers',
                suggestion: 'be very careful in the early and mid game'
            });
			
            UpdateTutorialPopups();

            //updating hero popups
			UpdateHeroInfoPopups();
			UpdateHeroSpellsPopups();
			
			setTimeout(function() {
				RecalculateUltimatePickerScrolls();
				$scope.$apply();
			},0);
		Debug('RecalculateAfterSelectionWDataEnd');
        }

        function GetWinTimeDataset(heroesEnemy, heroesTeam) {
            let skill = 1;
            for (var N = 0; N < $scope.SkillLevels.length; N++)
                if ($scope.skillLevel == $scope.SkillLevels[N]) skill = N;

            const enemyWinTimes = {};
            const teamWinTimes = {};
            const labelsWinTimes = [];
            const labelsWinTimesShow = [];
            const enemyWinTimesArr = [];
            const teamWinTimesArr = [];


            var aHeroes = heroesEnemy;
			var aWinTimes = enemyWinTimes;
			for (var aHN = 0; aHN < aHeroes.length; aHN++) {
				for (var aTime in aHeroes[aHN].timewin[skill]) {
					if (aTime.substr(0, 1) != 'a') continue;
					if (!(aTime in aWinTimes)) aWinTimes[aTime] = 0;
					aWinTimes[aTime] += aHeroes[aHN].timewin[skill][aTime];
				}
			}

			var aAvg = 0;
			aAvgNr = 0;
			
			for (var aTime in aWinTimes) {
				aWinTimes[aTime] /= aHeroes.length;
				aAvg += aWinTimes[aTime];
				aAvgNr++;
			}
			for (var aTime in aWinTimes) {
				aWinTimes[aTime] += 0.5 - aAvg / aAvgNr;
				aWinTimes[aTime] = aHeroes.length == 0 ? 0.5 : Math.floor(aWinTimes[aTime] * 10000) / 10000;
			}
			var aHeroes = heroesTeam;
			var aWinTimes = teamWinTimes;
			for (var aHN = 0; aHN < aHeroes.length; aHN++) {
				for (var aTime in aHeroes[aHN].timewin[skill]) {
					if (aTime.substr(0, 1) != 'a') continue;
					if (!(aTime in aWinTimes)) aWinTimes[aTime] = 0;
					aWinTimes[aTime] += aHeroes[aHN].timewin[skill][aTime];
				}
			}
			var aAvg = 0;
			aAvgNr = 0;
			for (var aTime in aWinTimes) {
				aWinTimes[aTime] /= aHeroes.length;
				aAvg += aWinTimes[aTime];
				aAvgNr++;
			}
			for (var aTime in aWinTimes) {
				aWinTimes[aTime] += 0.5 - aAvg / aAvgNr;
				aWinTimes[aTime] = aHeroes.length == 0 ? 0.5 : Math.floor(aWinTimes[aTime] * 10000) / 10000;
			}
            

            for (var aTime in enemyWinTimes) {
                labelsWinTimes.push(aTime);
                labelsWinTimesShow.push(aTime.substr(1) + 'min');
            }
            for (var aTime in teamWinTimes)
                if (!(aTime in enemyWinTimes)) {
                    labelsWinTimes.push(aTime);
                    labelsWinTimesShow.push(aTime.substr(1) + 'min');
                }

            for (let aLN = 0; aLN < labelsWinTimes.length; aLN++) {
                if (labelsWinTimes[aLN] in enemyWinTimes)
                    enemyWinTimesArr.push(enemyWinTimes[labelsWinTimes[aLN]]);
                else
                    enemyWinTimesArr.push(0.5);
                if (labelsWinTimes[aLN] in teamWinTimes)
                    teamWinTimesArr.push(teamWinTimes[labelsWinTimes[aLN]]);
                else
                    teamWinTimesArr.push(0.5);
            }
            const scales = {
                large: {
                    scaleSteps: 6,
                    scaleStepWidth: 0.05,
                    scaleStartValue: 0.35
                },
                average: {
                    scaleSteps: 4,
                    scaleStepWidth: 0.05,
                    scaleStartValue: 0.4
                },
                small: {
                    scaleSteps: 6,
                    scaleStepWidth: 0.02,
                    scaleStartValue: 0.44
                },
                smaller: {
                    scaleSteps: 4,
                    scaleStepWidth: 0.02,
                    scaleStartValue: 0.46
                },
                smallest: {
                    scaleSteps: 4,
                    scaleStepWidth: 0.01,
                    scaleStartValue: 0.48
                }
            };
            let usedScale = 'smallest';
            for (var N = 0; N < enemyWinTimesArr.length; N++) {
                if (enemyWinTimesArr[N] < 0.48 || enemyWinTimesArr[N] > 0.52 && usedScale == 'smallest')
                    usedScale = 'smaller';
                if (teamWinTimesArr[N] < 0.48 || teamWinTimesArr[N] > 0.52 && usedScale == 'smallest')
                    usedScale = 'smaller';
                if (enemyWinTimesArr[N] < 0.46 || enemyWinTimesArr[N] > 0.54 && (usedScale == 'smaller' || usedScale == 'smallest'))
                    usedScale = 'small';
                if (teamWinTimesArr[N] < 0.46 || teamWinTimesArr[N] > 0.54 && (usedScale == 'smaller' || usedScale == 'smallest'))
                    usedScale = 'small';
                if (enemyWinTimesArr[N] < 0.44 || enemyWinTimesArr[N] > 0.56 && (usedScale == 'smaller' || usedScale == 'smallest' || usedScale == 'small'))
                    usedScale = 'average';
                if (teamWinTimesArr[N] < 0.44 || teamWinTimesArr[N] > 0.56 && (usedScale == 'smaller' || usedScale == 'smallest' || usedScale == 'small'))
                    usedScale = 'average';
                if (enemyWinTimesArr[N] < 0.4 || enemyWinTimesArr[N] > 0.6)
                    usedScale = 'large';
                if (teamWinTimesArr[N] < 0.4 || teamWinTimesArr[N] > 0.6)
                    usedScale = 'large';
            }
            return {
                labels: labelsWinTimesShow,
                enemyWin: enemyWinTimesArr,
                teamWin: teamWinTimesArr,
                scales: scales,
                usedScale: usedScale
            };
        }

        
        function UpdateHeroInfoPopups() {
		Debug('UpdateHeroInfoPopupsStart');

            let skill = 1;
            for (let N = 0; N < $scope.SkillLevels.length; N++)
                if ($scope.skillLevel == $scope.SkillLevels[N]) skill = N;

                //clearInterval( popupInterval );
            function appendScore(score) {
                let sign = "";
                let color = "";
                if (score >= 0) sign = "+";
                    if (score > 0) {
                        color = 'color="#3f903f"';

                    } else if (score < 0) {
                        color = 'color="#cc0000"';
                    }
                    return '<b><font ' + color + '>' + sign + score + '</font></b>';
                }
                //remove any opened popover
            const items = $(".heroInfoPopup");
            for (var i = 0; i < items.length; i++)
                $(items[i]).popover('hide');
            AddHeroesTimeAdv($scope, heroesLib, function(){ setTimeout(function(){
				Debug('UpdateHeroInfoPopups AddHeroesTimeAdvWPartScores');
                //<div class="heroInfoPopup" heroname="Hero Name Here" role="Role"></div>
                // console.log($scope.heroesJson["Enigma"]);
                // console.log($scope.heroesSuggested);
                const advantageScoreUsed = $scope.show.winratemode == 'wr' ? 'winrate' : 'advantage';
                const synergyScoreUsed = $scope.show.winratemode == 'wr' ? 'winrateteam' : 'synergy';
                const items = $(".heroInfoPopup");
                for (let i = 0; i < items.length; i++) {
                    if (!($(items[i]).attr("poped"))) {
                        const heroname = $(items[i]).attr("heroname");
                        const choose = $(items[i]).attr("choose");
                        (function (heroname, choose) {
                            const p = $(items[i]).popover({
                                html: true,
                                trigger: 'hover',
                                title: function () {
                                    $scope.heroesJson[heroname].nameshow + ": " + appendScore(Math.round($scope.heroPickScores[heroname].computedScore * 100) / 100)
                                },
                                content: function () {


                                    const counter_score = parseFloat($scope.heroPickScores[heroname].counterEnemyScoreStr);
                                    const team_score = parseFloat($scope.heroPickScores[heroname].helpTeamScoreStr);
                                    const total_score = (parseFloat(counter_score) + parseFloat(team_score)).toFixed(2);
                                    const aFull = $scope.heroesJson[heroname].timewin[skill].pfull;
                                    const aLate = $scope.heroesJson[heroname].timewin[skill].plate;
                                    const aMid = $scope.heroesJson[heroname].timewin[skill].pmid;
                                    const aEarly = $scope.heroesJson[heroname].timewin[skill].pearly;

                                    if (typeof(localizedHeroInfoPopup) == 'undefined')
                                        var templateHeroInfoPopup = {
                                            content: '<table width="250px" style="background-color: transparent;"><tr><td width="120px">counter: <<counter_score>><br>synergy: <<synergy_score>><br>time adv: <<gamePartScore>><br>personal: <<personalScore>></td><td width="20px"></td><td width="120px"><img src="<<heroimg>>" width="100px"></td></tr><<cmmodetop>><tr><td colspan=3><hr style="margin-top: 7px; margin-bottom: 7px;"></td></tr><tr><td>winrates:<table style="background-color: transparent;"><tr><td><small>Full Game</small></td><td width="10px"></td><td><small><<wrfull>></small></td><td><tr><td><small>Late Game</small></td><td width="10px"></td><td><small><<wrlate>></small></td><td><tr><td><small>Mid Game</small></td><td width="10px"></td><td><small><<wrmid>></small></td><td><tr><td><small>Early Game</small></td><td width="10px"></td><td><small><<wrearly>></small></td><td></table></td><td></td><td><table style="background-color: transparent;"><<rolestarsTemplate>></table></td></tr><tr><td colspan=3><hr style="margin-top: 7px; margin-bottom: 7px;"></td></tr><tr><td><<enemyheroesTemplate>></td><td></td><td><<teamheroesTemplate>></td></tr><<nemesestemplate>></table>',
                                            cmmodetop: '<tr><td colspan=3><br>counters team: <<cmcountersteam>><br>synergyzes with enemy: <<cmsynergyzeenemy>><br>countered by enemy bans: <<cmcounteredbans>></td></tr>',
                                            rolestars: '<tr><td><small><<role>></small></td><td width="10px"></td><td><<stars>></td></tr>',
                                            star: '<img src="/assets/img/picker/stargreen.png" width="10px">',
                                            heroTemplate: '<img src="<<heroimg>>" width="40px"> <<heroscore>><br>',
                                            nemesesHeader: '<tr><td colspan=3><hr style="margin-top: 7px; margin-bottom: 7px;"></td></tr><tr><td colspan=3 align="center">Pickable Nemeses</td></tr>',
                                            nemesesCore: '<tr><td colspan=3>Core: <<corenemeses>></td></tr>',
                                            nemesesUtility: '<tr><td colspan=3>Utility: <<utilitynemeses>></td></tr>',
                                            nemesesTemplate: '<img src="<<heroimg>>" width="30px"> ',
                                            roles: {}
                                        };
                                    else var templateHeroInfoPopup = localizedHeroInfoPopup;
                                    let cmmodetop = '';
                                    if ($scope.show.cmmode)
                                        cmmodetop = templateHeroInfoPopup.cmmodetop.replace('<<cmcountersteam>>', appendScore(parseFloat($scope.heroPickScores[heroname].counterTeamScoreStr))).replace('<<cmsynergyzeenemy>>', appendScore(parseFloat($scope.heroPickScores[heroname].helpEnemyScoreStr))).replace('<<cmcounteredbans>>', appendScore(parseFloat($scope.heroPickScores[heroname].counterBanScoreStr)));
                                    let rolestars = '';
                                    for (let role in $scope.heroesJson[heroname].stars) {
                                        if (role == "Melee") continue;
                                        if ($scope.heroesJson[heroname].stars[role] > 0) {
                                            let aRoleStr = role.replace('Role', '');
                                            if (role in templateHeroInfoPopup.roles) aRoleStr = templateHeroInfoPopup.roles[role];
                                            let starsTmp = '';
                                            for (let j = 0; j < $scope.heroesJson[heroname].stars[role]; j++) starsTmp += templateHeroInfoPopup.star;
                                            rolestars += templateHeroInfoPopup.rolestars.replace('<<role>>', aRoleStr).replace('<<stars>>', starsTmp);
                                        }
                                    }
                                    let enemyheroesT = '';
                                    for (var N = 0; N < $scope.heroesEnemy.length; N++) {
                                        var aVal = 0;
                                        if ($scope.heroesEnemy[N][advantageScoreUsed][$scope.heroesJson[heroname].id] != null)
                                            aVal = -$scope.heroesEnemy[N][advantageScoreUsed][$scope.heroesJson[heroname].id][skill];
                                        enemyheroesT += templateHeroInfoPopup.heroTemplate.replace('<<heroimg>>', $scope.heroesEnemy[N].imgsmall).replace('<<heroscore>>', appendScore(aVal));
                                    }
                                    let teamheroesT = '';
                                    for (var N = 0; N < $scope.heroesTeam.length; N++) {
                                        var aVal = 0;
                                        if ($scope.heroesTeam[N][synergyScoreUsed][$scope.heroesJson[heroname].id] != null)
                                            aVal = $scope.heroesTeam[N][synergyScoreUsed][$scope.heroesJson[heroname].id][skill];
                                        teamheroesT += templateHeroInfoPopup.heroTemplate.replace('<<heroimg>>', $scope.heroesTeam[N].imgsmall).replace('<<heroscore>>', appendScore(aVal));
                                    }
                                    let nemesesT = '';
                                    if ($scope.heroPickScores[heroname].nem.Core != 0 || $scope.heroPickScores[heroname].nem.Utility != 0) {
                                        nemesesT += templateHeroInfoPopup.nemesesHeader;
                                        if ($scope.heroPickScores[heroname].nem.Core != 0) {
                                            var nemT = '';
                                            for (var nN = 0; nN < $scope.heroPickScores[heroname].nem.Core.length; nN++)
                                                nemT += templateHeroInfoPopup.nemesesTemplate.replace('<<heroimg>>', $scope.heroesJson[$scope.heroPickScores[heroname].nem.Core[nN]].imgsmall);
                                            nemesesT += templateHeroInfoPopup.nemesesCore.replace('<<corenemeses>>', nemT);
                                        }
                                        if ($scope.heroPickScores[heroname].nem.Utility != 0) {
                                            var nemT = '';
                                            for (var nN = 0; nN < $scope.heroPickScores[heroname].nem.Utility.length; nN++)
                                                nemT += templateHeroInfoPopup.nemesesTemplate.replace('<<heroimg>>', $scope.heroesJson[$scope.heroPickScores[heroname].nem.Utility[nN]].imgsmall);
                                            nemesesT += templateHeroInfoPopup.nemesesUtility.replace('<<utilitynemeses>>', nemT);
                                        }
                                    }

                                    const replaceText = [
                                        ['<<counter_score>>', appendScore(counter_score)],
                                        ['<<synergy_score>>', appendScore(team_score)],
                                        ['<<gamePartScore>>', appendScore(parseFloat($scope.heroPickScores[heroname].gamePartScore))],
                                        ['<<personalScore>>', appendScore(parseFloat($scope.heroPickScores[heroname].personalScore))],
                                        ['<<heroimg>>', $scope.heroesJson[heroname].img],
                                        ['<<cmmodetop>>', cmmodetop],
                                        ['<<wrfull>>', '<font ' + (aFull > 51 ? 'color="#3f903f"' : (aFull < 49 ? 'color="#cc0000"' : '')) + '>' + Math.round(aFull * 1000) / 10 + '%</font>'],
                                        ['<<wrlate>>', '<font ' + (aLate > (aFull + 0.01) ? 'color="#3f903f"' : (aLate < (aFull - 0.01) ? 'color="#cc0000"' : '')) + '>' + Math.round(aLate * 1000) / 10 + '%</font>'],
                                        ['<<wrmid>>', '<font ' + (aMid > (aFull + 0.01) ? 'color="#3f903f"' : (aMid < (aFull - 0.01) ? 'color="#cc0000"' : '')) + '>' + Math.round(aMid * 1000) / 10 + '%</font>'],
                                        ['<<wrearly>>', '<font ' + (aEarly > (aFull + 0.01) ? 'color="#3f903f"' : (aEarly < (aFull - 0.01) ? 'color="#cc0000"' : '')) + '>' + Math.round(aEarly * 1000) / 10 + '%</font>'],
                                        ['<<rolestarsTemplate>>', rolestars],
                                        ['<<enemyheroesTemplate>>', enemyheroesT],
                                        ['<<teamheroesTemplate>>', teamheroesT],
                                        ['<<nemesestemplate>>', nemesesT],
                                    ];
                                    let content = templateHeroInfoPopup.content;
                                    for (let rN = 0; rN < replaceText.length; rN++) content = content.replace(replaceText[rN][0], replaceText[rN][1]);

                                    return content;
                                }
                            });
                            $(items[i]).attr('poped', "done");
			})(heroname, choose);
                    }

                }

            },100)});
        }
		$scope.UpdateHeroInfoPopups = UpdateHeroInfoPopups;
		
       function UpdateHeroSpellsPopups() {

           const items = $(".spellPopup");
           for (var i = 0; i < items.length; i++)
                $(items[i]).popover('hide');
			AddHeroSpells($http, $scope, function(){ setTimeout(function(){
				Debug('UpdateHeroSpellPopups AddHeroSpells');

                const items = $(".spellPopup");
                for (let i = 0; i < items.length; i++) {

                    if (!($(items[i]).attr("poped"))) {
                        const heroname = $(items[i]).attr("heroname");
                        const herospell = $(items[i]).attr("herospell");
//console.log(herospell);
                        const spell = $scope.spells.heroes[heroname][herospell];
                        let title = '';
                        if (spell.ultimate) title += '<span class="label label-danger">ultimate</span> ';
						if (spell.piercespellimmunity) title += '<span class="label label-warning">pierce spell imm</span> ';
						if (spell.scepter) title += '<span class="label label-primary">scepter</span> ';
                        const content = '<table width="200px" style="background-color: transparent;"><tr><td>' +
                            '<div style="color: white;" align="middle"><img style="height: 25px; margin-bottom: 10px;" src="' + $scope.heroesJson[spell.hname].img + '"> ' + spell.hname + '<br>' +
                            spell.name + ' <img style="height: 25px;" src="' + spell.img + '">' + '<br>' +
                            '<br><small>' + spell.desc + '</small><br>' +
                            '</div></td></tr></table>';

                        const p = $(items[i]).popover({
                            html: true,
                            //container: 'body',
                            trigger: 'hover',
                            title: title,
                            content: content
                        });
                        $(items[i]).attr('poped', "done");
                    }

                }
				
			},0)});

        }
		$scope.UpdateHeroSpellsPopups = UpdateHeroSpellsPopups;
		

        function RecalculateTeamScores() {
			Debug('RecalculateTeamScores');
            UpdateLocation();
            for (var N = 0; N < $scope.positionStars.length; N++) {
                $scope.positionStars[N].starsEnemy = 0;
                $scope.positionStars[N].starsTeam = 0;
                $scope.positionStars[N].starsPick = 0;
                for (var aHN = 0; aHN < $scope.heroesEnemy.length; aHN++)
                    $scope.positionStars[N].starsEnemy += $scope.heroesEnemy[aHN].stars[$scope.positionStars[N].position];
                for (var aHN = 0; aHN < $scope.heroesTeam.length; aHN++)
                    $scope.positionStars[N].starsTeam += $scope.heroesTeam[aHN].stars[$scope.positionStars[N].position];
                //		if ($scope.selfHeroSelected != null) $scope.positionStars[N].starsPick += $scope.selfHeroSelected.stars[$scope.positionStars[N].position];
            }
			AddHeroesTimeAdv($scope, heroesLib, function(){
                const aWinTimeDataset = GetWinTimeDataset($scope.heroesEnemy, $scope.heroesTeam);

                const data_timechart = {
                    labels: aWinTimeDataset.labels,
                    datasets: [{
                        label: "My First dataset",
                        fillColor: "rgba(204,0,0,0.1)",
                        strokeColor: "rgba(204,0,0,1)",
                        pointColor: "rgba(204,0,0,1)",
                        data: aWinTimeDataset.enemyWin
                    }, {
                        label: "My Second dataset",
                        fillColor: "rgba(63,144,63,0.1)",
                        strokeColor: "rgba(63,144,63,1)",
                        pointColor: "rgba(63,144,63,1)",
                        data: aWinTimeDataset.teamWin
                    }]
                };

                const linegraphOptions = {
                    scaleLabel: "<%=' '+value%>",
                    pointDotRadius: 2,
                    scaleOverride: true,
                };
                for (let aKey in aWinTimeDataset.scales[aWinTimeDataset.usedScale])
					linegraphOptions[aKey] = aWinTimeDataset.scales[aWinTimeDataset.usedScale][aKey];

					
				//old picker stuff
				if (typeof(IsUltimatePicker)!='undefined' && IsUltimatePicker===true) {
					for (let aTabNr = 0; aTabNr < 3; aTabNr ++) {
						if (timewinGraph[aTabNr] == null) {
								var ctx_timechart = null;
								if ($("#timechartnp"+aTabNr).get(0))
									ctx_timechart = $("#timechartnp"+aTabNr).get(0).getContext("2d");
								if (ctx_timechart != null) {
									timewinGraph[aTabNr] = new Chart(ctx_timechart).Line(data_timechart, linegraphOptions);
									timewinScale = aWinTimeDataset.usedScale;
								}
						} else {
							if ($scope.show.showtabs[aTabNr]!='advcharts' || (aTabNr == 1 && !$scope.show.extended) || (aTabNr == 2 && (!$scope.show.extended || !$scope.show.extendedSecondary))) {
								timewinGraph[aTabNr].destroy();
								timewinGraph[aTabNr] = null;
							} else {
								if (timewinGraph[aTabNr].datasets[0].points.length != data_timechart.datasets[0].data.length || timewinScale != aWinTimeDataset.usedScale) {
									$('#timechartnp'+aTabNr).remove();
									$('#timechartcanvas'+aTabNr).append('<canvas id="timechartnp'+aTabNr+'" height="200" width="300"></canvas>');
									timewinGraph[aTabNr] = null;
									var ctx_timechart = null;
									if ($("#timechartnp"+aTabNr).get(0))
										ctx_timechart = $("#timechartnp"+aTabNr).get(0).getContext("2d");
									if (ctx_timechart != null) { 
										timewinGraph[aTabNr] = new Chart(ctx_timechart).Line(data_timechart, linegraphOptions);
									}
								} else {
									for (var N = 0; N < timewinGraph[aTabNr].datasets[0].points.length; N++) {
										timewinGraph[aTabNr].datasets[0].points[N].value = data_timechart.datasets[0].data[N];
										timewinGraph[aTabNr].datasets[1].points[N].value = data_timechart.datasets[1].data[N];
									}
									timewinGraph[aTabNr].update();
								}
								timewinScale = aWinTimeDataset.usedScale;
							}
						}
					}
				}
				else {
					if (timewinGraph[0] == null) {
						if ($scope.show.chartsUP) {
							var ctx_timechart = null;
							if ($("#timechart").get(0))
								ctx_timechart = $("#timechart").get(0).getContext("2d");
							if (ctx_timechart != null) {
								timewinGraph[0] = new Chart(ctx_timechart).Line(data_timechart, linegraphOptions);
								timewinScale = aWinTimeDataset.usedScale;
							}
						}
					} else {
						if (!$scope.show.chartsUP) {
							timewinGraph[0].destroy();
							timewinGraph[0] = null;
						} else {
							if (timewinGraph[0].datasets[0].points.length != data_timechart.datasets[0].data.length || timewinScale != aWinTimeDataset.usedScale) {
								$('#timechart').remove();
								$('#timechartcanvas').append('<canvas class="timechart" id="timechart" height="160" width="190"></canvas>');
								var ctx_timechart = null;
								if ($("#timechart").get(0))
									ctx_timechart = $("#timechart").get(0).getContext("2d");
								if (ctx_timechart != null) {
									timewinGraph[0] = new Chart(ctx_timechart).Line(data_timechart, linegraphOptions);
								}
							} else {
								for (var N = 0; N < timewinGraph[0].datasets[0].points.length; N++) {
									timewinGraph[0].datasets[0].points[N].value = data_timechart.datasets[0].data[N];
									timewinGraph[0].datasets[1].points[N].value = data_timechart.datasets[1].data[N];
								}
								timewinGraph[0].update();
							}
							timewinScale = aWinTimeDataset.usedScale;
						}
					}
				}

			});

            let selected_enemy = "";
            let selected_team = "";
            const header = ['Durability', 'Mobility', 'Initiation', 'Disables', 'Nukes', 'Push', 'Carry'];
            if (typeof(localizedHeroInfoPopup) == 'undefined')
				var templateHeroInfoPopup = {
					roles: {}
				};
			else var templateHeroInfoPopup = localizedHeroInfoPopup;
			if ('Durable' in templateHeroInfoPopup.roles) header[0] = templateHeroInfoPopup.roles.Durable;
			if ('Escape' in templateHeroInfoPopup.roles) header[1] = templateHeroInfoPopup.roles.Escape;
			if ('Initiator' in templateHeroInfoPopup.roles) header[2] = templateHeroInfoPopup.roles.Initiator;
			if ('Disabler' in templateHeroInfoPopup.roles) header[3] = templateHeroInfoPopup.roles.Disabler;
			if ('Nuker' in templateHeroInfoPopup.roles) header[4] = templateHeroInfoPopup.roles.Nuker;
			if ('Pusher' in templateHeroInfoPopup.roles) header[5] = templateHeroInfoPopup.roles.Pusher;
			if ('RoleCarry' in templateHeroInfoPopup.roles) header[6] = templateHeroInfoPopup.roles.RoleCarry;
            const composition_enemy = [0 /*0-Durability*/, 0 /*1-Mobility*/, 0 /*2-Initiation*/, 0 /*3-Disables*/, 0 /*4-Nukes*/, 0 /*5-Push*/, 0 /*6-Carry*/];
            for (var N = 0; N < $scope.heroesEnemy.length; N++) {
                composition_enemy[0] += $scope.heroesEnemy[N].stars.Durable ? $scope.heroesEnemy[N].stars.Durable : 0;
                composition_enemy[1] += $scope.heroesEnemy[N].stars.Escape ? $scope.heroesEnemy[N].stars.Escape : 0;
                composition_enemy[2] += $scope.heroesEnemy[N].stars.Initiator ? $scope.heroesEnemy[N].stars.Initiator : 0;
                composition_enemy[3] += $scope.heroesEnemy[N].stars.Disabler ? $scope.heroesEnemy[N].stars.Disabler : 0;
                composition_enemy[4] += $scope.heroesEnemy[N].stars.Nuker ? $scope.heroesEnemy[N].stars.Nuker : 0;
                composition_enemy[5] += $scope.heroesEnemy[N].stars.Pusher ? $scope.heroesEnemy[N].stars.Pusher : 0;
                composition_enemy[6] += $scope.heroesEnemy[N].stars.RoleCarry ? $scope.heroesEnemy[N].stars.RoleCarry : 0;
                selected_enemy += $scope.heroesEnemy[N].name;
            }


            const composition_team = [0 /*0-Durability*/, 0 /*1-Mobility*/, 0 /*2-Initiation*/, 0 /*3-Disables*/, 0 /*4-Nukes*/, 0 /*5-Push*/, 0 /*6-Carry*/];
            for (var N = 0; N < $scope.heroesTeam.length; N++) {
                composition_team[0] += $scope.heroesTeam[N].stars.Durable ? $scope.heroesTeam[N].stars.Durable : 0;
                composition_team[1] += $scope.heroesTeam[N].stars.Escape ? $scope.heroesTeam[N].stars.Escape : 0;
                composition_team[2] += $scope.heroesTeam[N].stars.Initiator ? $scope.heroesTeam[N].stars.Initiator : 0;
                composition_team[3] += $scope.heroesTeam[N].stars.Disabler ? $scope.heroesTeam[N].stars.Disabler : 0;
                composition_team[4] += $scope.heroesTeam[N].stars.Nuker ? $scope.heroesTeam[N].stars.Nuker : 0;
                composition_team[5] += $scope.heroesTeam[N].stars.Pusher ? $scope.heroesTeam[N].stars.Pusher : 0;
                composition_team[6] += $scope.heroesTeam[N].stars.RoleCarry ? $scope.heroesTeam[N].stars.RoleCarry : 0;
                selected_team += $scope.heroesTeam[N].name;
            }


            const data_teaminfo = {
                labels: header,
                datasets: [{
                    label: "Enemy Team",
                    fillColor: "rgba(204,0,0,0.2)",
                    pointColor: "rgba(204,0,0,1)",
                    data: composition_enemy,
                }, {
                    label: "My Team",
                    fillColor: "rgba(119,179,0,0.2)",
                    pointColor: "rgba(119,179,0,1)",
                    data: composition_team,
                }]
            };


            //old picker
            var ctx_enemy = null;
			if ($("#radarchart-teaminfo").get(0)) {
				ctx_enemy = $("#radarchart-teaminfo").get(0).getContext("2d");
			}
			if (ctx_enemy == null) {
				if (compositionGraph[0] != null && (!$scope.show.chartsUP || ($scope.heroesEnemy.length == 0 && $scope.heroesTeam.length == 0))) {
					compositionGraph[0].destroy();
					compositionGraph[0] = null;
				}
			}
            else if (compositionGraph[0] == null) {
				if ($scope.show.chartsUP) {
					compositionGraph[0] = new Chart(ctx_enemy).Radar(data_teaminfo, {
						scaleLineColor: "rgba(255,255,255,.2)",
						scaleShowLine: true,
						pointDot: false,
					});
				}
            } else {
				if (!$scope.show.chartsUP) {
					compositionGraph[0].destroy();
					compositionGraph[0] = null;
				} else {
					for (var N = 0; N < compositionGraph[0].datasets[0].points.length; N++) {
						compositionGraph[0].datasets[0].points[N].value = data_teaminfo.datasets[0].data[N];
						compositionGraph[0].datasets[1].points[N].value = data_teaminfo.datasets[1].data[N];
					}
					compositionGraph[0].update();
				}
            }
			
			//new picker
			for (var aTabNr = 0; aTabNr < 3; aTabNr ++) {
				var ctx_enemy = null;
				if ($("#radarchart-teaminfo"+aTabNr).get(0)) {
					ctx_enemy = $("#radarchart-teaminfo"+aTabNr).get(0).getContext("2d");
				}
				if (ctx_enemy == null) {
					if (compositionGraph[aTabNr] != null && (($scope.show.showtabs[aTabNr]!='advcharts' || (aTabNr == 1 && !$scope.show.extended) || (aTabNr == 2 && (!$scope.show.extended || !$scope.show.extendedSecondary))) || ($scope.heroesEnemy.length == 0 && $scope.heroesTeam.length == 0))) {
						compositionGraph[aTabNr].destroy();
						compositionGraph[aTabNr] = null;
					}
				}
				else if (compositionGraph[aTabNr] == null) {
					if ($scope.show.showtabs[aTabNr]=='advcharts') {
						compositionGraph[aTabNr] = new Chart(ctx_enemy).Radar(data_teaminfo, {
							scaleLineColor: "rgba(255,255,255,.2)",
							scaleShowLine: true,
							pointDot: false,
						});
					}
				} else {
					if ($scope.show.showtabs[aTabNr]!='advcharts' || (aTabNr == 1 && !$scope.show.extended) || (aTabNr == 2 && (!$scope.show.extended || !$scope.show.extendedSecondary))) {
//					if ($scope.show.showtabs[aTabNr]!='advcharts') {
						compositionGraph[aTabNr].destroy();
						compositionGraph[aTabNr] = null;
					} else {
						for (var N = 0; N < compositionGraph[aTabNr].datasets[0].points.length; N++) {
							compositionGraph[aTabNr].datasets[0].points[N].value = data_teaminfo.datasets[0].data[N];
							compositionGraph[aTabNr].datasets[1].points[N].value = data_teaminfo.datasets[1].data[N];
						}
						compositionGraph[aTabNr].update();
					}
				}
			}
        }

        function UpdateLocation() {
            const arrHeroes = [];
            if ($scope.show.cmmode) arrHeroes.push('M_cm');
            for (var N = 0; N < $scope.heroesEnemy.length; N++)
                arrHeroes.push('E_' + $scope.heroesEnemy[N].name.replace(/ /g, '_'));
            for (var N = 0; N < $scope.heroesTeam.length; N++)
                arrHeroes.push('T_' + $scope.heroesTeam[N].name.replace(/ /g, '_'));
			for (var N = 0; N < $scope.banEnemy.length; N++)
                arrHeroes.push('BE_' + $scope.banEnemy[N].name.replace(/ /g, '_'));
            for (var N = 0; N < $scope.banTeam.length; N++)
                arrHeroes.push('BT_' + $scope.banTeam[N].name.replace(/ /g, '_'));
            for (var N = 0; N < $scope.banAll.length; N++) {
                if ($scope.show.cmmode && $scope.banAll[N].name in $scope.CMUnavailable) continue;
                arrHeroes.push('BA_' + $scope.banAll[N].name.replace(/ /g, '_'));
            }
			for (var N = 0; N < $scope.show.showtabs.length; N++) {
				if ((N == 0 && $scope.show.showtabs[N] != 'coreutil') || (N == 1 && $scope.show.extended) || (N == 2 && $scope.show.extended && $scope.show.extendedSecondary))
					arrHeroes.push('S_'+N+'_'+$scope.show.showtabs[N]);
			}
			if (arrHeroes.length == 0) {
				if ($location.path() != '') $location.path('No_Heroes');
			} else
				$location.path(arrHeroes.join('/'));
        }


		$scope.UpdateTutorialPopups = UpdateTutorialPopups;
		
		$scope.UpdateTutorialPopupsAsync = function() {
            setTimeout(function() {
               UpdateTutorialPopupsNow();
            }, 10);
        }
		

        $scope.SearchMatchNr = function() {
            if (typeof($scope.searchText) == 'undefined' || $scope.searchText == '')
                return $scope.heroes.length;
            let nr = 0;
            const lowSearchText = $scope.searchText.toLowerCase();
            for (let N = 0; N < $scope.heroes.length; N++)
                if (HeroIsSearched($scope.heroes[N], lowSearchText))
                    nr++;
            return nr;
        }
        $scope.HeroIsSearched = function(hname) {
            if (typeof($scope.searchText) == 'undefined' || $scope.searchText == '')
                return true;
            return HeroIsSearched($scope.heroesJson[hname], $scope.searchText.toLowerCase());
        }
		
		$scope.ClearShowOnly = function() {
			for (let rN = 0; rN < $scope.availableRoles.length; rN++)
				$scope.show['only'+$scope.availableRoles[rN].role] = 'no';
		}
		
		$scope.UpdateAutopicker = function () {
			if ($scope.show.autopicker.use == false) return;

			$http.get('/api/autopicker/get').
			then(function (success){
                const data = success.data, status = success.status, headers = success.headers, config = success.config;
                if ('active' in data && data.active ===true) {
					if ('error' in data && data.error === true) {
						$scope.show.autopicker.active = false;
						if ('errorId' in data) $scope.show.autopicker.error = data.errorId;
						else $scope.show.autopicker.error = 'UNKNOWN';
					} else {
						$scope.show.autopicker.active = true;
						$scope.show.autopicker.error = 'NONE';
						if ('info' in data) {

                            let aUpdated = false;
                            if ('isRadiant' in data.info && $scope.show.teamRadiant != data.info.isRadiant) {
								$scope.show.teamRadiant = data.info.isRadiant;
								aUpdated = true;
							}

							if ('radiantPick' in data.info) {
                                let aRadiantTeam = $scope.heroesTeam;
                                if (!$scope.show.teamRadiant) aRadiantTeam = $scope.heroesEnemy;
								for (var hN = 0; hN < aRadiantTeam.length; hN++) {
									var aFound = false;
									for (var hdN = 0; hdN < data.info.radiantPick.length; hdN++) if (data.info.radiantPick[hdN] == aRadiantTeam[hN].vid) { aFound = true; break; }
									if (!aFound) {
										RemoveHeroesNameNoRecalculate(aRadiantTeam[hN].name);
										aUpdated = true;
									}
								}
								
								for (var hdN = 0; hdN < data.info.radiantPick.length; hdN++) {
									var aFound = false;
									for (var hN = 0; hN < aRadiantTeam.length; hN++) if (data.info.radiantPick[hdN] == aRadiantTeam[hN].vid) { aFound = true; break; }
									if (!aFound) {
										if (data.info.radiantPick[hdN] in $scope.valveIds) {
											if ($scope.show.teamRadiant) AddHeroes($scope.valveIds[data.info.radiantPick[hdN]].name, false);
											else AddHeroes($scope.valveIds[data.info.radiantPick[hdN]].name, true);
											aUpdated = true;
										}
									}
								}
							}
							if ('direPick' in data.info) {
                                let aDireTeam = $scope.heroesTeam;
                                if ($scope.show.teamRadiant) aDireTeam = $scope.heroesEnemy;
								for (var hN = 0; hN < aDireTeam.length; hN++) {
									var aFound = false;
									for (var hdN = 0; hdN < data.info.direPick.length; hdN++) if (data.info.direPick[hdN] == aDireTeam[hN].vid) { aFound = true; break; }
									if (!aFound) {
										RemoveHeroesNameNoRecalculate(aDireTeam[hN].name);
										aUpdated = true;
									}
								}
								
								for (var hdN = 0; hdN < data.info.direPick.length; hdN++) {
									var aFound = false;
									for (var hN = 0; hN < aDireTeam.length; hN++) if (data.info.direPick[hdN] == aDireTeam[hN].vid) { aFound = true; break; }
									if (!aFound) {
										if (data.info.direPick[hdN] in $scope.valveIds) {
											if ($scope.show.teamRadiant) AddHeroes($scope.valveIds[data.info.direPick[hdN]].name, true);
											else AddHeroes($scope.valveIds[data.info.direPick[hdN]].name, false);
											aUpdated = true;
										}
									}
								}
							}
							if ('radiantBan' in data.info) {
                                let aRadiantBan = $scope.banTeam;
                                if (!$scope.show.teamRadiant) aRadiantBan = $scope.banEnemy;
								for (var hN = 0; hN < aRadiantBan.length; hN++) {
									var aFound = false;
									for (var hdN = 0; hdN < data.info.radiantBan.length; hdN++) if (data.info.radiantBan[hdN] == aRadiantBan[hN].vid) { aFound = true; break; }
									if (!aFound) {
										RemoveHeroesNameNoRecalculate(aRadiantBan[hN].name);
										aUpdated = true;
									}
								}
								
								for (var hdN = 0; hdN < data.info.radiantBan.length; hdN++) {
									var aFound = false;
									for (var hN = 0; hN < aRadiantBan.length; hN++) if (data.info.radiantBan[hdN] == aRadiantBan[hN].vid) { aFound = true; break; }
									if (!aFound) {
										if (data.info.radiantBan[hdN] in $scope.valveIds) {
											if ($scope.show.teamRadiant) BanHeroes($scope.valveIds[data.info.radiantBan[hdN]].name, false);
											else BanHeroes($scope.valveIds[data.info.radiantBan[hdN]].name, true);
											aUpdated = true;
										}
									}
								}
								if (data.info.radiantBan.length != 0) $scope.show.cmmode = true;
							}
							if ('direBan' in data.info) {
                                let aDireBan = $scope.banTeam;
                                if ($scope.show.teamRadiant) aDireBan = $scope.banEnemy;
								for (var hN = 0; hN < aDireBan.length; hN++) {
									var aFound = false;
									for (var hdN = 0; hdN < data.info.direBan.length; hdN++) if (data.info.direBan[hdN] == aDireBan[hN].vid) { aFound = true; break; }
									if (!aFound) {
										RemoveHeroesNameNoRecalculate(aDireBan[hN].name);
										aUpdated = true;
									}
								}
								
								for (var hdN = 0; hdN < data.info.direBan.length; hdN++) {
									var aFound = false;
									for (var hN = 0; hN < aDireBan.length; hN++) if (data.info.direBan[hdN] == aDireBan[hN].vid) { aFound = true; break; }
									if (!aFound) {
										if (data.info.direBan[hdN] in $scope.valveIds) {
											if ($scope.show.teamRadiant) BanHeroes($scope.valveIds[data.info.direBan[hdN]].name, true);
											else BanHeroes($scope.valveIds[data.info.direBan[hdN]].name, false);
											aUpdated = true;
										}
									}
								}
								if (data.info.direBan.length != 0) $scope.show.cmmode = true;
							}
							if ('unavailableHeroes' in data.info) {
                                const aBanAll = $scope.banAll;
                                for (var hN = 0; hN < aBanAll.length; hN++) {
                                                                        var aFound = false;
                                                                        for (var hdN = 0; hdN < data.info.unavailableHeroes.length; hdN++) if (data.info.unavailableHeroes[hdN] == aBanAll[hN].vid) { aFound = true; break; }
                                                                        if (!aFound) {
                                                                                RemoveHeroesNameNoRecalculate(aBanAll[hN].name);
                                                                                aUpdated = true;
                                                                        }
                                                                }
                                                                for (var hdN = 0; hdN < data.info.unavailableHeroes.length; hdN++) {
                                                                        var aFound = false;
                                                                        for (var hN = 0; hN < aBanAll.length; hN++) if (data.info.unavailableHeroes[hdN] == aBanAll[hN].vid) { aFound = true; break; }
                                                                        if (!aFound) {
                                                                                if (data.info.unavailableHeroes[hdN] in $scope.valveIds) {
                                                                                        UnavailableHeroes($scope.valveIds[data.info.unavailableHeroes[hdN]].name);
                                                                                        aUpdated = true;
                                                                                }
                                                                        }
                                                                }
							}
							
							
							if (aUpdated) {
								RecalculateAfterSelection();
							}
						}
					}
				}else {
					$scope.show.autopicker.active = false;
					$scope.show.autopicker.error = 'NONE';
				}
				if ('energy' in data && 'error' in data && data.error === false)
					$scope.show.autopicker.energy = data.energy;
				if ('lastUpdate' in data && data.lastUpdate < 120) $scope.AutopickerUpdateOften = true;
				else $scope.AutopickerUpdateOften = false;
				$scope.UpdateTutorialPopups();
			}, function(err) {});
		}
		
		$scope.StartUpdateAutopicker = function () {
			if ($scope.beta===false) return;
			$scope.AutopickerUpdateOften = false;
            let APCounter = 0;
            setInterval(function() {
				if (
					($scope.AutopickerUpdateOften && APCounter % 5 == 1) || 
					APCounter % 20 == 1 ||
					(APCounter <= 30 && APCounter % 5 == 1)
				)
					$scope.UpdateAutopicker();
				APCounter++;
			}, 1000);
			$scope.UpdateAutopicker();
		}
		
		$scope.openCompletepPicker = function() {
			location.href = location.href.replace('/counterpick', '/herocounter')
		}

    }

    $scope.loaded = {};

    $scope.log = function(msg) {
        console.log(msg)
    };

    $scope.adsBlocked = (typeof(AdsAreShown) == 'undefined');

    $scope.beta = false;
    if (gup('beta') == 'true') $scope.beta = true;
    if (gup('beta') == 'autopicker') $scope.beta = true;

    $scope.searchText = '';
    $scope.Math = Math;
    $scope.steamBrowser = navigator.userAgent.indexOf('Valve Steam GameOverlay') != -1;
    $scope.overwolfBrowser = gup('overwolflogin') == 'true';


    $scope.showInitialScreen = true;
    $scope.firstScreen = true;

    $scope.show = {
		teamRadiant: false,
		skillLevelN: 1,
		cmmode: false,
        bonusearly: 'no',
        bonusmid: 'no',
        bonuslate: 'no',
		bonuspersonal: 'no',
        winratemode: 'syn', //in ultimatepicker overwritten by cookie

		onlydisablers: 'no', //for old picker
		onlyinitiators: 'no', //for old picker
		onlygankers: 'no', //for old picker
		onlycounterpushers: 'no', //for old picker
		onlypushers: 'no', //for old picker
		onlyfavorites: 'disabled',
		nodisliked: 'disabled',
		personalformula: 'disabled',
	extroles: 'no', //in ultimatepicker overwritten by cookie
        suggestions: 'lanes',
		showtabs: ['coreutil', 'advcharts', 'matchups'],
        tutorial: false,
		help: {
			bans: false
		},
        //tips: true,
		optionsUP: false,
		gridHeroesUP: false,
		chartsUP: typeof(IsUltimatePicker) == 'undefined',
        heroPool: (typeof($cookieStore.get('showHeroPool')) == 'undefined' ? 'grid' : $cookieStore.get('showHeroPool')),
		pleaseLogInPopup: false,
		usePASPopup: false,
		extended: false,
		extendedSecondary: false,
		searchedHero: null,
		map: {
			height: 300,
			width: 300
		},
		autopicker: {
			active: false,
			error: 'NONE',
			use: true
		},
		toggle: function(key) {
                        if ($scope.show[key] == 'yes') $scope.show[key] = 'no';
                        else $scope.show[key] = 'yes';
			switch (key) {
			case 'extroles': $cookieStore.put('showExtendedRoles', $scope.show[key],{expires: new Date(now.getFullYear()+2, now.getMonth(), now.getDate())}); break;
			}
                },
		setKey: function(key, value) {
			$scope.show[key] = value;
                        switch (key) {
                        //case 'winratemode': $cookieStore.put('winrateMode', value); break;
                        }
		}
	};
	if (typeof(IsBTG) != 'undefined') {
		 $scope.show.optionsUP = true;
	}
	if (typeof(IsUltimatePicker) != 'undefined') {
		$scope.UltimatePicker = {};
		$scope.show.extroles = typeof($cookieStore.get('showExtendedRoles')) == 'undefined' ? 'no' : $cookieStore.get('showExtendedRoles');
		//$scope.show.winratemode = typeof($cookieStore.get('winrateMode')) == 'undefined' ? 'syn' : $cookieStore.get('winrateMode');
        }
	if (typeof(IsCompletePicker) != 'undefined')
		$scope.CompletePicker = {};


    $scope.skillLevelN = -1; //todo

    $scope.heroesEnemy = [];
    $scope.heroesTeam = [];
	$scope.lanes = {
		'SafelaneCarry': {heroes: []},
		'LaneSupport': {heroes: []},
		'Mid': {heroes: []},
		'Offlane': {heroes: []},
		'Jungler': {heroes: []},
		'Roamer': {heroes: []}
	}
	
	$scope.banEnemy = [];
    $scope.banTeam = [];
	$scope.banAll = [];
	$scope.plusMinus = {};
	$scope.heroesPicked = {};
	$scope.heroesSearched = [];
    $scope.heroesEnemyTips = {};

    $scope.enemyCounter = 0;
    $scope.teamCounter = 0;
    $scope.enemySynergy = 0;
    $scope.teamSynergy = 0;

    var timewinGraph = [null, null, null];
    var timewinScale = null;
    var compositionGraph = [null, null, null];

    //$scope.SkillLevels = ["Very High", "High", "Normal" ];
    //$cookieStore.put('skillLevel', $scope.SkillLevels[0]);

	var now = new Date(), expCookie = new Date(now.getFullYear()+2, now.getMonth(), now.getDate());

    AddHeroesInfo($scope, heroesLib, function() {
	
           
		for (let N = 0; N < $scope.heroes.length; N++)
			$scope.heroesPicked[$scope.heroes[N].name] = {pickedTeam: false, pickedEnemy: false, bannedTeam: false, bannedEnemy: false, removedPool: false};
			
		AddPersonalSettings($http, $scope, function() {

			//The please log in popup
            let nextLogInPopup = $cookieStore.get('nextLogInPopup');
            if (nextLogInPopup != -1) {
				if (!$scope.loggedIn) {
					if (typeof(nextLogInPopup) == 'undefined' || nextLogInPopup == 0) {
						nextLogInPopup = +new Date() + 1000 * 24 * 3600 * 7;
						$cookieStore.put('nextLogInPopup', nextLogInPopup,{expires: expCookie})
					}
					
					if (nextLogInPopup < +new Date())
						$scope.show.pleaseLogInPopup = true;
						
					$scope.LogInPopupClose = function(howlong){
                        let howLongNewTs = +new Date();
                        if (howlong == '1day') howLongNewTs += 1000 * 24 * 3600;
						if (howlong == '1week') howLongNewTs += 1000 * 24 * 3600 * 7;
						if (howlong == '1month') howLongNewTs += 1000 * 24 * 3600 * 31;
						if (howlong == '1year') howLongNewTs += 1000 * 24 * 3600 * 356;
						if (howlong == '4ever') howLongNewTs = -1;
						
						if (howLongNewTs == -1 || howLongNewTs > nextLogInPopup) {
							nextLogInPopup = howLongNewTs;
							$cookieStore.put('nextLogInPopup', nextLogInPopup,{expires: expCookie});
						}
						$scope.show.pleaseLogInPopup = false;
					}
				} else {
					$cookieStore.put('nextLogInPopup', 0,{expires: expCookie})
				}
			}
			//end please log in popup
			
			//The use PAS popup
            let usePASPopup = $cookieStore.get('usePASPopup');
            if (usePASPopup != -1) {
					if (typeof(usePASPopup) == 'undefined') {
						usePASPopup = 0;
					}
					
					if (usePASPopup < +new Date())
						$scope.show.usePASPopup = true;
						
					$scope.TryPersonalPopupClose = function(howlong){
                        let howLongNewTs = +new Date();
                        if (howlong == 'next') howLongNewTs += 1000 * 24 * 3600 * 3;
						if (howlong == '1day') howLongNewTs += 1000 * 24 * 3600;
						if (howlong == '1week') howLongNewTs += 1000 * 24 * 3600 * 7;
						if (howlong == '1month') howLongNewTs += 1000 * 24 * 3600 * 31;
						if (howlong == '1year') howLongNewTs += 1000 * 24 * 3600 * 356;
						if (howlong == '4ever') howLongNewTs = -1;
						
						if (howLongNewTs == -1 || howLongNewTs > usePASPopup) {
							usePASPopup = howLongNewTs;
							$cookieStore.put('usePASPopup', usePASPopup,{expires: new Date(now.getFullYear()+2, now.getMonth(), now.getDate())});
						}
						$scope.show.usePASPopup = false;
					}
			}
			//end use PAS popup
			
			if (!$scope.loggedIn) return;

			function WatchSetting(watch, setting, defaultVal, set) {
                let savedSkill = defaultVal;
                if (setting in $scope.settings && savedSkill != $scope.settings[setting]) {
					savedSkill = $scope.settings[setting];
					set($scope.settings[setting]);
				}
				$scope.$watch(watch, function(newSkill) {
					if (savedSkill == newSkill) return;
					savedSkill = newSkill;
					$scope.settings[setting] = savedSkill;
                    const saveObj = {general: {}};
                    saveObj.general[setting] = savedSkill;
					SaveSetting($http, saveObj);
				});
			}
			WatchSetting('skillLevel', 'userSkillLevel', $scope.skillLevel, function(val){$scope.skillLevel = val});
			WatchSetting('show.gridHeroesUP', 'pickeruGridHeroesUP', false, function(val){$scope.show.gridHeroesUP = val});
			WatchSetting('show.optionsUP', 'pickeruOptionsUP', false, function(val){$scope.show.optionsUP = val});
			WatchSetting('show.chartsUP', 'pickeruChartsUP', false, function(val){$scope.show.chartsUP = val});
			if ($scope.personalEnabled)
				WatchSetting('show.bonuspersonal', 'pickeruBonusPersonal', $scope.show.bonuspersonal, function(val){$scope.show.bonuspersonal = val});

			$scope.RecalculateUltimatePickerScrollsAsync();
			
			$scope.StartUpdateAutopicker();
			
			UpdateTutorialPopups();
		});
        if ($scope.show.heroPool == 'grid')
            $scope.heroes.sort(function(a, b) {
                return a.heropedia - b.heropedia;
            });
        else if ($scope.show.heroPool == 'list')
            $scope.heroes.sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });

		$scope.ProcessSearch('start');
			
        InitHeroesSuggested();

        $scope.skillLevel = $scope.SkillLevels[2];//(typeof($cookieStore.get('skillLevel')) == 'undefined' ? $scope.SkillLevels[0] : $cookieStore.get('skillLevel'));

        GenerateFromPath();

        RecalculateAfterSelection();

        UpdateTutorialPopups();
		
    });
}]);

pickerApp.controller('HeroTimeAdvCtrl', ['$scope', '$http', 'heroes', function($scope, $http, heroesLib) {
    $scope.skillSelected = 0;
    $scope.heroesGraph = [];
    $scope.times = ['a5', 'a10', 'a15', 'a20', 'a25', 'a30', 'a35', 'a40', 'a45'];
    const aColumns = [
        ['x', 5, 10, 15, 20, 25, 30, 35, 40, 45]
    ];
    let chart = null;
    AddHeroesInfo($scope, heroesLib, function() {
		AddHeroesTimeAdv($scope, heroesLib, function() {
			for (var hN = 0; hN < $scope.heroes.length; hN++) {
                const aHero = {
                    name: $scope.heroes[hN].name,
                    adv: [
                        [],
                        [],
                        []
                    ],
                    ind: hN
                };
                for (let sN = 0; sN < $scope.SkillLevels.length; sN++)
					for (let tN = 0; tN < $scope.times.length; tN++)
						aHero.adv[sN].push($scope.heroes[hN].timewin[sN][$scope.times[tN]]);
				$scope.heroesGraph.push(aHero);

			}
			$scope.heroesGraph.sort(function(a, b) {
				return a.name.localeCompare(b.name);
			});
			for (var hN = 0; hN < $scope.heroesGraph.length; hN++) {
				aColumns.push([$scope.heroesGraph[hN].name].concat($scope.heroesGraph[hN].adv[$scope.skillSelected]));
			}
			chart = c3.generate({
				bindto: '#chart',
				data: {
					x: 'x',
					columns: aColumns,
					type: 'spline'
				},
				size: {
					width: 1170,
					height: 600
				},
				tooltip: {
					grouped: false,
					format: {
						title: function(d) {
							return '<span style="color: black;"> minute ' + d + '</span>';
						},
						name: function(name, ratio, id, index) {
							return '<span style="color: black;width: 80px;">' + name + '</span>';
						},
						value: function(value, ratio, id) {
							return '<span style="color: black;width: 40px;">' + value + '</span>';
						}
					}
				},
				axis: {
					y: {
						tick: {
							format: function(d) {
								return Math.round(d * 100) / 100;
							}
						}
					}
				}
			});
		});
    });
    $scope.ShowAll = function() {
        if (chart == null) return;
        chart.show();
    }

    $scope.HideAll = function() {
        if (chart == null) return;
        chart.hide();
    }

    $scope.LoadSkillData = function(skill) {
        if (chart == null) return;
        $scope.skillSelected = skill;
        const aColumns = [
            ['x', 5, 10, 15, 20, 25, 30, 35, 40, 45]
        ];
        for (let hN = 0; hN < $scope.heroesGraph.length; hN++) {
            aColumns.push([$scope.heroesGraph[hN].name].concat($scope.heroesGraph[hN].adv[$scope.skillSelected]));
        }
        chart.load({
            columns: aColumns
        });
    }

}]);

pickerApp.controller('PubMetaCtrl', ['$scope', '$cookieStore', '$location', '$rootScope', '$http', 'heroes', function($scope, $cookieStore, $location, $rootScope, $http, heroesLib) {

    $scope.log = function(msg) {
        console.log(msg)
    };

    const game_parts = [{
        early: ['pearly'],
        mid: ['pmid'],
        late: ['plate'],
        full: ['pfull']
    }, {
        early: ['pearly'],
        mid: ['pmid'],
        late: ['plate'],
        full: ['pfull']
    }, {
        early: ['pearly'],
        mid: ['pmid'],
        late: ['plate'],
        full: ['pfull']
    },];

    $scope.RecalculateAfterSelection = function() {
        if (typeof(SingleMeta)!='undefined') {
            var timewins1 = $scope.herotimeadvall[0].timewins;
            var timewins2 = $scope.herotimeadvall[0].timewins;
        } else {
            $location.path('v1_' + $scope.v1 + '/' + 'v2_' + $scope.v2);
            for (var N = 0; N < $scope.herotimeadvall.length; N++) {
                if ($scope.herotimeadvall[N].map_version == $scope.v1) {
                    var timewins1 = $scope.herotimeadvall[N].timewins;
					$scope.date1 = $scope.herotimeadvall[N].timewinLastUpdate;
                }
                if ($scope.herotimeadvall[N].map_version == $scope.v2) {
                    var timewins2 = $scope.herotimeadvall[N].timewins;
					$scope.date2 = $scope.herotimeadvall[N].timewinLastUpdate;
                }
            }
        }

        $scope.heroPower = [];
		for (let hName in timewins1[0]) {

            const aHero = {
                name: hName,
                power: [],
                powercmp: [],
                powerdif: [],
                img: $scope.heroesJson[hName].imgsmall
            };

            var usedTimewins = timewins1;
            var usedPower = 'power';
            for (var aLvlN = 0; aLvlN < $scope.SkillLevels.length; aLvlN++) {
                var aLevelInfo = {}
                for (var aGamePart in game_parts[aLvlN]) {
                    var aScore = 0;
                    var aScoreGames = 0;
                    for (var aMinN = 0; aMinN < game_parts[aLvlN][aGamePart].length; aMinN++) {
                        var aGameMin = game_parts[aLvlN][aGamePart][aMinN];
                        const aSmallSampleKey = 'f_' + game_parts[aLvlN][aGamePart][aMinN];
                        if (aSmallSampleKey in usedTimewins[aLvlN][hName] && usedTimewins[aLvlN][hName][aSmallSampleKey])
                            $scope.smallsample[aLvlN + '_' + hName + '_' + game_parts[aLvlN][aGamePart][aMinN]] = true;
                        if (hName in usedTimewins[aLvlN])
                            aScore += usedTimewins[aLvlN][hName][aGameMin];
                        aScoreGames++;
                    }
                    aScore /= aScoreGames;
                    aLevelInfo[aGamePart] = Math.round(aScore * 1000) / 10;
                }
                aHero[usedPower].push(aLevelInfo);
            }
            var average = {};
            var deviation = {};
            for (var aGamePart in game_parts[0]) {
                average[aGamePart] = 0;
                deviation[aGamePart] = 0;
                for (var aLvlN = 0; aLvlN < $scope.SkillLevels.length; aLvlN++)
                    average[aGamePart] += aHero[usedPower][aLvlN][aGamePart];
                average[aGamePart] /= $scope.SkillLevels.length;
                for (var aLvlN = 0; aLvlN < $scope.SkillLevels.length; aLvlN++)
                    deviation[aGamePart] += Math.pow(average[aGamePart] - aHero.power[aLvlN][aGamePart], 2);
                average[aGamePart] = Math.round(average[aGamePart] * 10) / 10;
                deviation[aGamePart] = Math.round(Math.sqrt(deviation[aGamePart]) * 10) / 10;
            }
            aHero[usedPower].push(average);
            aHero[usedPower].push(deviation);
            //copy paste above
            var usedTimewins = timewins2;
            var usedPower = 'powercmp';
            for (var aLvlN = 0; aLvlN < $scope.SkillLevels.length; aLvlN++) {
                var aLevelInfo = {}
                for (var aGamePart in game_parts[aLvlN]) {
                    var aScore = 0;
                    var aScoreGames = 0;
                    for (var aMinN = 0; aMinN < game_parts[aLvlN][aGamePart].length; aMinN++) {
                        var aGameMin = game_parts[aLvlN][aGamePart][aMinN];
                        const aGameNr = 's' + game_parts[aLvlN][aGamePart][aMinN].substr(1);
                        if (hName in usedTimewins[aLvlN])
                            aScore += usedTimewins[aLvlN][hName][aGameMin];
                        aScoreGames++;
                    }
                    aScore /= aScoreGames;
                    aLevelInfo[aGamePart] = Math.round(aScore * 1000) / 10;
                }
                aHero[usedPower].push(aLevelInfo);
            }
            var average = {};
            var deviation = {};
            for (var aGamePart in game_parts[0]) {
                average[aGamePart] = 0;
                deviation[aGamePart] = 0;
                for (var aLvlN = 0; aLvlN < $scope.SkillLevels.length; aLvlN++)
                    average[aGamePart] += aHero[usedPower][aLvlN][aGamePart];
                average[aGamePart] /= $scope.SkillLevels.length;
                for (var aLvlN = 0; aLvlN < $scope.SkillLevels.length; aLvlN++)
                    deviation[aGamePart] += Math.pow(average[aGamePart] - aHero.power[aLvlN][aGamePart], 2);
                average[aGamePart] = Math.round(average[aGamePart] * 10) / 10;
                deviation[aGamePart] = Math.round(Math.sqrt(deviation[aGamePart]) * 10) / 10;
            }
            aHero[usedPower].push(average);
            aHero[usedPower].push(deviation);
            //end copy paste	


            for (var N = 0; N < aHero.power.length; N++) {
                aHero.powerdif.push({});
                for (let aKey in aHero.power[N]) {
                    aHero.powerdif[N][aKey] = (aHero.power[N][aKey] - aHero.powercmp[N][aKey]);
                    aHero.powerdif[N][aKey] = Math.round(aHero.powerdif[N][aKey] * 10) / 10;
                }
            }
            $scope.heroPower.push(aHero);
        }
        $scope.heroPower.sort(function(a, b) {
            return b.power[3].late - a.power[3].late
        });
    }

    $scope.Show = function(what, sort, desc, which) {
        $scope.show = what;
        let aPower = $scope.SkillLevels.length;
        for (var N = 0; N < $scope.SkillLevels.length; N++)
            if (sort == $scope.SkillLevels[N])
                aPower = N;
        if (sort == 'Deviation') aPower = N + 1;
        $scope.heroPower.sort(function(a, b) {
            let powerUsed = 'power';
            if (which == 'cmp') powerUsed = 'powercmp';
            else if (which == 'dif') powerUsed = 'powerdif';
            let aDiff = b[powerUsed][aPower][what] - a[powerUsed][aPower][what];
            if (desc) return aDiff;
            else return -aDiff;
        });
    }
	
	AddHeroesInfo( $scope, heroesLib, function() {
		AddHeroesTimeAdvAll($http, $scope, function() {
			$scope.show = '';
			if (typeof(SingleMeta)!='undefined') {
				$scope.v1 = $scope.herotimeadvall[0].map_version;
				$scope.v2 = $scope.herotimeadvall[0].map_version;
			} else {
                const versions = $location.path().split('/').filter(function (x) {
                    return x != '';
                });
                for (var N = 0; N < versions.length; N++) {
					if (versions[N].substr(0, 3) == 'v1_') $scope.v1 = versions[N].substr(3);
					if (versions[N].substr(0, 3) == 'v2_') $scope.v2 = versions[N].substr(3);
				}
				var found = false;
				for (var N = 0; N < $scope.herotimeadvall.length; N++)
					if ($scope.herotimeadvall[N].map_version == $scope.v1) found = true;
				if (!found) $scope.v1 = $scope.herotimeadvall[0].map_version;
				var found = false;
				for (var N = 0; N < $scope.herotimeadvall.length; N++)
					if ($scope.herotimeadvall[N].map_version == $scope.v2) found = true;
				if (!found) $scope.v2 = $scope.herotimeadvall[1].map_version;
			}

			$scope.smallsample = {};
			$scope.RecalculateAfterSelection();
			$scope.Show('full', 'Average', true);
		});
	});
	
}]);

function CreateHeroTrendsChart(svgSelector, size, hdata) {
    const aTypes = [
        {
            id: 'all',
            title: 'All Skills'
        }, {
            id: 'vhigh',
            title: 'Very High'
        }, {
            id: 'high',
            title: 'High'
        }, {
            id: 'norm',
            title: 'Normal'
        }
    ];

    const width = size;
    const height = size / 2;

    //create SVG area
    const svgzone = d3.select(svgSelector)
        .attr("width", size)
        .attr("height", size / 2);

    //SVG area margins rectangle
	svgzone.append("rect")
	.attr("class", "showmargins")
	.attr("height", size / 2)
	.attr("width", size);

	//TITLE
	svgzone.append("text")
	.attr("x", Math.round(size * 0.06))
	.attr("y", Math.round(size * 0.06))
	.attr("class", "httexttitle")
	.style("font-size", Math.round(size * 0.04)+"px")
	.text(hdata.text);

	//Legend area
    const legendInfo = {
        svg: null,
        top: Math.round(size * 0.02),
        left: Math.round(size * 0.8),
        height: Math.round(size * 0.455),
        width: Math.round(size * 0.18),
    };
    legendInfo.svg = svgzone.append("g").attr("transform", "translate("+legendInfo.left+","+legendInfo.top+")");

	//Legend Stuff
	legendInfo.svg.append("text")
		.attr("x", Math.round(size * 0.08))
		.attr("y", size * 0.03)
		.attr("text-anchor", "middle")
		.attr("class", "htlegend")
		.style("font-size", Math.round(size * 0.03)+"px")
		.text(hdata.titlechanges);
	legendInfo.svg.append("text")
		.attr("x", Math.round(size * 0.08))
		.attr("y", size * 0.06)
		.attr("text-anchor", "middle")
		.attr("class", "htlegend")
		.style("font-size", Math.round(size * 0.03)+"px")
		.text(hdata.timechanges);
	for (var tN = 0; tN < aTypes.length; tN++) {
        let yOffset = size * 0.075 * tN + size * 0.095; //normal spacing;
		yOffset += (tN+1) * size * 0.02; //spacing between each group
		yOffset = Math.round(yOffset);
		
		legendInfo.svg.append("line")
		.attr("x1", 0)
		.attr("y1", Math.round(yOffset-0.04*size))
		.attr("x2", legendInfo.width)
		.attr("y2", Math.round(yOffset-0.04*size))
		.attr("class", "htlegendbar");

		legendInfo.svg.append("text")
		.attr("x", Math.round(size * 0.08))
		.attr("y", yOffset)
		.attr("text-anchor", "middle")
		.attr("class", "htlegend htfill"+aTypes[tN].id)
		.style("font-size", Math.round(size * 0.035)+"px")
		.text(aTypes[tN].title);

        const aDiff = Math.round((hdata[aTypes[tN].id][hdata[aTypes[tN].id].length - 1] - hdata[aTypes[tN].id][0]) * 100) / 100;
        legendInfo.svg.append("text")
		.attr("x", Math.round(size * 0.08))
		.attr("y", Math.round(yOffset+0.04*size))
		.attr("text-anchor", "middle")
		.attr("class", "htlegend "+(Math.abs(aDiff) < 0.2 ? 'htfillsmalldiff' : (aDiff < 0 ? 'htfillneg' : 'htfillpoz')))
		.style("font-size", Math.round(size * 0.035)+"px")
		.text((aDiff > 0 ? "+"+aDiff : aDiff)+'%');
	}
	legendInfo.svg.append("line")
	.attr("x1", legendInfo.width)
	.attr("y1", 0)
	.attr("x2", legendInfo.width)
	.attr("y2", legendInfo.height)
	.attr("class", "htlegendbar");
	
	legendInfo.svg.append("line")
	.attr("x1", 0)
	.attr("y1", legendInfo.height)
	.attr("x2", legendInfo.width)
	.attr("y2", legendInfo.height)
	.attr("class", "htlegendbar");
	
	//Legend area margin
	legendInfo.svg.append("rect").attr("class", "showmargins").attr("height", legendInfo.height).attr("width", legendInfo.width);

	//Chart area
    const chartInfo = {
        svg: null,
        top: Math.round(size * 0.1),
        left: Math.round(size * 0.1),
        height: Math.round(size * 0.3),
        width: Math.round(size * 0.65),
    };
    chartInfo.svg = svgzone.append("g").attr("transform", "translate("+chartInfo.left+","+chartInfo.top+")");

	//declaring axis
    const x = d3.scale.linear().domain([0, hdata.labels.length - 1]).range([0, chartInfo.width]);
    const y = d3.scale.linear().domain([hdata.min, hdata.max]).range([chartInfo.height, 0]);

    //adding each line
	function AddLineToChart(dataKey, title) {
		chartInfo.svg.selectAll(".dots"+dataKey).data(hdata[dataKey])
		.enter().append("circle")
		.attr("class", "htdots htdots"+dataKey)
		.attr("cx", function(d, ind) { return x(ind); })
		.attr("cy", function(d, ind) { return y(d); })
		.attr("r", Math.ceil(size*0.0075))
		.attr("zIndex", "10")
		.on("mouseover", function(d, ind) {
			d3.select(this).attr("r", Math.ceil(size*0.0125));
			tooltip.id = Math.round(Math.random()*100000);
			tooltip.svg.attr("transform", "translate("+x(ind)+","+y(d)+")");
			tooltip.svgtextlabel.text(hdata.labels[ind]);
			tooltip.svgtextskill.text(title).attr("class", "httooltipskill htfill"+dataKey);
			tooltip.svgtextvalue.text(d+"%");
			tooltip.svgtextvalue.attr("class", "httooltipvalue "+(Math.abs(50-d) < 0.2 ? 'htfillsmalldiff' : (d-50 < 0 ? 'htfillneg' : 'htfillpoz')))
			tooltip.svg.transition().duration(100).style("opacity", 0.95);
		})                  
		.on("mouseout", function(d) {
			d3.select(this).attr("r", Math.ceil(size*0.0075));
            const closeid = tooltip.id;
            setTimeout(function() {
				if (tooltip.id == closeid) {
					tooltip.svg.transition().duration(400).style("opacity", 0);
					tooltip.svg.attr("transform", "translate("+size+","+size/2+")");
				}
			}, 1000);
		});

		chartInfo.svg.append("path")
		.attr('d', (d3.svg.line().x(function(d, ind) { return x(ind); }).y(function(d, ind) { return y(d); }).interpolate("linear"))(hdata[dataKey]))
		.attr("class", "htpath htpath"+dataKey)
		.attr("stroke-width", Math.ceil(size*0.0025))
	}
	for (var tN = aTypes.length-1; tN >= 0 ; tN--)
		AddLineToChart(aTypes[tN].id, aTypes[tN].title);

    const xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
    chartInfo.svg.append("g").attr("class", "htaxis htxaxis").style("font-size", Math.round(size * 0.025)+"px").attr("transform", "translate(0," + chartInfo.height + ")").call(xAxis);
    const insertLinebreaks = function (d) {
        const el = d3.select(this);
        const words = hdata.labelsAxis[d].split('<br>');
        el.text('');
        for (let i = 0; i < words.length; i++) {
            const tspan = el.append('tspan').text(words[i]);
            if (i > 0)
                tspan.attr('x', 0).attr('dy', Math.round(size * 0.025));
        }
    };
    chartInfo.svg.selectAll('g text').each(insertLinebreaks);

    const yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(function (d) {
        return d + '%';
    }).ticks(size >= 300 ? 5 : 4);
    chartInfo.svg.append("g").attr("class", "htaxis htyaxis").style("font-size", Math.round(size * 0.025)+"px").attr("transform", "translate(-"+Math.round(size * 0.015)+",0)").call(yAxis);

	//Chart area margin
	chartInfo.svg.append("rect").attr("class", "showmargins").attr("height", chartInfo.height).attr("width", chartInfo.width);
		
	//Tooltip
	var tooltip = {
		svg: null,
		svgtextlabel: null,
		svgtextskill: null,
		svgtextvalue: null,
		id: 0,
		height: Math.round(size * 0.135),
		width: Math.round(size * 0.25),
	};
	tooltip.svg = chartInfo.svg.append("g").style("opacity", 0);
	tooltip.svg.append("rect")
	.attr("class", "httooltiprect")
	.attr("height", tooltip.height)
	.attr("width", tooltip.width);

	tooltip.svgtextlabel = tooltip.svg.append("text")
	.attr("x", Math.round(tooltip.width / 2))
	.attr("y", Math.round(size * 0.04))
	.attr("text-anchor", "middle")
	.attr("class", "httooltiplabel")
	.style("font-size", Math.round(size * 0.035)+"px")
	.text('label');

	tooltip.svgtextskill = tooltip.svg.append("text")
	.attr("x", Math.round(tooltip.width / 2))
	.attr("y", Math.round(size * 0.08))
	.attr("text-anchor", "middle")
	.attr("class", "httooltipskill")
	.style("font-size", Math.round(size * 0.035)+"px")
	.text('skill');

	tooltip.svgtextvalue = tooltip.svg.append("text")
	.attr("x", Math.round(tooltip.width / 2))
	.attr("y", Math.round(size * 0.12))
	.attr("text-anchor", "middle")
	.attr("class", "httooltipvalue")
	.style("font-size", Math.round(size * 0.035)+"px")
	.text('value');

}


pickerApp.controller('HeroWinratesCtrl', ['$scope', '$cookieStore', '$location', '$rootScope', '$http', 'heroes', function($scope, $cookieStore, $location, $rootScope, $http, heroesLib) {
/*var hdata = {
	text: "Winrate Short Games",
	labels: ["03/13/2015", "03/14/2015", "03/15/2015", "03/16/2015", "03/17/2015", "03/18/2015", "03/19/2015", "03/20/2015", "03/21/2015", "03/22/2015"],
	labelsAxis: ["03/13<br>2015", "03/14<br>2015", "03/15<br>2015", "03/16<br>2015", "03/17<br>2015", "03/18<br>2015", "03/19<br>2015", "03/20<br>2015", "03/21<br>2015", "03/22<br>2015"],
	all: [48.1, 50.14, 50.04, 50.37, 50.39, 50.28, 50.31, 48.1, 50.14, 50.04],
	norm: [50.21, 50.34, 50.24, 50.57, 50.19, 50.18, 50.11, 50.19, 50.18, 50.11],
	high: [49.1, 49.14, 49.04, 49.37, 49.39, 49.28, 49.31, 49.39, 49.28, 49.31],
	vhigh: [51.1, 51.14, 51.04, 51.37, 51.39, 51.28, 51.31, 51.14, 51.04, 51.37],
	min: 45,
	max: 55,
}*/
    $scope.log = function(msg) {
        console.log(msg)
    };
	
	$scope.show = {
		sorttable: false
	}

    const aTime = '10d';
    $scope.winratesTime = '10d';
	
	$scope.sortInfo = {
		what: 'name',
		skill: 'all',
		when: 'end',
		asc: 'asc',
		whatOpt: [{'id': 'allwr', name: "All Winrates"},{'id': 'allpr', name:"All Pickrates"},{'id': 'shortwr', name: "Short Games Winrates"},{'id': 'mediumwr', name: "Medium Games Winrates"},{'id': 'longwr', name:"Long Games Winrates"}],
		skillOpt: [{'id':'all', name:"All Skills"},{'id':'vhigh', name: "Very High Skill"},{'id':'high', name: "High Skill"},{'id':'norm', name: "Normal Skill"}],
		whenOpt: [{'id':'diff', name: "Period Difference"},{'id':'end', name: "Period End"},{'id':'start', name: "Period Start"}]
	}

    const arrSettings = $location.path().split('/').filter(function (x) {
        return x != '';
    });
    for (let sN = 0; sN < arrSettings.length; sN++) {
		if (arrSettings[sN].substr(0, 5)=='sort_'){
			//sort_allwr_norm_end_desc
            const aSortSet = arrSettings[sN].split('_');
            if (aSortSet.length != 5) continue;
			$scope.sortInfo.what = aSortSet[1];
			$scope.sortInfo.skill = aSortSet[2];
			$scope.sortInfo.when = aSortSet[3];
			$scope.sortInfo.asc = aSortSet[4];
		}
	}
	
	function GeneratePath() {
        let aPath = '';
        if ($scope.sortInfo.what != 'name') {
			if (aPath!='') aPath+='/';
			aPath += 'sort_'+$scope.sortInfo.what+'_'+$scope.sortInfo.skill+'_'+$scope.sortInfo.when+'_'+$scope.sortInfo.asc;
		}
		return aPath;
	}
	
	AddHeroesWinrateInfo($scope, $http, heroesLib, aTime);

        $scope.SortBy = function(what, skill, when, asc) {
                $scope.sortInfo.what = what;
                $scope.sortInfo.skill = skill;
                $scope.sortInfo.when = when;
                $scope.sortInfo.asc = asc;
                $location.path(GeneratePath());
        }
}]);

function AddHeroesWinrateInfo($scope, $http, heroesLib, aTime) {
        function GetMinMax (arrObj) {
            const aRet = {
                min: 1000000, max: -1000000
            };
            const aOpts = ['all', 'norm', 'high', 'vhigh'];
            for (let obN = 0; obN < arrObj.length; obN++) {
                        for (let oN = 0; oN < aOpts.length; oN++) {
                                for (let N = 0; N < arrObj[obN][aOpts[oN]].length; N++) {
                                        if (aRet.min > arrObj[obN][aOpts[oN]][N]) aRet.min = arrObj[obN][aOpts[oN]][N];
                                        if (aRet.max < arrObj[obN][aOpts[oN]][N]) aRet.max = arrObj[obN][aOpts[oN]][N];
                                }
                        }
                }

                if (aRet.min > aRet.max) {
                        aRet.min = 0;
                        aRet.max = 0;
                }
                return aRet;
        }
        function PopulateHData(hdata, obj) {
            const aOpts = ['all', 'norm', 'high', 'vhigh'];
            for (let oN = 0; oN < aOpts.length; oN++) {
                        hdata[aOpts[oN]] = obj[aOpts[oN]];
                }
        }
        $scope.FormatWrSmallTable = function (value) {
                return Math.round(value*10)/10;
        }

	AddHeroesInfo($scope, heroesLib, function() {
		AddHeroWinrates($http, $scope, aTime, function() {
			setTimeout(function(){
				//console.log($scope.heroes);
				for (let N = 0; N < $scope.heroes.length; N++) {
                    const hdata = {labels: [], labelsAxis: []};
                    if (!(('wrinfo'+aTime) in $scope.heroes[N]) || typeof($scope.heroes[N]['wrinfo'+aTime])=='undefined') continue;
					for (let lN = 0; lN < $scope.heroes[N]['wrinfo'+aTime].labels.length; lN++) {
                        const aLabSplit = $scope.heroes[N]['wrinfo' + aTime].labels[lN].split('_');
                        if (aLabSplit.length != 3) {
							hdata.labels.push( $scope.heroes[N]['wrinfo'+aTime].labels[lN] );
							hdata.labelsAxis.push( $scope.heroes[N]['wrinfo'+aTime].labels[lN] );
							continue;
						}
						hdata.labels.push( aLabSplit[1] + '/' + aLabSplit[2] + '/' + aLabSplit[0] );
						hdata.labelsAxis.push( aLabSplit[1] + '/' + aLabSplit[2] + '<br>' + aLabSplit[0] );
					}
					
					
					hdata.timechanges = 'last 10 days';
					
					hdata.min = 35;
					hdata.max = 65;
					var aMinMax = GetMinMax([$scope.heroes[N]['wrinfo'+aTime].allwr]);
					while (hdata.min > aMinMax.min) {
						hdata.min -= 5;
						if (hdata.max -5 > aMinMax.max) hdata.max -= 5;
					}
					while (hdata.max < aMinMax.max) {
						hdata.max += 5;
						if (hdata.min + 5 < aMinMax.max) hdata.mim += 5;
					}
					
					hdata.titlechanges = 'WR Changes';
					hdata.text = "Winrate " + $scope.heroes[N].name;
					PopulateHData(hdata, $scope.heroes[N]['wrinfo'+aTime].allwr);
					CreateHeroTrendsChart("#hgr-wrall-"+$scope.heroes[N].id, 400, hdata);
					
					hdata.min = 0;
					hdata.max = 20;
					var aMinMax = GetMinMax([$scope.heroes[N]['wrinfo'+aTime].allpr]);
					while (hdata.max < aMinMax.max) hdata.max += 5;
					
					hdata.titlechanges = 'PR Changes';
					hdata.text = "Pickrate " + $scope.heroes[N].name;
					PopulateHData(hdata, $scope.heroes[N]['wrinfo'+aTime].allpr);
					CreateHeroTrendsChart("#hgr-prall-"+$scope.heroes[N].id, 400, hdata);

					hdata.min = 35;
					hdata.max = 65;
					var aMinMax = GetMinMax([$scope.heroes[N]['wrinfo'+aTime].shortwr, $scope.heroes[N]['wrinfo'+aTime].mediumwr, $scope.heroes[N]['wrinfo'+aTime].longwr]);
					while (hdata.min > aMinMax.min) {
						hdata.min -= 5;
						if (hdata.max -5 > aMinMax.max) hdata.max -= 5;
					}
					
					while (hdata.max < aMinMax.max) {
						hdata.max += 5;
						if (hdata.min + 5 < aMinMax.max) hdata.mim += 5;
					}
					
					hdata.titlechanges = 'WR Changes';
					hdata.text = "Winrate Short Games " + $scope.heroes[N].name;
					if (hdata.text.length > 35) hdata.text = "WR Short Games " + $scope.heroes[N].name;
					PopulateHData(hdata, $scope.heroes[N]['wrinfo'+aTime].shortwr);
					CreateHeroTrendsChart("#hgr-wrshort-"+$scope.heroes[N].id, 300, hdata);
					
					hdata.text = "Winrate Medium Games " + $scope.heroes[N].name;
					if (hdata.text.length > 35) hdata.text = "WR Medium Games " + $scope.heroes[N].name;
					PopulateHData(hdata, $scope.heroes[N]['wrinfo'+aTime].mediumwr);
					CreateHeroTrendsChart("#hgr-wrmedium-"+$scope.heroes[N].id, 300, hdata);
					
					hdata.text = "Winrate Long Games " + $scope.heroes[N].name;
					if (hdata.text.length > 35) hdata.text = "WR Long Games " + $scope.heroes[N].name;
					PopulateHData(hdata, $scope.heroes[N]['wrinfo'+aTime].longwr);
					CreateHeroTrendsChart("#hgr-wrlong-"+$scope.heroes[N].id, 300, hdata);
				}
			}, 10);
		});
	});
}	

pickerApp.filter('orderHWR', function () {
  // custom value function for sorting
  function myValueFunction(val, scope) {
console.log(scope.sortInfo.what + ' '+val.name);
		if (scope.sortInfo.what == 'name')
			return val.name;
      const aObj = val['wrinfo' + scope.winratesTime][scope.sortInfo.what][scope.sortInfo.skill];
      if (scope.sortInfo.when == 'end') return aObj[aObj.length-1];
		else if (scope.sortInfo.when == 'diff') return aObj[aObj.length-1] - aObj[0];
		else return aObj[0];
		return 0;
	};

  return function (obj, scope) {
	if (typeof(obj) == 'undefined') return;
      const newArr = [];
      for (var N = 0; N < obj.length; N++) if (!(('wrinfo'+scope.winratesTime) in obj[N])) {
		return newArr;
	}
	for (var N = 0; N < obj.length; N++) newArr.push(obj[N]);
    // apply a custom sorting function
    newArr.sort(function (a, b) {
      if (scope.sortInfo.what == 'name') {
        if (scope.sortInfo.asc == 'asc') return a.name.localeCompare(b.name);
        else return b.name.localeCompare(a.name);
      }
      if (scope.sortInfo.asc == 'asc') return myValueFunction(a, scope) - myValueFunction(b, scope);
	  else if (scope.sortInfo.asc == 'desc') return myValueFunction(b, scope) - myValueFunction(a, scope);
	  else return Math.abs(myValueFunction(b, scope)) - Math.abs(myValueFunction(a, scope));
    });
	//console.log(newArr);
    return newArr;
  };
});

pickerApp.controller('PersonalScoresCtrl', ['$scope', '$cookieStore', '$location', '$rootScope', '$http', 'heroes', function($scope, $cookieStore, $location, $rootScope, $http, heroesLib) {
	if (gup('beta') == 'true') $scope.beta = true;
	$scope.show={};
	$scope.Math = Math;
	$scope.friends = [];
	AddHeroesInfo( $scope, heroesLib, function() {
		AddPersonalSettings($http, $scope, function() {
            let savedPriv = $scope.settings.privacy;
            $scope.$watch('settings.privacy', function(priv) {
				if (savedPriv == $scope.settings.privacy) return;
				savedPriv = $scope.settings.privacy;
				$http.post('/api/settings/set', {general: {privacy:priv}}).
				then(function (success){}, function(err) {});
			});
		});
		AddHeroesPersonal($http, $scope, true, function() {
			
			if ($scope.loggedIn) {
				AddFriends($http, $scope, function() {
					
				});
			}
			
			$scope.heroesPersonal = [];
			for (var N = 0; N < $scope.heroes.length; N++)
				$scope.heroesPersonal.push($scope.heroes[N]);
			$scope.heroesPersonal.sort(function(a,b) {
                let aScA = -1;
                let aScB = -1;
                if ('personalScores' in a && 'usedScore' in a.personalScores) aScA = a.personalScores.usedScore;
				if ('personalScores' in b && 'usedScore' in b.personalScores) aScB = b.personalScores.usedScore;
				return aScB-aScA;
			});

            const scoreRolesNr = {};
            $scope.scoreRolesJson = {};
			for (var N = 0; N < $scope.availableRoles.length; N++) {
				$scope.scoreRolesJson[$scope.availableRoles[N].role] = 0;
				scoreRolesNr[$scope.availableRoles[N].role] = 0;
			}
            let hasScores = false;
            for (let hN = 0; hN < $scope.heroesPersonal.length; hN++) {
				for (var aRole in $scope.heroesPersonal[hN].rolesJSON) {
					if (aRole in $scope.scoreRolesJson && 'personalScores' in $scope.heroesPersonal[hN] && 'usedScore' in $scope.heroesPersonal[hN].personalScores) {
						$scope.scoreRolesJson[aRole] += $scope.heroesPersonal[hN].personalScores.usedScore;
						scoreRolesNr[aRole]++;
						if ($scope.heroesPersonal[hN].personalScores.usedScore!=0) hasScores = true;
					}
				}
			}
			$scope.scoreRoles = [];
			
			if (hasScores) {
				for (var aRole in $scope.scoreRolesJson) {
					if (scoreRolesNr[aRole] != 0)
						$scope.scoreRolesJson[aRole] /= scoreRolesNr[aRole];
					$scope.scoreRoles.push({role: aRole, score: $scope.scoreRolesJson[aRole]});
				}
				$scope.scoreRoles.sort(function(a,b){ return b.score - a.score; });
			}
			UpdateTutorialPopups();
		})
	});
	$scope.SortHeroes = function(what, desc) {
		$scope.heroesPersonal.sort(function(a,b) {
            let aScA = -1;
            let aScB = -1;
            switch (what) {
			case 'score':
				aScA = a.personalScores.usedScore;
				aScB = b.personalScores.usedScore;
				break;
			case 'wra':
				aScA = a.personalScores.wrAll;
				aScB = b.personalScores.wrAll;
				break;
			case 'wran':
				aScA = a.personalScores.cntAll;
				aScB = b.personalScores.cntAll;
				break;
			case 'wr10':
				aScA = a.personalScores.wr10;
				aScB = b.personalScores.wr10;
				break;
			case 'wr10n':
				aScA = a.personalScores.cnt10;
				aScB = b.personalScores.cnt10;
				break;
			case 'wrm':
				aScA = a.personalScores.wrMon;
				aScB = b.personalScores.wrMon;
				break;
			case 'wrmn':
				aScA = a.personalScores.cntMon;
				aScB = b.personalScores.cntMon;
				break;
			case 'wr3':
				aScA = a.personalScores.wr3Mon;
				aScB = b.personalScores.wr3Mon;
				break;
			case 'wr3n':
				aScA = a.personalScores.cnt3Mon;
				aScB = b.personalScores.cnt3Mon;
				break;
			}
			return desc? aScB-aScA : aScA-aScB;
		});
	}
}]);

pickerApp.controller('PersonalSettingsCtrl', ['$scope', '$http', 'heroes', function($scope, $http, heroesLib) {
	if (gup('beta') == 'true') $scope.beta = true;
	$scope.Math = Math;
	$scope.NeedSave = 'no';
	$scope.stuffLoaded = false;
	
	
    $scope.SkillLevelsJson = {"Very High": 0, "High": 1, "Normal": 2};
	
	$scope.PersonalScore = {
		skillLevel: "High",
		heroesToCompareList: [],
		heroToCompare: 'Vengeful Spirit',
		heroesEnemy: [{name:"Anti-Mage", advModeScore: 0, wrModeScore: 0, prsModeScore: 0, plusMinus: 1}, {name:"Lion", advModeScore: 0, wrModeScore: 0, prsModeScore: 0, plusMinus: 0}, {name:"Leshrac", advModeScore: 0, wrModeScore: 0, prsModeScore: 0, plusMinus: 0}],
		heroesTeam: [{name:"Luna", advModeScore: 0, wrModeScore: 0, prsModeScore: 0, plusMinus: 0}, {name:"Enigma", advModeScore: 0, wrModeScore: 0, prsModeScore: 0, plusMinus: 0}, {name:"Queen of Pain", advModeScore: 0, wrModeScore: 0, prsModeScore: 0, plusMinus: -1}],
		advantageAdvModeScore: 0,
		advantageWrModeScore: 0,
		advantagePrsModeScore: 0,
		synergyAdvModeScore: 0,
		synergyWrModeScore: 0,
		synergyPrsModeScore: 0,
		matchupAdvModeScore: 0,
		matchupWrModeScore: 0,
		matchupPrsModeScore: 0,
		partBonus: {
			each: [{
				name: 'early',
				bonus: 0,
				active: 'yes',
				thisPartAdvModeScore: 0,
				thisPartWrModeScore: 0,
				thisPartPrsModeScore: 0
			}, {
				name: 'mid',
				bonus: 0,
				active: 'yes',
				thisPartAdvModeScore: 0,
				thisPartWrModeScore: 0,
				thisPartPrsModeScore: 0
			}, {
				name: 'late',
				bonus: 0,
				active: 'no',
				thisPartAdvModeScore: 0,
				thisPartWrModeScore: 0,
				thisPartPrsModeScore: 0
			}],
			nrPartsActive: 2,
			partAdvModeScore: 0,
			partWrModeScore: 0,
			partPrsModeScore: 0,
		},
		personalHeroScore: 0,
		personalHeroScoreScaled: 0,
		personalAdvModeScore: 0,
		personalWrModeScore: 0,
		personalPrsModeScore: 0,
		finalAdvModeScore: 0,
		finalWrModeScore: 0,
		finalPrsModeScore: 0
	}
	
	
	$scope.availableCompOps = ['added', 'multiplied', 'default'];
	AddHeroesInfo($scope, heroesLib, function() {
		for (let N = 0; N < $scope.heroes.length; N++)
			$scope.PersonalScore.heroesToCompareList.push($scope.heroes[N].name);
		AddPersonalSettings($http, $scope, function() {
			$scope.stuffLoaded = true;
			UpdateTutorialPopups();
			AddHeroesAdvScores($scope, heroesLib, function(){
				AddHeroesWinScores($scope, heroesLib, function(){
					AddHeroesTimeAdv($scope, heroesLib, function(){
						AddHeroesPersonal($http, $scope, false, function(){
							HeroesScalePersonalScores($scope);
							$scope.RecalculatePersonalScores();
						});
					});
				});
			});
		});
	});
	$scope.CycleFavoriteDisliked = function(hname) {
		if (!$scope.heroesJson[hname].personalSettings.favorite && !$scope.heroesJson[hname].personalSettings.disliked)
			$scope.heroesJson[hname].personalSettings.favorite = true;
		else if ($scope.heroesJson[hname].personalSettings.favorite) {
			$scope.heroesJson[hname].personalSettings.favorite = false;
			$scope.heroesJson[hname].personalSettings.disliked = true;
		} else if ($scope.heroesJson[hname].personalSettings.disliked) {
			$scope.heroesJson[hname].personalSettings.disliked = false;
			$scope.heroesJson[hname].personalSettings.favorite = false;
		}
		$scope.ChengedSettings();
	}
	$scope.ChangeRole = function(hname, role, to) {
		if (!$scope.personalEnabled) return;
		if (to=='role') {
			$scope.heroesJson[hname].rolesJSON[role] = true;
			delete $scope.heroesJson[hname].canRolesJSON[role];
		} else if (to=='extended') {
			$scope.heroesJson[hname].canRolesJSON[role] = true;
                        delete $scope.heroesJson[hname].rolesJSON[role];
                } else if (to=='none') {
			delete $scope.heroesJson[hname].rolesJSON[role];
			delete $scope.heroesJson[hname].canRolesJSON[role];
		}
		$scope.ChengedSettings();
		UpdateTutorialPopups();
	}
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
    $scope.RecalculatePersonalScores = function() {
console.log('RecalculatePersonalScores');
			$scope.PersonalScore.advantageAdvModeScore = 0;
			$scope.PersonalScore.advantageWrModeScore = 0;
			if ($scope.settingsPersonal.formulas.advantageOp == 'multiplied') $scope.PersonalScore.advantagePrsModeScore = 1;
			else $scope.PersonalScore.advantagePrsModeScore = 0;

//aThisHeroScores.vs[$scope.heroesEnemy[aEHN].name].advantage = -$scope.heroesEnemy[aEHN].advantage[$scope.heroes[aHN].id][skill];				
			for (var N = 0; N < $scope.PersonalScore.heroesEnemy.length; N++) {
				$scope.PersonalScore.heroesEnemy[N].advModeScore = Number.NaN;
				$scope.PersonalScore.heroesEnemy[N].wrModeScore = Number.NaN;
				$scope.PersonalScore.heroesEnemy[N].prsModeScore = Number.NaN;
				if ($scope.PersonalScore.heroToCompare == $scope.PersonalScore.heroesEnemy[N].name) continue;
				var variables = {
					advantageScore: -$scope.heroesJson[$scope.PersonalScore.heroesEnemy[N].name].advantageUnscaled[$scope.heroesJson[$scope.PersonalScore.heroToCompare].id][$scope.SkillLevelsJson[$scope.PersonalScore.skillLevel]],
					advantageScoreScaled: -$scope.heroesJson[$scope.PersonalScore.heroesEnemy[N].name].advantage[$scope.heroesJson[$scope.PersonalScore.heroToCompare].id][$scope.SkillLevelsJson[$scope.PersonalScore.skillLevel]],
					winrateScore: -$scope.heroesJson[$scope.PersonalScore.heroesEnemy[N].name].winrateUnscaled[$scope.heroesJson[$scope.PersonalScore.heroToCompare].id][$scope.SkillLevelsJson[$scope.PersonalScore.skillLevel]],
					winrateScoreScaled: -$scope.heroesJson[$scope.PersonalScore.heroesEnemy[N].name].winrate[$scope.heroesJson[$scope.PersonalScore.heroToCompare].id][$scope.SkillLevelsJson[$scope.PersonalScore.skillLevel]],
					heroPlusMinus: $scope.PersonalScore.heroesEnemy[N].plusMinus
				};
				$scope.PersonalScore.heroesEnemy[N].advModeScore = GetCustomFunctionHandler('cnd(heroPlusMinus, 0.5, 1, 2.5) * ssqrt(scale(advantageScoreScaled, 2, 1))', ['advantageScore', 'advantageScoreScaled', 'winrateScore', 'winrateScoreScaled','heroPlusMinus'], functionPointers).exec(variables);
				$scope.PersonalScore.heroesEnemy[N].wrModeScore = GetCustomFunctionHandler('cnd(heroPlusMinus, 0.5, 1, 2.5) * ssqrt(scale(winrateScoreScaled, 2, 1))', ['advantageScore', 'advantageScoreScaled', 'winrateScore', 'winrateScoreScaled','heroPlusMinus'], functionPointers).exec(variables);
				if ($scope.settingsPersonal.formulas.advantage == 'default') $scope.PersonalScore.heroesEnemy[N].prsModeScore = $scope.PersonalScore.heroesEnemy[N].advModeScore;
				else $scope.PersonalScore.heroesEnemy[N].prsModeScore = GetCustomFunctionHandler($scope.settingsPersonal.formulas.advantage, ['advantageScore', 'advantageScoreScaled', 'winrateScore', 'winrateScoreScaled','heroPlusMinus'], functionPointers).exec(variables);
				
				$scope.PersonalScore.advantageAdvModeScore += $scope.PersonalScore.heroesEnemy[N].advModeScore;
				$scope.PersonalScore.advantageWrModeScore += $scope.PersonalScore.heroesEnemy[N].wrModeScore;

				if ($scope.settingsPersonal.formulas.advantageOp == 'multiplied') $scope.PersonalScore.advantagePrsModeScore *= $scope.PersonalScore.heroesEnemy[N].prsModeScore;
				else $scope.PersonalScore.advantagePrsModeScore += $scope.PersonalScore.heroesEnemy[N].prsModeScore;
			}
			
			$scope.PersonalScore.advantageAdvModeScore = $scope.PersonalScore.advantageAdvModeScore;
			$scope.PersonalScore.advantageWrModeScore = $scope.PersonalScore.advantageWrModeScore;
			$scope.PersonalScore.advantagePrsModeScore = $scope.PersonalScore.advantagePrsModeScore;
			
			$scope.PersonalScore.synergyAdvModeScore = 0;
			$scope.PersonalScore.synergyWrModeScore = 0;
			if ($scope.settingsPersonal.formulas.synergyOp == 'multiplied') $scope.PersonalScore.synergyPrsModeScore = 1;
			else $scope.PersonalScore.synergyPrsModeScore = 0;
				
			for (var N = 0; N < $scope.PersonalScore.heroesTeam.length; N++) {
				$scope.PersonalScore.heroesTeam[N].advModeScore = Number.NaN;
				$scope.PersonalScore.heroesTeam[N].wrModeScore = Number.NaN;
				$scope.PersonalScore.heroesTeam[N].prsModeScore = Number.NaN;
				if ($scope.PersonalScore.heroToCompare == $scope.PersonalScore.heroesTeam[N].name) continue;
				var variables = {
					synergyScore: $scope.heroesJson[$scope.PersonalScore.heroesTeam[N].name].synergyUnscaled[$scope.heroesJson[$scope.PersonalScore.heroToCompare].id][$scope.SkillLevelsJson[$scope.PersonalScore.skillLevel]],
					synergyScoreScaled: $scope.heroesJson[$scope.PersonalScore.heroesTeam[N].name].synergy[$scope.heroesJson[$scope.PersonalScore.heroToCompare].id][$scope.SkillLevelsJson[$scope.PersonalScore.skillLevel]],
					winrateTeamScore: $scope.heroesJson[$scope.PersonalScore.heroesTeam[N].name].winrateteamUnscaled[$scope.heroesJson[$scope.PersonalScore.heroToCompare].id][$scope.SkillLevelsJson[$scope.PersonalScore.skillLevel]],
					winrateTeamScoreScaled: $scope.heroesJson[$scope.PersonalScore.heroesTeam[N].name].winrateteam[$scope.heroesJson[$scope.PersonalScore.heroToCompare].id][$scope.SkillLevelsJson[$scope.PersonalScore.skillLevel]],
					heroPlusMinus: $scope.PersonalScore.heroesTeam[N].plusMinus
				};
				$scope.PersonalScore.heroesTeam[N].advModeScore = GetCustomFunctionHandler('cnd(heroPlusMinus, 0.5, 1, 2.5) * ssqrt(scale(synergyScoreScaled, 1.5, 1))', ['synergyScore', 'synergyScoreScaled', 'winrateTeamScore', 'winrateTeamScoreScaled','heroPlusMinus'], functionPointers).exec(variables);
				$scope.PersonalScore.heroesTeam[N].wrModeScore = GetCustomFunctionHandler('cnd(heroPlusMinus, 0.5, 1, 2.5) * ssqrt(scale(winrateTeamScoreScaled, 1.5, 1))', ['synergyScore', 'synergyScoreScaled', 'winrateTeamScore', 'winrateTeamScoreScaled','heroPlusMinus'], functionPointers).exec(variables);
				if ($scope.settingsPersonal.formulas.synergy == 'default') $scope.PersonalScore.heroesTeam[N].prsModeScore = $scope.PersonalScore.heroesTeam[N].advModeScore;
				else $scope.PersonalScore.heroesTeam[N].prsModeScore = GetCustomFunctionHandler($scope.settingsPersonal.formulas.synergy, ['synergyScore', 'synergyScoreScaled', 'winrateTeamScore', 'winrateTeamScoreScaled','heroPlusMinus'], functionPointers).exec(variables);

				$scope.PersonalScore.synergyAdvModeScore += $scope.PersonalScore.heroesTeam[N].advModeScore;
				$scope.PersonalScore.synergyWrModeScore += $scope.PersonalScore.heroesTeam[N].wrModeScore;

				if ($scope.settingsPersonal.formulas.synergyOp == 'multiplied') $scope.PersonalScore.synergyPrsModeScore *= $scope.PersonalScore.heroesTeam[N].prsModeScore;
				else $scope.PersonalScore.synergyPrsModeScore += $scope.PersonalScore.heroesTeam[N].prsModeScore;
			}
			
			$scope.PersonalScore.synergyAdvModeScore = $scope.PersonalScore.synergyAdvModeScore;
			$scope.PersonalScore.synergyWrModeScore = $scope.PersonalScore.synergyWrModeScore;
			$scope.PersonalScore.synergyPrsModeScore = $scope.PersonalScore.synergyPrsModeScore;
			
			$scope.PersonalScore.matchupAdvModeScore = GetCustomFunctionHandler('heroAdvantageScore+heroSynergyScore', ['heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
					heroAdvantageScore: $scope.PersonalScore.advantageAdvModeScore,
					heroSynergyScore: $scope.PersonalScore.synergyAdvModeScore
				});
			$scope.PersonalScore.matchupWrModeScore = GetCustomFunctionHandler('heroAdvantageScore+heroSynergyScore', ['heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
					heroAdvantageScore: $scope.PersonalScore.advantageWrModeScore,
					heroSynergyScore: $scope.PersonalScore.synergyWrModeScore
				});
			$scope.PersonalScore.matchupPrsModeScore = GetCustomFunctionHandler($scope.settingsPersonal.formulas.matchup == 'default'? 'heroAdvantageScore+heroSynergyScore' : $scope.settingsPersonal.formulas.matchup, ['heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
					heroAdvantageScore: $scope.PersonalScore.advantagePrsModeScore,
					heroSynergyScore: $scope.PersonalScore.synergyPrsModeScore
				});

			if ('gamePart' in $scope.heroesJson[$scope.PersonalScore.heroToCompare]) {
				$scope.PersonalScore.partBonus.each[0].bonus = $scope.heroesJson[$scope.PersonalScore.heroToCompare].gamePart[$scope.SkillLevelsJson[$scope.PersonalScore.skillLevel]].early;
				$scope.PersonalScore.partBonus.each[1].bonus = $scope.heroesJson[$scope.PersonalScore.heroToCompare].gamePart[$scope.SkillLevelsJson[$scope.PersonalScore.skillLevel]].mid;
				$scope.PersonalScore.partBonus.each[2].bonus = $scope.heroesJson[$scope.PersonalScore.heroToCompare].gamePart[$scope.SkillLevelsJson[$scope.PersonalScore.skillLevel]].late;
			}
			$scope.PersonalScore.partBonus.nrPartsActive = 0;
			for (var N = 0; N < $scope.PersonalScore.partBonus.each.length; N++)
				if ($scope.PersonalScore.partBonus.each[N].active == 'yes') $scope.PersonalScore.partBonus.nrPartsActive++;
			
			$scope.PersonalScore.partBonus.partAdvModeScore = 0;
			$scope.PersonalScore.partBonus.partWrModeScore = 0;
			if ($scope.settingsPersonal.formulas.partBonusOp == 'multiplied') $scope.PersonalScore.partBonus.partPrsModeScore = 1;
			else $scope.PersonalScore.partBonus.partPrsModeScore = 0;
			
			for (var N = 0; N < $scope.PersonalScore.partBonus.each.length; N++) {
				if ($scope.PersonalScore.partBonus.each[N].active != 'yes') {
					$scope.PersonalScore.partBonus.each[N].thisPartAdvModeScore = 0;
					$scope.PersonalScore.partBonus.each[N].thisPartWrModeScore = 0;
					$scope.PersonalScore.partBonus.each[N].thisPartPrsModeScore = 0;
					continue;
				}
				//max(0.5 * abs(matchupScore), 0.5) * partBonus / nrPartsActive
				$scope.PersonalScore.partBonus.each[N].thisPartAdvModeScore = GetCustomFunctionHandler('max(0.5 * abs(matchupScore), 0.5) * partBonus / nrPartsActive', ['partBonus', 'nrPartsActive', 'matchupScore', 'heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
					partBonus: $scope.PersonalScore.partBonus.each[N].bonus,
					nrPartsActive: $scope.PersonalScore.partBonus.nrPartsActive,
					matchupScore: $scope.PersonalScore.matchupAdvModeScore,
					heroAdvantageScore: $scope.PersonalScore.advantageAdvModeScore,
					heroSynergyScore: $scope.PersonalScore.synergyAdvModeScore
				});
				$scope.PersonalScore.partBonus.each[N].thisPartWrModeScore = GetCustomFunctionHandler('max(0.5 * abs(matchupScore), 0.5) * partBonus / nrPartsActive', ['partBonus', 'nrPartsActive', 'matchupScore', 'heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
						partBonus: $scope.PersonalScore.partBonus.each[N].bonus,
						nrPartsActive: $scope.PersonalScore.partBonus.nrPartsActive,
						matchupScore: $scope.PersonalScore.matchupWrModeScore,
						heroAdvantageScore: $scope.PersonalScore.advantageWrModeScore,
						heroSynergyScore: $scope.PersonalScore.synergyWrModeScore
					});
				$scope.PersonalScore.partBonus.each[N].thisPartPrsModeScore = GetCustomFunctionHandler($scope.settingsPersonal.formulas.partBonus == 'default' ? 'max(0.5 * abs(matchupScore), 0.5) * partBonus / nrPartsActive' : $scope.settingsPersonal.formulas.partBonus, ['partBonus', 'nrPartsActive', 'matchupScore', 'heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
						partBonus: $scope.PersonalScore.partBonus.each[N].bonus,
						nrPartsActive: $scope.PersonalScore.partBonus.nrPartsActive,
						matchupScore: $scope.PersonalScore.matchupPrsModeScore,
						heroAdvantageScore: $scope.PersonalScore.advantagePrsModeScore,
						heroSynergyScore: $scope.PersonalScore.synergyPrsModeScore
					});
				
				$scope.PersonalScore.partBonus.partAdvModeScore += $scope.PersonalScore.partBonus.each[N].thisPartAdvModeScore;
				$scope.PersonalScore.partBonus.partWrModeScore += $scope.PersonalScore.partBonus.each[N].thisPartWrModeScore;
				if ($scope.settingsPersonal.formulas.partBonusOp == 'multiplied') $scope.PersonalScore.partBonus.partPrsModeScore *= $scope.PersonalScore.partBonus.each[N].thisPartPrsModeScore;
				else $scope.PersonalScore.partBonus.partPrsModeScore += $scope.PersonalScore.partBonus.each[N].thisPartPrsModeScore;
			}
			
			$scope.PersonalScore.personalHeroScore = $scope.heroesJson[$scope.PersonalScore.heroToCompare].personalScores.usedScoreUnscaled;
			$scope.PersonalScore.personalHeroScoreScaled = $scope.heroesJson[$scope.PersonalScore.heroToCompare].personalScores.usedScore;
			
			$scope.PersonalScore.personalAdvModeScore = GetCustomFunctionHandler('sgn(personalHeroScoreScaled) * min(abs(personalHeroScoreScaled), 0.75) * abs(matchupScore)', ['personalHeroScore', 'personalHeroScoreScaled', 'matchupScore', 'heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
				personalHeroScore: $scope.PersonalScore.personalHeroScore,
				personalHeroScoreScaled: $scope.PersonalScore.personalHeroScoreScaled,
				matchupScore: $scope.PersonalScore.matchupAdvModeScore,
				heroAdvantageScore: $scope.PersonalScore.advantageAdvModeScore,
				heroSynergyScore: $scope.PersonalScore.synergyAdvModeScore
			});
			$scope.PersonalScore.personalWrModeScore = GetCustomFunctionHandler('sgn(personalHeroScoreScaled) * min(abs(personalHeroScoreScaled), 0.75) * abs(matchupScore)', ['personalHeroScore', 'personalHeroScoreScaled', 'matchupScore', 'heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
				personalHeroScore: $scope.PersonalScore.personalHeroScore,
				personalHeroScoreScaled: $scope.PersonalScore.personalHeroScoreScaled,
				matchupScore: $scope.PersonalScore.matchupWrModeScore,
				heroAdvantageScore: $scope.PersonalScore.advantageWrModeScore,
				heroSynergyScore: $scope.PersonalScore.synergyWrModeScore
			});
			$scope.PersonalScore.personalPrsModeScore = GetCustomFunctionHandler($scope.settingsPersonal.formulas.personal == 'default' ? 'sgn(personalHeroScoreScaled) * min(abs(personalHeroScoreScaled), 0.75) * abs(matchupScore)' : $scope.settingsPersonal.formulas.personal, ['personalHeroScore', 'personalHeroScoreScaled', 'matchupScore', 'heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
				personalHeroScore: $scope.PersonalScore.personalHeroScore,
				personalHeroScoreScaled: $scope.PersonalScore.personalHeroScoreScaled,
				matchupScore: $scope.PersonalScore.matchupPrsModeScore,
				heroAdvantageScore: $scope.PersonalScore.advantagePrsModeScore,
				heroSynergyScore: $scope.PersonalScore.synergyPrsModeScore
			});
			
			//matchupScore + partBonusScore + personalScore
			$scope.PersonalScore.finalAdvModeScore = GetCustomFunctionHandler('matchupScore + partBonusScore + personalScore', ['partBonusScore', 'personalScore', 'matchupScore', 'heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
				partBonusScore: $scope.PersonalScore.partBonus.partAdvModeScore,
				personalScore: $scope.PersonalScore.personalAdvModeScore,
				matchupScore: $scope.PersonalScore.matchupAdvModeScore,
				heroAdvantageScore: $scope.PersonalScore.advantageAdvModeScore,
				heroSynergyScore: $scope.PersonalScore.synergyAdvModeScore
			});
			$scope.PersonalScore.finalWrModeScore = GetCustomFunctionHandler('matchupScore + partBonusScore + personalScore', ['partBonusScore', 'personalScore', 'matchupScore', 'heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
				partBonusScore: $scope.PersonalScore.partBonus.partWrModeScore,
				personalScore: $scope.PersonalScore.personalWrModeScore,
				matchupScore: $scope.PersonalScore.matchupWrModeScore,
				heroAdvantageScore: $scope.PersonalScore.advantageWrModeScore,
				heroSynergyScore: $scope.PersonalScore.synergyWrModeScore
			});
			$scope.PersonalScore.finalPrsModeScore = GetCustomFunctionHandler($scope.settingsPersonal.formulas.finalScore == 'default' ? 'matchupScore + partBonusScore + personalScore' : $scope.settingsPersonal.formulas.finalScore, ['partBonusScore', 'personalScore', 'matchupScore', 'heroAdvantageScore', 'heroSynergyScore'], functionPointers).exec({
				partBonusScore: $scope.PersonalScore.partBonus.partPrsModeScore,
				personalScore: $scope.PersonalScore.personalPrsModeScore,
				matchupScore: $scope.PersonalScore.matchupPrsModeScore,
				heroAdvantageScore: $scope.PersonalScore.advantagePrsModeScore,
				heroSynergyScore: $scope.PersonalScore.synergyPrsModeScore
			});
		
	}
	$scope.RoundDec = RoundDec;
	$scope.FormulaIsValid = function(formula, variables) {
		if (typeof(formula)=='undefined') return false;
		if (formula=='default') return true;
		return GetCustomFunctionHandler(formula, variables, functionPointers).isValid();
	}
	$scope.IsDefault = function(hname) {
		for (var aRole in $scope.heroesJson[hname].rolesJSON)
			if (!(aRole in $scope.heroesJson[hname].rolesJSONDefault))
				return false;
		for (var aRole in $scope.heroesJson[hname].rolesJSONDefault)
			if (!(aRole in $scope.heroesJson[hname].rolesJSON))
				return false;
                for (var aRole in $scope.heroesJson[hname].canRolesJSON)
                        if (!(aRole in $scope.heroesJson[hname].canRolesJSONDefault))
                                return false;
                for (var aRole in $scope.heroesJson[hname].canRolesJSONDefault)
                        if (!(aRole in $scope.heroesJson[hname].canRolesJSON))
                                return false;
		return true;
	}
	$scope.ResetToDefault = function(hname) {
		for (var aRole in $scope.heroesJson[hname].rolesJSON)
			if (!(aRole in $scope.heroesJson[hname].rolesJSONDefault))
				delete $scope.heroesJson[hname].rolesJSON[aRole];
		for (var aRole in $scope.heroesJson[hname].rolesJSONDefault)
			if (!(aRole in $scope.heroesJson[hname].rolesJSON))
				$scope.heroesJson[hname].rolesJSON[aRole] = $scope.heroesJson[hname].rolesJSONDefault[aRole];
                for (var aRole in $scope.heroesJson[hname].canRolesJSON)
                        if (!(aRole in $scope.heroesJson[hname].canRolesJSONDefault))
                                delete $scope.heroesJson[hname].canRolesJSON[aRole];
                for (var aRole in $scope.heroesJson[hname].canRolesJSONDefault)
                        if (!(aRole in $scope.heroesJson[hname].canRolesJSON))
                                $scope.heroesJson[hname].canRolesJSON[aRole] = $scope.heroesJson[hname].canRolesJSONDefault[aRole];
		$scope.ChengedSettings();
		UpdateTutorialPopups();
	}
	$scope.ChengedSettings = function() {
		$scope.NeedSave = 'yes';
	}
	$scope.SaveSettings = function() {
        const personalSettingsJSON = {heroSettings: {}, generalSettings: $scope.settingsPersonal};
        for (let N = 0; N < $scope.heroes.length; N++) {
			if (!($scope.heroes[N].name in personalSettingsJSON.heroSettings)) personalSettingsJSON.heroSettings[$scope.heroes[N].name]={};
			if ($scope.heroes[N].personalSettings.favorite) {
				personalSettingsJSON.heroSettings[$scope.heroes[N].name].favorite = true;
			}
			else if ($scope.heroes[N].personalSettings.disliked) {
				personalSettingsJSON.heroSettings[$scope.heroes[N].name].disliked = true;
			}
			if (!$scope.IsDefault($scope.heroes[N].name)) { {
				personalSettingsJSON.heroSettings[$scope.heroes[N].name].roles = $scope.heroesJson[$scope.heroes[N].name].rolesJSON;
				personalSettingsJSON.heroSettings[$scope.heroes[N].name].canRoles = $scope.heroesJson[$scope.heroes[N].name].canRolesJSON;
			}
			} else
				personalSettingsJSON.heroSettings[$scope.heroes[N].name].roles = 'default';
		}
		console.log(personalSettingsJSON);
		$scope.NeedSave = 'saving';
		
		$http.post('/api/settings/set', {personal: personalSettingsJSON}).
		then(function (success){
            const data = success.data, status = success.status, headers = success.headers, config = success.config;
            if ($scope.NeedSave == 'saving')
				$scope.NeedSave = 'no';
		}, function(err) {});
	}
	$scope.ChengedFormula = function() {
		$scope.ChengedSettings();
		$scope.RecalculatePersonalScores();
	}
	window.onbeforeunload = function (e) {
		if ($scope.NeedSave == 'no') return undefined;
		return "Are you sure you want to leave without saving your settings first?";      
	};
}]);

pickerApp.controller('HeroInfoCtrl', ['$scope', '$http', 'heroes', function($scope, $http, heroesLib) {
	$scope.Math = Math;
	AddFullHeroInfoInController($scope, $http, heroesLib);
	AddHeroesWinrateInfo($scope, $http, heroesLib, '10d');
}]);
function AddFullHeroInfoInController($scope, $http, heroesLib) {
	$scope.Math = Math;
	$scope.hero = hero;
	$scope.skillLevel = 0;
	
	$scope.adv = {};
	$scope.show = {};
	
    $scope.heroesGraph = [];
    $scope.times = ['a5', 'a10', 'a15', 'a20', 'a25', 'a30', 'a35', 'a40', 'a45'];
	
	$scope.SortScores = function () {
		//poate fi apelat cand se schimba skill level
		$scope.adv.heroSynergyScores = [];
		$scope.adv.heroAdvantageScoresRev = [];
		$scope.adv.heroSynergyScoresRev = [];
		for (let N = 0; N < $scope.adv.heroAdvantageScores.length; N++) {
			$scope.adv.heroSynergyScores.push($scope.adv.heroAdvantageScores[N]);
			$scope.adv.heroAdvantageScoresRev.push($scope.adv.heroAdvantageScores[N]);
			$scope.adv.heroSynergyScoresRev.push($scope.adv.heroAdvantageScores[N]);
		}

        const advUse = $scope.show.sort == 'adv' ? 'advantage' : 'winrate';
        const synUse = $scope.show.sort == 'adv' ? 'synergy' : 'winrateteam';
        $scope.adv.heroAdvantageScores.sort(function(a,b) { return b[advUse][$scope.skillLevel] - a[advUse][$scope.skillLevel]; });
		$scope.adv.heroSynergyScores.sort(function(a,b) { return b[synUse][$scope.skillLevel] - a[synUse][$scope.skillLevel]; });
		$scope.adv.heroAdvantageScoresRev.sort(function(a,b) { return a[advUse][$scope.skillLevel] - b[advUse][$scope.skillLevel]; });
		$scope.adv.heroSynergyScoresRev.sort(function(a,b) { return a[synUse][$scope.skillLevel] - b[synUse][$scope.skillLevel]; });
		
	}
	$scope.SetSkillLvl = function (nr) { $scope.skillLevel = nr; $scope.SortScores(); };
	$scope.LiniarScale = function(val, min, max) {
	   if (val < min) val = min;
	   if (val > max) val = max;
	   return (val - min) / (max - min);
	}
	$scope.RecalculateScores = function() {
		if (!('advantage' in $scope.heroesJson[$scope.hero])) return;
        const heroAdvantageScores = [];
        for (aHero in $scope.heroesJson) {
            const aHeroScore = {name: aHero};
            if ('advantageUnscaled' in $scope.heroInfo) {
				if ($scope.heroInfo.advantageUnscaled[$scope.heroesJson[aHero].id] == null) continue;
				aHeroScore.advantage = $scope.heroInfo.advantageUnscaled[$scope.heroesJson[aHero].id];
			}
			if ('synergyUnscaled' in $scope.heroInfo) {
				if ($scope.heroInfo.synergyUnscaled[$scope.heroesJson[aHero].id] == null) continue;
				aHeroScore.synergy = $scope.heroInfo.synergyUnscaled[$scope.heroesJson[aHero].id];
			}
			if ('winrateUnscaled' in $scope.heroInfo) {
				if ($scope.heroInfo.winrateUnscaled[$scope.heroesJson[aHero].id] == null) continue;
				aHeroScore.winrate = $scope.heroInfo.winrateUnscaled[$scope.heroesJson[aHero].id];
			}
			if ('winrateteamUnscaled' in $scope.heroInfo) {
				if ($scope.heroInfo.winrateteamUnscaled[$scope.heroesJson[aHero].id] == null) continue;
				aHeroScore.winrateteam = $scope.heroInfo.winrateteamUnscaled[$scope.heroesJson[aHero].id];
			}
			heroAdvantageScores.push(aHeroScore);
		}
		$scope.adv.heroAdvantageScores = heroAdvantageScores;
		$scope.SortScores();
	}
	
	AddHeroesInfo($scope, heroesLib, function() {
		$scope.heroInfo = $scope.heroesJson[$scope.hero];
		AddPersonalSettings($http, $scope, function() {
			
		});
		AddHeroesAdvScores($scope, heroesLib, function(){
			AddHeroesWinScores($scope, heroesLib, function() {
				$scope.RecalculateScores();
			});
		});
		AddHeroesTimeAdv($scope, heroesLib, function(){
		});
		AddHeroesPersonal($http, $scope, false, function(){
		});
		AddHeroBio($http, $scope, function(){
		});
		AddHeroSpells($http, $scope, function(){
			$scope.spellsInfo = $scope.spells.heroes[$scope.hero]
		});
		
		AddHeroesTimeAdv($scope, heroesLib, function() {
            const aColumns = [
                ['x', 5, 10, 15, 20, 25, 30, 35, 40, 45]
            ];

            for (let sN = 0; sN < $scope.SkillLevels.length; sN++) {
                const aRow = [];
                for (let tN = 0; tN < $scope.times.length; tN++)
					aRow.push($scope.heroInfo.timewin[sN][$scope.times[tN]]);
				aColumns.push([$scope.SkillLevels[sN]+' Skill'].concat(aRow));
			}
			
			c3.generate({
				bindto: '#chart',
				data: {
					x: 'x',
					columns: aColumns,
					type: 'spline'
				},
				size: {
					width: 600,
					height: 250
				},
				tooltip: {
					grouped: false,
					format: {
						title: function(d) {
							return '<span style="color: black;"> minute ' + d + '</span>';
						},
						name: function(name, ratio, id, index) {
							return '<span style="color: black;width: 80px;">' + name + '</span>';
						},
						value: function(value, ratio, id) {
							return '<span style="color: black;width: 40px;">' + Math.round(value*10000)/100 + '%</span>';
						}
					}
				},
				axis: {
					y: {
						tick: {
							format: function(d) {
								return Math.round(d * 10000) / 100 + '%';
							}
						}
					},
					x: {
						tick: {
							format: function(d) {
								return d + 'min';
							}
						}
					}
				}
			});
		});
		
		UpdateTutorialPopups();
		
	});
	AddHeroTips($http, $scope, function(){
	});	
}

pickerApp.controller('AllHeroInfoCtrl', ['$scope', 'heroes', function($scope, heroesLib) {
	AddHeroesInfo($scope, heroesLib, function() {
	});
}]);


//FILTERS
{
    function HeroIsSearched(item, lowSearchText) {
        for (let N = 0; N < item.searchTerms.length; N++)
            if (item.searchTerms[N].indexOf(lowSearchText) != -1)
                return true;
        return false;
    }

    function HeroIsSearchedStrict(item, lowSearchText) {
        for (let N = 0; N < item.searchTerms.length; N++)
            if (item.searchTerms[N] == lowSearchText)
                return true;
        return false;
    }

    pickerApp.filter('searchMatch', function() {
        return function(items, searchText) {
            if (typeof(searchText) == 'undefined' || searchText == '')
                return items;
            const filtered = [];
            const lowSearchText = searchText.toLowerCase();
            angular.forEach(items, function(item, ind) {
                if (HeroIsSearched(item, lowSearchText))
                    filtered.push(item);
            });
            return filtered;
        };
    });

    pickerApp.filter('searchMatchStrict', function() {
        return function(items, searchText) {
            if (typeof(searchText) == 'undefined' || searchText == '')
                return items;
            const filtered = [];
            const filteredStrict = [];
            const lowSearchText = searchText.toLowerCase();
            angular.forEach(items, function(item, ind) {
                if (HeroIsSearched(item, lowSearchText)) {
                    if (HeroIsSearchedStrict(item, lowSearchText)) filteredStrict.push(item);
                    else filtered.push(item);
                }
            });
            return filteredStrict.concat(filtered);
        };
    });

    pickerApp.filter('splitSuggestions', function() {
        return function(items, showWhat, first) {
            //ng-if="categ.types.indexOf(show.suggestions)!=-1"
            const filtered = [];
            const split = {
                lanes: 4,
                roles: 4
            };
            let found = 0;
            for (let N = 0; N < items.length; N++)
                if (items[N].types.indexOf(showWhat) != -1) {
                    found++;
                    if (first && found <= split[showWhat])
                        filtered.push(items[N]);
                    else if (!first && found > split[showWhat])
                        filtered.push(items[N]);
                }
            return filtered;
        };
    });
    pickerApp.filter('showAllSuggestions', function() {
        return function(items, showWhat) {
            //ng-if="categ.types.indexOf(show.suggestions)!=-1"
            const filtered = [];
            for (let N = 0; N < items.length; N++)
                if (items[N].types.indexOf(showWhat) != -1)
                       filtered.push(items[N]);
            return filtered;
        };
    });
	
	pickerApp.filter('reverse', function() {
	  return function(items) {
		return items.slice().reverse();
	  };
	});
}
