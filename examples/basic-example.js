/**
 * Puppeteer基础示例
 * 展示了Puppeteer的基本用法，包括：
 * 1. 启动浏览器
 * 2. 创建新页面
 * 3. 导航到URL
 * 4. 等待和选择元素
 * 5. 获取页面内容
 * 6. 截图和生成PDF
 * 7. 监听请求和响应
 * 8. 关闭浏览器
 */

const puppeteer = require('puppeteer');

(async () => {
  // 1. 启动浏览器
  const browser = await puppeteer.launch({
    headless: false, // 设置为true会以无头模式运行，不显示浏览器界面
    defaultViewport: { width: 1280, height: 800 }
  });

  // 2. 创建新页面
  const page = await browser.newPage();
  
  // 示例：监听请求和响应
  page.on('request', request => {
    console.log(`请求URL: ${request.url()}`);
    console.log(`请求方法: ${request.method()}`);
  });
  
  page.on('response', async response => {
    console.log(`响应URL: ${response.url()}`);
    console.log(`响应状态: ${response.status()}`);
    
    // 只打印文本响应内容，避免二进制数据导致输出混乱
    const contentType = response.headers()['content-type'] || '';
    if (contentType.includes('application/json')) {
      try {
        const json = await response.json();
        console.log('响应JSON: ', json);
      } catch (e) {
        console.log('解析JSON失败');
      }
    }
  });

  // 3. 导航到URL
  await page.goto('https://example.com', {
    waitUntil: 'networkidle2' // 等待网络基本空闲才算加载完成
  });

  // 4. 等待和选择元素
  await page.waitForSelector('h1');
  const h1Element = await page.$('h1');
  
  // 5. 获取页面内容
  // 使用$eval获取元素文本
  const h1Text = await page.$eval('h1', el => el.textContent);
  console.log('H1文本: ', h1Text);
  
  // 使用evaluate在页面上下文中执行代码
  const pageTitle = await page.evaluate(() => {
    return document.title;
  });
  console.log('页面标题: ', pageTitle);
  
  // 获取页面上所有链接
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => a.href);
  });
  console.log('页面链接: ', links);

  // 6. 截图和生成PDF
  await page.screenshot({ path: 'example.png' });
  
  // PDF仅在无头模式下可用
  // await page.pdf({ path: 'example.pdf', format: 'A4' });
  
  // 7. 使用exposeFunction将Node环境函数暴露给浏览器
  await page.exposeFunction('logMessage', message => {
    console.log(`来自浏览器的消息: ${message}`);
  });
  
  // 在浏览器中调用暴露的函数
  await page.evaluate(() => {
    logMessage('这条消息是从浏览器内部发送的');
  });
  
  // 8. 示例：设置和获取cookies
  await page.setCookie({
    name: 'testCookie',
    value: 'testValue',
    domain: 'example.com'
  });
  
  const cookies = await page.cookies();
  console.log('Cookies: ', cookies);
  
  // 9. 表单交互示例
  // 如果页面有表单，可以输入文本
  // await page.type('#searchInput', '搜索内容', { delay: 100 });
  // await page.click('#searchButton');
  
  // 等待5秒，方便查看结果
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 10. 关闭浏览器
  await browser.close();
})().catch(error => {
  console.error('运行中出现错误:', error);
});