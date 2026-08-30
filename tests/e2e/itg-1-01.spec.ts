import { test, expect } from '@playwright/test';

test.describe("日報下書き保存フロー", () => {
  test("SCEN-637: [normal] 日報下書き保存フロー - 業務フロー「日報下書き保存フロー」を開始から完了まで実行する", async ({ page, request }) => {
    await test.step("ログインページにアクセス", async () => {
      await page.goto("/login.html");
      await expect(page.locator('input[name="username"]')).toBeVisible();
    });

    await test.step("ログイン処理を実行", async () => {
      await page.fill('[name="username"]', 'test');
      await page.fill('[name="password"]', 'test');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
    });

    await test.step("日報入力・編集画面に遷移", async () => {
      await page.goto("/panels/scr-1787119190590.html");
      await expect(page.locator('[data-testid="yesterday-achievement-input"]')).toBeVisible();
    });

    await test.step("日報の3項目を入力", async () => {
      const uniqueYesterday = "顧客A社との打ち合わせ実施_" + Date.now();
      const uniqueToday = "提案資料の作成_" + Date.now();
      const uniqueIssue = "リソース不足による納期遅延リスク_" + Date.now();

      await page.fill('[data-testid="yesterday-achievement-input"]', uniqueYesterday);
      await page.fill('[data-testid="today-plan-input"]', uniqueToday);
      await page.fill('[data-testid="issues-input"]', uniqueIssue);

      await expect(page.locator('[data-testid="yesterday-achievement-input"]')).toHaveValue(uniqueYesterday);
      await expect(page.locator('[data-testid="today-plan-input"]')).toHaveValue(uniqueToday);
      await expect(page.locator('[data-testid="issues-input"]')).toHaveValue(uniqueIssue);
    });

    await test.step("下書き保存ボタンをクリック", async () => {
      await page.click('[data-testid="draft-button"]');
    });

    await test.step("下書き保存成功のトースト通知を確認", async () => {
      const successMessage = page.locator('#success-message');
      await expect(successMessage).toBeVisible({ timeout: 3000 });
      const messageText = await successMessage.textContent();
      expect(messageText).toContain('下書きを保存しました');
    });

    await test.step("別ページに遷移", async () => {
      await page.goto("/panels/scr-1787119200549.html");
    });

    await test.step("日報入力・編集画面に再度遷移して入力内容が復元されていることを確認", async () => {
      await page.goto("/panels/scr-1787119190590.html");
      await expect(page.locator('[data-testid="yesterday-achievement-input"]')).toBeVisible();

      const yesterdayValue = await page.locator('[data-testid="yesterday-achievement-input"]').inputValue();
      const todayValue = await page.locator('[data-testid="today-plan-input"]').inputValue();
      const issueValue = await page.locator('[data-testid="issues-input"]').inputValue();

      expect(yesterdayValue).toContain('顧客A社との打ち合わせ実施');
      expect(todayValue).toContain('提案資料の作成');
      expect(issueValue).toContain('リソース不足による納期遅延リスク');
    });

    await test.step("記録が保存されていることをAPI経由で確認", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "朝会報告",
      );

      if (apiUrl && appId && tableIndex !== -1) {
        const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
        const rows = await res.json();

        const savedReport = rows.find(
          (row: any) =>
            row.yesterday_achievement &&
            row.yesterday_achievement.includes('顧客A社との打ち合わせ実施'),
        );

        expect(savedReport).toBeDefined();
        if (savedReport) {
          expect(savedReport.today_plan).toContain('提案資料の作成');
          expect(savedReport.issues).toContain('リソース不足による納期遅延リスク');
        }
      }
    });
  });
});