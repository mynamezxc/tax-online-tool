# tax-online-tool
***Các link access tax online tool***
## Default key e8e3fa20d2588dfb1d1281caaf94332c
## Method GET
```
# Browser init
http://localhost:3000/?key={key}
# Login with custom account
/login/{browser_id}/{captcha}/{username}/{password}?key={key}
# Start upload file
/upload-file/{browser_id}?url={public_xml_link}&key={key}
# Close browser
/close-browser/:browser_id
```
