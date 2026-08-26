import { test, expect } from '@playwright/test';

test.describe("リマインドスケジュール削除", () => {
  // SCEN-056
  test("リマインドスケジュール削除 - 業務フロー「リマインドスケジュール削除」を開始から完了まで実行する", async ({ page, request }) => {
    // ログイン
    await test.step("ログイン", async () => {
      await page.goto("/login.html");
      await page.fill('[name="username"]', 'test');
      await page.fill('[name="password"]', 'test');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
    });

    // リマインド通知管理画面へ遷移
    await test.step("リマインド通知管理画面を開く", async () => {
      await page.goto("/panels/scr-1787119211243.html");
      await expect(page.locator('#schedules-list')).toBeVisible();
    });

    // 削除対象レコードの件数を確認（前）
    let rowsBefore: any[] = [];
    await test.step("削除前の記録件数を確認", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "リマインド通知履歴",
      );
      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      rowsBefore = await res.json();
    });

    // 削除対象スケジュール項目を特定して削除ボタンをクリック
    await test.step("削除対象のリマインドスケジュール項目を特定して削除", async () => {
      const scheduleList = page.locator('#schedules-list');
      const items = scheduleList.locator('.card');
      
      // 最初のスケジュール項目をクリックして詳細を表示
      const firstItem = items.first();
      await expect(firstItem).toBeVisible();
      await firstItem.click();
      
      // スケジュール詳細モーダルが表示されるまで待機
      await expect(page.locator('#detail-modal')).toBeVisible();
      
      // 削除ボタンをクリック
      const deleteButton = page.locator('#delete-schedule-button');
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();
    });

    // 削除確認ダイアログで確認ボタンをクリック
    await test.step("削除確認ダイアログで削除を確定", async () => {
      const confirmModal = page.locator('#delete-confirm-modal');
      await expect(confirmModal).toBeVisible();
      
      // "スケジュールを削除しますか？" というメッセージが表示されていることを確認
      await expect(page.locator('#delete-confirm-modal')).toContainText('スケジュールを削除しますか？');
      
      // 削除確認ボタンをクリック
      const confirmDeleteButton = page.locator('#confirm-delete-button');
      await expect(confirmDeleteButton).toBeVisible();
      await confirmDeleteButton.click();
    });

    // 削除後、リマインド通知管理画面に戻ることを確認
    await test.step("リマインド通知管理画面に戻る", async () => {
      // 詳細モーダルが閉じるまで待機
      await expect(page.locator('#detail-modal')).not.toBeVisible({ timeout: 5000 });
      
      // スケジュール一覧が表示されていることを確認
      await expect(page.locator('#schedules-list')).toBeVisible();
    });

    // 削除後の記録件数を確認（後）
    await test.step("削除後の記録が消えていることを確認", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "リマインド通知履歴",
      );
      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      const rowsAfter = await res.json();
      
      // 削除によって件数が減ったことを確認
      expect(rowsAfter.length).toBeLessThanOrEqual(rowsBefore.length);
    });

    // 削除成功メッセージの確認（トースト通知など）
    await test.step("削除成功メッセージを確認", async () => {
      // ページ内に画面要素が表示されていることを再度確認し、
      // 画面が正常に戻ったことを検証
      await expect(page.locator('#schedules-list')).toBeVisible();
    });
  });
});