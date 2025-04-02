/**
 * Puppeteer网页爬虫示例
 * 展示了如何使用Puppeteer抓取网页内容，包括：
 * 1. 爬取文本内容
 * 2. 爬取图片
 * 3. 监听和拦截网络请求
 * 4. 保存数据
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

(async () => {
  // 创建保存结果的目录
  const resultsDir = path.join(__dirname, 'results');
  try {
    await fs.mkdir(resultsDir, { recursive: true });
  } catch (err) {
    console.log('目录已存在或创建失败');
  }

  // 启动浏览器
  const browser = await puppeteer.launch({ 
    headless: true, // 对于爬虫，通常使用无头模式
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 设置用户代理，避免被网站识别为爬虫
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36');
    
    // 设置视口大小
    await page.setViewport({ width: 1280, height: 800 });
    
    // 监听网络请求，可以用于收集API数据
    const apiResults = [];
    page.on('response', async response => {
      const url = response.url();
      
      // 例如，只收集特定API的响应
      if (url.includes('/api/') && response.status() === 200) {
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            apiResults.push({
              url,
              data
            });
          }
        } catch (error) {
          console.error(`解析API响应失败: ${url}`, error);
        }
      }
    });
    
    // 设置请求拦截器，可以屏蔽图片等资源加载以提高性能
    // await page.setRequestInterception(true);
    // page.on('request', request => {
    //   // 对于爬虫，可以选择跳过图片、字体等资源的加载
    //   const resourceType = request.resourceType();
    //   if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
    //     request.abort();
    //   } else {
    //     request.continue();
    //   }
    // });
    
    // 导航到目标网站
    console.log('正在访问网站...');
    await page.goto('https://news.ycombinator.com/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // 爬取文本内容例子：抓取Hacker News上的新闻标题和链接
    console.log('正在爬取新闻内容...');
    const newsItems = await page.evaluate(() => {
      // 这段代码在浏览器环境中执行
      const items = document.querySelectorAll('.athing');
      return Array.from(items).map(item => {
        // 获取标题
        const titleElement = item.querySelector('.titleline > a');
        const title = titleElement ? titleElement.innerText : '';
        const url = titleElement ? titleElement.href : '';
        
        // 获取分数和评论（在下一个元素中）
        const scoreRow = item.nextElementSibling;
        const score = scoreRow ? scoreRow.querySelector('.score')?.innerText || '0 points' : '0 points';
        
        return { title, url, score };
      });
    });
    
    // 保存爬取的新闻内容
    await fs.writeFile(
      path.join(resultsDir, 'hacker-news.json'),
      JSON.stringify(newsItems, null, 2)
    );
    console.log(`已爬取 ${newsItems.length} 条新闻，并保存到 results/hacker-news.json`);
    
    // 爬取图片例子
    console.log('正在跳转到示例页面...');
    await page.goto('https://unsplash.com/s/photos/nature', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // 等待图片加载
    await page.waitForSelector('img', { timeout: 60000 });
    
    // 爬取图片URL
    const imageUrls = await page.evaluate(() => {
      const imgElements = document.querySelectorAll('img[srcset]');
      return Array.from(imgElements)
        .slice(0, 5) // 只获取前5张图片
        .map(img => {
          // 获取最大分辨率的图片URL
          const srcset = img.getAttribute('srcset');
          const src = img.getAttribute('src');
          
          // 如果有srcset，解析它获取最大分辨率的图片
          if (srcset) {
            const sources = srcset.split(',')
              .map(s => s.trim().split(' '))
              .sort((a, b) => {
                // 根据宽度排序，获取最大的
                const aWidth = a[1] ? parseInt(a[1].replace('w', '')) : 0;
                const bWidth = b[1] ? parseInt(b[1].replace('w', '')) : 0;
                return bWidth - aWidth;
              });
              
            if (sources.length > 0 && sources[0].length > 0) {
              return sources[0][0];
            }
          }
          
          return src; // 如果没有srcset，返回src
        })
        .filter(url => url && url.startsWith('http')); // 只保留有效的URL
    });
    
    // 将图片URL保存到文件
    await fs.writeFile(
      path.join(resultsDir, 'image-urls.json'),
      JSON.stringify(imageUrls, null, 2)
    );
    console.log(`已爬取 ${imageUrls.length} 张图片URL，并保存到 results/image-urls.json`);
    
    // 保存API响应数据（如果有）
    if (apiResults.length > 0) {
      await fs.writeFile(
        path.join(resultsDir, 'api-results.json'),
        JSON.stringify(apiResults, null, 2)
      );
      console.log(`已捕获 ${apiResults.length} 个API响应，并保存到 results/api-results.json`);
    }
    
    // 截取整个页面的截图
    await page.screenshot({ 
      path: path.join(resultsDir, 'screenshot.png'),
      fullPage: true
    });
    console.log('已保存网页截图到 results/screenshot.png');
    
  } catch (error) {
    console.error('爬虫运行过程中出错:', error);
  } finally {
    // 关闭浏览器
    await browser.close();
    console.log('浏览器已关闭，爬虫任务完成');
  }
})();