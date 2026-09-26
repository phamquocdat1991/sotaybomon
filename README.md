# Sổ tay bộ môn (Sổ tay giáo viên THCS & THPT)

Phiên bản hiện tại: **5.0.0 — Học đường tương tác & Chuẩn Thông tư 22**.

Ứng dụng quản lý công việc và trợ giảng thông minh dành cho giáo viên bộ môn: Tổng quan điều hành, Thời khóa biểu 38 tuần, Theo dõi tiết học tương tác (Vòng quay may mắn, Đồng hồ nhóm, Bảng vinh danh), Sổ điểm & Xếp loại theo Thông tư 22/2021/TT-BGDĐT, Trợ lý AI Sandwich Feedback và Soạn tin nhắn Zalo gửi Phụ huynh 1-Click.

## Chạy trên máy

```bash
npm ci
npm run dev
```

## Triển khai Vercel từ GitHub

1. Đẩy thư mục dự án lên một repository GitHub.
2. Import repository đó trong Vercel.
3. Giữ nguyên thiết lập framework Next.js và bấm Deploy.

Dữ liệu của phiên bản này được lưu an toàn bằng `localStorage` trên từng trình duyệt; ứng dụng có thể hoạt động hoàn toàn ngoại tuyến (Offline) không phụ thuộc đường truyền mạng trường học. Giáo viên có thể tải bản sao lưu JSON và khôi phục trên thiết bị khác trong trang Thiết lập.

## Nghiệp vụ và tính năng nổi bật (Phiên bản 5.0.0)

### 1. Bộ công cụ Trợ giảng tương tác trên lớp (Mới)
- **🎡 Vòng quay may mắn / Bốc thăm ngẫu nhiên**: Gọi học sinh phát biểu hoặc kiểm tra bài cũ với hiệu ứng hồi hộp và âm thanh chúc mừng Web Audio API. Lọc thông minh học sinh chưa có điểm hoạt động hoặc loại trừ học sinh vắng.
- **⏱️ Đồng hồ đếm ngược hoạt động nhóm**: Cài sẵn 30s, 1p, 2p, 3p, 5p; hỗ trợ chiếu toàn màn hình (Projector Mode) và chuông báo khi hết giờ thảo luận.
- **🏆 Bảng vinh danh tiết học**: Tự động tổng kết Top 3–5 học sinh tích cực nhất tiết học và hỗ trợ 1-click sao chép gửi vào nhóm Zalo lớp.

### 2. Chuẩn hóa đánh giá theo Thông tư 22/2021/TT-BGDĐT (Mới)
- Tính điểm trung bình môn học kỳ có trọng số theo quy chuẩn Bộ GD&ĐT.
- Tự động xếp loại học lực môn học theo 4 mức: **Tốt, Khá, Đạt, Chưa đạt**, áp dụng chặt chẽ tiêu chí khống chế điểm thành phần.
- Hiển thị huy hiệu xếp loại TT22 trực quan trong Sổ điểm, Hồ sơ học sinh và Báo cáo tiến bộ.
- Xuất sổ điểm ra file `.csv` chuẩn Thông tư 22 mở được bằng Microsoft Excel.

### 3. Trợ lý Sư phạm Thông minh & Soạn tin nhắn Zalo 1-Click (Mới)
- **Lời phê Sandwich Feedback 3 vế**: Khen ngợi nỗ lực cụ thể ➔ Nhắc nhở khéo léo điểm cần khắc phục ➔ Động viên và định hướng giải pháp.
- **Soạn tin nhắn Zalo gửi Phụ huynh (1-Click Copy)**: 4 kịch bản thiết thực (Khen ngợi nỗ lực, Nhắc nhở học tập, Thông báo chuyên cần vắng/muộn, Báo cáo kết quả định kỳ) với lời chào trang trọng, đầy đủ thông tin để giáo viên gửi trực tiếp qua Zalo.
- **Hỗ trợ kết nối Google Gemini AI**: Tùy chọn nhập API Key trong Thiết lập để kích hoạt trí tuệ nhân tạo Gemini Flash; nếu để trống, ứng dụng hoạt động ngoại tuyến (Offline) an toàn 100%.

### 4. Quản lý lớp học & Dữ liệu chuyên sâu
- Thời khóa biểu độc lập cho 38 tuần; theo dõi và đánh dấu tiết đã hoàn thành.
- Nhập danh sách học sinh từ file Excel `.xlsx`, `.csv` hoặc dán trực tiếp từ Google Sheets.
- Xem biểu đồ cột tiến trình điểm số từng học sinh, quản lý thông tin liên hệ phụ huynh.
- Sao lưu & khôi phục toàn bộ dữ liệu ra file JSON, ghi nhật ký chỉnh sửa 80 hoạt động gần nhất.

## Thông tin bộ khung


A clean full-stack starter running on [vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Sites Lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json`, when present, declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from `oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive `oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the OAuth cookies, and identity header injection. Do not implement app routes for those reserved paths. Routes that do not import and call the helper remain anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the Sites hosting platform's access policy controls for workspace-wide restrictions, or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write actions tied to the current ChatGPT user. Leave public content anonymous.

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build and verify the rendered development-preview metadata
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
