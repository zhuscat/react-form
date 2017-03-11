import React, { Component, PropTypes } from 'react';

export default class FormItem extends Component {
  render() {
    const status = this.context.isInputValidating(this.props.children.props.name);
    return (
      <div>
      {this.props.children}
      { status ? '验证中' : ''}
      </div>
    );
  }
}

FormItem.contextTypes = {
  isInputValidating: PropTypes.func,
}
