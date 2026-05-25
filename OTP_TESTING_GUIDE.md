## ✅ OTP Testing Guide

### Quick Test with cURL

#### 1. Register User & Send OTP

```bash
curl -X POST http://localhost:3000/api/auth/sendotp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "email": "test@example.com",
    "name": "Test User"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "step": "otp"
}
```

#### 2. Verify OTP

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "otp": "123456"
  }'
```

**Expected Response (if OTP is correct):**

```json
{
  "success": true,
  "message": "Otp Verified"
}
```

---

### Test Cases

#### ✅ Test 1: OTP Generation & Storage

- Send OTP request
- Check MongoDB: User document should have `otp` as string (not number)
- Check logs for: `[OTPService] Sending OTP to: test@example.com`

#### ✅ Test 2: OTP Type Safety

- Generate OTP: e.g., `"123456"` (string)
- Database stores as: `"123456"` (string)
- Verification compares: `String(user.otp) === "123456"` ✓

#### ✅ Test 3: Phone Number Normalization

- Send with spaces: `" 9876543210 "`
- System normalizes to: `"9876543210"`
- Verification finds user correctly

#### ✅ Test 4: OTP Expiry

- Request OTP (2-minute expiry)
- Wait 120+ seconds
- Try to verify OTP
- Should return: `"Otp has expired"`

#### ✅ Test 5: Invalid OTP

- Request OTP
- Try to verify with wrong OTP
- Should return: `"Invalid Otp"`

#### ✅ Test 6: Rate Limiting

- Send multiple OTP requests rapidly (within 15 min window)
- After threshold, should get rate limit error

---

### Testing with Postman

**Collection Setup:**

```
Base URL: {{base_url}} = http://localhost:3000/api/auth
```

**Environment Variables:**

```
phone: 9876543210
email: test@example.com
otp: (captured from logs)
```

**Requests:**

1. **Send OTP**
   - POST: `{{base_url}}/sendotp`
   - Body:
     ```json
     {
       "phoneNumber": "{{phone}}",
       "email": "{{email}}"
     }
     ```

2. **Verify OTP**
   - POST: `{{base_url}}/verify-otp`
   - Body:
     ```json
     {
       "phoneNumber": "{{phone}}",
       "otp": "{{otp}}"
     }
     ```

---

### Debugging Tips

#### 1. Check OTP in Database

```bash
# MongoDB Shell
use staff-management
db.users.findOne({ phoneNumber: "9876543210" })
```

Expected output:

```json
{
  "_id": ObjectId(...),
  "phoneNumber": "9876543210",
  "email": "test@example.com",
  "otp": "123456",
  "otpExpiry": ISODate("2026-05-24T10:35:00.000Z"),
  "isVerified": false
}
```

#### 2. Check Email Logs

With `MAIL_DRIVER=logs`, OTP emails are logged to console:

```
[MAIL LOG] To: test@example.com, Subject: Your OTP Verification Code
[MAIL LOG] HTML Content: ...
```

#### 3. Enable Debug Mode

Already configured in `.env`:

```
DEBUG=staff*
```

Check console for detailed logs with `[OTPService]` prefix

#### 4. Verify Gmail SMTP Configuration

```javascript
// Test SMTP connection
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "staffmanagementproject578@gmail.com",
    pass: "uupfuetpdaushcxy",
  },
});

transporter.verify(function (error, success) {
  if (error) console.error("SMTP Error:", error);
  else console.log("SMTP Ready:", success);
});
```

---

### Common Issues & Solutions

#### Issue: "Invalid OTP" even with correct OTP

**Solution:** Check MongoDB for OTP type - should be string

```bash
db.users.findOne({}).otp  # Should be "123456" not 123456
```

#### Issue: "User not found" during verification

**Solution:** Ensure phone numbers match exactly (no spaces/formatting differences)

#### Issue: Gmail not sending emails

**Solution:**

- Verify Gmail account password is app-specific password
- Check "Less secure app access" settings
- Verify SMTP credentials in `.env`

#### Issue: OTP expires too quickly

**Solution:** Verify `otpExpiry` is 2 minutes from now

```javascript
// In MongoDB, should be current time + 2 minutes
new Date(Date.now() + 2 * 60 * 1000);
```

---

### Fixed Issues Summary

| Issue               | Before                  | After                      | Status   |
| ------------------- | ----------------------- | -------------------------- | -------- |
| OTP Type Mismatch   | Number stored as String | String type consistent     | ✅ Fixed |
| Phone Normalization | Inconsistent            | Trimmed and normalized     | ✅ Fixed |
| OTP Comparison      | Type coercion issues    | Explicit string comparison | ✅ Fixed |
| Phone spaces        | Could break lookup      | Trimmed before query       | ✅ Fixed |

---

### Next Steps

1. **Run the tests above to verify fixes**
2. **Monitor logs for any issues**
3. **Consider adding:**
   - SMS OTP sending (fallback to email)
   - OTP resend rate limiting
   - Attempt counter (lock after 5 failed attempts)
   - OTP verification audit logging
