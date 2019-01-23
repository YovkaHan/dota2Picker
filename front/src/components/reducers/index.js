import Core from '../Core/redux/reducer';
import List from '../List/redux/reducer';
import PickList from '../PickList/redux/reducer';
import Tabs from '../Tabs/redux/reducer';
import ListSuggested from '../ListSuggested/redux/reducer';
import {combineReducers} from 'redux';
import produce from "immer";

export function actionTemplate (sequence, template, divider){
    const result = {};

    Object.keys(template.root).map(k => {
        result[template.root[k]] = sequence.map(i=> i === 'root' ? template.root[k] : template[i]).join(divider);
    });

    return result
}

export function createReducer(cases = () => {}, defaultState = {}, id) {
    return (
        state = defaultState,
        action
    ) =>
        produce(state, draft => {
            if (action && action.type && action.id === id) {
                cases(action.type)(draft, action.payload);
            }
        });
}

export default {
    Components: combineReducers({
        Core: combineReducers({
            core0: Core('core0'), /** Heroes-List **/
            core1: Core('core1'), /** Storage **/
            core2: Core('core2'), /** StorageAdvStat **/
            core3: Core('core3'), /** StorageWinStat **/
            core4: Core('core4'), /** StorageCounterPickerDefault **/
            core5: Core('core5'), /** CounterPicker **/
        }),
        List: combineReducers({
            list0: List('list0'), /** Heroes-List **/
            list1: PickList('list1'), /** Radiant Picks/Bans **/
            list2: PickList('list2'), /** Dire Picks/Bans **/
            list3: ListSuggested('list3'), /** Radiant Picks Suggestions **/
            list4: ListSuggested('list4')  /** Dire Picks Suggestions **/
        }),
        Tabs: combineReducers(({
            tabs0: Tabs('tabs0'),
            tabs1: Tabs('tabs1')
        }))
    })
};
