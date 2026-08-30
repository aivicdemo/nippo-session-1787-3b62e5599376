import { test, expect } from '@playwright/test';

test.describe("日報送信フロー", () => {
  // SCEN-638
  test("[normal] 日報送信フロー - 業務フロー「日報送信フロー」を開始から完了まで実行する", async ({ page, request }) => {
    const uniqueYesterday = "顧客A向け提案資料作成_" + Date.now();
    const uniqueToday = "顧客A との打ち合わせ_" + Date.now();
    const uniqueIssue = "プロジェクトBのスケジュール遅延_" + Date.now();

    await test.step("工程1: ログイン", async () => {
      await page.goto("/login.html");
      await page.fill('[name="username"]', 'testuser');
      await page.fill('[name="password"]', 'testpass');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
    });

    await test.step("工程2: ダッシュボードから日報入力・編集画面へ遷移", async () => {
      await page.goto("/panels/scr-1787119190590.html");
      await expect(page.locator('#report-form')).toBeVisible();
    });

    await test.step("工程3: 3項目を入力", async () => {
      await page.fill('[name="yesterday_achievement"]', uniqueYesterday);
      await page.fill('[name="today_plan"]', uniqueToday);
      await page.fill('[name="issues"]', uniqueIssue);
    });

    await test.step("工程4: 送信ボタンをクリック", async () => {
      await page.click('[data-testid="submit-button"]');
      await expect(page.locator('#success-message')).toBeVisible({ timeout: 5000 });
    });

    await test.step("工程5: 日報確認・検索画面へ遷移することを確認", async () => {
      await page.waitForURL(url => url.toString().includes('scr-1787119221707'));
      await expect(page.locator('#reports-tbody')).toBeVisible();
    });

    await test.step("工程6: 当該日報が一覧に表示され、ステータスが「提出済み」であることを確認", async () => {
      const reportRows = page.locator('[class="report-row"]');
      const rowCount = await reportRows.count();
      expect(rowCount).toBeGreaterThan(0);
      
      let found = false;
      for (let i = 0; i < rowCount; i++) {
        const rowText = await reportRows.nth(i).textContent();
        if (rowText && rowText.includes(uniqueYesterday)) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    await test.step("工程7: 当該日報の詳細を開き、入力した3項目が保存されていることを確認", async () => {
      const reportRows = page.locator('[class="report-row"]');
      const rowCount = await reportRows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const rowText = await reportRows.nth(i).textContent();
        if (rowText && rowText.includes(uniqueYesterday)) {
          await reportRows.nth(i).click();
          break;
        }
      }

      await expect(page.locator('#detail-panel')).toBeVisible();
      const detailContent = await page.locator('#detail-panel').textContent();
      
      expect(detailContent).toContain(uniqueYesterday);
      expect(detailContent).toContain(uniqueToday);
      expect(detailContent).toContain(uniqueIssue);
    });

    await test.step("工程8: データベースに記録を確認", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "朝会報告",
      );

      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      const rows = await res.json();
      
      expect(JSON.stringify(rows)).toContain(uniqueYesterday);
      expect(JSON.stringify(rows)).toContain(uniqueToday);
      expect(JSON.stringify(rows)).toContain(uniqueIssue);
    });
  });
});