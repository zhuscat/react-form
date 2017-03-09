# ReactForm

## 思想

高阶组件

## 使用

开发中...

## 规则解析？

现在当 validate 整个 form 的时候，会遍历每一个名字，然后调用各自的 validateInput，那么，抽取出的验证模块（纯验证，与UI无关只能验证一个 name）

下一版本想要改成生成一个 validate 的模块（带有传进来的 name 数组)，整个模块验证一下就好了