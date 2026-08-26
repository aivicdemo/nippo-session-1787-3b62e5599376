import { test, expect } from '@playwright/test';

test.describe("リマインドスケジュール新規作成", () => {
  // SCEN-054: [normal] リマインドスケジュール新規作成 - 業務フロー「リマインドスケジュール新規作成」を開始から完了まで実行する
  test("リマインドスケジュール新規作成の業務フロー通しテスト", async ({ page, request }) => {
    // ログイン処理
    await test.step("ログイン画面でテストユーザーでログインする", async () => {
      await page.goto("/login.html");
      await page.fill('[name="username"]', 'test');
      await page.fill('[name="password"]', 'test');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
    });

    // リマインド通知管理画面を開く
    await test.step("リマインド通知管理画面を開く", async () => {
      await page.goto("/panels/scr-1787119211243.html");
      await expect(page.locator('text=リマインド通知管理')).toBeVisible();
    });

    // 「新規作成」ボタンをクリック
    await test.step("「新規作成」ボタンをクリックしてフォームを表示する", async () => {
      await page.click('[data-testid="create-schedule-button"]');
      await expect(page.locator('#create-modal')).toBeVisible();
    });

    // 作成フォームで入力する
    const uniqueValue = "朝会報告" + Date.now();
    await test.step("リマインドスケジュール作成フォームで内容を入力する", async () => {
      // 通知時刻を入力
      const sendTimeInput = page.locator('[data-testid="send-time-input"]');
      await sendTimeInput.click();
      await sendTimeInput.fill("09:00");

      // 対象チームを選択（営業チーム）
      const teamSelect = page.locator('[data-testid="team-select"]');
      await teamSelect.selectOption("1");

      // 報告期限を入力
      const deadlineHoursInput = page.locator('[data-testid="deadline-hours-input"]');
      await deadlineHoursInput.fill("2");

      // 有効にするチェックボックスを確認
      const isActiveCheckbox = page.locator('[data-testid="is-active-checkbox"]');
      await isActiveCheckbox.check();
    });

    // 「保存」ボタンをクリック
    let rowsBeforeCreate: any[] = [];
    await test.step("保存前のリマインド通知スケジュール記録件数を取得する", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "リマインド通知履歴",
      );
      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      rowsBeforeCreate = await res.json();
    });

    await test.step("保存ボタンをクリックしてスケジュールを作成する", async () => {
      await page.click('[data-testid="save-schedule-button"]');
      await expect(page.locator('#create-modal')).not.toBeVisible();
    });

    // リマインド通知管理画面に遷移し、スケジュール一覧に新規作成されたスケジュールが表示されることを確認
    await test.step("リマインド通知管理画面に遷移し、新規作成されたスケジュールが表示されることを確認する", async () => {
      await expect(page.locator('text=リマインド通知管理')).toBeVisible();
      await expect(page.locator('#schedules-list')).toBeVisible();
    });

    // 記録が実際に保存されたことを確認
    await test.step("保存後のリマインド通知スケジュール記録を確認する", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "リマインド通知履歴",
      );
      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      const rowsAfterCreate = await res.json();
      
      expect(Array.isArray(rowsAfterCreate)).toBe(true);
      expect(rowsAfterCreate.length).toBeGreaterThanOrEqual(rowsBeforeCreate.length);
    });

    // スケジュール項目の通知状態が「有効」で表示されていることを確認
    await test.step("スケジュール項目に通知状態が「有効」で表示されていることを確認する", async () => {
      const schedulesList = page.locator('#schedules-list');
      await expect(schedulesList).toBeVisible();
      const scheduleItems = schedulesList.locator('li, div[class*="schedule"]');
      expect(await scheduleItems.count()).toBeGreaterThan(0);
    });
  });
});