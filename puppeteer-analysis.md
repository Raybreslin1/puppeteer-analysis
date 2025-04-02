# Puppeteer分析报告

## 文章来源
本分析基于CSDN博客文章：[Puppeteer 使用教程-基础篇（超详细、超全面）](https://blog.csdn.net/weixin_47746452/article/details/131751015)

## 文章结构

该文章主要分为以下几个部分：
1. 前言
2. Puppeteer简介
3. Puppeteer中Browser、browserContent、Page的关系
4. Puppeteer APIs
5. 总结

## 主要内容分析

### 1. 前言

作者提到Puppeteer是目前比较友好的实现爬虫、自动化测试、页面捕获等的Node库，但网上相关的博客有些少，没有一篇文章能将puppeteer的相关内容、API、示例讲得很清晰，因此撰写了这篇文章。

文章提供了以下资源链接：
- [Puppeteer 中文官网](https://puppeteer.bootcss.com/)
- [Puppeteer 英文官网](https://pptr.dev/)
- [Gitee地址](https://gitee.com/wfeng0/puppeteer-demo)

### 2. Puppeteer简介

Puppeteer是一个Node库，它提供了一个高级API来通过DevTools协议控制Chromium或Chrome。Puppeteer默认以headless模式运行，但可以通过修改配置文件运行"有头"模式。

```javascript
const puppeteer = require('puppeteer');

const browser = puppeteer.launch({ headless: false })
// 为false表示不开启无头模式，则运行程序时，会有puppeteer的内核浏览器开启运行，模拟页面操作
// 当关闭无头模式后，可能会导致电脑闪屏，也是偶发的，反正我的电脑是会这样
```

### 3. Puppeteer中Browser、browserContent、Page的关系

文章提供了Puppeteer的浏览器结构图，并解释了三者之间的关系：

```javascript
// 创建 browser
const browser = puppeteer.launch()

// 创建 browserContent
browser.newPage()

// 创建 Page
page.goto("URL")
```

- Puppeteer使用Devtools协议与浏览器进行通信
- Browser实例可以拥有浏览器上下文
- BrowserContent实例定义了一个浏览器会话并可拥有多个页面
- Page就是我们所理解的标签页

### 4. Puppeteer APIs

#### 4.1 Browser

Browser对象是通过`puppeteer.launch`或`puppeteer.connect`创建的，可通过传入option实现对创建的浏览器进行控制。

浏览器的断开与重连示例：
```javascript
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  // 存储节点以便能重新连接到Chromium
  const browserWSEndpoint = browser.wsEndpoint();
  // 从Chromium断开和puppeteer的连接
  browser.disconnect();

  // 使用节点来重新建立连接
  const browser2 = await puppeteer.connect({browserWSEndpoint});
  // 关闭Chromium
  await browser2.close();
});
```

#### 4.2 Page

Page提供操作一个tab页或extension background page的方法。一个Browser实例可以有多个Page实例。

```javascript
const browser = await puppeteer.launch();
const page = await browser.newPage()
```

Page是puppeteer中重要的角色，为我们提供了可操作对象，包括获取dom内容、页面截图、保存PDF等多操作。

Page可以触发Node原生事件，通过on、once、removeListener实现对事件的监听移除。

##### 4.2.1 page.on(request/response)

可以监听页面的请求和响应：

```javascript
const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:5500/demo.html");

page.on("request", (req) => {
  console.log("req.headers()", req.headers());
  console.log("req.method()", req.method());
  console.log("postData()", req.postData());
});

page.on("response", async (res) => {
  console.log(await res.text());
});
```

##### 4.2.2 page.$()

在页面内执行`document.querySelector`。如果没有元素匹配指定选择器，返回值是`null`。

```javascript
const btn = await page.$("button");
await btn.click();
```

##### 4.2.3 page.$$()

执行`document.querySelectorAll`，用法同上。

##### 4.2.4 page.$eval()

`page.$eval(selector, pageFunction[, ...args])`方法会把匹配到的元素作为第一个参数传给`pageFunction`。

```javascript
const data = await page.$eval("h1", (h1) => {
  // 这里的环境是在puppeteer浏览器中，不是在外部环境，因此log在打开的浏览器中看
  // 返回的结果作为方法的结果
  console.log("puppeteer内核浏览器", h1);
  return "主动返回的结果作为方法返回值";
});

console.log("page.$eval结果：", data);
```

还可以通过第三个参数实现上下文参数传递：

```javascript
const params = {
  p1: "p1",
  p2: 30,
  p3: {
    data: [1, 2, 3, 4],
  },
};

const data = await page.$eval(
  "h1",
  (h1, params) => {
    console.log("puppeteer内核浏览器", h1);
    console.log("外部参数", params);
    return "主动返回的结果作为方法返回值";
  },
  params
);
```

##### 4.2.5 page.addScriptTag()

允许向页面插入script标签或script代码片段：

```javascript
await page.addScriptTag({
  content: "const a='aaaaa'",
});
```

##### 4.2.6 page.addStyleTag(options)

与上类似，用于添加样式。

##### 4.2.7 page.click

模拟元素点击。

##### 4.2.8 page.cookies()

返回页面cookies：

```javascript
await page.goto("https://www.baidu.com");
const cookies = await page.cookies("https://www.baidu.com");
console.log(cookies);
```

##### 4.2.9 page.evaluate(pageFunction[, ...args])

在页面实例上下文中执行方法，用法跟page.$eval()类似，只是没有了选择器。

##### 4.2.10 page.exposeFunction(name, puppeteerFunction)

将Node环境中的方法暴露给浏览器环境使用：

```javascript
const saveImg = (path) => {
  console.log("有人调用saveImg方法了", path);
};
// 添加方法
await page.exposeFunction("saveImg", (path) => saveImg(path));

// 直接在上下文执行，不需要通过选择器
page.evaluate(() => {
  console.log("puppeteer内核浏览器");
  saveImg("/img/test");
});
```

##### 4.2.11 page.focus()、page.hover(selector)、page.mouse()

用于处理焦点和鼠标事件。

##### 4.2.12 page.pdf()

生成PDF文件。

##### 4.2.13 page.setCookie(...cookies)

设置页面cookies，非常重要，常用于爬取有cookies的网址：

```javascript
await page.setCookie({
  name: "BD_UPN",
  value: "12314753",
});
```

处理实际页面的cookies字符串：

```javascript
const cookies = "BIDUPSID=;BDSFRCVID=Os-....省略....B64_BOT=1;channel=bai47c2-a2fb-4aae994ac343";
 
const arr = cookies.split(";");
arr.forEach(async (i) => {
  const [name, value] = i.split("=");
  let obj = { name, value };
  await page.setCookie(obj);
});
```

注意：name、value中一定不要有空格，不然会报Invalid cookie fields。

##### 4.2.14 page.setRequestInterception(value[Boolean])

启用请求拦截器：

```javascript
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg'))
      interceptedRequest.abort();
    else
      interceptedRequest.continue();
  });
  await page.goto('https://example.com');
  await browser.close();
});
```

##### 4.2.15 Request和Response对象

###### Request对象主要方法：
- request.abort([errorCode])：中断请求
- request.continue：继续请求
- request.headers()：获取请求头
- request.method()：获取请求方法
- request.postData()：获取请求数据
- request.url()：请求的URL

###### Response对象主要方法：
- response.buffer()：解析响应中的buffer
- response.headers()：响应头
- response.json()：将响应体转换为json格式
- response.remoteAddress()：获取远程服务的ip端口
- response.text()：文本化响应体

##### 4.2.16 page.type(selector, text[, options])

实现字符输入操作：

```javascript
page.type('#mytextarea', 'Hello'); // 立即输入
page.type('#mytextarea', 'World', {delay: 100}); // 输入变慢，像一个用户
```

##### 4.2.17 page.waitForRequest/waitForResponse

等待特定请求或响应的方法。

## 总结

文章详细介绍了Puppeteer的常用API和使用示例，对于页面爬取数据，请求、响应、DOM选择器是最常用的功能；对于自动化测试，type字符输入、page.$()选取元素也是最常用的功能。掌握这些API，基本可以满足爬取数据的需求。

作者还提到将在后续文章中提供爬取数据的具体示例。