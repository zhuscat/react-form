import React, { Component, PropTypes } from 'react';
import Validator from './Validator';

export default function createForm(WrappedComponent) {
  class Form extends Component {
    constructor(props) {
      super(props);
      this.inputdata = {};
      this.metadata = {};
      this.getInputProps = this.getInputProps.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.handleValidateChange = this.handleValidateChange.bind(this);
      this.isInputValidating = this.isInputValidating.bind(this);
      this.validateAllInputs = this.validateAllInputs.bind(this);
      this.getNameValues = this.getNameValues.bind(this);
      this.cachedFunctions = {};
    }

    getChildContext() {
      return {
        isInputValidating: this.isInputValidating,
        validateAllInputs: this.validateAllInputs,
        getNameValues: this.getNameValues,
      };
    }

    getInput(name) {
      return {
        name,
        ...this.inputdata[name],
      };
    }

    getValue(name) {
      if (this.inputdata[name] && (this.inputdata[name].value != null)) {
        return this.inputdata[name].value;
      }
      if (this.metadata[name].initialValue) {
        return this.metadata[name].initialValue;
      }
      // 最后 return '' 有待商榷
      return '';
    }

    getNameValues() {
      const nameValueMap = {};
      Object.keys(this.inputdata).forEach((name) => {
        nameValueMap[name] = this.inputdata[name].value;
      });
      return nameValueMap;
    }

    getNameNeededValidated() {
      return Object.keys(this.metadata).filter((name) => {
        return !!this.metadata[name].validates;
      });
    }

    isInputValidating(name) {
      const input = this.getInput(name);
      if (input.isValidating) {
        return true;
      }
      return false;
    }

    handleValidateChange(name, trigger, event) {
      const newInput = this.getInput(name);
      newInput.isValidating = true;
      newInput.value = event.target.value;
      this.inputdata[name] = newInput;
      this.forceUpdate();
      const meta = this.metadata[name];
      const { validates } = meta;
      const rules = validates[trigger];
      this.validateInput(name, trigger);
    }

    handleChange(name, event) {
      this.inputdata[name] = {
        name,
        value: event.target.value,
        isValidating: false,
      }
      this.forceUpdate();
    }

    validateInput(name, trigger, callback) {
      this.inputdata[name].isValidating = true;
      // 调整参数
      if (typeof trigger === 'function') {
        callback = trigger;
        trigger = undefined;
      }
      const meta = this.metadata[name];
      let { validates } = meta;

      if (trigger) {
        validates = validates.filter((validate) => {
          if (!validate.triggers) {
            return true;
          } else if (validate.triggers.includes(trigger)) {
            return true;
          }
          return false;
        });
      }

      const namevalues = this.getNameValues();
      const description = {};
      description[name] = [];
      validates.forEach((validate) => {
        const { rules } = validate;
        description[name].push(...rules);
      });
      const validator = new Validator(description);
      this.testValue = this.testValue + 1;
      validator.validate(namevalues, (errMap, namevalues) => {
        callback && callback(errMap, namevalues);
        this.testValue = this.testValue - 1;
        this.inputdata[name].isValidating = false;
        this.forceUpdate();
      });
    }

    validateInputs(names, callback) {
      names.forEach((name) => {
        this.inputdata[name].isValidating = true;
      });
      const errorMap = {};
      let len = names.length;
      const namevalues = this.getNameValues();
      const description = {};
      Object.keys(this.metadata).forEach((name) => {
        description[name] = [];
        const { validates } = this.metadata[name];
        validates.forEach((validate) => {
          const { rules } = validate;
          description[name].push(...rules);
        });
      });
      const validator = new Validator(description);
      validator.validate(namevalues, (errorMap, namevalues) => {
        names.forEach((name) => {
          this.inputdata[name].isValidating = false;
        });
        callback(errorMap, namevalues);
        this.forceUpdate();
      });
      this.forceUpdate();
    }

    validateAllInputs(callback) {
      const names = this.getNameNeededValidated();
      this.validateInputs(names, callback);
    }

    getCachedFunction(name, trigger, fn) {
      if (this.cachedFunctions[name] && this.cachedFunctions[name][trigger]) {
        return this.cachedFunctions[name][trigger];
      }
      // 这里可能能再简化的优雅一点
      if (!this.cachedFunctions[name]) {
        this.cachedFunctions[name] = {};
      }
      this.cachedFunctions[name][trigger] = fn.bind(this, name, trigger);
      return this.cachedFunctions[name][trigger];
    }

    getInputProps(name, options) {
      if (!this.metadata[name]) {
        const meta = {};
        const { validates, initialValue } = options;
        meta.initialValue = initialValue;
        meta.validates = validates;
        this.metadata[name] = meta;
      }

      const inputProps = {};
      const { validates } = this.metadata[name];
      validates.forEach((validate) => {
        const triggers = validate.triggers || ['onChange'];
        triggers.forEach((trigger) => {
          inputProps[trigger] = this.getCachedFunction(name, trigger, this.handleValidateChange);
        });
      });

      if (!inputProps.hasOwnProperty('onChange')) {
        inputProps['onChange'] = this.getCachedFunction(name, 'onChange', this.handleChange);
      }

      return {
        name,
        value: this.getValue(name) || '',
        ...inputProps,
      };
    }

    render() {
      const props = {
        getInputProps: this.getInputProps,
        validateAllInputs: this.validateAllInputs,
        getNameValues: this.getNameValues,
      };

      return <WrappedComponent form={props} />
    }
  }

  Form.childContextTypes = {
    isInputValidating: PropTypes.func,
    validateAllInputs: PropTypes.func,
    getNameValues: PropTypes.func,
  }

  return Form;
}
