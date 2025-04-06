# AI Code Assistant for VS Code

An open-source, provider-agnostic alternative to GitHub Copilot with advanced features and customization options.

## Features

### 🤖 Multiple AI Provider Support

- OpenAI (GPT-3.5, GPT-4)
- Anthropic (Claude)
- Mistral AI
- Easy integration of additional providers

### 💬 Interactive Chat Interface

- Context-aware code discussions
- File and selection context support
- Syntax highlighting for code snippets
- Smart follow-up suggestions
- Copy code with one click
- Chat history persistence

### ✍️ Code Intelligence

- Inline code suggestions
- Real-time code completion
- Context-aware recommendations
- Code explanation and optimization
- Support for multiple programming languages

### 🎯 Task Automation

- Code refactoring
- Documentation generation
- Test case creation
- Multi-step operations with progress tracking
- Custom workflow creation

### 🎤 Voice Input Support

- Voice commands for common operations
- Multiple language support
- Hands-free coding assistance

### ⚙️ Customization

- Provider selection and configuration
- Model selection per provider
- Customizable keyboard shortcuts
- Adjustable suggestion settings

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "AI Code Assistant"
4. Click Install
5. Reload VS Code when prompted

## Configuration

1. Open the AI Code Assistant sidebar (click the icon in the Activity Bar)
2. Go to Settings
3. Select your preferred AI provider
4. Enter your API key
5. Choose your default model
6. Configure additional settings as needed

## Usage

### Chat Interface

- Open the Chat view in the AI Code Assistant sidebar
- Type your question or use voice input (Ctrl+Shift+V)
- Add file context by clicking the 📄 button
- Use suggested follow-up questions for quick interactions

### Code Assistance

- Select code and right-click for context menu options:
  - Explain Code
  - Optimize Code
  - Generate Documentation
- Use Ctrl+Shift+Space for inline suggestions

### Task Automation

- Open the Agent view
- Click "New Task" to start automated operations
- Monitor progress in real-time
- View detailed logs and results

### Voice Commands

Common voice commands:

- "explain this code"
- "optimize this function"
- "document this class"
- "start refactoring"

## Keyboard Shortcuts

- `Ctrl+Shift+P`: Command Palette
  - "AI Assistant: Start Chat"
  - "AI Assistant: Configure Provider"
  - "AI Assistant: Toggle Voice Input"
- `Ctrl+Shift+Space`: Suggest Code Completion
- `Ctrl+Shift+V`: Toggle Voice Input

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

1. Clone the repository

```bash
git clone https://github.com/ai-code-assistant/vscode-extension.git
cd vscode-extension
```

2. Install dependencies

```bash
npm install
```

3. Open in VS Code

```bash
code .
```

4. Press F5 to start debugging

## Privacy & Security

- API keys are stored securely using VS Code's secret storage
- No code or messages are stored on external servers
- All processing happens locally or through your configured AI provider
- Provider connections use secure HTTPS

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Report Issues](https://github.com/ai-code-assistant/vscode-extension/issues)
- [Feature Requests](https://github.com/ai-code-assistant/vscode-extension/issues/new?labels=enhancement)
- [Documentation](https://github.com/ai-code-assistant/vscode-extension/wiki)
