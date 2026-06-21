import { expect, test } from "@playwright/test";
import {
  createAdminTestClient,
  createTestUser,
  type TestClient,
  type TestUser,
} from "@/tests/setup/supabase-test-clients";

test.describe("manager happy path", () => {
  let admin: TestClient;
  let user: TestUser;

  test.beforeAll(async () => {
    admin = createAdminTestClient();
    user = await createTestUser(admin, "e2e");
  });

  test.afterAll(async () => {
    if (user) await admin.auth.admin.deleteUser(user.id);
  });

  test("login, add employee and evidence, revise take, then see feed", async ({ page }) => {
    const employeeName = `Minh E2E ${Date.now()}`;
    const observation = "Delivered the release notes before the deadline";
    const currentTake = "Reliable on scoped delivery work";

    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Mật khẩu").fill(user.password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL("http://127.0.0.1:3100/");
    // Roster ready (auto-wait on a stable element instead of networkidle).
    await expect(page.getByRole("heading", { name: "Roster" })).toBeVisible();

    await page.getByRole("button", { name: "+ Nhân viên", exact: true }).click();
    const employeeDialog = page.getByRole("dialog");
    await employeeDialog.getByLabel("Tên *").fill(employeeName);
    await employeeDialog.getByLabel("Vai trò").fill("Engineer");
    await employeeDialog.getByRole("button", { name: "Lưu" }).click();
    await expect(page.getByRole("link", { name: employeeName })).toBeVisible();

    await page.getByRole("link", { name: employeeName }).click();
    // Wait for the profile URL — the Roster (incl. its daily-reminder "+ Ghi hôm nay"
    // banner) then unmounts, so the only "+ Ghi hôm nay" left is the profile's preselected
    // one. (The employee card name is also a heading, so a heading-wait is not enough.)
    await page.waitForURL(/\/employees\/[0-9a-f-]+$/);
    await page.getByRole("button", { name: "+ Ghi hôm nay" }).click();
    const entryDialog = page.getByRole("dialog");
    await entryDialog.getByPlaceholder(/Quan sát cụ thể/).fill(observation);
    await entryDialog.getByRole("button", { name: "Tích cực" }).click();
    await entryDialog.getByRole("button", { name: "Lưu" }).click();

    const timelineEntry = page.getByRole("listitem").filter({ hasText: observation });
    await expect(timelineEntry).toBeVisible();
    await expect(timelineEntry.getByRole("button")).toHaveCount(0);

    const take = page.getByLabel("Nhận định hiện tại");
    await take.fill(currentTake);
    await take.blur();
    await expect(page.getByText("đã lưu", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Feed", exact: true }).click();
    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByText(observation, { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: employeeName })).toBeVisible();
  });
});
