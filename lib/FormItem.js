'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createFormItem = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function createFormItem() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var STATUS_OK = 0;
  var STATUS_VALIDATING = 1;
  var STATUS_ERROR = 2;

  var propTypes = {
    className: _react.PropTypes.string,
    infoClassName: _react.PropTypes.string,
    okClassName: _react.PropTypes.string,
    validatingClassName: _react.PropTypes.string,
    errorClassName: _react.PropTypes.string
  };

  var defaultProps = {
    className: options.className || 'zc-form-item',
    infoClassName: options.infoClassName || 'zc-form-item-info',
    okClassName: options.okClassName || '',
    validatingClassName: options.validatingClassName || '',
    errorClassName: options.errorClassName || ''
  };

  var FormItem = function (_Component) {
    _inherits(FormItem, _Component);

    function FormItem() {
      _classCallCheck(this, FormItem);

      return _possibleConstructorReturn(this, (FormItem.__proto__ || Object.getPrototypeOf(FormItem)).apply(this, arguments));
    }

    _createClass(FormItem, [{
      key: 'getInputStatus',
      value: function getInputStatus() {
        var isValidating = this.context.isInputValidating(this.props.children.props.name);
        var errors = this.context.getInputErrors(this.props.children.props.name);
        if (isValidating) {
          return STATUS_VALIDATING;
        } else if (errors.length > 0) {
          return STATUS_ERROR;
        }
        return STATUS_OK;
      }
    }, {
      key: 'renderField',
      value: function renderField() {
        var status = this.getInputStatus();
        // TODO: still need to improve the code
        var wrapperClassName = void 0;
        switch (status) {
          case STATUS_OK:
            wrapperClassName = 'status-ok';
          case STATUS_VALIDATING:
            wrapperClassName = 'status-validating';
          case STATUS_ERROR:
            wrapperClassName = 'status-error';
        }
        var indicatorClassName = '';
        switch (status) {
          case STATUS_OK:
            indicatorClassName = this.props.okClassName;
          case STATUS_VALIDATING:
            indicatorClassName = this.props.validatingClassName;
          case STATUS_ERROR:
            indicatorClassName = this.props.errorClassName;
        }
        return _react2.default.createElement(
          'div',
          { className: wrapperClassName, style: { position: 'relative' } },
          this.props.children,
          _react2.default.createElement('i', { className: indicatorClassName })
        );
      }
    }, {
      key: 'renderError',
      value: function renderError() {
        if (this.getInputStatus() === STATUS_ERROR) {
          var errors = this.context.getInputErrors(this.props.children.props.name);
          var errorStr = errors.filter(function (error) {
            return !!error;
          }).map(function (error) {
            return error.message;
          }).join(', ');
          return _react2.default.createElement(
            'div',
            { style: { position: 'relative' } },
            _react2.default.createElement(
              'span',
              { className: this.props.infoClassName },
              errorStr
            )
          );
        }
        return '';
      }
    }, {
      key: 'render',
      value: function render() {
        return _react2.default.createElement(
          'div',
          { className: this.props.className },
          this.renderField(),
          this.renderError()
        );
      }
    }]);

    return FormItem;
  }(_react.Component);

  FormItem.propTypes = propTypes;
  FormItem.defaultProps = defaultProps;

  FormItem.contextTypes = {
    isInputValidating: _react.PropTypes.func,
    getInputErrors: _react.PropTypes.func
  };

  return FormItem;
}

exports.default = createFormItem();
exports.createFormItem = createFormItem;
//# sourceMappingURL=FormItem.js.map