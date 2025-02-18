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
    const extractButton = document.getElementById('extract'); // Extract button for the new functionality

    const API_BASE_URL = 'http://localhost:8000'; // Your API base URL

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            navLinks.forEach(l => l.classList.remove('active', 'bg-blue-600'));
            this.classList.add('active', 'bg-blue-600');
            pages.forEach(page => page.classList.add('hidden'));
            document.getElementById(targetPage).classList.remove('hidden');
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
                    return document.body.innerText;  // Extract body text
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
            // Extract body content from the current active tab
            const bodyContent = await extractBodyContent();
            
            // Display the extracted content in popup
            document.getElementById('content').textContent = bodyContent;

        } catch (error) {
            console.error('Error:', error);
            showError('Failed to extract content.');
        }
    });

    // Function to handle different API requests
    async function sendToAPI(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}?webpage_text=${data}`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },  // Specify plain text content type
                body: data,  // Send the string directly as the body (no encoding)
            });
            return await response.json(); // Ensure to return the response JSON
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Event listener for the "analyze" button
    analyzeButton.addEventListener('click', async () => {
        try {
            const bodyContent = await extractBodyContent(); // Extract page content

            // Send data to the analyze endpoint
            const dataFromAPI = await sendToAPI('/analyze', bodyContent);

            if (dataFromAPI) {
                updateSummary(dataFromAPI.summary);
                updateFactCheck(dataFromAPI.factCheck);
                updateStats(dataFromAPI.stats);
            }
        } catch (error) {
            console.error('Analyze error:', error);
        }
    });

    // Event listener for the "refresh summary" button
    refreshSummaryButton.addEventListener('click', async () => {
        try {
            const bodyContent = await extractBodyContent(); // Extract page content

            // Send the body content directly as a string to the refresh-summary endpoint
            const dataFromAPI = await sendToAPI('/ai/summarize', bodyContent);

            if (dataFromAPI) {
                updateSummary(dataFromAPI.summary);
            }
        } catch (error) {
            console.error('Refresh summary error:', error);
        }
    });

    // Event listener for the "run fact check" button
    runFactCheckButton.addEventListener('click', async () => {
        try {
            const bodyContent = await extractBodyContent(); // Extract page content

            // Send data to the run-fact-check endpoint
            const dataFromAPI = await sendToAPI('/run-fact-check', bodyContent);

            if (dataFromAPI) {
                updateFactCheck(dataFromAPI.factCheck);
            }
        } catch (error) {
            console.error('Fact check error:', error);
        }
    });

    // UI Update Functions
    function updateSummary(summary) {
        document.getElementById('summary-text').textContent = summary || 'No summary available';
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
                li.className = 'mb-2 p-2 bg-gray-50 rounded';
                factList.appendChild(li);
            });
        } else {
            factList.innerHTML = '<li class="text-gray-500">No facts to check</li>';
        }
    }

    function updateStats(stats) {
        if (stats) {
            document.getElementById('pages-analyzed').textContent = stats.pagesAnalyzed || '0';
            document.getElementById('facts-checked').textContent = stats.factsChecked || '0';
        }
    }

    // Chat Functions
    async function sendChatMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        appendChatMessage('You', message);
        userInput.value = '';

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            appendChatMessage('AI', data.response);
        } catch (error) {
            appendChatMessage('AI', 'Sorry, I encountered an error processing your message.');
        }
    }

    function appendChatMessage(sender, message) {
        const msgElement = document.createElement('div');
        msgElement.className = `message ${sender.toLowerCase()}-message p-2 ${sender === 'AI' ? 'bg-gray-200' : 'bg-blue-100'} rounded-lg mb-2`;
        msgElement.innerHTML = ` 
            <div class="font-semibold text-gray-700">${sender}:</div>
            <div>${message}</div>
        `;
        chatMessages.appendChild(msgElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showError(message) {
        // Add error notification functionality here
        console.error(message);
    }

    // Event Listener for sendMessage
    sendMessageButton.addEventListener('click', sendChatMessage);
    userInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
});
