import { test, expect } from '@playwright/test';

test.describe("リマインドスケジュール保存", () => {
  // SCEN-055
  test("リマインドスケジュール保存 - 業務フロー通しテスト", async ({ page, request }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    const uniqueSendTime = `08:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;

    await test.step("リマインド通知管理画面を開く", async () => {
      await page.goto("/");
      await expect(page).toHaveURL(/.*scr-1787119211243\.html$/);
      await expect(page.locator("text=リマインド通知管理")).toBeVisible();
    });

    await test.step("新規スケジュール作成ボタンをクリック", async () => {
      const createButton = page.locator('[data-testid="create-schedule-button"]');
      await expect(createButton).toBeVisible();
      await createButton.click();
    });

    await test.step("スケジュール設定フォームが表示されることを確認", async () => {
      const createModal = page.locator('#create-modal');
      await expect(createModal).toBeVisible();
      const createForm = page.locator('#create-form');
      await expect(createForm).toBeVisible();
    });

    await test.step("送信時刻を入力", async () => {
      const sendTimeInput = page.locator('[name="send_time"]');
      await expect(sendTimeInput).toBeVisible();
      await sendTimeInput.fill(uniqueSendTime);
      await expect(sendTimeInput).toHaveValue(uniqueSendTime);
    });

    await test.step("対象チームを選択可能な状態であることを確認", async () => {
      const teamSelect = page.locator('[name="team_id"]');
      await expect(teamSelect).toBeVisible();
      await teamSelect.click();
      await expect(page.locator('text=営業チーム')).toBeVisible();
      await expect(page.locator('text=企画チーム')).toBeVisible();
      await expect(page.locator('text=開発チーム')).toBeVisible();
      await page.locator('text=営業チーム').click();
    });

    await test.step("報告期限を入力", async () => {
      const deadlineInput = page.locator('[name="deadline_hours"]');
      await expect(deadlineInput).toBeVisible();
      await deadlineInput.fill('24');
    });

    await test.step("作成後すぐに有効にするをチェック", async () => {
      const isActiveCheckbox = page.locator('[name="is_active"]');
      await expect(isActiveCheckbox).toBeVisible();
      await isActiveCheckbox.check();
    });

    await test.step("保存ボタンをクリック", async () => {
      const saveButton = page.locator('[data-testid="save-schedule-button"]');
      await expect(saveButton).toBeVisible();
      await Promise.all([
        page.waitForURL(/.*scr-1787119211243\.html$/),
        saveButton.click(),
      ]);
    });

    await test.step("リマインド通知管理画面に遷移したことを確認", async () => {
      await expect(page).toHaveURL(/.*scr-1787119211243\.html$/);
      await expect(page.locator("text=リマインド通知管理")).toBeVisible();
    });

    await test.step("保存したスケジュールが通知スケジュール一覧に表示されることを確認", async () => {
      const schedulesList = page.locator('#schedules-list');
      await expect(schedulesList).toBeVisible();
      await expect(page.locator('#schedules-empty')).not.toBeVisible();
      const pageContent = await page.locator('body').textContent();
      expect(pageContent).toContain(uniqueSendTime);
    });

    await test.step("記録がデータベースに保存されていることを確認", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "リマインド通知履歴",
      );
      const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
      const rows = await res.json();
      expect(JSON.stringify(rows)).toContain(uniqueSendTime);
    });
  });
});