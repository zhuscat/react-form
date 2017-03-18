'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = createForm;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Validator = require('./Validator');

var _Validator2 = _interopRequireDefault(_Validator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// 当触发异步验证的时候，可能会在短时间内多次触发，使用该ID确保返回的是正确的验证回调
var validateId = 0;

function createForm(WrappedComponent) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var Form = function (_Component) {
    _inherits(Form, _Component);

    function Form(props) {
      _classCallCheck(this, Form);

      var _this = _possibleConstructorReturn(this, (Form.__proto__ || Object.getPrototypeOf(Form)).call(this, props));

      _this.formdata = {};
      _this.metadata = {};
      _this.getInputProps = _this.getInputProps.bind(_this);
      _this.handleChange = _this.handleChange.bind(_this);
      _this.handleValidateChange = _this.handleValidateChange.bind(_this);
      _this.isInputValidating = _this.isInputValidating.bind(_this);
      _this.validateAllInputs = _this.validateAllInputs.bind(_this);
      _this.getNameValues = _this.getNameValues.bind(_this);
      _this.getInputErrors = _this.getInputErrors.bind(_this);
      _this.cachedFunctions = {};

      if (options.mapPropsToFormData) {
        _this.formdata = options.mapPropsToFormData(props);
      }
      return _this;
    }

    _createClass(Form, [{
      key: 'componentWillReceiveProps',
      value: function componentWillReceiveProps(nextProps) {
        if (options.mapPropsToFormData) {
          this.formdata = options.mapPropsToFormData(nextProps);
        }
      }
    }, {
      key: 'getChildContext',
      value: function getChildContext() {
        return {
          isInputValidating: this.isInputValidating,
          validateAllInputs: this.validateAllInputs,
          getNameValues: this.getNameValues,
          getInputErrors: this.getInputErrors
        };
      }
    }, {
      key: 'getInput',
      value: function getInput(name) {
        return _extends({
          name: name,
          value: this.getValue(name)
        }, this.formdata[name]);
      }
    }, {
      key: 'setInputs',
      value: function setInputs(newInputs) {
        this.formdata = _extends({}, this.formdata, newInputs);

        if (options.onChange) {
          options.onChange(this.formdata, this.props);
        }

        this.forceUpdate();
      }
    }, {
      key: 'getValue',
      value: function getValue(name) {
        if (this.formdata[name] && this.formdata[name].value != null) {
          return this.formdata[name].value;
        }
        if (this.metadata[name].initialValue != null) {
          return this.metadata[name].initialValue;
        }
        // 最后 return '' 有待商榷
        return undefined;
      }
    }, {
      key: 'getNameValues',
      value: function getNameValues() {
        var _this2 = this;

        var nameValueMap = {};
        Object.keys(this.formdata).forEach(function (name) {
          nameValueMap[name] = _this2.formdata[name].value;
        });
        return nameValueMap;
      }
    }, {
      key: 'getInputErrors',
      value: function getInputErrors(name) {
        var input = this.getInput(name);
        if (input.errors) {
          return input.errors;
        }
        return [];
      }
    }, {
      key: 'getNameNeededValidated',
      value: function getNameNeededValidated() {
        var _this3 = this;

        return Object.keys(this.metadata).filter(function (name) {
          return !!_this3.metadata[name].validates;
        });
      }
    }, {
      key: 'isInputValidating',
      value: function isInputValidating(name) {
        var input = this.getInput(name);
        if (input.isValidating) {
          return true;
        }
        return false;
      }
    }, {
      key: 'handleValidateChange',
      value: function handleValidateChange(name, trigger, event) {
        console.log(this.formdata);
        var newInput = this.getInput(name);
        newInput.value = event.target.value;
        newInput.dirty = true;
        newInput.isValidating = true;
        this.validateInput(newInput, trigger);
      }
    }, {
      key: 'handleChange',
      value: function handleChange(name, trigger, event) {
        var newInput = this.getInput(name);
        newInput.value = event.target.value;
        // 说明值发生了改变，如果 dirty 为 false，不需要触发验证
        newInput.dirty = true;
        newInput.isValidating = false;
        this.setInputs(_defineProperty({}, name, newInput));
      }
    }, {
      key: 'validateInput',
      value: function validateInput(input, trigger, callback) {
        var _this4 = this;

        if (input.dirty === false) {
          return;
        }
        var name = input.name;
        // 调整参数

        if (typeof trigger === 'function') {
          callback = trigger;
          trigger = undefined;
        }
        var meta = this.metadata[name];
        var validates = meta.validates;


        if (trigger) {
          validates = validates.filter(function (validate) {
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

        var currentValidateId = validateId;
        ++validateId;
        meta.validateId = currentValidateId;
        input.isValidating = true;
        this.setInputs(_defineProperty({}, name, input));

        var namevalues = this.getNameValues();
        var description = {};
        description[name] = {
          rules: [],
          onlyFirst: !!this.metadata[name].onlyFirst
        };
        validates.forEach(function (validate) {
          var _description$name$rul;

          var rules = validate.rules;

          (_description$name$rul = description[name].rules).push.apply(_description$name$rul, _toConsumableArray(rules));
        });
        var validator = new _Validator2.default(description);
        validator.validate(namevalues, function (errMap, namevalues) {
          if (currentValidateId === _this4.metadata[name].validateId) {
            callback && callback(errMap, namevalues);
            var newInput = _this4.getInput(name);
            newInput.isValidating = false;
            newInput.dirty = false;
            newInput.errors = errMap[name];
            _this4.setInputs(_defineProperty({}, name, newInput));
          }
        });
      }
    }, {
      key: 'validateInputs',
      value: function validateInputs(names, callback) {
        var _this5 = this;

        var newInputs = {};
        // 形成了闭包
        var currentValidateId = validateId;
        ++validateId;
        names.forEach(function (name) {
          var newInput = _this5.getInput(name);
          if (newInput.dirty === false) {
            return;
          }
          newInput.isValidating = true;
          newInputs[name] = newInput;
          _this5.metadata[name].validateId = currentValidateId;
        });
        this.setInputs(newInputs);
        var namevalues = this.getNameValues();
        var description = {};
        // 新增了一个策略，onlyFirst: 顺序进行 rule 的检验，发现一个错误就停止
        Object.keys(this.metadata).forEach(function (name) {
          description[name] = {
            rules: [],
            onlyFirst: !!_this5.metadata[name].onlyFirst
          };
          var validates = _this5.metadata[name].validates;

          validates.forEach(function (validate) {
            var _description$name$rul2;

            var rules = validate.rules;

            (_description$name$rul2 = description[name].rules).push.apply(_description$name$rul2, _toConsumableArray(rules));
          });
        });
        var validator = new _Validator2.default(description);
        validator.validate(namevalues, function (errorMap, namevalues) {
          var newInputs = {};
          names.forEach(function (name) {
            if (currentValidateId === _this5.metadata[name].validateId) {
              var newInput = _this5.getInput(name);
              newInput.isValidating = false;
              newInput.dirty = false;
              newInputs[name] = newInput;
              newInput.errors = errorMap[name];
            }
          });
          // 有些值不是脏值，但是之前出现过错误的，回调的时候也要把错误重新传出去
          _this5.setInputs(newInputs);
          var allErrMap = {};
          names.forEach(function (name) {
            var input = _this5.getInput(name);
            allErrMap[name] = input.errors || [];
          });
          callback(allErrMap, namevalues);
        });
      }
    }, {
      key: 'validateAllInputs',
      value: function validateAllInputs(callback) {
        var names = this.getNameNeededValidated();
        this.validateInputs(names, callback);
      }
    }, {
      key: 'getCachedFunction',
      value: function getCachedFunction(name, trigger, fn) {
        var namedCachedFuncs = this.cachedFunctions[name] = this.cachedFunctions[name] || {};
        if (!namedCachedFuncs[trigger]) {
          namedCachedFuncs[trigger] = fn.bind(this, name, trigger);
        }
        return namedCachedFuncs[trigger];
      }
    }, {
      key: 'getInputProps',
      value: function getInputProps(name, options) {
        var _this6 = this;

        if (!this.metadata[name]) {
          var meta = {};
          var _validates = options.validates,
              initialValue = options.initialValue,
              onlyFirst = options.onlyFirst;

          meta.initialValue = initialValue;
          meta.validates = _validates;
          meta.onlyFirst = onlyFirst;
          this.metadata[name] = meta;
        }

        var inputProps = {};
        var validates = this.metadata[name].validates;

        validates.forEach(function (validate) {
          var triggers = validate.triggers || ['onChange'];
          triggers.forEach(function (trigger) {
            inputProps[trigger] = _this6.getCachedFunction(name, trigger, _this6.handleValidateChange);
          });
        });

        if (!inputProps.hasOwnProperty('onChange')) {
          inputProps['onChange'] = this.getCachedFunction(name, 'onChange', this.handleChange);
        }

        return _extends({
          name: name,
          value: this.getValue(name)
        }, inputProps);
      }
    }, {
      key: 'render',
      value: function render() {
        var props = {
          getInputProps: this.getInputProps,
          validateAllInputs: this.validateAllInputs,
          getNameValues: this.getNameValues
        };

        return _react2.default.createElement(WrappedComponent, { form: props });
      }
    }]);

    return Form;
  }(_react.Component);

  Form.childContextTypes = {
    isInputValidating: _react.PropTypes.func,
    validateAllInputs: _react.PropTypes.func,
    getNameValues: _react.PropTypes.func,
    getInputErrors: _react.PropTypes.func
  };

  return Form;
}
//# sourceMappingURL=Form.js.map