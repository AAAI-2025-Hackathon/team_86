document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('nav a');
    const pages = document.querySelectorAll('.page');
    const analyzeButton = document.getElementById('analyze-page');
    const refreshSummaryButton = document.getElementById('refresh-summary');
    const runFactCheckButton = document.getElementById('run-fact-check');
    const sendMessageButton = document.getElementById('send-message');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetPage).classList.add('active');
        });
    });

    // Analyze current page
    analyzeButton.addEventListener('click', analyzePage);

    // Refresh summary
    refreshSummaryButton.addEventListener('click', refreshSummary);

    // Run fact check
    runFactCheckButton.addEventListener('click', runFactCheck);

    // Send chat message
    sendMessageButton.addEventListener('click', sendChatMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // Initialize
    updateStats();
    
    function analyzePage() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "getPageContent"}, function(response) {
                if (response && response.html) {
                    // Send to backend for analysis
                    fetch('http://localhost:8000/analyze', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({html: response.html}),
                    })
                    .then(response => response.json())
                    .then(data => {
                        updateSummary(data.summary);
                        updateFactCheck(data.factCheck);
                        updateStats();
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
                }
            });
        });
    }

    function refreshSummary() {
        document.getElementById('summary-text').textContent = '';
        document.getElementById('loading').style.display = 'block';
        analyzePage();
    }

    function runFactCheck() {
        document.getElementById('fact-check-list').innerHTML = '';
        document.getElementById('fact-check-loading').style.display = 'block';
        analyzePage();
    }

    function sendChatMessage() {
        const message = userInput.value.trim();
        if (message) {
            appendChatMessage('You', message);
            userInput.value = '';
            
            // Send to backend for AI response
            fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({message: message}),
            })
            .then(response => response.json())
            .then(data => {
                appendChatMessage('AI', data.response);
            })
            .catch(error => {
                console.error('Error:', error);
                appendChatMessage('AI', 'Sorry, I encountered an error. Please try again.');
            });
        }
    }

    function appendChatMessage(sender, message) {
        const messageElement = document.createElement('p');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateSummary(summary) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('summary-text').textContent = summary;
    }

    function updateFactCheck(facts) {
        document.getElementById('fact-check-loading').style.display = 'none';
        const factList = document.getElementById('fact-check-list');
        factList.innerHTML = '';
        facts.forEach(fact => {
            const li = document.createElement('li');
            li.textContent = fact;
            factList.appendChild(li);
        });
    }

    function updateStats() {
        // In a real scenario, you'd fetch these from storage or backend
        document.getElementById('pages-analyzed').textContent = '10';
        document.getElementById('facts-checked').textContent = '50';
    }
});