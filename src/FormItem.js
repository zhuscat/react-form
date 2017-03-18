import React, { Component, PropTypes } from 'react';

const STATUS_OK = 0;
const STATUS_VALIDATING = 1;
const STATUS_ERROR = 2;

const propTypes = {
  className: PropTypes.string,
  infoClassName: PropTypes.string,
  okClassName: PropTypes.string,
  validatingClassName: PropTypes.string,
  errorClassName: PropTypes.string,
};

const defaultProps = {
  className: 'zc-form-item',
  infoClassName: 'zc-form-item-info',
  okClassName: '',
  validatingClassName: '',
  errorClassName: '',
}

export default class FormItem extends Component {
  getInputStatus() {
    const isValidating = this.context.isInputValidating(this.props.children.props.name);
    const errors = this.context.getInputErrors(this.props.children.props.name);
    if (isValidating) {
      return STATUS_VALIDATING;
    } else if (errors.length > 0) {
      return STATUS_ERROR;
    }
    return STATUS_OK;
  }

  renderField() {
    const status = this.getInputStatus();
    // TODO: still need to improve the code
    let wrapperClassName;
    switch (status) {
      case STATUS_OK:
        wrapperClassName = 'status-ok';
      case STATUS_VALIDATING:
        wrapperClassName = 'status-validating';
      case STATUS_ERROR:
        wrapperClassName = 'status-error';
    }
    let indicatorClassName = '';
    switch (status) {
      case STATUS_OK:
        indicatorClassName = this.props.okClassName;
      case STATUS_VALIDATING:
        indicatorClassName = this.props.validatingClassName;
      case STATUS_ERROR:
        indicatorClassName = this.props.errorClassName;
    }
    return (
      <div className={wrapperClassName} style={{ position: 'relative' }}>
        {this.props.children}
        <i className={indicatorClassName} />
      </div>
    );
  }

  renderError() {
    if (this.getInputStatus() === STATUS_ERROR) {
      const errors = this.context.getInputErrors(this.props.children.props.name);
      const errorStr = errors.filter((error) => {
        return !!error;
      }).map((error) => {
        return error.message;
      }).join(', ');
      return (
        <div style={{ position: 'relative' }}>
          <span className={this.props.infoClassName}>{errorStr}</span>
        </div>
      );
    }
    return '';
  }

  render() {
    return (
      <div className={this.props.className}>
        {this.renderField()}
        {this.renderError()}
      </div>
    );
  }
}

FormItem.propTypes = propTypes;
FormItem.defaultProps = defaultProps;

FormItem.contextTypes = {
  isInputValidating: PropTypes.func,
  getInputErrors: PropTypes.func,
}
