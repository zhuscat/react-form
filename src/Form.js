import React, { Component, PropTypes } from 'react';
import Validator from './Validator';

// 当触发异步验证的时候，可能会在短时间内多次触发，使用该ID确保返回的是正确的验证回调
let validateId = 0;

export default function createForm(WrappedComponent) {
  class Form extends Component {
    constructor(props) {
      super(props);
      this.formdata = {};
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
        ...this.formdata[name],
      };
    }

    setInputs(newInputs) {
      this.formdata = {
        ...this.formdata,
        ...newInputs,
      }
      this.forceUpdate();
    };

    getValue(name) {
      if (this.formdata[name] && (this.formdata[name].value != null)) {
        return this.formdata[name].value;
      }
      if (this.metadata[name].initialValue) {
        return this.metadata[name].initialValue;
      }
      // 最后 return '' 有待商榷
      return '';
    }

    getNameValues() {
      const nameValueMap = {};
      Object.keys(this.formdata).forEach((name) => {
        nameValueMap[name] = this.formdata[name].value;
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
      newInput.value = event.target.value;
      newInput.dirty = true;
      newInput.isValidating = true;
      this.setInputs({
        [name]: newInput,
      });
      const meta = this.metadata[name];
      const { validates } = meta;
      const rules = validates[trigger];
      this.validateInput(name, trigger);
    }

    handleChange(name, trigger, event) {
      const newInput = this.getInput(name);
      newInput.value = event.target.value;
      // 说明值发生了改变，如果 dirty 为 false，不需要触发验证
      newInput.dirty = true;
      newInput.isValidating = false;
      this.setInputs({
        [name]: newInput,
      });
    }

    validateInput(name, trigger, callback) {
      const input = this.getInput(name);
      if (input.dirty === false) {
        return;
      }
      this.formdata[name].isValidating = true;
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
        if (namevalues[name] === this.formdata[name].value) {
          callback && callback(errMap, namevalues);
          this.formdata[name].isValidating = false;
          this.forceUpdate();
        }
      });
    }

    validateInputs(names, callback) {
      const newInputs = {};
      // 形成了闭包
      const currentValidateId = validateId;
      ++validateId;
      names.forEach((name) => {
        const newInput = this.getInput(name);
        if (newInput.dirty === false) {
          return;
        }
        newInput.isValidating = true;
        newInputs[name] = newInput;
        this.metadata[name].validateId = currentValidateId;
      });
      this.setInputs(newInputs);
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
        const newInputs = {};
        names.forEach((name) => {
          if (currentValidateId === this.metadata[name].validateId) {
            const newInput = this.getInput(name);
            newInput.isValidating = false;
            newInput.dirty = false;
            newInputs[name] = newInput;
          }
        });
        callback(errorMap, namevalues);
        this.setInputs(newInputs);
      });
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
        value: this.getValue(name),
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
