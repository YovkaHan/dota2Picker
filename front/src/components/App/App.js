import React from 'react';

import {Socket, Storage, StorageAdvStat, StorageWinStat, List, PickList, CounterPicker, StorageCounterPickerDefault} from '../';
import Dummy from '../Dummy';

import './style.scss';
import CounterPickerWrapper from "../CounterPicker";

const pcb = {
    Storage: {
        id: 'storage0',
        relations: {
            Core: {
                id: 'core1'
            },
        }
    },
    StorageAdvStat: {
        id: 'storage1',
        relations: {
            Core: {
                id: 'core2'
            },
        }
    },
    StorageWinStat: {
        id: 'storage2',
        relations: {
            Core: {
                id: 'core3'
            },
        }
    },
    List: {
        id: 'list0',
        relations: {
            Core: {
                id: 'core0'
            },
            Storage: {
                id: 'core4'
            },
            Radiant: {
                id: 'list1',
            },
            Dire: {
                id: 'list2',
            }
        }
    },
    Radiant: {
        id: 'list1',
        relations: {
            Data: {
                id: 'core4'
            }
        }
    },
    Dire: {
        id: 'list2',
        relations: {
            Data: {
                id: 'core4'
            }
        }
    },
    StorageCounterPickerDefault: {
        id: 'storage3',
        relations: {
            Core:  {
                id:  'core4'
            },
            Storage0: {
                id:  'core1'
            },
            Storage1:{
                id:  'core2'
            }
        }
    },
    CounterPicker: {
        id: 'cpiker0',
        relations: {
            Core: {
                id:  'core5'
            },
            Storage0: {
                id:  'core1'
            },
            Storage1:{
                id:  'core4'
            },
            Radiant: {
                id: 'list1'
            },
            Dire: {
                id: 'list2'
            }
        }
    },
    RadiantList: {
        id: 'list3',
        relations: {
            Storage: {
                id: 'core5'
            }
        }
    },
    DireList: {
        id: 'list4',
        relations: {
            Storage: {
                id: 'core5'
            }
        }
    },
    Tabs: {
        id: 'tabs0'
    }
};

export default class App extends React.Component {
    constructor() {
        super();

        this.state = {}

    }

    componentDidMount() {
    }

    render() {

        return (
            <React.Fragment>
                <Storage pcb={pcb.Storage}/>
                <StorageAdvStat pcb={pcb.StorageAdvStat}/>
                {/*<StorageWinStat pcb={pcb.StorageWinStat}/>*/}
                <StorageCounterPickerDefault pcb={pcb.StorageCounterPickerDefault}/>

                {/**Layout*/}
                <div className={`the-app dota-picker`}>
                    <div className={`dota-picker__item heroes`}>
                        <List pcb={pcb.List} rootClass={`heroes-list`}/>
                    </div>
                    <div className={`dota-picker__item match`}>
                        <div className={`picks`}>
                            <PickList pcb={pcb.Radiant} rootClass={'radiant-team'}/>
                            <PickList pcb={pcb.Dire} rootClass={'dire-team'}/>
                        </div>
                        <div className={`picker`}>
                            <CounterPicker  pcb={pcb.CounterPicker}/>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}