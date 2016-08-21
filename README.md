### jst -> xtpl 简单的转换工具

* 由于jst语法比xtpl更自由，无法完全覆盖所有场景，只能简单转换常用规则
* 规则枚举在index.js中
* 输入为jst模板的字符串，输出为xtpl模板的字符串

### usage

```
const xtplConvert = require('xtplConvert');
let outStr = xtplConvert(inStr);
```

### todo

* 覆盖更多模板业务场景

