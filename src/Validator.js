/*
 * description 的结构
 * {
 *   "name1": [{ "required": true, validates: "" }, { validatates: "" }, { ... }],
 *   "name2": ...
 * }
*/

function Validator(description) {
  const normalizedDescription = this._normalizeDescription(description);
  this.description = normalizedDescription;
  console.log(this.description);
};

Validator.prototype._normalizeDescription = function _normalizeDescription(description) {
  return description;
};

Validator.prototype.validate = function validate(formdata, callback) {
  const description = this.description;
  // TODO: 错误处理
  Promise.all(Object.keys(this.description).map((name) => {
    const rules = this.description[name];
    const value = formdata[name];
    // const errors = [];
    // let len = rules.length;
    // 暂定规则
    // 所有执行完才执行完
    // const oneRuleDone = (err) => {
    //   if (err) {
    //     errors.push(err);
    //   }
    //   len--;
    //   if (len === 0) {
    //     oneKeyDone(errors);
    //   }
    // };

    // 根据规则开始验证
    // TODO: 处理错误
    return Promise.all(rules.map((rule) => {
      // rule.validator(value, formdata, oneRuleDone);
      const rulePromise = new Promise(function(resolve, reject) {
        rule.validator(value, formdata, function(err) {
          resolve(err);
        });
      });
      return rulePromise;
    })).then(function(errors) {
      return errors || [];
    });
  })).then(function(errors) {
    const errorMap = {};
    Object.keys(description).forEach((name, idx) => {
      errorMap[name] = errors[idx];
    });
    callback(errorMap, formdata);
  })
};

export default Validator;
