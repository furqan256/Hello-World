(function () {
  const vscode = acquireVsCodeApi();
  let providers = [];
  let models = [];
  let currentSettings = null;

  // Initialize UI elements
  const providerSelect = document.getElementById("provider-select");
  const providerConfig = document.getElementById("provider-config");
  const modelSelect = document.getElementById("model-select");
  const voiceEnabled = document.getElementById("voice-enabled");
  const voiceLanguage = document.getElementById("voice-language");
  const saveButton = document.getElementById("save-settings");
  const testButton = document.getElementById("test-connection");

  // Initialize event listeners
  providerSelect.addEventListener("change", handleProviderChange);
  voiceEnabled.addEventListener("change", handleVoiceToggle);
  saveButton.addEventListener("click", saveSettings);
  testButton.addEventListener("click", testConnection);

  // Handle incoming messages from extension
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "providers":
        updateProviders(message.providers);
        break;
      case "models":
        updateModels(message.models);
        break;
      case "initialState":
        loadInitialState(message.settings);
        break;
      case "notification":
        showNotification(message.message);
        break;
      case "error":
        showError(message.message);
        break;
    }
  });

  function updateProviders(newProviders) {
    providers = newProviders;
    renderProviderSelect();
  }

  function updateModels(newModels) {
    models = newModels;
    renderModelSelect();
  }

  function renderProviderSelect() {
    providerSelect.innerHTML = `
      <option value="">Choose a provider...</option>
      ${providers
        .map(
          (provider) =>
            `<option value="${provider.id}">${provider.name}</option>`
        )
        .join("")}
    `;

    if (currentSettings?.providerId) {
      providerSelect.value = currentSettings.providerId;
      handleProviderChange();
    }
  }

  function renderModelSelect() {
    modelSelect.innerHTML = `
      <option value="">Choose a model...</option>
      ${models
        .map((model) => `<option value="${model.id}">${model.name}</option>`)
        .join("")}
    `;

    if (currentSettings?.providerConfig?.model) {
      modelSelect.value = currentSettings.providerConfig.model;
    }

    modelSelect.disabled = models.length === 0;
  }

  function renderProviderConfig(provider) {
    providerConfig.innerHTML = "";

    if (!provider) {
      return;
    }

    provider.configFields.forEach((field) => {
      const fieldContainer = document.createElement("div");
      fieldContainer.className = "config-field";

      const label = document.createElement("label");
      label.textContent = field.name;
      label.htmlFor = `config-${field.key}`;

      const input = document.createElement("input");
      input.id = `config-${field.key}`;
      input.name = field.key;
      input.type = field.type === "boolean" ? "checkbox" : "text";
      if (field.type === "number") {
        input.type = "number";
      }
      if (field.secret) {
        input.type = "password";
      }
      input.required = field.required;

      // Set current value if exists
      if (currentSettings?.providerConfig?.[field.key]) {
        if (field.type === "boolean") {
          input.checked = currentSettings.providerConfig[field.key];
        } else {
          input.value = currentSettings.providerConfig[field.key];
        }
      }

      if (field.description) {
        const description = document.createElement("div");
        description.className = "field-description";
        description.textContent = field.description;
        fieldContainer.appendChild(description);
      }

      fieldContainer.appendChild(label);
      fieldContainer.appendChild(input);
      providerConfig.appendChild(fieldContainer);
    });
  }

  function handleProviderChange() {
    const providerId = providerSelect.value;
    const provider = providers.find((p) => p.id === providerId);

    renderProviderConfig(provider);
    if (provider) {
      vscode.postMessage({
        type: "getModels",
        content: { providerId },
      });
      testButton.disabled = false;
    } else {
      modelSelect.innerHTML = '<option value="">Choose a model...</option>';
      modelSelect.disabled = true;
      testButton.disabled = true;
    }
  }

  function handleVoiceToggle() {
    voiceLanguage.disabled = !voiceEnabled.checked;
  }

  function getProviderConfig() {
    const config = {};
    const inputs = providerConfig.querySelectorAll("input");
    inputs.forEach((input) => {
      if (input.type === "checkbox") {
        config[input.name] = input.checked;
      } else {
        config[input.name] = input.value;
      }
    });
    return config;
  }

  function saveSettings() {
    const settings = {
      providerId: providerSelect.value,
      config: getProviderConfig(),
      modelId: modelSelect.value,
      voiceSettings: {
        enabled: voiceEnabled.checked,
        language: voiceLanguage.value,
      },
    };

    vscode.postMessage({
      type: "saveSettings",
      content: settings,
    });
  }

  function testConnection() {
    const settings = {
      providerId: providerSelect.value,
      config: getProviderConfig(),
    };

    vscode.postMessage({
      type: "testConnection",
      content: settings,
    });
  }

  function loadInitialState(settings) {
    currentSettings = settings;

    if (settings.voiceSettings) {
      voiceEnabled.checked = settings.voiceSettings.enabled;
      voiceLanguage.value = settings.voiceSettings.language;
      voiceLanguage.disabled = !settings.voiceSettings.enabled;
    }

    // Request providers list
    vscode.postMessage({ type: "getProviders" });
  }

  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  function showError(message) {
    const error = document.createElement("div");
    error.className = "error-message";
    error.textContent = message;
    document.body.appendChild(error);

    setTimeout(() => {
      error.remove();
    }, 5000);
  }

  // Request initial state
  vscode.postMessage({ type: "initialize" });
})();
