# AI Code Assistant

An open-source, provider-agnostic alternative to GitHub Copilot that supports multiple AI providers and advanced coding features.

## Features

- 🤖 Multiple AI Provider Support (OpenAI, Hugging Face, etc.)
- 💬 Interactive Chat Mode
- ✏️ Smart Code Editing
- 🎯 Autonomous Agent Mode
- 🎤 Voice Input Support
- 🐛 Context-Aware Debugging
- 📝 Automated Documentation
- 👥 Collaborative Features
- 📊 Code Analytics & Testing
- 🔄 Version Control Integration
- ⚡ Custom Workflow Automation
- 🔌 MCP Server Integration

## Installation

### VS Code Marketplace

Coming soon...

### Manual Installation

1. Download the latest `.vsix` file from the [releases](../../releases) page
2. Open VS Code
3. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
4. Type "Install from VSIX" and select the command
5. Choose the downloaded `.vsix` file

## Configuration

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "AI Assistant: Configure Provider"
3. Select your preferred AI provider
4. Enter your API key and other required settings

## Development

### Prerequisites

- Node.js 16.x or higher
- VS Code

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/ai-code-assistant/vscode-extension.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the extension:

   ```bash
   npm run compile
   ```

4. Launch the extension in debug mode:
   - Press F5 in VS Code
   - Or select Run > Start Debugging

### Testing

Run the test suite:

```bash
npm test
```

### Packaging

Create a VSIX package:

```bash
npm run vscode:prepublish
npx @vscode/vsce package
```

## Contributing

Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to:

- Submit issues
- Submit pull requests
- Add new AI providers
- Improve documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
