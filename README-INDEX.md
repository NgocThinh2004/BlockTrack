# Firebase Firestore Indexes

## Lỗi chỉ mục (Index) trên Firestore

Nếu bạn gặp lỗi sau:

```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Điều này có nghĩa là Firestore yêu cầu một chỉ mục phức hợp (composite index) để thực hiện một truy vấn đang lọc và sắp xếp theo nhiều trường.

## Cách tạo chỉ mục

1. Mở liên kết được cung cấp trong thông báo lỗi
2. Đăng nhập vào tài khoản Firebase của bạn
3. Trên giao diện tạo chỉ mục, bạn sẽ thấy các trường cần được đánh chỉ mục đã được điền sẵn
4. Nhấp vào "Create index" để xác nhận
5. Chờ vài phút để Firestore tạo và kích hoạt chỉ mục

## Các chỉ mục cần thiết

Dự án này cần các chỉ mục sau:

### Collection: products

1. **Owner and Creation Date Index:**
   - Fields:
     - `ownerId` (Ascending)
     - `createdAt` (Descending)

## Các truy vấn đang sử dụng chỉ mục

- `getProductsByOwner()` trong `productModel.js` - Lọc theo `ownerId` và sắp xếp theo `createdAt` (giảm dần)

## Giải pháp tạm thời

Nếu bạn chưa tạo được chỉ mục, ứng dụng sẽ tự động sử dụng chế độ dự phòng:
1. Thực hiện truy vấn không có sắp xếp (không yêu cầu chỉ mục)
2. Sắp xếp kết quả trong bộ nhớ

Tuy nhiên, giải pháp này sẽ kém hiệu quả cho bộ dữ liệu lớn, vì vậy bạn nên tạo chỉ mục càng sớm càng tốt.
