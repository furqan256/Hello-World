import * as assert from "assert";
import * as vscode from "vscode";
import { ProviderManager } from "../../providers/ProviderManager";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Starting all tests.");

  test("Provider Manager Initialization", () => {
    const manager = ProviderManager.getInstance();
    assert.strictEqual(typeof manager.getProviders, "function");
    assert.strictEqual(typeof manager.getProvider, "function");
  });

  test("OpenAI Provider Registration", () => {
    const manager = ProviderManager.getInstance();
    const provider = manager.getProvider("openai");
    assert.ok(provider);
    assert.strictEqual(provider.id, "openai");
  });

  test("Settings View Commands", async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes("ai-code-assistant.configureProvider"));
  });

  test("Chat View Commands", async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes("ai-code-assistant.startChat"));
  });
});
