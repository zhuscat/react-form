'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
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

var validateStrategy = {
  once: function once(func, arr) {
    var promise = new Promise(function (resolve, reject) {
      var next = function next(i, len) {
        var data = arr[i];
        func(data, function (err) {
          if (err) {
            resolve([err]);
          } else if (i === len) {
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
  all: function all(func, arr) {
    var promise = Promise.all(arr.map(function (data) {
      return new Promise(function (resolve, reject) {
        func(data, function (err) {
          resolve(err);
        });
      });
    }));
    return promise;
  }
};

var predefinedRule = {
  required: function required(value, rule, formdata, callback) {
    if (value == null || value === '' || value.length === 0) {
      callback(new Error('这是必须要填的参数', formdata));
    } else {
      callback();
    }
  },
  string: function string(value, rule, formdata, callback) {
    var errors = [];

    if (value === undefined || value === null || value === '' || value.length === 0) {
      if (rule.required) {
        errors.push('这是必须的字段');
      }
    } else if (Object.prototype.toString.call(value) !== '[object String]') {
      errors.push('必须要是一个字符串');
    } else {
      if (typeof rule.max === 'number' && value.length > rule.max) {
        errors.push('\u5B57\u7B26\u4E2A\u6570\u4E0D\u80FD\u5927\u4E8E' + rule.max);
      }
      if (typeof rule.min === 'number' && value.length < rule.min) {
        errors.push('\u5B57\u7B26\u4E2A\u6570\u4E0D\u80FD\u5C0F\u4E8E' + rule.min);
      }
    }

    var combinedErrStr = errors.join(',');
    if (combinedErrStr.length > 0) {
      callback(new Error(combinedErrStr));
    } else {
      callback();
    }
  },
  number: function number(value, rule, formdata, callback) {
    var errors = [];

    if (value === undefined || value === null || value === '' || value.length === 0) {
      if (rule.required) {
        errors.push('这是必须的字段');
      }
    } else if (Object.prototype.toString.call(value) !== '[object Number]') {
      errors.push('必须要是一个数字');
    } else {
      if (typeof rule.max === 'number' && value > rule.max) {
        errors.push('\u6570\u5B57\u4E0D\u80FD\u5927\u4E8E' + rule.max);
      }
      if (typeof rule.min === 'number' && value < rule.min) {
        errors.push('\u6570\u5B57\u4E0D\u80FD\u5C0F\u4E8E' + rule.min);
      }
    }

    var combinedErrStr = errors.join(',');
    if (combinedErrStr.length > 0) {
      callback(new Error(combinedErrStr));
    } else {
      callback();
    }
  },
  array: function array(value, rule, formdata, callback) {
    var errors = [];

    if (value === undefined || value === null || value === '' || value.length === 0) {
      if (rule.required) {
        errors.push('这是必须的字段');
      }
    } else if (Object.prototype.toString.call(value) !== '[object Array]') {
      errors.push('必须是一个数组');
    } else {
      if (typeof rule.max === 'number' && value.length > rule.max) {
        errors.push('\u4E0D\u80FD\u9009\u62E9\u591A\u4E8E' + rule.max + '\u7684\u4E2A\u6570');
      }
      if (typeof rule.min === 'number' && value.length < rule.min) {
        errors.push('\u4E0D\u80FD\u9009\u62E9\u5C11\u4E8E' + rule.min + '\u7684\u4E2A\u6570');
      }
    }

    var combinedErrStr = errors.join(',');
    if (combinedErrStr.length > 0) {
      callback(new Error(combinedErrStr));
    } else {
      callback();
    }
  }
};

function Validator(description) {
  var normalizedDescription = this._normalizeDescription(description);
  this.description = normalizedDescription;
};

Validator.prototype._getValidator = function _getValidator(rule) {
  if (typeof rule.validator === 'function') {
    return rule.validator;
  } else if ('required' in rule && Object.keys(rule).length === 1) {
    return predefinedRule['required'];
  } else if (predefinedRule[rule.type]) {
    return predefinedRule[rule.type];
  }
  var dumbValidator = function dumbValidator(value, rule, formdata, callback) {
    callback();
  };
  return dumbValidator;
};

Validator.prototype._normalizeDescription = function _normalizeDescription(description) {
  return description;
};

Validator.prototype.validate = function validate(formdata, callback) {
  var $this = this;
  // 未考虑 promise 的错误处理
  Promise.all(Object.keys($this.description).map(function (name) {
    var rules = void 0,
        onlyFirst = void 0;
    // backward compatibility
    if (Object.prototype.toString.call($this.description[name]) === '[object Array]') {
      rules = $this.description[name];
      onlyFirst = false;
    } else {
      rules = $this.description[name].rules;
      onlyFirst = $this.description[name].onlyFirst;
    }
    var value = formdata[name];

    var dataArr = rules.map(function (rule) {
      return {
        value: value,
        rule: rule,
        formdata: formdata,
        validator: $this._getValidator(rule)
      };
    });

    var func = function func(data, callback) {
      var value = data.value,
          rule = data.rule,
          formdata = data.formdata,
          validator = data.validator;

      validator(value, rule, formdata, callback);
    };

    if (onlyFirst) {
      return validateStrategy.once(func, dataArr);
    } else {
      return validateStrategy.all(func, dataArr).then(function (errors) {
        return errors.filter(function (err) {
          if (err != null) {
            return true;
          }
          return false;
        });
      });
    }
  })).then(function (errors) {
    var errorMap = {};
    Object.keys($this.description).forEach(function (name, idx) {
      errorMap[name] = errors[idx];
    });
    callback(errorMap, formdata);
  });
};

exports.default = Validator;
exports.validateStrategy = validateStrategy;
//# sourceMappingURL=Validator.js.map