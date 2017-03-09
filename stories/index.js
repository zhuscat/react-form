import React from 'react';
import { storiesOf, action, linkTo } from '@kadira/storybook';
import TestForm from '../src/TestForm';

storiesOf('Form', module)
  .add('demo', () => (
    <TestForm />
  ));