# StudyQuest AI — Security & Production Readiness Review

This document audits the security architectures and input boundaries implemented in **StudyQuest AI**.

---

## 🔒 1. API Credentials Safety
- **No Hardcoded Secrets**: All agent models (`Gemini(model="gemini-flash-latest")`) retrieve API credentials from environment variables (`GEMINI_API_KEY`) loaded via `dotenv`.
- **Secret Scanner Whitelist**: The workspace configuration (.gitignore) blocks `.env` and `studyquest.db` database instances from being pushed to source control.

---

## 📁 2. File Upload Sanitation & Validation
Syllabus files are uploaded to `POST /api/syllabus/upload` under strict security protocols:
- **Type Whitelisting**: The backend validates the mime-type/file extension. Only `.txt` and `.pdf` files are accepted. Scripting extensions (`.py`, `.sh`, `.js`) or binary executable formats (`.exe`, `.elf`) are immediately rejected.
- **Maximum Size Constraint**: Files are limited to **2MB** in memory. Attempts to upload larger payloads return a `400 Bad Request` before writing to disk.
- **Filename Sanitation**: Filenames are sanitized using regex:
  `re.sub(r"[^a-zA-Z0-9_\.-]", "", filename)`
  This prevents Path Traversal attacks (e.g., `../../etc/passwd` injection).
- **Immediate Cleanup (Zero-Retention)**: Uploaded files are deleted immediately after reading and parsing text content. Absolute folder paths are never returned in JSON payloads.

---

## 🛰️ 3. CORS and Network Protection
- **Origin Restricting**: FastAPI uses `CORSMiddleware` restricted to whitelisted origins:
  `ALLOW_ORIGINS=http://localhost:3000`
  Wildcard credentials are disallowed in cross-origin requests.

---

## 🗄️ 4. SQLite Storage & Injection Prevention
- **Parameterized SQL**: All SQLite database actions in [db.py](file:///home/unish/StudyQuest-AI/backend/services/db.py), [study_service.py](file:///home/unish/StudyQuest-AI/backend/services/study_service.py), and [spaced_rep_service.py](file:///home/unish/StudyQuest-AI/backend/services/spaced_rep_service.py) use parameterized queries (e.g. `cursor.execute("SELECT ... WHERE key = ?", (key,))`). Raw string formatting in query strings is blocked.
- **Local Persistence**: Database file `studyquest.db` is stored inside the local backend folder, isolated from general web-accessible folders.
