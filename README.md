# PhoneHub — Quản lý bán điện thoại di động

Bài tập lớn môn Thiết kế Web, đề tài số 29. Giao diện gồm 5 trang HTML, CSS và JavaScript thuần, không cần npm hoặc kết nối mạng.

## Chạy website

1. Giải nén, mở thư mục `phonehub` bằng VS Code.
2. Mở terminal tại thư mục này, chạy `python -m http.server 8000` (hoặc `python3 -m http.server 8000`).
3. Mở http://localhost:8000/index.html. Có thể thay bằng tiện ích Live Server.

Nên dùng máy chủ tĩnh. Mở trực tiếp bằng `file://` có thể khiến localStorage không được chia sẻ ổn định giữa các trang ở một số trình duyệt. Giữ cùng nguồn truy cập (giao thức, tên máy, cổng) để dùng cùng dữ liệu.

## Các trang

- `index.html`: doanh thu, hóa đơn gần đây và cảnh báo tồn thấp.
- `products.html`: thêm, sửa, xóa, tìm kiếm và lọc sản phẩm.
- `sales.html`: giỏ nhiều sản phẩm, khách hàng, giảm giá và ghi nhận thanh toán.
- `customers.html`: thêm, sửa, xóa, tìm khách; số đơn và tổng chi tiêu.
- `reports.html`: lọc ngày/trạng thái, chi tiết, in, hủy hoàn kho và CSV.

## Kịch bản trình diễn

Dữ liệu ban đầu chưa có đơn. Chọn Khách mẫu 01, mua 2 SP01 iPhone 15 (16.990.000 đồng/máy), giảm 100.000 đồng. Tổng phải trả 33.880.000 đồng, tồn SP01 từ 12 xuống 10. Vào Báo cáo hủy đơn, tồn trở về 12 và doanh thu loại bỏ đơn hủy. Các mẫu khách, điện thoại, giá chỉ dùng minh họa.

Thêm khách mới trước khi lập giỏ; giỏ chưa thanh toán chỉ tồn tại trong trang và mất khi chuyển trang. Hóa đơn đã lưu giữ tên khách, giá và cấu hình tại thời điểm bán. Không xóa khách/sản phẩm đã có lịch sử hóa đơn. Giá bán được hiểu là giá dùng trong bài tập; không tách thuế.

## Lưu dữ liệu

Khóa localStorage: `phonehub.v1`. Xóa riêng khóa này trong DevTools → Application/Storage → Local Storage rồi tải lại để về dữ liệu mẫu. Việc này xóa dữ liệu bài tập đã tạo. Không có nhập lại CSV; cần giữ dữ liệu trình duyệt nếu muốn tiếp tục bài trình diễn.

## Kiểm thử

Có Node.js: `node --test tests/core.test.cjs`.
Đã chạy 9 ca nghiệp vụ, đạt 9/9. Kiểm tra cú pháp app.js thành công. Kiểm tra tĩnh liên kết và tài nguyên trong HTML.
Các ca kiểm tra giao diện, responsive, in, CSV và tương tác trình duyệt nằm trong báo cáo và cần chạy trước khi nộp; chưa được xác nhận bằng kiểm thử trình duyệt tự động.

## Phạm vi

Đây là sản phẩm front-end học tập. Chưa có xác thực, phân quyền kỹ thuật, backend, đồng bộ nhiều máy, giao dịch chống bán trùng giữa tab, IMEI, bảo hành, phiếu nhập hoặc xử lý thanh toán thật. Thanh toán là thao tác ghi nhận mô phỏng. Hóa đơn không có giá trị pháp lý. Chỉnh tồn trực tiếp chưa ghi lịch sử nhập kho. Không lưu dữ liệu nhạy cảm.

## Hồ sơ nộp

Báo cáo Word/PDF có đủ 6 phần theo đề bài. Nguồn nội dung ở `docs/BaoCao.md`, sơ đồ và wireframe nằm trong `docs/`. Bổ sung trường, lớp, giảng viên, thành viên, phân công thực tế và hai bảng tự đánh giá trước khi nộp. Điểm được để trống để nhóm chấm đúng thực tế.
