## jst -> xtpl 简单的转换工具

* 由于jst语法比xtpl更自由，无法完全覆盖所有场景，只能简单转换常用规则
* 规则枚举在index.js中
* 输入为jst模板的字符串，输出为xtpl模板的字符串

### install
```
npm install --save @ali/xtplConvert
```

### test
```
tnpm test
```

### usage

```
const xtplConvert = require('@ali/xtpl-convert');
let outStr = xtplConvert(inStr);
```

### todo

* 覆盖更多模板业务场景

### history

* 2016-08-24 增加对js代码块if,statement逻辑判断，增加对for语法的支持。




