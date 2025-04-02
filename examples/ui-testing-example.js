/**
 * Puppeteer自动化UI测试示例
 * 展示了如何使用Puppeteer进行简单的UI测试，包括：
 * 1. 表单输入与验证
 * 2. 按钮点击与交互
 * 3. 导航测试
 * 4. 状态验证
 * 5. 截图对比
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const assert = require('assert').strict;

// 简单的测试报告函数
const report = {
  passed: 0,
  failed: 0,
  total: 0,
  
  test: async function(name, fn) {
    this.total++;
    console.log(`\n[TEST] ${name}`);
    try {
      await fn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
    } catch (error) {
      console.error(`❌ FAILED: ${name}`);
      console.error(error);
      this.failed++;
    }
  },
  
  summary: function() {
    console.log(`\n======= TEST SUMMARY =======`);
    console.log(`Total: ${this.total}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success rate: ${Math.round((this.passed / this.total) * 100)}%`);
    console.log(`============================\n`);
  }
};

(async () => {
  // 创建保存结果的目录
  const resultsDir = path.join(__dirname, 'test-results');
  try {
    await fs.mkdir(resultsDir, { recursive: true });
  } catch (err) {
    // 目录已存在，忽略错误
  }

  // 启动浏览器
  const browser = await puppeteer.launch({ 
    headless: false,  // 自动化测试可视化观察
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // 创建页面
    const page = await browser.newPage();
    
    // 设置更长的超时时间，以适应网络波动
    page.setDefaultTimeout(30000);
    
    // 测试套件开始
    console.log('开始UI自动化测试...');
    
    // 测试1: 导航到目标页面
    await report.test('能够成功导航到搜索引擎页面', async () => {
      await page.goto('https://www.duckduckgo.com', { waitUntil: 'networkidle2' });
      const title = await page.title();
      assert(title.includes('DuckDuckGo'), `页面标题应包含"DuckDuckGo"，但实际为"${title}"`);
    });
    
    // 测试2: 搜索功能测试
    await report.test('搜索功能正常工作', async () => {
      // 在搜索框中输入文本
      await page.type('#searchbox_input', 'Puppeteer automation testing');
      
      // 截图记录输入状态
      await page.screenshot({ 
        path: path.join(resultsDir, 'search-input.png')
      });
      
      // 提交搜索
      await page.keyboard.press('Enter');
      
      // 等待搜索结果加载
      await page.waitForSelector('.react-results--main');
      
      // 验证搜索结果页面
      const resultsExist = await page.evaluate(() => {
        const results = document.querySelectorAll('.react-results--main article');
        return results.length > 0;
      });
      
      assert(resultsExist, '搜索应该返回至少一个结果');
      
      // 截图记录搜索结果
      await page.screenshot({ 
        path: path.join(resultsDir, 'search-results.png')
      });
    });
    
    // 测试3: 点击第一个搜索结果
    await report.test('能够点击搜索结果并导航到新页面', async () => {
      // 等待搜索结果加载完成
      await page.waitForSelector('.react-results--main article h2 a');
      
      // 获取第一个结果的链接，以便稍后验证
      const firstResultUrl = await page.evaluate(() => {
        const firstResultLink = document.querySelector('.react-results--main article h2 a');
        return firstResultLink ? firstResultLink.href : null;
      });
      
      assert(firstResultUrl, '应该能获取到第一个搜索结果的URL');
      
      // 创建一个Promise来等待新页面打开
      const newPagePromise = new Promise(resolve => {
        browser.once('targetcreated', target => {
          resolve(target.page());
        });
      });
      
      // 点击第一个搜索结果 (在新标签页中打开)
      await page.click('.react-results--main article h2 a');
      
      // 等待新页面打开
      const newPage = await newPagePromise;
      await newPage.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // 验证新页面已加载
      const newPageUrl = newPage.url();
      console.log(`导航到了新页面: ${newPageUrl}`);
      
      // 截图新页面
      await newPage.screenshot({ 
        path: path.join(resultsDir, 'result-page.png') 
      });
      
      // 关闭新页面，回到搜索结果页
      await newPage.close();
    });
    
    // 测试4: 返回主页测试
    await report.test('能够返回到主页', async () => {
      await page.goto('https://www.duckduckgo.com', { waitUntil: 'networkidle2' });
      
      // 验证返回到主页
      const searchBoxExists = await page.$('#searchbox_input') !== null;
      assert(searchBoxExists, '应该回到首页并看到搜索框');
    });
    
    // 测试5: 验证黑暗模式切换功能
    await report.test('能够切换深色/浅色模式', async () => {
      // 点击设置按钮
      await page.click('[data-testid="navbar-menu-button"]');
      
      // 等待菜单显示
      await page.waitForSelector('[data-testid="setting-link"][data-key="theme"]');
      
      // 截图显示菜单状态
      await page.screenshot({ 
        path: path.join(resultsDir, 'settings-menu.png') 
      });
      
      // 点击主题设置
      await page.click('[data-testid="setting-link"][data-key="theme"]');
      
      // 等待主题选项出现
      await page.waitForSelector('[data-testid="theme-button"]');
      
      // 获取当前主题
      const initialTheme = await page.evaluate(() => {
        const htmlElement = document.documentElement;
        return htmlElement.getAttribute('data-theme') || 'light';
      });
      
      console.log(`当前主题: ${initialTheme}`);
      
      // 点击切换主题按钮
      const themeButtons = await page.$$('[data-testid="theme-button"]');
      const targetTheme = initialTheme === 'light' ? 'dark' : 'light';
      
      // 选择与当前主题相反的主题
      for (const button of themeButtons) {
        const buttonText = await page.evaluate(el => el.textContent.toLowerCase(), button);
        if (buttonText.includes(targetTheme)) {
          await button.click();
          break;
        }
      }
      
      // 等待主题切换生效
      await page.waitForTimeout(1000);
      
      // 验证主题已切换
      const newTheme = await page.evaluate(() => {
        const htmlElement = document.documentElement;
        return htmlElement.getAttribute('data-theme') || 'light';
      });
      
      console.log(`切换后主题: ${newTheme}`);
      assert(initialTheme !== newTheme, '主题应该成功切换');
      
      // 截图显示主题切换后状态
      await page.screenshot({ 
        path: path.join(resultsDir, `theme-${newTheme}.png`) 
      });
    });
    
    // 显示测试报告
    report.summary();
    
  } catch (error) {
    console.error('测试运行时出错:', error);
  } finally {
    // 关闭浏览器
    await browser.close();
    console.log('浏览器已关闭，测试完成');
  }
})();