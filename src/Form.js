import React, { Component, PropTypes } from 'react';
import Validator from './Validator';

// 当触发异步验证的时候，可能会在短时间内多次触发，使用该ID确保返回的是正确的验证回调
let validateId = 0;

export default function createForm(WrappedComponent, options = {}) {
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
      this.getInputErrors = this.getInputErrors.bind(this);
      this.cachedFunctions = {};

      if (options.mapPropsToFormData) {
        this.formdata = options.mapPropsToFormData(props);
      }
    }

    componentWillReceiveProps(nextProps) {
      if (options.mapPropsToFormData) {
        this.formdata = options.mapPropsToFormData(nextProps);
      }
    }

    getChildContext() {
      return {
        isInputValidating: this.isInputValidating,
        validateAllInputs: this.validateAllInputs,
        getNameValues: this.getNameValues,
        getInputErrors: this.getInputErrors,
      };
    }

    getInput(name) {
      return {
        name,
        value: this.getValue(name),
        ...this.formdata[name],
      };
    }

    setInputs(newInputs) {
      this.formdata = {
        ...this.formdata,
        ...newInputs,
      }

      if (options.onChange) {
        options.onChange(this.formdata, this.props);
      }

      this.forceUpdate();
    };

    getValue(name) {
      if (this.formdata[name] && (this.formdata[name].value != null)) {
        return this.formdata[name].value;
      }
      if (this.metadata[name].initialValue != null) {
        return this.metadata[name].initialValue;
      }
      // 最后 return '' 有待商榷
      return undefined;
    }

    getNameValues() {
      const nameValueMap = {};
      Object.keys(this.formdata).forEach((name) => {
        nameValueMap[name] = this.formdata[name].value;
      });
      return nameValueMap;
    }

    getInputErrors(name) {
      const input = this.getInput(name);
      if (input.errors) {
        return input.errors;
      }
      return [];
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
      console.log(this.formdata);
      const newInput = this.getInput(name);
      newInput.value = event.target.value;
      newInput.dirty = true;
      newInput.isValidating = true;
      this.validateInput(newInput, trigger);
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

    validateInput(input, trigger, callback) {
      if (input.dirty === false) {
        return;
      }
      const { name } = input;
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

      if (validates.length === 0) {
        return;
      }

      const currentValidateId = validateId;
      ++validateId;
      meta.validateId = currentValidateId;
      input.isValidating = true;
      this.setInputs({
        [name]: input,
      });

      const namevalues = this.getNameValues();
      const description = {};
      description[name] = {
        rules: [],
        onlyFirst: !!this.metadata[name].onlyFirst,
      };
      validates.forEach((validate) => {
        const { rules } = validate;
        description[name].rules.push(...rules);
      });
      const validator = new Validator(description);
      validator.validate(namevalues, (errMap, namevalues) => {
        if (currentValidateId === this.metadata[name].validateId) {
          callback && callback(errMap, namevalues);
          const newInput = this.getInput(name);
          newInput.isValidating = false;
          newInput.dirty = false;
          newInput.errors = errMap[name];
          this.setInputs({
            [name]: newInput,
          });
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
      // 新增了一个策略，onlyFirst: 顺序进行 rule 的检验，发现一个错误就停止
      Object.keys(this.metadata).forEach((name) => {
        description[name] = {
          rules: [],
          onlyFirst: !!this.metadata[name].onlyFirst,
        };
        const { validates } = this.metadata[name];
        validates.forEach((validate) => {
          const { rules } = validate;
          description[name].rules.push(...rules);
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
            newInput.errors = errorMap[name];
          }
        });
        // 有些值不是脏值，但是之前出现过错误的，回调的时候也要把错误重新传出去
        this.setInputs(newInputs);
        const allErrMap = {};
        names.forEach((name) => {
          const input = this.getInput(name);
          allErrMap[name] = input.errors || [];
        });
        callback(allErrMap, namevalues);
      });
    }

    validateAllInputs(callback) {
      const names = this.getNameNeededValidated();
      this.validateInputs(names, callback);
    }

    getCachedFunction(name, trigger, fn) {
      const namedCachedFuncs = this.cachedFunctions[name] = this.cachedFunctions[name] || {};
      if (!namedCachedFuncs[trigger]) {
        namedCachedFuncs[trigger] = fn.bind(this, name, trigger);
      }
      return namedCachedFuncs[trigger];
    }

    getInputProps(name, options) {
      if (!this.metadata[name]) {
        const meta = {};
        const { validates, initialValue, onlyFirst } = options;
        meta.initialValue = initialValue;
        meta.validates = validates;
        meta.onlyFirst = onlyFirst;
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

      return <WrappedComponent {...this.props} form={props} />
    }
  }

  Form.childContextTypes = {
    isInputValidating: PropTypes.func,
    validateAllInputs: PropTypes.func,
    getNameValues: PropTypes.func,
    getInputErrors: PropTypes.func,
  }

  return Form;
}
