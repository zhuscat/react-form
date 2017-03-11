import React, { Component, PropTypes } from 'react';

export default class FormItem extends Component {
  render() {
    const status = this.context.isInputValidating(this.props.children.props.name);
    const errors = this.context.getInputErrors(this.props.children.props.name);
    return (
      <div>
      {this.props.children}
      { status ? '验证中' : ''}
        <div>
        {errors.map((error) => {
          if (error) {
            return <span>{error.message}</span>;
          }
          return ''
        })}
        </div>
      </div>
    );
  }
}

FormItem.contextTypes = {
  isInputValidating: PropTypes.func,
  getInputErrors: PropTypes.func,
}
