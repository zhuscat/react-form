# ReactForm

## 思想

高阶组件

## Usage 使用

*WARNING:* This component is still under development

To install react-form:

```bash
npm install react-validation-form --save
```

How to use:

```javascript
import React, { Component, PropTypes } from 'react';
import { createForm, FormItem } from 'react-validation-form';

const propTypes = {
  value: PropTypes.string,
};

class Input extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <input type="text" value={this.props.value} {...this.props} />
  }
}

Input.propTypes = propTypes;

class TestForm extends Component {
  render() {
    return (
      <form>
        <FormItem>
          <Input {...this.props.form.getInputProps('username', {
            initialValue: 'username',
            onlyFirst: true, // default false
            validates: [
              {
                rules: [{
                  required: true
                },
                {
                  validator: (value, rule, formdata, callback) => {
                    setTimeout(() => {
                      callback(new Error('不合法的输入'));
                    }, 1000);
                  },
                }],
                triggers: ['onChange', 'onBlur'],
              },
            ]
          })} />
        </FormItem>
        <FormItem>
          <Input {...this.props.form.getInputProps('password', {
            validates: [
              {
                rules: [{
                  validator: (value, rule, formdata, callback) => {
                    setTimeout(() => {
                      callback(new Error('不合法输入'));
                    }, 1000);
                  },
                }],
                triggers: ['onChange', 'onBlur'],
              },
            ]
          })} />
        </FormItem>
        <FormItem>
          <Input {...this.props.form.getInputProps('nickname', {
            validates: [
              {
                rules: [
                  {
                    required: true,
                    type: 'string',
                    max: 20,
                    min: 5,
                  },
                  {
                  validator: (value, rule, formdata, callback) => {
                    setTimeout(() => {
                      callback(new Error('不合法输入'));
                    }, 1000);
                  },
                }],
                triggers: ['onBlur'],
              },
            ]
          })} />
        </FormItem>
        <button onClick={(e) => {
          e.preventDefault();
          this.props.form.validateAllInputs((err, namevalues) => {
            console.log(err);
          })
        }}>提交</button>
      </form>
    )
  }
}

// now you can use the form.
export default createForm(TestForm);
```

## 问题记录

### 问题1

对于异步验证，举个例子，加入是 `onChange` 触发验证，那么对于频繁修改表单，会不断地触发回调，造成显示上出现验证和验证结束UI之间的闪烁
（初步解决方案，通过观察现在的值跟之前放进去的值是否一致来决定是否触发回调）

经验证，以上方法仍然会闪动，当来回删除键入同一个字符即可。

**解决方案**: 目前采用记录一个 validateId 来解决，记录每一个验证的 validateId，效果良好

### 问题2
加入脏检查

原因：一个表单元素可能在 `onChange` 的时候不触发验证，然后在 `onBlur` 的时候触发验证，如果表单元素的值没有被改过，不应该触发验证，使用脏检查可以避免不必要的验证

### 问题3

`onChange` 与 `onBlur` 是检测两种错误的，`onChange` 检测出了一个错误，然后错误显示出来，接着触发 `onBlur`，此时 `onBlur` 触发的错误应该和 `onChange` 触发的错误同时显示出来，而不是只显示 `onChange` 触发的错误，但是两次触发 `onBlur` 只应该显示最后一次发生的错误，但是，`onChange` 和 `onBlur` 可能是检测同一个错误的，这就要求程序要记录 validates 在数组中的序号，这样就能达到要求，不过目前 `Validator` 的设计是传入 rules 数组（会把 `validates` 数组进行转换变成 `rules` 数组），所以现在暂时是显示最后一次验证得出的错误。