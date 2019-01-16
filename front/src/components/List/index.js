import List from './List';
import React from 'react';
import {Core} from '../';

import './style.scss';

const ListWrapper = (props) => <Core {...props}><List {...props}/></Core>;

export default ListWrapper;