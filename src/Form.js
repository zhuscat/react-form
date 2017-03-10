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
      if (this.inputdata[name] && this.inputdata[name].value) {
        return this.inputdata[name].value;
      }
      return '';
    }

    getNameValues() {
      const nameValueMap = {};
      Object.keys(this.inputdata).forEach((name) => {
        nameValueMap[name] = this.inputdata[name].value;
      });
      return nameValueMap;
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

    // 增加 callback 参数，当 validateInput 完成的时候，调用 callback 函数（如果存在）
    validateInput(name, trigger, callback) {
      this.inputdata[name].isValidating = true;
      // 优化这里
      if (typeof trigger === 'function') {
        callback = trigger;
        trigger = undefined;
      }
      // 根据是否给 trigger 这个参数 不给就忽略 trigger 进行验证
      const meta = this.metadata[name];
      let { validates } = meta;
      // 将符合的 rule 过滤出来
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

      // 看一下 validates 的长度，每一个 validate 都结束的时候调用 callback
      let len = validates.length;
      let errors = [];

      // 过滤好了
      validates.forEach((validate) => {
        const { rules } = validate;
        // 这里开始解析规则
        // 然后可以开始验证了
        // 现在暂时假设所有的规则都是有一个成员 validator 的

        // rules 是一个数组

        // TODO: 这里思考一下，这里是对 validate 中每一个要求的验证方案进行验证 但是有时候
        // 并不需要这样，只要有一个出错，立即调用 callback
        // 这里先取个名字
        // 对于出现一个错误就调用 callback，就叫做... 取名真难
        // 目前是验证所有的
        const validationDone = (err) => {
          this.inputdata[name].isValidating = false;
          len--;
          if (err) {
            errors.push(err);
          }
          if (len === 0 && callback) {
            callback(errors);
          }
          this.forceUpdate();
        }

        rules.forEach((rule) => {
          const { validator } = rule;
          validator(this.inputdata[name], this.inputdata, validationDone);
        });
      });
    }

    validateInputs(names, callback) {
      // 对每一个 name 都设置 isValidating 为 true
      names.forEach((name) => {
        this.inputdata[name].isValidating = true;
      });
      const errorMap = {};
      let len = names.length;
      const namevalues = this.getNameValues();
      // names.forEach((name) => {
      //   this.validateInput(name, (errors) => {
      //     errorMap[name] = errors;
      //     len--;
      //     if (len === 0) {
      //       callback(errorMap, namevalues);
      //     }
      //   });
      // });
      // this.forceUpdate();
      /* 刚刚写了一个 Validator 类，考虑到如果按照现在的方式，每验证一个 input
       * 都要创建一个 Validator 类，但是实际上
       * Validator 是可以同时验证多个表单元素的，因此这里要修改一下
       * 改成验证多个表单元素创建一个 Validator
      */
      // 首先，把所有的 rules 全部拿到
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
      const names = Object.keys(this.inputdata);
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

    // getFieldProps 是一个会不断被调用的函数 因此要做好性能优化（每次Input出现变动都会被调用）
    getInputProps(name, options) {
      if (!this.metadata[name]) {
        const meta = {};
        // validates 的每一个成员是一个 validate 每一个 validate 是一个对象，其包括 rules（规则），trigger（触发时机），rules 是一个数组，每一个成员是一个 rule，可以根据 rule 去生成验证信息
        const { validates } = options;
        // 不要去 normalized validate
        /*
         * 起初想要把 validates 数据变成 { 'onChange': [...], 'onBlur': [...] }
         * 但是这样一来并没有更简洁
         * 因为可能会有需要调用每一条规则进行验证
         * 而转换成这个形式会出现验证的冗余
        */
        // const normalizedValidates = {};
        meta.validates = validates;
        this.metadata[name] = meta;
      }

      const inputProps = {};
      const { validates } = this.metadata[name];
      // Object.keys(validates).forEach((trigger) => {
      //   inputProps[trigger] = this.handleValidateChange.bind(this, name, trigger);
      // });
      // 为什么做 cache 因为遍历 validates 中提取 trigger 的时候会有重复 trigger 出现的可能性
      // 使用一个 cache 可以防止重复进行 bind 操作
      // 另外，getInputProps 是一个会重复调用的函数，这也是使用 cache 的原因
      validates.forEach((validate) => {
        const triggers = validate.triggers || ['onChange'];
        triggers.forEach((trigger) => {
          inputProps[trigger] = this.getCachedFunction(name, trigger, this.handleValidateChange);
        });
      });

      // 这个时候再看一下 onChange 这个函数“注册”进 inputProps 里面没有，没有的话添加默认的 onChange 这个函数

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
