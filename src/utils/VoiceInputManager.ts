import * as vscode from "vscode";

export class VoiceInputManager {
  private static instance: VoiceInputManager;
  private recognition: any;
  private isListening: boolean = false;
  private statusBarItem: vscode.StatusBarItem;

  private constructor() {
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.text = "$(unmute) Voice Input";
    this.statusBarItem.command = "ai-code-assistant.toggleVoiceInput";
    this.statusBarItem.show();

    // Initialize Web Speech API if available
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const WebSpeechRecognition = (window as any).webkitSpeechRecognition;
      this.recognition = new WebSpeechRecognition();
      this.setupRecognition();
    }
  }

  public static getInstance(): VoiceInputManager {
    if (!VoiceInputManager.instance) {
      VoiceInputManager.instance = new VoiceInputManager();
    }
    return VoiceInputManager.instance;
  }

  private setupRecognition() {
    if (!this.recognition) {
      return;
    }

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateStatusBar();
      vscode.window.showInformationMessage("Voice input started");
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateStatusBar();
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.handleVoiceCommand(transcript);
    };

    this.recognition.onerror = (event: any) => {
      vscode.window.showErrorMessage(`Voice input error: ${event.error}`);
      this.isListening = false;
      this.updateStatusBar();
    };
  }

  private updateStatusBar() {
    this.statusBarItem.text = this.isListening
      ? "$(mute) Voice Input Active"
      : "$(unmute) Voice Input";
  }

  private async handleVoiceCommand(transcript: string) {
    const command = transcript.toLowerCase().trim();

    // Parse commands
    if (command.startsWith("explain")) {
      // Explain code
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        await vscode.commands.executeCommand(
          "ai-code-assistant.explainCode",
          text
        );
      }
    } else if (command.startsWith("optimize")) {
      // Optimize code
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        await vscode.commands.executeCommand(
          "ai-code-assistant.optimizeCode",
          text
        );
      }
    } else if (command.startsWith("refactor")) {
      // Start refactoring task
      await vscode.commands.executeCommand("ai-code-assistant.startRefactor");
    } else if (command.startsWith("document")) {
      // Start documentation task
      await vscode.commands.executeCommand(
        "ai-code-assistant.startDocumentation"
      );
    } else if (command.startsWith("chat")) {
      // Open chat with specific question
      const question = command.replace("chat", "").trim();
      if (question) {
        await vscode.commands.executeCommand(
          "ai-code-assistant.startChat",
          question
        );
      }
    } else {
      // Unknown command
      vscode.window.showWarningMessage(`Unknown voice command: ${command}`);
    }
  }

  public toggleVoiceInput() {
    if (!this.recognition) {
      vscode.window.showErrorMessage(
        "Voice input is not supported in this environment"
      );
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  public dispose() {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.statusBarItem.dispose();
  }
}
