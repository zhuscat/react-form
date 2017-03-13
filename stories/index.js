import React from 'react';
import { storiesOf, action, linkTo } from '@kadira/storybook';
import TestForm from '../examples/TestForm';
import TestForm2 from '../examples/TestForm2';

storiesOf('Form', module)
  .add('Simple', () => (
    <TestForm />
  ))
  .add('With Redux', () => {
    return <TestForm2 />
  });