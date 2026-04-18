---
name: "security"
description: "Use when: reviewing or fixing security vulnerabilities, preventing injection attacks, hardening authentication, validating inputs, protecting sensitive data, or performing zero-trust audits. Triggers on SQL, XSS, CSRF, auth, injection, Supabase, API keys, tokens, CORS, secrets."
---

# Security & Vulnerability Prevention Skill

This project handles user authentication, database queries, and external API integrations. Apply this skill whenever you write code that touches user input, API routes, authentication, or sensitive data. **Target: zero vulnerabilities, zero penetration paths.**

---

## 1. Prevent SQL Injection

Never interpolate user input into SQL queries. Always use parameterized queries.

### Supabase (PostgreSQL via PostgREST)

**VULNERABLE (SQL Injection):**

```ts
// WRONG: user_id comes from request body — attacker can inject SQL
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', `${userId} OR 1=1`) // SQL injection possible
  .single();
```

**SECURE:**

```ts
// CORRECT: Supabase PostgREST handles parameterization automatically
// The value is treated as a literal, never executed as SQL
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', userId) // userId is a parameter, never SQL
  .single();

if (error) {
  console.error(error.message);
  return { error: 'Failed to fetch project' };
}
```

### Direct PostgreSQL Queries (via pg library, rare in this project)

**VULNERABLE:**

```ts
const query = `SELECT * FROM users WHERE id = ${userId}`;
const result = await db.query(query); // SQL injection — attacker controls the string
```

**SECURE:**

```ts
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
// $1 is a placeholder; userId is passed separately and never interpolated
```

---

## 2. Prevent XSS (Cross-Site Scripting)

Never render user input as raw HTML. Always sanitize or escape it.

### React Auto-Escaping (Default Safe)

React **automatically escapes** user input in JSX, preventing most XSS:

**SAFE (React escapes automatically):**

```tsx
const userMessage = '<img src=x onerror="alert(1)" />'; // Attacker's payload

export function Comment() {
  return <p>{userMessage}</p>; // React escapes: renders literal string, not HTML
}
// Output: <p>&lt;img src=x onerror="alert(1)" /&gt;</p> (safe)
```

### Markdown Rendering (Requires Sanitization)

If you render markdown or HTML from user input, always sanitize it:

**VULNERABLE:**

```tsx
import { marked } from 'marked';

function MarkdownRenderer({ markdown }: { markdown: string }) {
  // WRONG: marked() outputs raw HTML, including any script tags
  return <div dangerouslySetInnerHTML={{ __html: marked(markdown) }} />;
}

// Attacker input: "# Title\n<script>alert('XSS')</script>"
// Result: script tag is rendered and executed
```

**SECURE:**

```tsx
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function MarkdownRenderer({ markdown }: { markdown: string }) {
  // marked converts markdown to HTML
  // DOMPurify removes any script tags or event handlers
  const sanitized = DOMPurify.sanitize(marked(markdown));
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// Attacker input: "# Title\n<script>alert('XSS')</script>"
// Result: <h1>Title</h1> (script tag stripped)
```

### Never Use `dangerouslySetInnerHTML` Without Sanitization

**VULNERABLE:**

```tsx
// WRONG: trusting user input with dangerouslySetInnerHTML
const userContent = req.body.content; // "<h1>Title</h1><script>alert('hacked')</script>"
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

**SECURE:**

```ts
import DOMPurify from 'dompurify';

const userContent = req.body.content;
const sanitized = DOMPurify.sanitize(userContent, {
  ALLOWED_TAGS: ['h1', 'h2', 'p', 'strong', 'em', 'a', 'ul', 'li'],
  ALLOWED_ATTR: ['href', 'title'],
});
<div dangerouslySetInnerHTML={{ __html: sanitized }} />
```

---

## 3. Authentication & Token Security

### Never Expose API Keys in Client Code

**VULNERABLE:**

```ts
// WRONG: API key hardcoded in client code — visible in browser devtools
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

**SECURE:**

```ts
// CORRECT: Use environment variables (set via .env.local, not in git)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY // Safe to expose anon key (limited RLS)
);

// For sensitive operations, call a backend function that uses service role key
const response = await fetch('/api/admin/secret-action', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'value' }),
});
```

### Validate Session on Every Protected Route

**VULNERABLE:**

```tsx
// WRONG: only checks if user object exists — doesn't validate token freshness
function ProtectedPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }, []);

  if (!user) return <Navigate to="/login" />;
  return <Dashboard />; // If token expired after getUser call, no verification happens
}
```

**SECURE:**

```tsx
function ProtectedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) {
          setError('Session expired. Please log in again.');
          return;
        }
        setUser(data.user);
      } catch (e) {
        console.error(e instanceof Error ? e.message : String(e));
        setError('Failed to verify session');
      }
    })();
  }, []);

  if (error) return <Navigate to="/login" />;
  if (!user) return <Loading />;
  return <Dashboard />;
}
```

### Use Secure HTTP-Only Cookies for Session Tokens (Backend Only)

If your backend sets session cookies, use HTTP-only, Secure, and SameSite flags:

```ts
// Backend (Node.js/Express)
res.cookie('sessionToken', token, {
  httpOnly: true, // inaccessible to JavaScript — prevents XSS theft
  secure: true, // only sent over HTTPS
  sameSite: 'Strict', // not sent on cross-origin requests — prevents CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

---

## 4. Prevent CSRF (Cross-Site Request Forgery)

### Validate Request Origin & Referer

**VULNERABLE:**

```ts
// POST handler without origin validation
// Attacker site can send form to your API and change user data
app.post('/api/update-profile', (req, res) => {
  const { user_id, email } = req.body;
  // No check: is this request from your domain or an attacker's?
  updateUser(user_id, { email });
});
```

**SECURE:**

```ts
app.post('/api/update-profile', (req, res) => {
  const origin = req.headers['origin'] || req.headers['referer'];
  const allowedOrigins = ['https://yoursite.com', 'https://www.yoursite.com'];

  if (!origin || !allowedOrigins.includes(new URL(origin).origin)) {
    return res.status(403).json({ error: 'CSRF: Invalid origin' });
  }

  const { user_id, email } = req.body;
  updateUser(user_id, { email });
});
```

### Use CSRF Tokens for State-Changing Operations

For form submissions, issue a token that must be validated on the server:

```tsx
// Frontend: Get CSRF token on page load
useEffect(() => {
  fetch('/api/csrf-token')
    .then(r => r.json())
    .then(data => setCSRFToken(data.token));
}, []);

// Include token in form submission
function updateProfile() {
  fetch('/api/update-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken, // Token in header
    },
    body: JSON.stringify({ email: newEmail }),
  });
}

// Backend: Validate token
app.post('/api/update-profile', (req, res) => {
  const token = req.headers['x-csrf-token'];
  if (!token || !validateCSRFToken(req.session.id, token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  // Safe to process
});
```

---

## 5. Input Validation & Sanitization

### Validate on Server — Never Trust Client Validation Alone

**VULNERABLE:**

```ts
// Frontend validation only — attacker bypasses by sending raw API request
function SignupForm() {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    if (!email.includes('@')) {
      alert('Invalid email'); // Client-side check only
      return;
    }
    fetch('/api/signup', { method: 'POST', body: JSON.stringify({ email }) });
  };
}
```

**SECURE:**

```ts
// Frontend: user-friendly validation
function SignupForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Client-side check (UX only)
    if (!email.includes('@')) {
      setError('Invalid email');
      return;
    }

    // Send to backend for real validation
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }
      // Success
    } catch (e) {
      console.error(e instanceof Error ? e.message : String(e));
      setError('Network error');
    }
  };
}

// Backend: Real validation
app.post('/api/signup', (req, res) => {
  const { email } = req.body;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate length
  if (email.length > 254) {
    return res.status(400).json({ error: 'Email too long' });
  }

  // Check if user already exists
  const existing = checkEmailExists(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // All checks passed — create user
  createUser(email);
});
```

### Whitelist Allowed Values, Don't Blacklist

**VULNERABLE (Blacklist):**

```ts
const sortBy = req.query.sort; // user input: "user_id; DROP TABLE users;"
const forbidden = ['DROP', 'DELETE', 'TRUNCATE'];
if (!forbidden.some(word => sortBy.toUpperCase().includes(word))) {
  // False sense of security — attacker can find variations
  query = `SELECT * FROM projects ORDER BY ${sortBy}`;
}
```

**SECURE (Whitelist):**

```ts
const sortBy = req.query.sort;
const allowedSortFields = ['created_at', 'updated_at', 'name', 'status'];

if (!allowedSortFields.includes(sortBy)) {
  return res.status(400).json({ error: 'Invalid sort field' });
}

const direction = req.query.dir;
if (!['asc', 'desc'].includes(direction)) {
  return res.status(400).json({ error: 'Invalid sort direction' });
}

// Safe to use — values are from whitelist
const query = `SELECT * FROM projects ORDER BY ${sortBy} ${direction}`;
```

---

## 6. Protect Sensitive Data

### Never Log Passwords, Tokens, or PII

**VULNERABLE:**

```ts
// Logs contain sensitive data — if logs are breached, attacker has passwords
console.log('User login:', { email, password, apiToken });
```

**SECURE:**

```ts
// Only log safe identifiers
console.warn('User login attempt failed for email: ' + maskEmail(email));

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  return local.substring(0, 2) + '***@' + domain; // user@example.com -> us***@example.com
}
```

### Encrypt Sensitive Data at Rest

For passwords, use Supabase Auth (handled automatically). For other sensitive data:

```ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte hex string

function encryptSensitiveData(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // Store iv:ciphertext
}

function decryptSensitiveData(encrypted: string): string {
  const [ivHex, ciphertext] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}
```

### Use HTTPS Only

**Enforce in backend:**

```ts
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  next();
});
```

---

## 7. Secure File Uploads

### Validate File Type & Size

**VULNERABLE:**

```ts
// No validation — attacker uploads 5GB file or malicious executable
app.post('/api/upload', (req, res) => {
  const file = req.files.file;
  file.mv(`./uploads/${file.name}`);
});
```

**SECURE:**

```ts
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

app.post('/api/upload', (req, res) => {
  const file = req.files.file;

  // Check MIME type
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return res.status(400).json({ error: 'File type not allowed' });
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return res.status(400).json({ error: 'File too large' });
  }

  // Check file extension (extra validation)
  const ext = path.extname(file.name).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    return res.status(400).json({ error: 'Invalid file extension' });
  }

  // Generate safe filename (don't use user input directly)
  const safeName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
  file.mv(`./uploads/${safeName}`);
});
```

### Scan Uploads for Malware

```ts
import { ClamAv } from 'clamav.js';

const clamscan = new ClamAv({
  clamdscan: {
    host: 'localhost',
    port: 3310,
  },
});

app.post('/api/upload', async (req, res) => {
  const file = req.files.file;
  const tempPath = `/tmp/${crypto.randomBytes(16).toString('hex')}`;
  await file.mv(tempPath);

  try {
    const { isInfected } = await clamscan.scanFile(tempPath);
    if (isInfected) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: 'File contains malware' });
    }
    // File is safe
    fs.renameSync(tempPath, `./uploads/${safeName}`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    res.status(500).json({ error: 'Scan failed' });
  }
});
```

---

## 8. Secure API Integration

### Validate External API Responses

**VULNERABLE:**

```ts
// Trusts external API without validation
const response = await fetch('https://api.external.com/data');
const data = await response.json();
db.insert(data); // What if API response was corrupted or malicious?
```

**SECURE:**

```ts
import { z } from 'zod';

const ExternalDataSchema = z.object({
  id: z.number(),
  name: z.string().max(255),
  email: z.string().email(),
});

const response = await fetch('https://api.external.com/data', { timeout: 5000 });
if (!response.ok) {
  throw new Error(`API returned ${response.status}`);
}

const data = await response.json();
const validated = ExternalDataSchema.parse(data); // Throws if invalid
db.insert(validated);
```

### Never Expose Internal Error Details to Users

**VULNERABLE:**

```ts
app.post('/api/checkout', (req, res) => {
  try {
    processPayment(req.body);
  } catch (e) {
    // Exposes full error stack — attacker learns internal structure
    res.status(500).json({ error: e.toString() });
  }
});

// Attacker sees: "Error: connection refused on 192.168.1.5:3306"
// Now attacker knows the internal IP and port
```

**SECURE:**

```ts
app.post('/api/checkout', (req, res) => {
  try {
    processPayment(req.body);
  } catch (e) {
    // Log full error internally (for debugging)
    console.error(e instanceof Error ? e.message : String(e));
    // Return generic error to user (safe)
    res.status(500).json({ error: 'Payment processing failed. Please try again.' });
  }
});
```

---

## 9. Rate Limiting & DDoS Prevention

### Implement Rate Limiting on API Routes

```ts
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP per window
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/login', loginLimiter, (req, res) => {
  // Max 5 login attempts per 15-minute window per IP
  authenticateUser(req.body);
});
```

### Timeout Long-Running Requests

```ts
app.post('/api/process', (req, res) => {
  // Kill request if it takes > 30 seconds
  const timeout = setTimeout(() => {
    res.status(408).json({ error: 'Request timeout' });
  }, 30000);

  processLongTask(req.body)
    .then(result => {
      clearTimeout(timeout);
      res.json(result);
    })
    .catch(e => {
      clearTimeout(timeout);
      console.error(e instanceof Error ? e.message : String(e));
      res.status(500).json({ error: 'Processing failed' });
    });
});
```

---

## 10. Security Checklist

Before submitting a PR that touches auth, API, data, or user input:

- [ ] No SQL injection: using parameterized queries (Supabase `.eq()`, PostgREST) not string interpolation
- [ ] No XSS: user input is React-escaped or DOMPurify-sanitized; never use `dangerouslySetInnerHTML` without sanitization
- [ ] No CSRF: form submissions validate origin; CSRF tokens used for state-changing operations
- [ ] API keys not hardcoded: using `import.meta.env` and `.env.local` (not committed)
- [ ] Input validation on server: whitelist allowed values; validate format, length, type
- [ ] No credential logging: passwords, tokens, PII never logged
- [ ] Sensitive data encrypted: using Supabase encryption or crypto library
- [ ] Errors generic to users: full error stacks only in server logs, not API responses
- [ ] File uploads validated: MIME type, size, extension checked; filename sanitized
- [ ] External API responses validated: using zod schema or similar
- [ ] Rate limiting on login/sensitive routes: prevents brute-force attacks
- [ ] HTTPS enforced: backend redirects HTTP to HTTPS
- [ ] Session tokens secure: HTTP-only, Secure, SameSite flags set
- [ ] No hardcoded test credentials in code

---

## 11. Penetration Testing Mindset

When reviewing security, always ask:

1. **Can I bypass this check?** If validation is only client-side, the answer is yes.
2. **What if I send null/undefined/empty string?** Edge cases are attack vectors.
3. **Can I inject special characters?** Parentheses, semicolons, quotes, backticks?
4. **What if I send a huge payload?** File uploads, JSON payloads, query strings?
5. **Can I access someone else's data?** Try `user_id=2` if you're user 1.
6. **What if my token expires mid-request?** Session handling robust?
7. **Is there a timing leak?** Does password check take different time for wrong vs. correct?
8. **Can I enumerate users?** Does "email already registered" leak existence of accounts?
9. **What gets logged?** Could logs be a security risk if leaked?
10. **Is there a race condition?** Can I submit the form twice simultaneously?

---

## 12. Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — Most common web vulnerabilities
- [OWASP Top 10 for LLMs](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — AI security
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [MDN: Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security) — Interactive labs
