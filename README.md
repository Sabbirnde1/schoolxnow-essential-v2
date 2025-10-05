# SchoolXnow Essential v2

A modern school management system built with enterprise-grade security and performance.

## 🚀 Quick Start

### Prerequisites
- Node.js 16.x or higher
- npm 7.x or higher
- Git

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd schoolxnow-essential-v2

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🛠️ Tech Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn-ui
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **State Management**: React Query
- **Form Handling**: React Hook Form
- **Testing**: Vitest + React Testing Library

## 🔒 Security Features

Enterprise-grade security implementation:

- ✅ Secure credential management
- ✅ Zero-trust architecture
- ✅ Runtime configuration validation
- ✅ Automated security checks
- ✅ Comprehensive audit logging

### Security Usage Example

```typescript
import { SecureConfig } from '@/lib/secure-config';

// Secure credential access
const api = SecureConfig.getApiConfig();

// Safe logging (automatically masked)
console.log('API Status:', api.getSafeStatus());
```

## 📚 Documentation

### Core Guides
- [Environment Setup](./ENV_SETUP.md)
- [Security Implementation](./SECURITY_IMPLEMENTATION_SUMMARY.md)
- [Error Handling](./ERROR_HANDLING_GUIDE.md)
- [Supabase Features](./SUPABASE_FEATURES_GUIDE.md)

### Development
- [Code Style Guide](./CODE_STYLE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Testing Strategy](./TESTING.md)
- [API Documentation](./API.md)

## 🔧 Development

```bash
# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

### Using GitHub

1. **Direct File Edit**
   - Open file on GitHub
   - Click the pencil icon (Edit)
   - Make changes
   - Commit with description

2. **Using Codespaces**
   - Click "Code" button
   - Select "Codespaces"
   - Click "New codespace"
   - Make changes in the browser IDE
   - Commit and push

3. **Local Development**
   - Fork the repository
   - Create feature branch
   - Make changes
   - Submit pull request

## ⚡ Environment Variables

Create `.env` file in root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed configuration.

## 📦 Project Structure

```
schoolxnow-essential-v2/
├── src/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── pages/
│   └── styles/
├── tests/
├── public/
└── docs/
```

## 🔍 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run lint` - Lint code
- `npm run format` - Format code

## 📝 License

MIT License - See [LICENSE](./LICENSE) for details

## 🆘 Support

- Open an issue for bugs
- Discussions for questions
- Pull requests welcome

---
Built with by SchoolXnow Team

