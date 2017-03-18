/*
 * 结构命名
 * validates: validate[]
 * validate: { rules: [], triggers: [] }
 * rules: rule[]
 * rule: { required: true, validator: function, name: string }
*/

// 这里说明一下
// 所有 validator 都是形如 (value, formdata, callback) => {} 形式的函数
// 其中 callback 形如 (errorMap, formdata) => {}

// 这里要提取出两个策略
// 策略1 对于一个字段，运行所有 rule，然后 callback 传入错误
// 策略2 对于一个字段，顺序执行 rule，一旦出现错误 callback 传入错误

const validateStrategy = {
  once: (func, arr) => {
    const promise = new Promise((resolve, reject) => {
      const next = (i, len) => {
        const data = arr[i];
        func(data, (err) => {
          if (err) {
            resolve([err]);
          } else if (i === len - 1) {
            resolve([]);
          } else {
            next(i + 1, len);
          }
        });
      };
      next(0, arr.length);
    });
    return promise;
  },
  all: (func, arr) => {
    const promise = Promise.all(arr.map(data => {
      return new Promise((resolve, reject) => {
        func(data, (err) => {
          resolve(err);
        });
      });
    }));
    return promise;
  },
};

const predefinedRule = {
  required: (value, rule, formdata, callback) => {
    if (value == null || value === '' || value.length === 0) {
      callback(new Error('这是必须要填的参数', formdata));
    } else {
      callback();
    }
  },
  string: (value, rule, formdata, callback) => {
    const errors = [];

    if (value === undefined || value === null || value === '' || value.length === 0) {
      if (rule.required) {
        errors.push('这是必须的字段');
      }
    } else if (Object.prototype.toString.call(value) !== '[object String]') {
      errors.push('必须要是一个字符串');
    } else {
      if ((typeof rule.max === 'number') && (value.length > rule.max)) {
        errors.push(`字符个数不能大于${rule.max}`);
      }
      if ((typeof rule.min === 'number') && (value.length < rule.min)) {
        errors.push(`字符个数不能小于${rule.min}`);
      }
    }

    const combinedErrStr = errors.join(',');
    if (combinedErrStr.length > 0) {
      callback(new Error(combinedErrStr));
    } else {
      callback();
    }
  },
  number: (value, rule, formdata, callback) => {
    const errors = [];

    if (value === undefined || value === null || value === '' || value.length === 0) {
      if (rule.required) {
        errors.push('这是必须的字段');
      }
    } else if (Object.prototype.toString.call(value) !== '[object Number]') {
      errors.push('必须要是一个数字');
    } else {
      if ((typeof rule.max === 'number') && (value > rule.max)) {
        errors.push(`数字不能大于${rule.max}`);
      }
      if ((typeof rule.min === 'number') && (value < rule.min)) {
        errors.push(`数字不能小于${rule.min}`);
      }
    }

    const combinedErrStr = errors.join(',');
    if (combinedErrStr.length > 0) {
      callback(new Error(combinedErrStr));
    } else {
      callback();
    }
  },
  array: (value, rule, formdata, callback) => {
    const errors = [];

    if (value === undefined || value === null || value === '' || value.length === 0) {
      if (rule.required) {
        errors.push('这是必须的字段');
      }
    } else if (Object.prototype.toString.call(value) !== '[object Array]') {
      errors.push('必须是一个数组');
    } else {
      if ((typeof rule.max === 'number') && (value.length > rule.max)) {
        errors.push(`不能选择多于${rule.max}的个数`);
      }
      if ((typeof rule.min === 'number') && (value.length < rule.min)) {
        errors.push(`不能选择少于${rule.min}的个数`);
      }
    }

    const combinedErrStr = errors.join(',');
    if (combinedErrStr.length > 0) {
      callback(new Error(combinedErrStr));
    } else {
      callback();
    }
  },
}

function Validator(description) {
  const normalizedDescription = this._normalizeDescription(description);
  this.description = normalizedDescription;
};

Validator.prototype._getValidator = function _getValidator(rule) {
  if (typeof rule.validator === 'function') {
    return rule.validator;
  } else if (('required' in rule) && (Object.keys(rule).length === 1)) {
    return predefinedRule['required'];
  } else if (predefinedRule[rule.type]) {
    return predefinedRule[rule.type];
  }
  const dumbValidator = (value, rule, formdata, callback) => {
    callback();
  }
  return dumbValidator;
}

Validator.prototype._normalizeDescription = function _normalizeDescription(description) {
  return description;
};

Validator.prototype.validate = function validate(formdata, callback) {
  const $this = this;
  // 未考虑 promise 的错误处理
  Promise.all(Object.keys($this.description).map(name => {
    let rules, onlyFirst;
    // backward compatibility
    if (Object.prototype.toString.call($this.description[name]) === '[object Array]') {
      rules = $this.description[name];
      onlyFirst = false;
    } else {
      rules = $this.description[name].rules;
      onlyFirst = $this.description[name].onlyFirst;
    }
    const value = formdata[name];

    const dataArr = rules.map((rule) => {
      return {
        value,
        rule,
        formdata,
        validator: $this._getValidator(rule),
      };
    });

    const func = (data, callback) => {
      const { value, rule, formdata, validator } = data;
      validator(value, rule, formdata, callback);
    };

    if (onlyFirst) {
      return validateStrategy.once(func, dataArr);
    } else {
      return validateStrategy.all(func, dataArr)
        .then(function(errors) {
          return errors.filter((err) => {
            if (err != null) {
              return true;
            }
            return false;
          });
        });
    }
  })).then(function(errors) {
    const errorMap = {};
    Object.keys($this.description).forEach((name, idx) => {
      errorMap[name] = errors[idx];
    });
    callback(errorMap, formdata);
  });
};

export default Validator;

export { validateStrategy };
