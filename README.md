# Puppeteer分析与示例

本项目基于CSDN博客文章[《Puppeteer 使用教程-基础篇（超详细、超全面）》](https://blog.csdn.net/weixin_47746452/article/details/131751015)，提供了对Puppeteer的详细分析以及实用示例代码。

## 项目内容

- [Puppeteer分析报告](./puppeteer-analysis.md)：详细解析Puppeteer的架构、API和使用方法
- 实用示例：
  - [基础示例](./examples/basic-example.js)：展示Puppeteer的基本用法
  - [网页爬虫示例](./examples/web-scraper-example.js)：展示如何使用Puppeteer爬取网页内容
  - [UI自动化测试示例](./examples/ui-testing-example.js)：展示如何使用Puppeteer进行UI自动化测试

## Puppeteer简介

Puppeteer是一个Node库，它提供了一个高级API来通过DevTools协议控制Chromium或Chrome。Puppeteer默认以headless模式运行，但可以通过配置切换到"有头"模式。

Puppeteer可以用于：
- 网页截图和生成PDF
- 自动化表单提交、UI测试、键盘输入等
- 创建自动化测试环境
- 爬取SPA（单页应用）并进行预渲染
- 捕获网站的时间线，帮助诊断性能问题
- 测试Chrome扩展程序

## 安装使用

1. 安装Node.js (>= 14.0.0)
2. 创建一个新的项目目录并初始化：
```bash
mkdir puppeteer-project
cd puppeteer-project
npm init -y
```

3. 安装Puppeteer：
```bash
npm install puppeteer
```

4. 运行示例：
```bash
node examples/basic-example.js
```

## Puppeteer主要组件

- **Browser**：表示一个浏览器实例，可以包含多个页面
- **BrowserContext**：浏览器会话，可以包含多个页面
- **Page**：表示一个标签页，提供操作页面的方法
- **Frame**：每个页面有一个主框架和可能的多个子框架
- **ElementHandle**：表示页面中的DOM元素
- **JSHandle**：表示JavaScript对象的引用

## 示例代码

### 基本使用
```javascript
const puppeteer = require('puppeteer');

(async () => {
  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: false // 设置为false可以看到浏览器界面
  });
  
  // 创建新页面
  const page = await browser.newPage();
  
  // 导航到URL
  await page.goto('https://example.com');
  
  // 获取页面标题
  const title = await page.title();
  console.log(`页面标题: ${title}`);
  
  // 关闭浏览器
  await browser.close();
})();
```

### 更多示例
查看 [examples](./examples/) 目录获取更多实用示例。

## 参考资源

- [Puppeteer官方文档](https://pptr.dev/)
- [Puppeteer中文文档](https://puppeteer.bootcss.com/)
- [原始CSDN博客文章](https://blog.csdn.net/weixin_47746452/article/details/131751015)

## 许可证

MIT