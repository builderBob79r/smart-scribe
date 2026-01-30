# Smart Scribe

A secure, AI-powered personal diary application built with Electron and React.

## Overview

Smart Scribe is a privacy-focused notepad application that uses local AI to help improve your writing while keeping all your notes encrypted on your device. No cloud storage, no data sharing - your thoughts stay yours.

## Features

### Current (Backend)

- **🔒 End-to-End Encryption**: All notes encrypted at rest using AES-256-GCM
- **🤖 AI Writing Assistant**: Local LLM integration for text refinement (6 styles: refine, formal, casual, grammar, concise, simplify)
- **🔐 Secure Authentication**: PBKDF2 password hashing with system keychain integration
- **🛡️ Security Hardening**: SQL injection prevention, brute-force protection, secure data serialization
- **📦 SQLite Database**: Fast, reliable local storage with WAL mode

### Roadmap

- **Frontend UI**: React-based Electron interface (coming soon)
- **Search**: Full-text search across encrypted notes
- **Tags & Organization**: Categorize and filter notes
- **Dark Mode**: Eye-friendly interface
- **Cross-Platform**: Windows, macOS, and Linux support

## Architecture

```
backend/
├── ai/
│   ├── modelLoader.js    # LLM initialization (LFM2-350M-Q6_K.gguf)
│   ├── inference.js      # AI text processing
│   └── prompts.js        # Style templates
├── database/
│   ├── db.js            # SQLite connection
│   ├── encryption.js    # AES-256-GCM encryption
│   └── models/
│       └── Note.js      # Note CRUD operations
└── security/
    ├── auth.js          # Password management
    ├── keychain.js      # Secure key storage
    └── crypto.js        # Cryptographic utilities
```

## Security

Smart Scribe takes your privacy seriously:

- **Local-First**: No cloud storage, all data stays on your device
- **Military-Grade Encryption**: AES-256-GCM for note content
- **Secure Password Storage**: PBKDF2 with 100k iterations
- **System Keychain**: OS-level secure key storage
- **Zero Knowledge**: Even the app can't read your notes without your password

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/builderBob79r/smart-scribe.git
cd smart-scribe

# Install dependencies
npm install

# Run the application (coming soon)
npm start
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Creating pull requests
- Code style and standards
- Security best practices
- Development workflow

## Development Status

🚧 **Work in Progress**: The backend infrastructure is complete. Frontend development is the next major milestone.

Current PR: See [open pull requests](https://github.com/builderBob79r/smart-scribe/pulls) for ongoing work.

## License

[License information to be added]

## Acknowledgments

- Built with [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) for local AI inference
- Uses [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for reliable database operations
- Encryption powered by [crypto-js](https://github.com/brix/crypto-js)
