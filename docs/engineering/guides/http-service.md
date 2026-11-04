# Hướng dẫn tích hợp `HttpService`

## Phạm vi và nguyên tắc

`src/shared/services/http.service.ts` là lớp vận chuyển cho **API nội bộ cùng origin**. Feature service gọi singleton `httpService` từ `@shared/services`, giữ nguyên trách nhiệm kiểm tra envelope/DTO, ánh xạ lỗi nghiệp vụ và quản lý trạng thái UI. Các service hiện có chưa được chuyển đồng loạt; tài liệu này là giao ước cho lần tích hợp tiếp theo của từng feature.

BE auth MVP dùng **access token và refresh token trong HttpOnly cookie**. JavaScript không đọc, lưu hay truyền hai token này qua `Authorization` hoặc header tùy biến. Trình duyệt tự gửi cookie phù hợp với URL khi `HttpService` dùng `credentials: "same-origin"`; dev đi qua Vite `/api` proxy. Nếu production chuyển API sang origin khác, phải thiết kế lại cookie/CORS/credentials cùng BE trước khi dùng client này.

## Giao diện request

| Thao tác | Cú pháp | Body |
|---|---|---|
| GET | `httpService.get<T>(endpoint, options?)` | Không có |
| POST | `httpService.post<T>(endpoint, body, options?)` | JSON |
| PUT | `httpService.put<T>(endpoint, body, options?)` | JSON |
| PATCH | `httpService.patch<T>(endpoint, body, options?)` | JSON |
| DELETE | `httpService.delete<T>(endpoint, options?)` | Không có |

`endpoint` là đường dẫn API bắt đầu bằng `/api/...`. `T` là **toàn bộ JSON response**, không tự động bóc `data`. Với response `204` hoặc body rỗng, kết quả là `undefined`; hãy chọn kiểu trả về phù hợp. Client đặt `Accept: application/json`, `Content-Type: application/json`, `cache: "no-store"`, và `credentials: "same-origin"` cho request. Khi body được cung cấp cho POST/PUT/PATCH, client `JSON.stringify` một lần.

`RequestOptions`:

| Thuộc tính | Ý nghĩa | Ví dụ |
|---|---|---|
| `headers?: Record<string,string>` | Header riêng của endpoint; ghép với header chung theo tên không phân biệt hoa thường | `{ "Idempotency-Key": key }` |
| `params?: Record<string,string>` | Thêm query parameter vào URL; tự mã hóa giá trị. Cần `String(...)` cho số/boolean | `{ page: String(page) }` |
| `signal?: AbortSignal` | Hủy request khi hook unmount hoặc request đã lỗi thời | `{ signal }` |
| `skipAuthRefresh?: boolean` | Không thử refresh sau 401; dùng cho luồng đặc biệt muốn tự xử lý 401 | `{ skipAuthRefresh: true }` |

Không truyền `Cookie`, `Authorization`, access token hoặc refresh token trong `options.headers`. Header nghiệp vụ như `Idempotency-Key` do feature tạo và truyền **trong cùng lần gọi** cùng `params` và `signal` nếu cần. FE không còn tạo fixture identity header cho DevAuth.
Auth MVP hiện tại không yêu cầu endpoint hoặc header CSRF; không dựa vào các đề xuất CSRF lịch sử trong handoff cũ.

```ts
import { httpService } from "@shared/services";

interface ApiResponse<T> { data: T; timestamp?: string }

export async function publish(input: PublicationInput, key: string, signal: AbortSignal) {
  const response = await httpService.post<ApiResponse<PublicationResult>>(
    "/api/v1/subscription/admin/configurations/FREE/publications",
    input,
    { headers: { "Idempotency-Key": key }, signal },
  );
  // Feature kiểm tra shape thật của response trước khi trả về domain model.
  return response.data;
}

const history = await httpService.get<ApiResponse<ConfigurationHistory>>(
  "/api/v1/subscription/admin/configurations/FREE/versions",
  { params: { limit: "20", beforeVersion: String(beforeVersion) }, signal },
);
```

Các ví dụ dùng endpoint đã có trong subscription management; kiểu dữ liệu và biến đầu vào rút gọn để tập trung vào request option. Luôn dùng contract đã được chấp nhận của feature đang tích hợp.

## 401, refresh và lỗi

Với request thường trả `401`, lớp chung gọi `POST /api/v1/auth/refresh` tối đa một lần rồi gửi lại request gốc tối đa một lần. Các request cùng chờ một refresh trong **một tab**. Request được gửi lại giữ method, body, `headers`, `params` và `signal`; vì vậy key dùng cho mutation phải ổn định qua retry. Auth endpoints `login`, `register`, `refresh`, `logout` không kích hoạt refresh. `403`, validation, conflict, lỗi mạng và response 5xx không kích hoạt refresh. Request đã abort không được retry. Không tự bọc thêm vòng refresh/retry trong feature service.

Refresh dùng refresh cookie do trình duyệt gửi và BE đặt cookie mới qua `Set-Cookie`; FE không nhận token trong JSON. Nếu refresh trả 401, client trả lỗi 401 gốc cho caller. Lỗi HTTP là `HttpError` (`Error` có `status`, `code`, `fieldErrors?`) lấy từ ProblemDetail khi có; feature quyết định thông điệp nghiệp vụ và điều hướng. Response thành công được parse JSON, nhưng client **không** kiểm tra envelope/DTO thay feature.

Lưu ý khi dùng POST/PUT/PATCH: retry chỉ an toàn khi 401 đến từ auth gate trước khi xử lý nghiệp vụ; với endpoint cần chống lặp, feature phải cung cấp `Idempotency-Key` theo contract BE. Luồng refresh nhiều tab và rotation race phụ thuộc chính sách BE; `HttpService` chỉ đồng bộ request trong một tab.

## Công thức chuyển một feature service

1. Xác nhận endpoint, body, query, header bắt buộc và envelope trong contract của feature. Giữ nguyên model và logic kiểm tra DTO hiện có.
2. Thay lần gọi `fetch` nội bộ bằng method tương ứng của `httpService`. Chuyển query sang `params`, header nghiệp vụ sang `headers`, `AbortSignal` sang `signal`; không tự thêm cookie/token hoặc refresh.
3. Dùng kiểu `ApiResponse<T>` khi BE trả envelope, sau đó bóc `data` trong feature. Giữ error mapping đặc thù và xử lý `HttpError.status/code/fieldErrors` tại biên feature/UI.
4. Kiểm tra trên backend thật qua proxy: request đầu, cookie sau login, 401 → refresh → retry, 401 không có phiên, 403, abort và mutation có key. Chạy `npm run build` và `npm run lint`; nếu sửa topic API client, chạy thêm `npm run test:topic-api` và kiểm tra contract.

Các API demo bên ngoài (`FAKE_STORE`, `JSON_PLACEHOLDER`) không dùng cookie auth nội bộ. Các service cũ còn gọi `fetch` trực tiếp là việc tích hợp của feature owner; tài liệu này không tuyên bố chúng đã được chuyển.
