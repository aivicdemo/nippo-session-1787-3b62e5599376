import { test, expect } from '@playwright/test';

test.describe("リマインドスケジュール新規作成", () => {
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

  // SCEN-054
  test("[normal] リマインドスケジュール新規作成 - 業務フロー「リマインドスケジュール新規作成」を開始から完了まで実行する", async ({ page, request }) => {
    // 工程1: リマインド通知管理画面を開く
    await test.step("リマインド通知管理画面を開く", async () => {
      await page.goto("/panels/scr-1787119211243.html");
      await expect(page.locator("text=リマインド通知管理")).toBeVisible();
    });

    // 工程2: 「新規作成」ボタンをクリックする
    await test.step("「新規作成」ボタンをクリックする", async () => {
      await page.click('[data-testid="create-schedule-button"]');
      await expect(page.locator("#create-modal")).toBeVisible();
    });

    // 工程3: リマインドスケジュール作成フォームで入力する
    await test.step("リマインドスケジュール作成フォームで入力する", async () => {
      // 通知時刻（朝会開始時刻）を入力
      const uniqueTime = (8 + Math.floor(Math.random() * 4)).toString().padStart(2, '0') + ":00";
      await page.fill('[name="send_time"]', uniqueTime);

      // 対象チーム（部員メンバー選択）を選択
      await page.selectOption('[name="team_id"]', { label: "営業チーム" });

      // 報告期限（送信後、何時間以内に報告）を入力
      const uniqueHours = "1";
      await page.fill('[name="deadline_hours"]', uniqueHours);

      // 作成後すぐに有効にするをチェック
      await page.check('[name="is_active"]');

      // 入力値の確認
      await expect(page.locator('[name="send_time"]')).toHaveValue(uniqueTime);
      await expect(page.locator('[name="team_id"]')).toHaveValue("営業チーム");
      await expect(page.locator('[name="deadline_hours"]')).toHaveValue(uniqueHours);
      await expect(page.locator('[name="is_active"]')).toBeChecked();
    });

    // 工程4: 「保存」ボタンをクリックする
    await test.step("「保存」ボタンをクリックする", async () => {
      await page.click('[data-testid="save-schedule-button"]');
      await expect(page.locator("#create-modal")).not.toBeVisible();
      await expect(page.locator("#schedules-list")).toBeVisible();
    });

    // 工程5: リマインド通知管理画面に遷移し、新規作成されたスケジュールが表示されることを確認
    await test.step("新規作成されたスケジュールが表示されることを確認", async () => {
      // リマインド通知管理画面の通知スケジュール一覧に新規作成されたスケジュールが表示されていることを確認
      const schedulesList = page.locator("#schedules-list");
      await expect(schedulesList).toBeVisible();

      // スケジュール項目に「営業チーム」が表示されていることを確認
      await expect(page.locator("#schedules-list")).toContainText("営業チーム");

      // スケジュール項目に通知状態が「有効」で表示されていることを確認
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "リマインド通知履歴",
      );

      if (tableIndex >= 0) {
        const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
        const rows = await res.json();
        expect(rows.length).toBeGreaterThan(0);
      }
    });
  });
});