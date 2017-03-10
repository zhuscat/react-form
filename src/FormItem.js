import React, { Component, PropTypes } from 'react';

export default class FormItem extends Component {
  render() {
    const status = this.context.isInputValidating(this.props.children.props.name);
    return (
      <div>
      { status ? '验证中' : ''}
      {this.props.children}
      </div>
    );
  }
}

FormItem.contextTypes = {
  isInputValidating: PropTypes.func,
}
