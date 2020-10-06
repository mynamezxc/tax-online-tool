# Tax Online Uploader

## Default key e8e3fa20d2588dfb1d1281caaf94332c
## Method GET
***Access Function***
```
# Browser init
http://localhost:3000/?key={key}
# Login with custom account
http://localhost:3000/login/{browser_id}/{captcha}/{username}/{password}?key={key}
# Start upload file
http://localhost:3000/upload-file/{browser_id}?url={public_xml_link}&key={key}
# Close browser
http://localhost:3000/close-browser/:browser_id?key={key}
```



* Key: e8e3fa20d2588dfb1d1281caaf94332c
Các method của API trả về dạng JSon
Thứ tự: Tạo trình duyệt, nhận captcha => Đăng nhập, điền mã captcha => Uploadfile => Đóng trình duyệt

***
 - Sau khi khởi tạo trình duyệt, tạo 1 hàm closeBrowser() để set thời gian đếm ngược để tựu động đóng trình duyệt (full RAM)
 - Nếu user đăng nhập thành công, upload thành công => Gọi hàm closeBrowser() đóng trình duyệt
***

## Khởi tạo trình duyệt, hiển thị mã captcha cho người dùng nhập
- Cấu trúc /?key={key}
VD: http://192.168.11.55:3000?key=e8e3fa20d2588dfb1d1281caaf94332c
Kết quả:
```
{
    id: "maUOjGMm", // browser_id
    status: true, // Kết quả
    message: "Waiting for captcha", // Log kết quả
    image: "captcha/maUOjGMm.png" // Link hình captcha trên API "192.168.11.55/captcha/maUOjGMm.png"
}
```


## Đăng nhập bằng tài khoản, captcha
- Cấu trúc /login/{browser_id}/{captcha_text}/{username}/{password}?key={key}
VD: http://192.168.11.55:3000/login/maUOjGMm/PAXC/0314609138-QL/pass123456?key=e8e3fa20d2588dfb1d1281caaf94332c
Kết quả:
```
{
    id: "maUOjGMm", // browser_id
    status: true, // Kết quả
    message: "Login success" // Log kết quả
}
```


## Upload file XML
- Cấu trúc /upload-file/{browser_id}?url={link_xml_public}&key={key}
VD: http://192.168.11.55:3000/upload-file/maUOjGMm?url=http://xuathoadon.net/HCM-0314609138000-BC26_AC-Q32020-L00.xml&key=e8e3fa20d2588dfb1d1281caaf94332c
Kết quả:
```
{
    id: "maUOjGMm", // browser_id
    status: true, // Kết quả
    message: "Upload success. Browser closed" // Log kết quả
}
```

## Đóng trình duyệt
- Cấu trúc /close-browser/{browser_id}?key={key}
VD: http://192.168.11.55:3000/close-browser/maUOjGMm?key=e8e3fa20d2588dfb1d1281caaf94332c
Kết quả:
```
{
    status: true,
    message: "closed"
}
```
