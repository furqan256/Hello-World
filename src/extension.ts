import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { ChatViewProvider } from './webview/ChatViewProvider';
import { SettingsViewProvider } from './webview/SettingsViewProvider';

export async function activate(context: vscode.ExtensionContext) {
    console.log('AI Code Assistant is now active');

    // Register WebView Providers
    const chatViewProvider = new ChatViewProvider(context.extensionUri);
    const settingsViewProvider = new SettingsViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'aiChatView',
            chatViewProvider
        ),
        vscode.window.registerWebviewViewProvider(
            'aiSettingsView',
            settingsViewProvider
        )
    );

    // Register Commands
    await registerCommands(context, {
        chatViewProvider,
        settingsViewProvider
    });

    // Initialize extension state
    await initializeExtension(context);
}

async function initializeExtension(context: vscode.ExtensionContext) {
    // Load saved configuration
    const config = vscode.workspace.getConfiguration('aiCodeAssistant');
    const provider = config.get<string>('provider');
    
    if (!provider) {
        // Show welcome message and prompt for initial setup
        const setup = await vscode.window.showInformationMessage(
            'Welcome to AI Code Assistant! Would you like to configure your AI provider now?',
            'Configure Now',
            'Later'
        );
        
        if (setup === 'Configure Now') {
            await vscode.commands.executeCommand('ai-code-assistant.configureProvider');
        }
    }
}

export function deactivate() {
    console.log('AI Code Assistant is now deactive');
}