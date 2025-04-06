(function () {
    const vscode = acquireVsCodeApi();
    
    const providerSelect = document.getElementById('provider');
    const providerConfig = document.getElementById('provider-config');
    const saveButton = document.getElementById('save-config');
    const testButton = document.getElementById('test-connection');

    let currentProvider = null;
    let providers = null;

    // Provider configuration template
    function createConfigFields(provider) {
        const fragment = document.createDocumentFragment();

        // Add provider description
        const descriptionDiv = document.createElement('div');
        descriptionDiv.classList.add('provider-description');
        descriptionDiv.textContent = provider.description;
        fragment.appendChild(descriptionDiv);

        // Add configuration fields
        provider.configFields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.classList.add('config-field');

            const label = document.createElement('label');
            label.setAttribute('for', field.key);
            label.textContent = field.name;
            
            const input = document.createElement('input');
            input.setAttribute('id', field.key);
            input.setAttribute('name', field.key);
            input.setAttribute('type', field.secret ? 'password' : 'text');
            input.required = field.required;

            if (field.type === 'number') {
                input.setAttribute('type', 'number');
            }

            fieldDiv.appendChild(label);
            fieldDiv.appendChild(input);

            if (field.description) {
                const description = document.createElement('div');
                description.classList.add('field-description');
                description.textContent = field.description;
                fieldDiv.appendChild(description);
            }

            fragment.appendChild(fieldDiv);
        });

        return fragment;
    }

    // Load provider configuration
    async function loadProviderConfig(providerId) {
        vscode.postMessage({
            type: 'getProviderConfig',
            provider: providerId
        });
    }

    // Save provider configuration
    async function saveConfig() {
        if (!currentProvider) return;

        const config = {};
        const fields = providerConfig.querySelectorAll('input');
        
        fields.forEach(field => {
            config[field.name] = field.value;
        });

        vscode.postMessage({
            type: 'saveConfig',
            provider: currentProvider,
            config
        });
    }

    // Test provider connection
    async function testConnection() {
        if (!currentProvider) return;

        vscode.postMessage({
            type: 'testConnection',
            provider: currentProvider
        });
    }

    // Show notification
    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.classList.add(isError ? 'error' : 'success');
        notification.textContent = message;
        
        providerConfig.insertBefore(notification, providerConfig.firstChild);
        
        setTimeout(() => notification.remove(), 5000);
    }

    // Event Listeners
    providerSelect.addEventListener('change', (e) => {
        currentProvider = e.target.value;
        const provider = providers.find(p => p.id === currentProvider);
        
        providerConfig.innerHTML = '';
        if (provider) {
            providerConfig.appendChild(createConfigFields(provider));
            loadProviderConfig(currentProvider);
        }
    });

    saveButton.addEventListener('click', saveConfig);
    testButton.addEventListener('click', testConnection);

    // Handle messages from extension
    window.addEventListener('message', (event) => {
        const message = event.data;

        switch (message.type) {
            case 'providerConfig':
                const fields = providerConfig.querySelectorAll('input');
                if (message.config) {
                    fields.forEach(field => {
                        if (message.config[field.name]) {
                            field.value = message.config[field.name];
                        }
                    });
                }
                break;
            case 'providers':
                providers = message.providers;
                providers.forEach(provider => {
                    const option = document.createElement('option');
                    option.value = provider.id;
                    option.textContent = provider.name;
                    providerSelect.appendChild(option);
                });
                break;
            case 'error':
                showNotification(message.message, true);
                break;
            case 'success':
                showNotification(message.message, false);
                break;
        }
    });

    // Initialize
    vscode.postMessage({ type: 'initialize' });
})();