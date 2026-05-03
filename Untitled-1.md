Good—this is the right move. Here’s a **clean, no-nonsense checklist** of issues in your file, ordered by priority so you can knock them out today.

---

# 🔴 Critical (fix before demo)

### 1. ❌ Wrong file type handling (Excel vs PDF)

**Problem:**

```ts
name: `TRUDA_DEBTORS_${month.toUpperCase()}_${year}.pdf`
mimeType: "application/pdf"
```

But you said it’s Excel.

**Fix:**

* Detect file type OR enforce Excel only
* Use correct MIME:

```ts
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

---

### 2. ❌ Files owned by YOUR Google account

**Problem:**

```ts
refresh_token: driveRefreshToken.value()
```

* Files belong to you personally
* Risk if token expires / you leave

**Fix (for later, not blocking demo):**

* Move to shared company Google account OR service account

---

### 3. ❌ No version control (overwrites silently)

**Problem:**

```ts
doc(reportId).set(...)
```

* No history
* No rollback
* Finance won’t like this

**Quick Fix:**
Add:

```ts
version: admin.firestore.FieldValue.increment(1)
```

OR:

* Store each upload as a new doc

---

### 4. ❌ No duplicate protection

**Problem:**

* Same month can be uploaded again with no warning

**Fix:**
Before upload:

* Check if doc exists
* Either:

  * Block upload
  * OR ask to overwrite

---

# 🟠 Important (should fix if you have time)

### 5. ⚠️ Role check using Firestore instead of Auth claims

**Problem:**

```ts
callerSnap.data()?.role
```

You already use:

```ts
setCustomUserClaims
```

**Fix:**
Use:

```ts
request.auth.token.role
```

Cleaner + safer

---

### 6. ⚠️ Hardcoded Google Drive folder ID

```ts
const folderId = "1vH1ZcuCWrsCrs9jJcSQ_iHzhRk0audnz";
```

**Problem:**

* Not flexible
* Hard to change later

**Fix:**

* Move to env/secret config

---

### 7. ⚠️ No file size validation

**Problem:**

* Someone could upload huge file

**Fix:**
Check before processing:

```ts
if (buffer.length > 40 * 1024 * 1024) throw error;
```

---

### 8. ⚠️ No file type validation

**Problem:**

* Someone could upload anything (PDF, ZIP, etc.)

**Fix:**
Validate extension or MIME before upload

---

# 🟡 Nice-to-have (polish)

### 9. 🟡 Email link still points to localhost

```ts
url: "http://localhost:5173/login"
```

**Fix:**

* Replace with your GitHub Pages URL

---

### 10. 🟡 No logging/audit trail

**Problem:**

* No record of who did what beyond basic fields

**Fix:**
Add:

```ts
action: "upload" / "delete"
```

Or separate audit collection

---

### 11. 🟡 Delete is permanent (no safety)

```ts
drive.files.delete(...)
```

**Problem:**

* No recovery

**Better:**

* Move to trash instead (Drive supports it)

---

### 12. 🟡 Filename ignores original file

```ts
fileName: fileName
```

But Drive uses generated name.

**Fix:**

* Either:

  * Use uploaded name
  * OR store both clearly

---

# 🟢 Already good (don’t touch)

* ✅ Auth checks in place
* ✅ Role-based access
* ✅ Secrets used properly
* ✅ Stream upload (correct approach)
* ✅ Firestore integration clean

---

# 🎯 What to actually do TODAY (focus)

If time is tight, do ONLY this:

1. Fix file type + MIME
2. Add duplicate check
3. Add version field
4. Fix login URL (localhost → live)
5. Ensure Drive preview link is used in frontend

That alone moves you from:

> “works”

to:

> “this is controlled and reliable”

---

If you want, next I can give you **exact code snippets for each fix** so you don’t waste time figuring it out.
