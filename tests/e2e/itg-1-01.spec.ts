import { test, expect } from '@playwright/test';

test.describe("日報入力・編集画面", () => {
  // SCEN-059: [normal] 日報入力・編集画面 - 〈日報入力・送信〉が最初から最後まで通り、記録が残る
  test("日報入力・送信フロー完全通し検証", async ({ page, request }) => {
    const uniqueYesterday = "機能Aのバグ修正完了_" + Date.now();
    const uniqueToday = "機能Bの実装開始_" + Date.now();
    const uniqueIssues = "データベース接続タイムアウト_" + Date.now();

    // ログイン
    await test.step("開発エンジニアがシステムにログインする", async () => {
      await page.goto("/login.html");
      await page.fill('[name="username"]', 'test');
      await page.fill('[name="password"]', 'test');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
    });

    // 日報入力・編集画面にアクセス
    await test.step("日報入力・編集画面にアクセスする", async () => {
      await page.goto("/panels/scr-1787119190590.html");
      await expect(page.locator('id=report-form')).toBeVisible();
    });

    // 3項目の入力
    await test.step("日報3項目を入力する", async () => {
      await page.fill('[data-testid="yesterday-achievement-input"]', uniqueYesterday);
      await page.fill('[data-testid="today-plan-input"]', uniqueToday);
      await page.fill('[data-testid="issues-input"]', uniqueIssues);

      // 入力内容が反映されていることを確認
      const yesterdayValue = await page.inputValue('[name="yesterday_achievement"]');
      const todayValue = await page.inputValue('[name="today_plan"]');
      const issuesValue = await page.inputValue('[name="issues"]');

      expect(yesterdayValue).toContain(uniqueYesterday);
      expect(todayValue).toContain(uniqueToday);
      expect(issuesValue).toContain(uniqueIssues);
    });

    // 送信ボタンをクリック
    await test.step("日報を送信する", async () => {
      await page.click('[data-testid="submit-button"]');
      // 送信完了確認画面が表示されるまで待機
      await expect(page.locator('id=success-message')).toBeVisible({ timeout: 10000 });
    });

    // 送信完了メッセージの確認
    await test.step("送信完了確認画面で完了メッセージを確認する", async () => {
      const successMessage = await page.locator('id=success-message').textContent();
      expect(successMessage).not.toBeNull();
    });

    // 日報確認・検索画面に遷移
    await test.step("日報確認・検索画面にアクセスする", async () => {
      await page.goto("/panels/scr-1787119221707.html");
      await expect(page.locator('id=reports-tbody')).toBeVisible();
    });

    // 本日の日報が一覧に表示されていることを確認
    await test.step("本日の日報が一覧に表示されていることを確認する", async () => {
      const reportList = await page.locator('id=reports-tbody').innerText();
      expect(reportList).toBe(true);
    });

    // 送信した日報の詳細を検索・開く
    await test.step("送信した日報の詳細を開く", async () => {
      // 検索キーワードで日報を検索
      await page.fill('[data-testid="keyword-search"]', uniqueYesterday);
      await page.click('[data-testid="search-button"]');
      
      // 検索結果が表示されるまで待機
      await expect(page.locator('id=reports-tbody')).toContainText(uniqueYesterday, { timeout: 5000 });
      
      // 結果の最初の行をクリックして詳細を開く
      const reportRow = page.locator('.report-row').first();
      await reportRow.click();
    });

    // 詳細画面で3項目すべてが記録されていることを確認
    await test.step("詳細画面で入力した3項目がすべて記録されていることを確認する", async () => {
      // 昨日の実績を確認
      const detailYesterday = await page.locator('id=detail-yesterday').textContent();
      expect(detailYesterday).toContain(uniqueYesterday);

      // 今日の予定を確認
      const detailToday = await page.locator('id=detail-today').textContent();
      expect(detailToday).toContain(uniqueToday);

      // 課題を確認
      const detailIssues = await page.locator('id=detail-issues').textContent();
      expect(detailIssues).toContain(uniqueIssues);
    });

    // API経由でデータベースに記録が残っていることを確認
    await test.step("朝会報告テーブルでデータベース記録を確認する", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "朝会報告",
      );

      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      expect(res.ok()).toBe(true);

      const rows = await res.json();
      const recordString = JSON.stringify(rows);
      
      expect(recordString).toContain(uniqueYesterday);
      expect(recordString).toContain(uniqueToday);
      expect(recordString).toContain(uniqueIssues);
    });
  });
});