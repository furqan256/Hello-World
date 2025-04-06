(function () {
    // Get VS Code webview API
    const vscode = acquireVsCodeApi();
    
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const voiceButton = document.getElementById('voice-button');

    let isRecording = false;
    let messages = [];

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            messageInput.value = transcript;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopRecording();
        };

        recognition.onend = () => {
            stopRecording();
        };
    }

    // Handle sending messages
    function sendMessage() {
        const content = messageInput.value.trim();
        if (content) {
            vscode.postMessage({
                type: 'sendMessage',
                content
            });
            messageInput.value = '';
        }
    }

    // Create and append message element
    function appendMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', message.role);
        
        const contentElement = document.createElement('div');
        contentElement.classList.add('content');
        contentElement.textContent = message.content;
        
        const timestampElement = document.createElement('div');
        timestampElement.classList.add('timestamp');
        timestampElement.textContent = new Date(message.timestamp).toLocaleTimeString();
        
        messageElement.appendChild(contentElement);
        messageElement.appendChild(timestampElement);
        messagesContainer.appendChild(messageElement);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        messages.push(message);
    }

    // Handle voice input
    function toggleRecording() {
        if (!recognition) {
            vscode.postMessage({
                type: 'error',
                message: 'Speech recognition is not supported in your browser.'
            });
            return;
        }

        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    function startRecording() {
        isRecording = true;
        voiceButton.style.backgroundColor = 'var(--vscode-inputValidation-errorBackground)';
        recognition.start();
    }

    function stopRecording() {
        isRecording = false;
        voiceButton.style.backgroundColor = '';
        recognition.stop();
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    voiceButton.addEventListener('click', toggleRecording);

    // Handle messages from extension
    window.addEventListener('message', (event) => {
        const message = event.data;
        switch (message.type) {
            case 'addMessage':
                appendMessage(message.message);
                break;
            case 'error':
                showError(message.message);
                break;
        }
    });

    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.classList.add('error');
        errorElement.textContent = message;
        messagesContainer.appendChild(errorElement);
        setTimeout(() => errorElement.remove(), 5000);
    }

    // Keep webview state
    window.addEventListener('beforeunload', () => {
        vscode.setState({ messages });
    });

    // Restore previous state
    const previousState = vscode.getState();
    if (previousState && previousState.messages) {
        previousState.messages.forEach(appendMessage);
    }
})();