import React from 'react';
import * as R from 'ramda'
import {connect} from "react-redux";
import {createSelector} from 'reselect';
// import createCachedSelector from 're-reselect';

import {
    initialize,
    increment,
    decrement
} from './redux/actions';

import './index.scss';

class Explain extends React.Component {
    render() {

        const {rootClass, data} = this.props;

        console.log('RENDER EXPLAIN');

        return(
            <div className={rootClass ? `${rootClass}__explain` : 'explain'}>
                {data.text}
            </div>
        )
    }
}

class Dummy extends React.PureComponent {

    onIncrement = () => {
        this.props.increment();
    };

    onDecrement = () => {
        this.props.decrement();
    };

    onReset = () => {
        this.props.initialize();
    };

    render() {

        const {item, explainObject} = this.props;

        console.log('RENDER DUMMY');
        return (
            <div className={`dummy`}>
                <div className={`dummy-count`}>
                    <div className={`dummy-count__value`}>{`${item.text}`}</div>
                    <Explain rootClass={`dummy-count`} data={explainObject} />
                </div>
                <div className={`dummy-buttons`}>
                    <div className={`dummy-buttons__item`} onClick={this.onIncrement}>
                        +
                    </div>
                    <div className={`dummy-buttons__item`} onClick={this.onDecrement}>
                        -
                    </div>
                    <div className={`dummy-buttons__item`} onClick={this.onReset}>
                        Reset
                    </div>
                </div>
            </div>
        )
    }
}

const countSelector = R.prop('count');
const itemsSelector = R.prop('objects');

const itemSelector = createSelector(
    countSelector,
    itemsSelector,
    (step, items) => R.path([step], items)
);

const itemExplainSelector = createSelector(
    countSelector,
    itemsSelector,
    (count, items) => R.path([count, 'inner'], items)
);

const mapStateToProps = state => ({
    count: countSelector(state.Dummy),
    item: itemSelector(state.Dummy),
    explainObject:  itemExplainSelector(state.Dummy)
});

const mapDispatchers = {
    initialize,
    increment,
    decrement
};
export default connect(mapStateToProps, mapDispatchers)(Dummy);