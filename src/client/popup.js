document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const analyzeButton = document.getElementById('analyze-page');
    const refreshSummaryButton = document.getElementById('refresh-summary');
    const runFactCheckButton = document.getElementById('run-fact-check');
    const sendMessageButton = document.getElementById('send-message');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const popup = document.getElementById('popup');
    const resizeHandles = document.querySelectorAll('.resize-handle');
    const extractButton = document.getElementById('extract');
    const modelSelect = document.getElementById('model-select');

    const API_BASE_URL = 'http://localhost:8000';

    // Persistent stats tracking
    let stats = {
        pagesAnalyzed: 0,
        factsChecked: 0
    };

    //Initialise conversationHistory
    let conversationHistory = [];

    // Navigation with immediate action
    navLinks.forEach(link => {
        link.addEventListener('click', async function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            navLinks.forEach(l => l.classList.remove('active', 'bg-blue-600'));
            this.classList.add('active', 'bg-blue-600');
            pages.forEach(page => page.classList.add('hidden'));
            document.getElementById(targetPage).classList.remove('hidden');

            // Trigger actions based on the selected page
            if (targetPage === 'summary') {
                await refreshSummary(); // Trigger summary immediately
            } else if (targetPage === 'factCheck') {
                await runFactCheck(); // Trigger fact check immediately
            } else if (targetPage === 'chat') {
                // Optionally send an initial message or just show the chat
                // For now, we'll keep it as is unless you want an initial AI message
            }
        });
    });

    // Resize functionality
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', initResize);
    });

    function initResize(e) {
        isResizing = true;
        startX = e.clientX;
        startWidth = popup.offsetWidth;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }

    function resize(e) {
        if (!isResizing) return;
        const diff = e.clientX - startX;
        const newWidth = startWidth + diff;
        if (newWidth >= 300 && newWidth <= 800) {
            popup.style.width = `${newWidth}px`;
        }
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
    }

    // Function to extract the body content from the current tab
    async function extractBodyContent() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return new Promise((resolve, reject) => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: function() {
                    return document.body.innerText;
                }
            }, (results) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(results[0].result);
                }
            });
        });
    }

    // Event listener for the "extract" button
    extractButton.addEventListener('click', async () => {
        try {
            const bodyContent = await extractBodyContent();
            document.getElementById('content').textContent = bodyContent;
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to extract content.');
        }
    });

    // Function to handle different API requests with model selection
    async function sendToAPI(endpoint, data, modelName, jsonify=false) {
        try {
            const url = new URL(`${API_BASE_URL}${endpoint}`);
            url.searchParams.append('model_name', modelName);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': jsonify ? 'application/json' : 'text/plain' },
                body: jsonify ? JSON.stringify(data) : data
            });
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error; // Re-throw to handle in calling function
        }
    }

    // Event listener for the "analyze" button
    analyzeButton.addEventListener('click', async () => {
        try {
            const bodyContent = await extractBodyContent();
            const selectedModel = modelSelect.value;
            const dataFromAPI = await sendToAPI('/analyze', bodyContent, selectedModel);

            if (dataFromAPI) {
                updateSummary(dataFromAPI.summary);
                updateFactCheck(dataFromAPI.factCheck);
                updateStats({ 
                    pagesAnalyzed: 1,
                    factsChecked: Array.isArray(dataFromAPI.factCheck) ? dataFromAPI.factCheck.length : 0 
                });
            }
        } catch (error) {
            console.error('Analyze error:', error);
            updateSummary('Cannot generate summary due to an error.');
            updateFactCheck(['Cannot perform fact check due to an error.']);
        }
    });

    // Function for "refresh summary" (also called on nav click)
    async function refreshSummary() {
        try {
            const bodyContent = await extractBodyContent();
            const selectedModel = modelSelect.value;
            const dataFromAPI = await sendToAPI('/ai/summarize', bodyContent, selectedModel);

            if (dataFromAPI) {
                updateSummary(dataFromAPI.summary || dataFromAPI);
                updateStats({ pagesAnalyzed: 1 });
            }
        } catch (error) {
            console.error('Refresh summary error:', error);
            updateSummary('Cannot generate summary due to an error.');
        }
    }

    refreshSummaryButton.addEventListener('click', refreshSummary);

    // Function for "run fact check" (also called on nav click)
    async function runFactCheck() {
        try {
            const bodyContent = await extractBodyContent();
            const selectedModel = modelSelect.value;
            const dataFromAPI = await sendToAPI('/ai/fact_check', bodyContent, selectedModel);

            if (dataFromAPI) {
                updateFactCheck(dataFromAPI.factCheck || dataFromAPI);
                updateStats({ 
                    factsChecked: Array.isArray(dataFromAPI.factCheck) ? dataFromAPI.factCheck.length : 1 
                });
            }
        } catch (error) {
            console.error('Fact check error:', error);
            updateFactCheck(['Cannot perform fact check due to an error.']);
        }
    }

    runFactCheckButton.addEventListener('click', runFactCheck);
    
    async function sendChatMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        console.log('msg', message)
        appendChatMessage('You', message);
        userInput.value = '';
    
        try {
            const selectedModel = modelSelect.value;
            const aiMessage = await sendToAPI('/ai/chat', {
                html: await extractBodyContent(),
                conv: getCurrentConversation()
            }, selectedModel, true);

            appendChatMessage('AI', aiMessage);
            updateConversation(aiMessage);
        } catch (error) {
            console.error('Chat error:', error);
            appendChatMessage('AI', 'Cannot respond due to an error.');
        }
    }
    


    function updateConversation(aiResponse) {
        const userMessage = {
            sender: 'You',
            message: userInput.value.trim()
        };

        const aiMessage = {
            sender: 'AI',
            message: aiResponse.response || aiResponse
        };

        conversationHistory.push(userMessage, aiMessage);

        appendChatMessage(userMessage.sender, userMessage.message);
        appendChatMessage(aiMessage.sender, aiMessage.message);

        localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    }

    function getCurrentConversation() {
        const storedConversation = localStorage.getItem('conversationHistory');
        return storedConversation ? JSON.parse(storedConversation) : conversationHistory;
    }


    // UI Update Functions
    function updateSummary(summary) {
        const summaryText = document.getElementById('summary-text');
        summaryText.textContent = summary || 'No summary available';
        summaryText.className = summary.startsWith('Cannot') ? 'text-red-500' : 'text-gray-700';
        document.getElementById('loading').style.display = 'none';
    }

    function updateFactCheck(facts) {
        const factList = document.getElementById('fact-check-list');
        const loading = document.getElementById('fact-check-loading');
        loading.style.display = 'none';
        factList.innerHTML = '';
        
        if (Array.isArray(facts) && facts.length > 0) {
            facts.forEach(fact => {
                const li = document.createElement('li');
                li.textContent = fact;
                li.className = fact.startsWith('Cannot') ? 'text-red-500 mb-2' : 'mb-2 p-2 bg-gray-50 rounded';
                factList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No facts to check';
            li.className = 'text-gray-500';
            factList.appendChild(li);
        }
    }

    // Updated updateStats function to accumulate stats
    function updateStats(newStats) {
        if (newStats) {
            stats.pagesAnalyzed += newStats.pagesAnalyzed || 0;
            stats.factsChecked += newStats.factsChecked || 0;
            document.getElementById('pages-analyzed').textContent = stats.pagesAnalyzed;
            document.getElementById('facts-checked').textContent = stats.factsChecked;
        }
    }

    function appendChatMessage(sender, message) {
        const msgElement = document.createElement('div');
        msgElement.className = `message ${sender.toLowerCase()}-message p-2 ${sender === 'AI' ? 'bg-gray-200' : 'bg-blue-100'} rounded-lg mb-2`;
        msgElement.innerHTML = ` 
            <div class="font-semibold text-gray-700">${sender}:</div>
            <div class="${message.startsWith('Cannot') ? 'text-red-500' : ''}">${message}</div>
        `;
        chatMessages.appendChild(msgElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showError(message) {
        console.error(message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 p-2 mb-2';
        errorDiv.textContent = message;
        document.getElementById('content').prepend(errorDiv);
    }

    // Event Listeners
    sendMessageButton.addEventListener('click', sendChatMessage);
    userInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
});