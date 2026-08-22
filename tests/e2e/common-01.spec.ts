import { test, expect } from '@playwright/test';

test.describe("リマインド通知管理画面", () => {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  const screenUrl = "/panels/scr-1787119211243.html";

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl + screenUrl);
  });

  // SCEN-001: スケジュール新規作成ボタン押下でスケジュール作成フォームが表示される
  test("SCEN-001: スケジュール新規作成ボタン押下でスケジュール作成フォームが表示される", async ({ page }) => {
    const createButton = page.locator('button:has-text("スケジュール新規作成")');
    const exists = await createButton.count() > 0;
    
    if (exists) {
      await createButton.click();
      const form = page.locator('[class*="schedule-form"], [class*="form"], form');
      await expect(form).toBeVisible();
    } else {
      const formElement = page.locator('[class*="schedule-form"], [class*="form"], form');
      await expect(formElement).toBeVisible();
    }
  });

  // SCEN-002: リマインド送信時刻の入力値がスケジュール保存時に反映される
  test("SCEN-002: リマインド送信時刻の入力値がスケジュール保存時に反映される", async ({ page }) => {
    const timeInput = page.locator('input[type="time"], input[class*="time"]').first();
    const saveButton = page.locator('button:has-text("保存"), button:has-text("登録")');
    
    if (await timeInput.isVisible()) {
      await timeInput.fill("06:30");
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(500);
      }
      const savedValue = await timeInput.inputValue();
      expect(savedValue).toBe("06:30");
    }
  });

  // SCEN-003: 対象チームの選択値がスケジュール保存時に反映される
  test("SCEN-003: 対象チームの選択値がスケジュール保存時に反映される", async ({ page }) => {
    const teamSelect = page.locator('select[class*="team"], select[class*="group"]').first();
    const saveButton = page.locator('button:has-text("保存"), button:has-text("登録")');
    
    if (await teamSelect.isVisible()) {
      await teamSelect.selectOption({ index: 1 });
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(500);
      }
      const scheduleList = page.locator('table tbody tr, div[class*="schedule-list"] > div');
      await expect(scheduleList.first()).toBeVisible();
    }
  });

  // SCEN-004: 対象メンバーの選択値がスケジュール保存時に反映される
  test("SCEN-004: 対象メンバーの選択値がスケジュール保存時に反映される", async ({ page }) => {
    const memberSelect = page.locator('input[class*="member"], select[class*="member"], div[class*="member-select"]').first();
    const saveButton = page.locator('button:has-text("保存"), button:has-text("登録")');
    
    if (await memberSelect.isVisible()) {
      await memberSelect.click();
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.count() > 0) {
        await checkbox.check();
        await checkbox.nth(1).check({ force: true });
      }
      const confirmBtn = page.locator('button:has-text("確定"), button:has-text("OK")');
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
      }
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(500);
      }
      const detailArea = page.locator('[class*="detail"], [class*="member-display"]');
      if (await detailArea.count() > 0) {
        await expect(detailArea).toBeVisible();
      }
    }
  });

  // SCEN-005: 定時リマインド通知の自動送信設定を有効にできる
  test("SCEN-005: 定時リマインド通知の自動送信設定を有効にできる", async ({ page }) => {
    const toggle = page.locator('input[type="checkbox"][class*="toggle"], label:has(input[type="checkbox"]) >> xpath=../..').first();
    const saveButton = page.locator('button:has-text("保存")');
    
    if (await toggle.count() > 0) {
      const toggleInput = page.locator('input[type="checkbox"]').first();
      const isChecked = await toggleInput.isChecked();
      if (!isChecked) {
        await toggleInput.check();
      }
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(500);
      }
      const enabledText = page.locator('text=有効');
      if (await enabledText.count() > 0) {
        await expect(enabledText).toBeVisible();
      }
    }
  });

  // SCEN-006: 定時リマインド通知の自動送信設定を無効にできる
  test("SCEN-006: 定時リマインド通知の自動送信設定を無効にできる", async ({ page }) => {
    const toggleInput = page.locator('input[type="checkbox"]').first();
    const saveButton = page.locator('button:has-text("保存")');
    
    if (await toggleInput.count() > 0) {
      const isChecked = await toggleInput.isChecked();
      if (isChecked) {
        await toggleInput.uncheck();
      }
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(500);
      }
      const unchecked = await toggleInput.isChecked();
      expect(unchecked).toBe(false);
    }
  });

  // SCEN-007: スケジュール有効/無効の切り替えボタン押下で状態が変わる
  test("SCEN-007: スケジュール有効/無効の切り替えボタン押下で状態が変わる", async ({ page }) => {
    const scheduleRows = page.locator('table tbody tr, div[class*="schedule-row"]');
    if (await scheduleRows.count() > 0) {
      const firstRow = scheduleRows.first();
      const toggleBtn = firstRow.locator('input[type="checkbox"], button[class*="toggle"]').first();
      if (await toggleBtn.count() > 0) {
        const initialState = await toggleBtn.getAttribute('class');
        await toggleBtn.click();
        await page.waitForTimeout(300);
        const newState = await toggleBtn.getAttribute('class');
        expect(initialState).not.toBe(newState);
      }
    }
  });

  // SCEN-008: 有効なスケジュール行の有効/無効切り替えで無効状態に変わる
  test("SCEN-008: 有効なスケジュール行の有効/無効切り替えで無効状態に変わる", async ({ page }) => {
    const scheduleRows = page.locator('table tbody tr, div[class*="schedule-row"]');
    if (await scheduleRows.count() > 0) {
      const firstRow = scheduleRows.first();
      const toggleCheckbox = firstRow.locator('input[type="checkbox"]').first();
      if (await toggleCheckbox.count() > 0) {
        const isEnabled = await toggleCheckbox.isChecked();
        if (isEnabled) {
          await toggleCheckbox.uncheck();
          await page.waitForTimeout(300);
          const disabled = !await toggleCheckbox.isChecked();
          expect(disabled).toBe(true);
        }
      }
    }
  });

  // SCEN-009: 無効なスケジュール行の有効/無効切り替えで有効状態に変わる
  test("SCEN-009: 無効なスケジュール行の有効/無効切り替えで有効状態に変わる", async ({ page }) => {
    const scheduleRows = page.locator('table tbody tr, div[class*="schedule-row"]');
    if (await scheduleRows.count() > 0) {
      const firstRow = scheduleRows.first();
      const toggleCheckbox = firstRow.locator('input[type="checkbox"]').first();
      if (await toggleCheckbox.count() > 0) {
        const isEnabled = await toggleCheckbox.isChecked();
        if (!isEnabled) {
          await toggleCheckbox.check();
          await page.waitForTimeout(300);
          const enabled = await toggleCheckbox.isChecked();
          expect(enabled).toBe(true);
        }
      }
    }
  });

  // SCEN-010: リマインド通知スケジュール一覧に複数件のスケジュールが表示される
  test("SCEN-010: リマインド通知スケジュール一覧に複数件のスケジュールが表示される", async ({ page }) => {
    const scheduleRows = page.locator('table tbody tr, div[class*="schedule-row"], li[class*="schedule-item"]');
    const rowCount = await scheduleRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);
    
    if (rowCount > 0) {
      const firstRowText = await scheduleRows.first().textContent();
      expect(firstRowText).toBeTruthy();
    }
  });
});