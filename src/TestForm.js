import React, { Component, PropTypes } from 'react';
import Input from './Input';
import createForm from './Form';
import FormItem from './FormItem';

class TestForm extends Component {
  render() {
    return (
      <form>
        <FormItem>
          <Input {...this.props.form.getInputProps('username', {
            validates: [
              {
                rules: [{
                  validator: (value, inputdata, callback) => {
                    setTimeout(() => {
                      callback(new Error('不合法的输入'));
                    }, 1000);
                  },
                }],
                triggers: ['onChange', 'onBlur'],
              },
            ]
          })} />
        </FormItem>
      </form>
    )
  }
}

export default createForm(TestForm);
