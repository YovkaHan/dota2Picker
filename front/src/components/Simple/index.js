import Simple from './Simple';
import React from 'react';
import {Core} from '../';

const SimpleWrapper = (props) => <Core {...props}><Simple/></Core>;

export default SimpleWrapper;