import React, { Component, PropTypes } from 'react';
import Input from '../src/Input';
import createForm from '../src/Form';
import FormItem from '../src/FormItem';
import { Provider, connect } from 'react-redux';
import { combineReducers } from 'redux';
import { createStore } from 'redux';

class TestForm extends Component {
  render() {
    return (
      <form>
        <FormItem>
          <Input {...this.props.form.getInputProps('username', {
            initialValue: 'username',
            onlyFirst: true, // default false
            validates: [
              {
                rules: [{
                  required: true
                },
                {
                  validator: (value, rule, formdata, callback) => {
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
                  validator: (value, rule, formdata, callback) => {
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
        <FormItem>
          <Input {...this.props.form.getInputProps('nickname', {
            validates: [
              {
                rules: [
                  {
                    required: true,
                    type: 'string',
                    max: 20,
                    min: 5,
                  },
                  {
                  validator: (value, rule, formdata, callback) => {
                    setTimeout(() => {
                      callback(new Error('不合法输入'));
                    }, 1000);
                  },
                }],
                triggers: ['onBlur'],
              },
            ]
          })} />
        </FormItem>
        <button onClick={(e) => {
          e.preventDefault();
          this.props.form.validateAllInputs((err, namevalues) => {
            console.log(err);
          })
        }}>提交</button>
      </form>
    )
  }
}

function form(state = {
  username: {
    value: 'Mapped',
  },
  password: {
    value: 'yaha',
  },
  nickname: {
    value: 'nick',
  },
}, action) {
  switch (action.type) {
    case 'UPDATE_FORM':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}

const createdForm = createForm(TestForm, {
  mapPropsToFormData(props) {
    return {
      username: props.username,
      password: props.password,
      nickname: props.nickname,
    };
  },
  onChange(formdata, props) {
    props.dispatch({
      type: 'UPDATE_FORM',
      payload: formdata,
    });
  },
});

function mapStateToProps(state) {
  return {
    username: state.form.username,
    password: state.form.password,
    nickname: state.form.nickname,
  };
}

const ConnectedForm = connect(mapStateToProps)(createdForm);


const store = createStore(combineReducers({
  form,
}));

export default class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <ConnectedForm />
      </Provider>
    );
  }
}
