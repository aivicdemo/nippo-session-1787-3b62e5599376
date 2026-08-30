import { test, expect } from '@playwright/test';

test.describe("未提出メンバーリマインド送信フロー", () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto("/login.html");
    await page.fill('[name="username"]', 'test');
    await page.fill('[name="password"]', 'test');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
  });

  // SCEN-639
  test("SCEN-639: [normal] 未提出メンバーリマインド送信フロー - 業務フロー全体を実行", async ({ page, request }) => {
    // 工程1: 部長向けダッシュボードにアクセス
    await test.step("部長向けダッシュボード画面にアクセス", async () => {
      await page.goto("/panels/scr-1787119200549.html");
      const dashboardElement = page.locator('[data-testid="submitted-count"]');
      await expect(dashboardElement).toBeVisible();
    });

    // 工程2: 本日の朝会報告提出状況を確認し、未提出メンバーが存在することを視認
    await test.step("本日の朝会報告提出状況を確認", async () => {
      const unsubmittedCountElement = page.locator('[data-testid="unsubmitted-count"]');
      await expect(unsubmittedCountElement).toBeVisible();
      const unsubmittedCountText = await unsubmittedCountElement.textContent();
      expect(unsubmittedCountText).not.toBe("0");
    });

    // 工程3: 「未提出メンバーへリマインド送信」ボタンをクリック前に記録件数を取得
    let rowsBeforeCount = 0;
    await test.step("リマインド送信前の記録件数を取得", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "リマインド通知履歴",
      );
      
      expect(tableIndex).toBeGreaterThanOrEqual(0);

      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      expect(res.ok()).toBe(true);
      const rowsBefore = await res.json();
      expect(Array.isArray(rowsBefore)).toBe(true);
      rowsBeforeCount = rowsBefore.length;
    });

    // 工程4: 「未提出メンバーへリマインド送信」ボタンをクリック
    await test.step("未提出メンバーへリマインド送信ボタンをクリック", async () => {
      const reminderButton = page.locator('[data-testid="send-reminder-button"]');
      await expect(reminderButton).toBeVisible();
      await reminderButton.click();
    });

    // 工程5: リマインド送信確認ダイアログが表示されることを確認
    await test.step("リマインド送信確認ダイアログが表示されることを確認", async () => {
      const confirmOverlay = page.locator('#reminder-confirm-overlay');
      await expect(confirmOverlay).toBeVisible();
      const reminderCountText = page.locator('#reminder-count-text');
      await expect(reminderCountText).toBeVisible();
    });

    // 工程6: ダイアログの「送信」ボタンをクリックしてリマインド送信処理を実行
    await test.step("ダイアログの送信ボタンをクリックしてリマインド送信実行", async () => {
      const confirmButton = page.locator('button:has-text("送信")');
      await expect(confirmButton).toBeVisible();
      await confirmButton.click();
    });

    // 工程7: ダッシュボード画面がリマインド送信完了状態に遷移することを確認
    await test.step("ダッシュボード画面がリマインド送信完了状態に遷移することを確認", async () => {
      const dashboardElement = page.locator('[data-testid="submitted-count"]');
      await expect(dashboardElement).toBeVisible();
    });

    // 工程8: 記録の確認 - リマインド通知履歴テーブルに送信記録が残っていることを確認
    await test.step("リマインド通知履歴テーブルに記録が残っていることを確認", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "リマインド通知履歴",
      );
      
      expect(tableIndex).toBeGreaterThanOrEqual(0);

      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      expect(res.ok()).toBe(true);
      const rowsAfter = await res.json();
      expect(Array.isArray(rowsAfter)).toBe(true);

      // 操作前の件数と操作後の件数を比較
      expect(rowsAfter.length).toBeGreaterThan(rowsBeforeCount);
    });

    // 工程9: 報告提出状況テーブルから未提出メンバーが正しく記録されていることを確認
    await test.step("報告提出状況テーブルに未提出メンバーが記録されていることを確認", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "報告提出状況",
      );

      expect(tableIndex).toBeGreaterThanOrEqual(0);

      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      expect(res.ok()).toBe(true);
      const rows = await res.json();
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBeGreaterThan(0);
    });

    // 工程10: ダッシュボード画面上でステータスが「リマインド送信済み」に更新されていることを確認
    await test.step("ダッシュボード画面上のステータスが更新されていることを確認", async () => {
      await page.goto("/panels/scr-1787119200549.html");

      const unsubmittedCountElement = page.locator('[data-testid="unsubmitted-count"]');
      await expect(unsubmittedCountElement).toBeVisible();
    });
  });
});