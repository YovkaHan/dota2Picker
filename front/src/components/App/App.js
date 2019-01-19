import React from 'react';

import {
    Socket,
    Storage,
    StorageAdvStat,
    StorageWinStat,
    List,
    PickList,
    CounterPicker,
    StorageCounterPickerDefault
} from '../';
import Dummy from '../Dummy';

import './style.scss';
import CounterPickerWrapper from "../CounterPicker";

const pcbTemplate = {
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
            Core: {
                id: 'core4'
            },
            Storage0: {
                id: 'core1'
            },
            Storage1: {
                id: 'core2'
            },
            Storage2: {
                id: 'core3'
            }
        }
    },
    CounterPicker: {
        id: 'cpiker0',
        relations: {
            Core: {
                id: 'core5'
            },
            Storage0: {
                id: 'core1'
            },
            Storage1: {
                id: 'core4'
            },
            Radiant: {
                id: 'list1'
            },
            Dire: {
                id: 'list2'
            }
        },
        children: [
            {
                alias: 'Табы',
                name: 'Tabs'
            },
            {
                alias: 'RadiantSuggestedPicks',
                name: 'RadiantList'
            }
        ]
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

function pcbGenerate(template) {
    const generated = {...template};
    generated.make = (name) => {
        let result = undefined;
        if (template.hasOwnProperty(name)) {
            result = {
                ...template[name],
                make: generated.make,
                children: (() => {
                    const result = {};
                    template[name].children ? template[name].children.map(child => {
                        template[Object.keys(template).find(key => {
                            if (key === child.name) {
                                result[child.alias] = {...template[key], name: child.name};
                                return true;
                            }
                            return false
                        })];
                    }) : {};
                    return result;
                })()
            }
        }
        return result;
    };
    return generated;
}

export default class App extends React.Component {
    constructor() {
        super();

        this.state = {};
        this.pcb = pcbGenerate(pcbTemplate);
    }

    componentDidMount() {
    }

    render() {

        return (
            <React.Fragment>
                <Storage pcb={this.pcb.make('Storage')}/>
                <StorageAdvStat pcb={this.pcb.make('StorageAdvStat')}/>
                <StorageWinStat pcb={this.pcb.make('StorageWinStat')}/>
                <StorageCounterPickerDefault pcb={this.pcb.make('StorageCounterPickerDefault')}/>

                {/**Layout*/}
                <div className={`the-app dota-picker`}>
                    <div className={`dota-picker__item heroes`}>
                        <List pcb={this.pcb.make('List')} rootClass={`heroes-list`}/>
                    </div>
                    <div className={`dota-picker__item match`}>
                        <div className={`picks`}>
                            <PickList pcb={this.pcb.make('Radiant')} rootClass={'radiant-team'}/>
                            <PickList pcb={this.pcb.make('Dire')} rootClass={'dire-team'}/>
                        </div>
                        <div className={`picker`}>
                            <CounterPicker pcb={this.pcb.make('CounterPicker')}/>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}