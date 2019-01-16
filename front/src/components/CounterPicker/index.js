import CounterPicker from './CounterPicker';
import React from 'react';
import './style.scss';
import {Core} from '../index';

const CounterPickerWrapper = (props) => <Core {...props}><CounterPicker/></Core>;

export default CounterPickerWrapper;