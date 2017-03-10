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

const predefinedRule = {
  required: (value, rule, formdata, callback) => {
    if (value == null || value === '' || value.length === 0) {
      callback(new Error('这是必须要填的参数', formdata));
    } else {
      callback();
    }
  }
}

function Validator(description) {
  const normalizedDescription = this._normalizeDescription(description);
  this.description = normalizedDescription;
};

Validator.prototype._getValidator = function _getValidator(rule) {
  if (typeof rule.validator === 'function') {
    return rule.validator;
  } else if ('required' in rule) {
    return predefinedRule['required'];
  }
}

Validator.prototype._normalizeDescription = function _normalizeDescription(description) {
  return description;
};

Validator.prototype.validate = function validate(formdata, callback) {
  const $this = this;
  Promise.all(Object.keys($this.description).map((name) => {
    const rules = $this.description[name];
    const value = formdata[name];
    return Promise.all(rules.map((rule) => {
      const rulePromise = new Promise(function(resolve, reject) {
        const validator = $this._getValidator(rule);
        validator(value, rule, formdata, function(err) {
          resolve(err);
        });
      });
      return rulePromise;
    })).then(function(errors) {
      return errors || [];
    });
  })).then(function(errors) {
    const errorMap = {};
    Object.keys($this.description).forEach((name, idx) => {
      errorMap[name] = errors[idx];
    });
    callback(errorMap, formdata);
  });
};

export default Validator;
