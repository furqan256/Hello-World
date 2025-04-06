import * as vscode from 'vscode';
import { BaseViewProvider } from './BaseViewProvider';

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
};

export class ChatViewProvider extends BaseViewProvider {
    private messages: ChatMessage[] = [];

    protected getHtmlContent(webview: vscode.Webview): string {
        const nonce = this.getNonce();
        const styleUri = this.getUri(webview, 'media', 'styles', 'chat.css');
        const scriptUri = this.getUri(webview, 'media', 'scripts', 'chat.js');

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <link href="${styleUri}" rel="stylesheet">
            <title>AI Chat</title>
        </head>
        <body>
            <div id="chat-container">
                <div id="messages"></div>
                <div id="input-container">
                    <textarea id="message-input" placeholder="Type your message..."></textarea>
                    <div id="button-container">
                        <button id="send-button">Send</button>
                        <button id="voice-button">🎤</button>
                    </div>
                </div>
            </div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }

    protected setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            async (message: { type: string; content: string }) => {
                switch (message.type) {
                    case 'sendMessage':
                        await this.handleUserMessage(message.content);
                        break;
                    case 'startVoice':
                        // TODO: Implement voice input handling
                        break;
                }
            },
            undefined,
            this._disposables
        );
    }

    private async handleUserMessage(content: string) {
        const userMessage: ChatMessage = {
            role: 'user',
            content,
            timestamp: Date.now()
        };

        this.messages.push(userMessage);
        await this.sendMessageToWebview('addMessage', userMessage);

        // TODO: Process message with selected AI provider
        const response = await this.processWithAI(content);
        
        const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: response,
            timestamp: Date.now()
        };

        this.messages.push(assistantMessage);
        await this.sendMessageToWebview('addMessage', assistantMessage);
    }

    private async processWithAI(content: string): Promise<string> {
        // TODO: Integrate with AI provider
        return 'This is a placeholder response. AI integration coming soon.';
    }

    private async sendMessageToWebview(type: string, message: any) {
        if (this._view) {
            await this._view.webview.postMessage({ type, message });
        }
    }

    private readonly _disposables: vscode.Disposable[] = [];
}