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
                  validator: (value, formdata, callback) => {
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
        <FormItem>
          <Input {...this.props.form.getInputProps('password', {
            validates: [
              {
                rules: [{
                  validator: (value, formdata, callback) => {
                    setTimeout(() => {
                      callback(new Error('不合法输入'));
                    }, 1000);
                  },
                }],
                triggers: ['onChange', 'onBlur'],
              },
            ]
          })} />
        </FormItem>
        <button onClick={(e) => {
          e.preventDefault();
          console.log(this.props.form.getNameValues());
        }}>提交</button>
      </form>
    )
  }
}

export default createForm(TestForm);
