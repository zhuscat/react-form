import React, { Component, PropTypes } from 'react';

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
      this.cachedFunctions = {};
    }

    getChildContext() {
      return {
        isInputValidating: this.isInputValidating,
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

    isInputValidating(name) {
      const input = this.getInput(name);
      if (input.isValidating) {
        return true;
      }
      return false;
    }

    handleValidateChange(name, trigger, value) {
      console.log('handleValidateChange');
      const newInput = this.getInput(name);
      newInput.isValidating = true;
      newInput.value = value;
      this.inputdata[name] = newInput;
      this.forceUpdate();
      const meta = this.metadata[name];
      const { validates } = meta;
      const rules = validates[trigger];
      this.validateInput(name, trigger);
    }

    handleChange(name, value) {
      this.inputdata[name] = {
        name,
        value,
        isValidating: false,
      }
      this.forceUpdate();
    }

    validateInput(name, trigger) {
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

      // 过滤好了
      validates.forEach((validate) => {
        const { rules } = validate;
        // 这里开始解析规则
        // 然后可以开始验证了
        // 现在暂时假设所有的规则都是有一个成员 validator 的

        // rules 是一个数组

        const validationDone = () => {
          console.log('validationDone called');
          this.inputdata[name].isValidating = false;
          this.forceUpdate();
        }

        rules.forEach((rule) => {
          const { validator } = rule;
          validator(this.inputdata[name], this.inputdata, validationDone);
        });
      });
    }

    validateInputs({ names }) {
      names.forEach((name) => {
        this.validateInput(name);
      });
      this.forceUpdate();
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
    }

    // getFieldProps 是一个会不断被调用的函数 因此要做好性能优化（每次Input出现变动都会被调用）
    getInputProps(name, options) {
      console.log(`getFieldProps called`);
      console.log(JSON.stringify(this.inputdata));
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
        console.log(validates);
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
        isValidating: this.isInputValidating(),
        ...inputProps,
      };
    }

    render() {
      const props = {
        getInputProps: this.getInputProps,
      };

      return <WrappedComponent form={props} />
    }
  }

  Form.childContextTypes = {
    isInputValidating: PropTypes.func,
  }

  return Form;
}
