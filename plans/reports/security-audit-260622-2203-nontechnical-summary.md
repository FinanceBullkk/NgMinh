---
type: security-audit
audience: project-owner
date: 2026-06-22
status: complete
---

# Báo Cáo An Toàn Dữ Liệu — Bản Dành Cho Chủ Dự Án

## Quyết định hiện tại

**Chưa nên nhập dữ liệu nhân viên thật hoặc phát hành chính thức.**

Hệ thống đã có nền tảng bảo vệ tốt và chúng tôi chưa tìm thấy trường hợp người này đọc
được ghi chú của người khác. Tuy nhiên, còn 5 vấn đề nghiêm trọng liên quan đến đăng ký
tài khoản, sửa lịch sử ghi chép và xoá dữ liệu. Các vấn đề này cần được xử lý trước khi
đưa dữ liệu thật vào hệ thống.

## Tóm tắt mức độ rủi ro

| Khu vực | Đánh giá | Ý nghĩa kinh doanh |
|---------|----------|--------------------|
| Người lạ đọc dữ liệu nhân viên | Tương đối tốt | Các thử nghiệm truy cập trái phép đều bị chặn |
| Tính trung thực của lịch sử ghi chép | Rủi ro cao | Ghi chép cũ có thể bị sửa bằng cách đi ngoài giao diện |
| An toàn tài khoản quản lý | Rủi ro cao | Chưa có lớp xác minh thứ hai khi đăng nhập hoặc xoá tài khoản |
| Khả năng xoá tài khoản đúng yêu cầu | Rủi ro cao | Một tài khoản khác có thể tạo liên kết làm việc xoá tài khoản thất bại |
| Rò rỉ chìa khoá quản trị | Tốt | Không tìm thấy chìa khoá bí mật trong mã nguồn hoặc lịch sử Git |
| Khả năng điều tra sự cố | Yếu | Chưa có nhật ký đủ để biết ai đã xuất hoặc xoá dữ liệu |

## Những điểm đang làm tốt

- Người chưa đăng nhập không đọc được dữ liệu.
- Thông tin đăng nhập giả bị từ chối.
- Trong thử nghiệm, tài khoản A không đọc được dữ liệu của tài khoản B.
- Chìa khoá có quyền cao nhất không xuất hiện trong phần mã gửi xuống trình duyệt.
- Không tìm thấy mật khẩu, chìa khoá bí mật hoặc thông tin đăng nhập bị lưu trong Git.
- Hệ thống kiểm tra phiên đăng nhập với máy chủ trước khi cho vào trang riêng tư.
- Kết quả kiểm thử phần phân tách dữ liệu: **14/14 bài kiểm thử đạt**.

## Năm vấn đề phải xử lý trước khi phát hành

### 1. Người lạ vẫn có thể tự tạo tài khoản

Ứng dụng được định nghĩa là công cụ riêng cho một người quản lý, nhưng cổng tạo tài khoản
vẫn đang mở. Thử nghiệm cho thấy một người không có quyền quản trị vẫn tạo được tài khoản.

**Hậu quả:** phát sinh người dùng không được phê duyệt, tốn tài nguyên, tăng chi phí và mở
thêm đường tấn công vào hệ thống.

**Cần làm:** đóng hoàn toàn đăng ký công khai. Chỉ tạo tài khoản quản lý bằng công cụ quản trị.

### 2. Một tài khoản khác có thể làm việc xoá tài khoản bị thất bại

Hệ thống đã ngăn phần lớn việc liên kết dữ liệu giữa hai chủ sở hữu, nhưng bỏ sót phần
“cảm nhận”. Trong thử nghiệm, tài khoản B tạo được một liên kết tới dữ liệu của tài khoản A.
Sau đó, yêu cầu xoá tài khoản A thất bại với lỗi máy chủ.

**Hậu quả:** người dùng không thể thực hiện quyền xoá tài khoản và dữ liệu của mình. Đây là
rủi ro vận hành và quyền riêng tư nghiêm trọng.

**Cần làm:** bảo đảm mọi liên kết dữ liệu đều bắt buộc thuộc cùng một chủ sở hữu.

### 3. Lịch sử ghi chép có thể bị sửa bên ngoài giao diện

Giao diện không có nút sửa ghi chép cũ, nhưng đây chỉ là cách trình bày. Thử nghiệm cho thấy
một người đã đăng nhập có thể gửi yêu cầu trực tiếp để thay đổi nội dung ghi chép cũ.

**Hậu quả:** lịch sử dùng cho đánh giá nhân sự không còn đáng tin cậy. Một ghi chép có thể
bị đổi nội dung, ngày, loại hoặc cảm nhận mà không để lại dấu vết.

**Cần làm:** khoá quyền sửa ở tầng lưu trữ dữ liệu, không chỉ ẩn nút trên giao diện.

### 4. Phiên đăng nhập bị đánh cắp có thể xoá toàn bộ tài khoản

Trước khi xoá, giao diện yêu cầu người dùng gõ một câu xác nhận. Tuy nhiên, bước này chỉ tồn
tại trên màn hình. Máy chủ không yêu cầu nhập lại mật khẩu hoặc xác minh hai lớp.

**Hậu quả:** nếu kẻ xấu lấy được phiên đăng nhập, họ có thể bỏ qua màn hình xác nhận và yêu
cầu xoá vĩnh viễn tài khoản cùng toàn bộ dữ liệu.

**Cần làm:** yêu cầu đăng nhập lại và xác minh hai lớp trước mọi thao tác xoá lớn.

### 5. Chính sách đăng nhập chưa tương xứng với độ nhạy cảm của dữ liệu

Hệ thống hiện chấp nhận mật khẩu từ 6 ký tự, không yêu cầu độ phức tạp và chưa bật xác minh
hai lớp.

**Hậu quả:** một tài khoản duy nhất nắm toàn bộ ghi chú nhân sự nhưng chỉ được bảo vệ bằng
một mật khẩu tương đối yếu.

**Cần làm:** mật khẩu tối thiểu 12 ký tự, kiểm tra mật khẩu đã bị lộ và bắt buộc xác minh
hai lớp cho tài khoản quản lý.

## Các cải thiện quan trọng tiếp theo

- Thêm lớp bảo vệ trình duyệt để giảm nguy cơ mã độc lấy phiên đăng nhập.
- Ghi nhật ký khi đăng nhập thất bại, xuất dữ liệu, xoá dữ liệu hoặc xoá tài khoản.
- Cảnh báo ngay khi có thao tác quản trị hoặc xoá dữ liệu bất thường.
- Giới hạn độ dài ghi chú, tên và số lượng dữ liệu tải trong một lần.
- Thu hẹp các quyền cơ sở dữ liệu không cần thiết.
- Kiểm tra bản sao lưu và diễn tập khôi phục dữ liệu định kỳ.

## Kế hoạch xử lý đề xuất

| Thứ tự | Công việc | Điều kiện hoàn thành |
|--------|-----------|----------------------|
| 1 | Đóng đăng ký công khai | Người lạ không thể tạo tài khoản |
| 2 | Sửa liên kết dữ liệu sai chủ sở hữu | Không thể chặn việc xoá tài khoản của người khác |
| 3 | Khoá sửa lịch sử ghi chép | Yêu cầu sửa trực tiếp bị từ chối |
| 4 | Bật xác minh hai lớp và xác minh lại trước khi xoá | Phiên đăng nhập thông thường không đủ để xoá tài khoản |
| 5 | Thêm bảo vệ trình duyệt và nhật ký | Có cảnh báo, truy vết và giảm nguy cơ mất phiên đăng nhập |
| 6 | Kiểm tra môi trường thật | Sao lưu, kết nối an toàn và quyền quản trị được xác minh |

## Điều kiện để chuyển sang “được phép dùng dữ liệu thật”

Chỉ chuyển trạng thái khi:

- Năm vấn đề nghiêm trọng ở trên đã được sửa và kiểm thử lại.
- Toàn bộ bài kiểm thử an toàn đều đạt.
- Đã xác minh cấu hình trên môi trường thật, không chỉ máy phát triển.
- Có bản sao lưu, quy trình khôi phục và người chịu trách nhiệm khi xảy ra sự cố.
- Có quy định ai được xem dữ liệu, giữ dữ liệu bao lâu và cách xử lý yêu cầu xoá.

## Tài liệu liên quan

- Bản kỹ thuật chi tiết: `security-audit-260622-1902-rls-auth-service-role.md`

## Câu hỏi chưa được xác minh

- Môi trường thật đã đóng đăng ký công khai chưa?
- Tài khoản quản lý và tài khoản quản trị dịch vụ đã bắt buộc xác minh hai lớp chưa?
- Đã bật kết nối an toàn, giới hạn truy cập mạng và sao lưu có khả năng khôi phục chưa?
- Chìa khoá quản trị có quy trình thay mới và xử lý khi bị lộ chưa?
- Đã có chính sách nội bộ cho việc truy cập, lưu giữ và xoá ghi chú nhân sự chưa?
