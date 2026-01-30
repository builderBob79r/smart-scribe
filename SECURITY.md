# Security Policy

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in Smart Scribe, please report it privately to help us address it before public disclosure.

### How to Report

1. **Email the maintainer directly** at the email address associated with the repository owner's GitHub account
2. **Or use GitHub's private vulnerability reporting** (if enabled for this repository):
   - Go to the Security tab
   - Click "Report a vulnerability"
   - Fill out the private advisory form

### What to Include

Please include the following information in your report:

- **Type of vulnerability** (e.g., SQL injection, encryption issue, authentication bypass)
- **Affected component** (e.g., database layer, authentication system, encryption module)
- **Steps to reproduce** the vulnerability
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up questions

### Response Timeline

- **Acknowledgment**: We aim to acknowledge receipt of your vulnerability report within 48 hours
- **Initial Assessment**: We will provide an initial assessment of the vulnerability within 5 business days
- **Status Updates**: We will keep you informed of our progress
- **Resolution**: We will notify you when the vulnerability has been fixed

### Disclosure Policy

- Please give us reasonable time to address the vulnerability before any public disclosure
- We will credit you for the discovery (unless you prefer to remain anonymous)
- We will work with you to understand and validate the vulnerability
- We will notify you when we plan to publicly disclose the fix

## Security Best Practices for Contributors

When contributing to Smart Scribe, please follow these security guidelines:

### Do's

- ✅ Use parameterized queries for all database operations
- ✅ Validate and sanitize all user inputs
- ✅ Use AES-256-GCM for encryption with unique IVs
- ✅ Use PBKDF2 with at least 100,000 iterations for password hashing
- ✅ Handle errors gracefully without leaking sensitive information
- ✅ Keep dependencies up to date
- ✅ Review code for security issues before submitting PRs

### Don'ts

- ❌ Never commit secrets, API keys, or passwords to the repository
- ❌ Don't use string concatenation for SQL queries
- ❌ Don't log sensitive data (passwords, encryption keys, user content)
- ❌ Don't implement custom encryption algorithms
- ❌ Don't disable security features for convenience
- ❌ Don't use weak hashing algorithms (MD5, SHA1)

## Supported Versions

Security updates will be provided for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

*Note: As the project is in early development, we currently only support the main branch.*

## Known Security Considerations

### Local-First Architecture

Smart Scribe is designed with a local-first architecture:

- All data is stored locally on the user's device
- No cloud synchronization or remote storage by default
- Encryption keys are managed through the OS keychain
- The application runs entirely on the user's machine

### Security Features

- **Encryption at Rest**: All note content is encrypted using AES-256-GCM
- **Password Security**: Passwords are hashed using PBKDF2 with 100,000 iterations
- **Brute Force Protection**: Failed login attempts trigger exponential backoff
- **SQL Injection Prevention**: All database queries use parameterized statements
- **Secure Key Storage**: Encryption keys stored in OS keychain (keytar)

### Limitations

- The application's security depends on the user's device security
- If the device is compromised, the application data may be at risk
- The master password is the primary security control - use a strong password
- Local AI model may cache processed text temporarily in memory

## Security Updates

We will announce security updates through:

- GitHub Security Advisories
- Release notes
- Repository README

Stay informed about security updates by watching this repository.
