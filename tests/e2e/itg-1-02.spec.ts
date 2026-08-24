import { test, expect } from '@playwright/test';

test.describe("部長向けダッシュボード", () => {
  // SCEN-060: [normal] 部長向けダッシュボード - チーム全体進捗ダッシュボード表示が最初から最後まで通り、記録が残る
  test("チーム全体進捗ダッシュボード表示が最初から最後まで通る", async ({ page, request }) => {
    const uniqueValue = "テスト課題" + Date.now();
    const engineerIds = ["engineer-a", "engineer-b", "engineer-c", "engineer-d", "engineer-e", 
                          "engineer-f", "engineer-g", "engineer-h", "engineer-i", "engineer-j"];
    const submittedEngineers = new Set<string>();

    // ログイン処理
    await test.step("部長がシステムにログイン", async () => {
      await page.goto("/login.html");
      await page.fill('[name="username"]', 'manager');
      await page.fill('[name="password"]', 'manager');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
      await page.goto("/panels/scr-1787119200549.html");
      await expect(page.locator(".header")).toBeVisible();
    });

    // 開発エンジニアAが初回ダッシュボードアクセス
    await test.step("開発エンジニアAが部長向けダッシュボードにアクセス", async () => {
      // 別ブラウザコンテキストでエンジニアAとしてログイン
      const engineerContext = await page.context().browser()?.newContext();
      if (!engineerContext) throw new Error("Failed to create context");
      const engineerPage = await engineerContext.newPage();
      
      await engineerPage.goto("/login.html");
      await engineerPage.fill('[name="username"]', 'engineer-a');
      await engineerPage.fill('[name="password"]', 'engineer-a');
      await Promise.all([
        engineerPage.waitForURL(url => !url.toString().includes('/login.html')),
        engineerPage.click('button[type="submit"]'),
      ]);
      
      // エンジニアAが日報を入力・提出
      await engineerPage.goto("/panels/scr-1787119190590.html");
      await expect(engineerPage.locator('[data-testid="yesterday-achievement-input"]')).toBeVisible();
      
      await engineerPage.fill('[name="yesterday_achievement"]', "昨日の実績" + Date.now());
      await engineerPage.fill('[name="today_plan"]', "今日の予定" + Date.now());
      await engineerPage.fill('[name="issues"]', uniqueValue);
      
      await Promise.all([
        engineerPage.waitForURL(url => url.toString().includes("/panels/")),
        engineerPage.click('[data-testid="submit-button"]'),
      ]);
      
      submittedEngineers.add("engineer-a");
      await engineerContext.close();
    });

    // 部長がダッシュボードをリロードして確認
    await test.step("部長がダッシュボードをリロードしてエンジニアAの情報を確認", async () => {
      await page.reload();
      await expect(page.locator('[data-testid="submitted-count"]')).toBeVisible();
      const submittedText = await page.locator('[data-testid="submitted-count"]').textContent();
      expect(submittedText).toContain("1");
    });

    // エンジニアB～Jが日報を入力・提出
    await test.step("開発エンジニアB～Jが日報入力・編集画面で情報を入力・提出", async () => {
      const engineersToSubmit = engineerIds.slice(1, 10);
      
      for (const engineerId of engineersToSubmit) {
        const engineerContext = await page.context().browser()?.newContext();
        if (!engineerContext) throw new Error("Failed to create context");
        const engineerPage = await engineerContext.newPage();
        
        await engineerPage.goto("/login.html");
        await engineerPage.fill('[name="username"]', engineerId);
        await engineerPage.fill('[name="password"]', engineerId);
        await Promise.all([
          engineerPage.waitForURL(url => !url.toString().includes('/login.html')),
          engineerPage.click('button[type="submit"]'),
        ]);
        
        await engineerPage.goto("/panels/scr-1787119190590.html");
        await expect(engineerPage.locator('[data-testid="yesterday-achievement-input"]')).toBeVisible();
        
        await engineerPage.fill('[name="yesterday_achievement"]', `${engineerId}の昨日実績`);
        await engineerPage.fill('[name="today_plan"]', `${engineerId}の今日予定`);
        await engineerPage.fill('[name="issues"]', uniqueValue);
        
        await Promise.all([
          engineerPage.waitForURL(url => url.toString().includes("/panels/")),
          engineerPage.click('[data-testid="submit-button"]'),
        ]);
        
        submittedEngineers.add(engineerId);
        await engineerContext.close();
      }
    });

    // 部長がダッシュボードをリロードして全員の情報を確認
    await test.step("部長がダッシュボードをリロードして全員の情報を確認", async () => {
      await page.reload();
      await expect(page.locator('[data-testid="submitted-count"]')).toBeVisible();
      const submittedText = await page.locator('[data-testid="submitted-count"]').textContent();
      expect(submittedText).toContain("10");
    });

    // ダッシュボードの課題情報確認
    await test.step("ダッシュボードに表示されている課題情報を確認", async () => {
      const issuesList = page.locator('#high-priority-list');
      await expect(issuesList).toBeVisible();
      const issuesContent = await issuesList.textContent();
      expect(issuesContent).toContain(uniqueValue);
    });

    // 部長がダッシュボードでチーム全体10名分のデータを確認
    await test.step("部長がダッシュボードでチーム全体10名分のデータを確認", async () => {
      const submittedCount = await page.locator('[data-testid="submitted-count"]').textContent();
      expect(submittedCount).toContain("10");
      
      const highPrioritySection = page.locator('#high-priority-section');
      await expect(highPrioritySection).toBeVisible();
    });

    // 日報確認・検索画面で全員の記録確認
    await test.step("日報確認・検索画面で全10名の日報記録が保存されていることを確認", async () => {
      await page.goto("/panels/scr-1787119221707.html");
      await expect(page.locator('[data-testid="keyword-search"]')).toBeVisible();
      
      await page.fill('[data-testid="keyword-search"]', uniqueValue);
      await page.click('[data-testid="search-button"]');
      
      const recordList = page.locator('[data-testid="record-list"]');
      await expect(recordList).toBeVisible();
      const recordContent = await recordList.textContent();
      expect(recordContent).toContain(uniqueValue);
    });

    // データベース記録確認
    await test.step("APIで日報記録がデータベースに保存されていることを確認", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tables = await page.evaluate(() => (window as any).AIVIC_TABLES || []);
      
      const reportTableIndex = tables.findIndex((t: any) => t.tableName === "朝会報告");
      expect(reportTableIndex).toBeGreaterThanOrEqual(0);
      
      const res = await request.get(`${apiUrl}/api/${reportTableIndex}?app=${appId}`);
      expect(res.ok()).toBe(true);
      const rows = await res.json();
      expect(JSON.stringify(rows)).toContain(uniqueValue);
      
      // 10名分の提出を確認
      const filteredRows = (rows as any[]).filter((row: any) => 
        JSON.stringify(row).includes(uniqueValue)
      );
      expect(filteredRows.length).toBeGreaterThanOrEqual(10);
    });

    // 最終確認: 部長は朝会での課題対応方針指示の判断材料を得ている
    await test.step("部長は最終的にダッシュボード上でチーム全体の進捗状況を把握し、朝会での課題対応方針指示の判断材料を得ている", async () => {
      await page.goto("/panels/scr-1787119200549.html");
      
      const submittedCount = await page.locator('[data-testid="submitted-count"]').textContent();
      expect(submittedCount).toContain("10");
      
      const highPrioritySection = page.locator('#high-priority-section');
      await expect(highPrioritySection).toBeVisible();
      
      const issuesList = page.locator('#high-priority-list');
      const issuesContent = await issuesList.textContent();
      expect(issuesContent).not.toBeNull();
      expect(issuesContent).toContain(uniqueValue);
    });
  });
});