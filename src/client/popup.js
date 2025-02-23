import { marked } from 'marked'
import DOMPurify from 'dompurify'

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link')
    const pages = document.querySelectorAll('.page')
    const analyzeButton = document.getElementById('analyze-page')
    const refreshSummaryButton = document.getElementById('refresh-summary')
    const runFactCheckButton = document.getElementById('run-fact-check')
    const sendMessageButton = document.getElementById('send-message')
    const userInput = document.getElementById('user-input')
    const chatMessages = document.getElementById('chat-messages')
    const popup = document.getElementById('popup')
    const resizeHandles = document.querySelectorAll('.resize-handle')
    const extractButton = document.getElementById('extract')
    const modelSelect = document.getElementById('model-select')
    const screenReadButtons = document.querySelectorAll('.screen-read-btn')

    const API_BASE_URL = 'http://localhost:8000'
    const synth = window.speechSynthesis

    // Initialize from localStorage or set defaults
    let stats = JSON.parse(localStorage.getItem('webAssistantStats')) || {
        pagesAnalyzed: 0,
        factsChecked: 0,
        summariesGenerated: 0,
        lastPageUrl: ''
    }

    let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || []

    // Update UI with stored stats
    document.getElementById('pages-analyzed').textContent = stats.pagesAnalyzed
    document.getElementById('facts-checked').textContent = stats.factsChecked

    // Navigation handling
    navLinks.forEach(link => {
        link.addEventListener('click', async function(e) {
            e.preventDefault()
            const targetPage = this.getAttribute('data-page')
            navLinks.forEach(l => l.classList.remove('active', 'bg-blue-600'))
            this.classList.add('active', 'bg-blue-600')
            pages.forEach(page => page.classList.add('hidden'))
            document.getElementById(targetPage).classList.remove('hidden')

            if (targetPage === 'summary') {
                await refreshSummary()
            } else if (targetPage === 'factCheck') {
                await runFactCheck()
            }
        })
    })

    // Resize functionality
    let isResizing = false
    let startX = 0
    let startWidth = 0

    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', initResize)
    })

    function initResize(e) {
        isResizing = true
        startX = e.clientX
        startWidth = popup.offsetWidth
        document.addEventListener('mousemove', resize)
        document.addEventListener('mouseup', stopResize)
    }

    function resize(e) {
        if (!isResizing) return
        const diff = startX - e.clientX 
        const newWidth = startWidth + diff
        if (newWidth >= 500 && newWidth <= 900) {
            popup.style.width = `${newWidth}px`
        }
    }

    function stopResize() {
        isResizing = false
        document.removeEventListener('mousemove', resize)
    }

    // Screen reading functionality
    function speakText(text) {
        synth.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.0
        utterance.pitch = 1.0
        utterance.volume = 1.0
        synth.speak(utterance)
    }

    function stopSpeaking() {
        synth.cancel()
    }

    screenReadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const contentId = this.getAttribute('data-content')
            const contentElement = document.getElementById(contentId)
            
            if (this.getAttribute('data-speaking') === 'true') {
                stopSpeaking()
                this.setAttribute('data-speaking', 'false')
                this.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>`
            } else {
                const textToRead = contentElement.textContent
                speakText(textToRead)
                this.setAttribute('data-speaking', 'true')
                this.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M23 9l-6 6m0-6l6 6" />
                </svg>`
            }
        })
    })

    // Content extraction
    async function extractBodyContent() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        return new Promise((resolve, reject) => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: function() {
                    return document.body.innerText
                }
            }, (results) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError)
                } else {
                    resolve(results[0].result)
                }
            })
        })
    }

    // Stats handling
    function updateStats(newStats) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentUrl = tabs[0].url
            const isNewPage = currentUrl !== stats.lastPageUrl

            if (newStats) {
                if (isNewPage && newStats.pagesAnalyzed) {
                    stats.pagesAnalyzed += 1
                    stats.lastPageUrl = currentUrl
                }
                if (newStats.factsChecked) {
                    stats.factsChecked += newStats.factsChecked
                }
                if (newStats.summariesGenerated) {
                    stats.summariesGenerated += 1
                }

                document.getElementById('pages-analyzed').textContent = stats.pagesAnalyzed
                document.getElementById('facts-checked').textContent = stats.factsChecked

                localStorage.setItem('webAssistantStats', JSON.stringify(stats))
            }
        })
    }

    // API communication
    async function sendToAPI(endpoint, data, modelName, jsonify=false) {
        try {
            const url = new URL(`${API_BASE_URL}${endpoint}`)
            url.searchParams.append('model_name', modelName)

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': jsonify ? 'application/json' : 'text/plain' },
                body: jsonify ? JSON.stringify(data) : data
            })
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`)
            }
            return await response.json()
        } catch (error) {
            console.error('API Error:', error)
            throw error
        }
    }

    // Button handlers
    extractButton.addEventListener('click', async () => {
        try {
            const bodyContent = await extractBodyContent()
            document.getElementById('content').textContent = bodyContent
        } catch (error) {
            console.error('Error:', error)
            showError('Failed to extract content.')
        }
    })

    analyzeButton.addEventListener('click', async () => {
        try {
            const bodyContent = await extractBodyContent()
            const selectedModel = modelSelect.value
            const dataFromAPI = await sendToAPI('/analyze', bodyContent, selectedModel)

            if (dataFromAPI) {
                updateSummary(dataFromAPI.summary)
                updateFactCheck(dataFromAPI.factCheck)
                updateStats({ 
                    pagesAnalyzed: 1,
                    factsChecked: Array.isArray(dataFromAPI.factCheck) ? dataFromAPI.factCheck.length : 0,
                    summariesGenerated: 1
                })
            }
        } catch (error) {
            console.error('Analyze error:', error)
            updateSummary('Cannot generate summary due to an error.')
            updateFactCheck(['Cannot perform fact check due to an error.'])
        }
    })

    async function refreshSummary() {
        try {
            const bodyContent = await extractBodyContent()
            const selectedModel = modelSelect.value
            const dataFromAPI = await sendToAPI('/ai/summarize', bodyContent, selectedModel)

            if (dataFromAPI) {
                updateSummary(markdownToHTML(dataFromAPI))
                updateStats({ summariesGenerated: 1 })
            }
        } catch (error) {
            console.error('Refresh summary error:', error)
            updateSummary('Cannot generate summary due to an error.')
        }
    }

    refreshSummaryButton.addEventListener('click', refreshSummary)

    async function runFactCheck() {
        try {
            const bodyContent = await extractBodyContent()
            const selectedModel = modelSelect.value
            const dataFromAPI = await sendToAPI('/ai/fact_check', bodyContent, selectedModel)

            if (dataFromAPI) {
                updateFactCheck(dataFromAPI.factCheck || dataFromAPI)
                updateStats({ 
                    factsChecked: Array.isArray(dataFromAPI.factCheck) ? dataFromAPI.factCheck.length : 1 
                })
            }
        } catch (error) {
            console.error('Fact check error:', error)
            updateFactCheck(['Cannot perform fact check due to an error.'])
        }
    }

    runFactCheckButton.addEventListener('click', runFactCheck)

    async function sendChatMessage() {
        const message = userInput.value.trim()
        if (!message) return
        appendChatMessage('You', `<span class="text-black">${message}</span>`);

        userInput.value = ''

        try {
            const selectedModel = modelSelect.value
            const aiMessage = await sendToAPI('/ai/chat', {
                html: await extractBodyContent(),
                conv: getCurrentConversation()
            }, selectedModel, true)

            appendChatMessage('AI', aiMessage)
        } catch (error) {
            console.error('Chat error:', error)
            appendChatMessage('AI', 'Cannot respond due to an error.')
        }
    }

    // Chat handling
    function updateConversation(message) {
        conversationHistory.push(message)
        localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory))
    }

    function getCurrentConversation() {
        return conversationHistory
    }

    // UI updates
    function updateSummary(summary) {
        const summaryText = document.getElementById('summary-text')
        summaryText.innerHTML = summary || 'No summary available'
        summaryText.className = summary.startsWith('Cannot') ? 'text-red-500' : 'text-gray-700'
        document.getElementById('loading').style.display = 'none'
    }

    function updateFactCheck(analysis) {
        const factCheckContent = document.getElementById('fact-check-content')
        const loading = document.getElementById('fact-check-loading')
        loading.style.display = 'none'
        factCheckContent.innerHTML = ''

        if (typeof analysis === 'string') {
            // Convert markdown to HTML and update the content
            factCheckContent.innerHTML = markdownToHTML(analysis);
        } else {
            // Clear any existing content and append the error message
            factCheckContent.innerHTML = '';  // Clear current content
            const message = document.createElement('p');
            message.textContent = 'No facts to check';
            message.className = 'text-red-500';  // Apply the styling
            factCheckContent.appendChild(message);  // Append the message to the container
        }
        
    }function appendChatMessage(sender, message) {
        const msgElement = document.createElement('div');
        
        // Set background color based on sender
        const backgroundColorClass = sender === 'AI' ? 'bg-gray-200' : 'bg-blue-100';
        
        // Set message styles and content
        msgElement.className = `message ${sender.toLowerCase()}-message p-2 ${backgroundColorClass} rounded-lg mb-2`;
    
        msgElement.innerHTML = ` 
            <div class="font-semibold text-gray-700">${sender}:</div>
            <div class="${message.startsWith('Cannot') ? 'text-red-500' : 'text-gray-900'}">${markdownToHTML(message)}</div>
        `;
        
        chatMessages.appendChild(msgElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Update conversation
        updateConversation({ sender, message });
    }
    
    function showError(message) {
        console.error(message)
        const errorDiv = document.createElement('div')
        errorDiv.className = 'text-red-500 p-2 mb-2'
        errorDiv.textContent = message
        document.getElementById('content').prepend(errorDiv)
    }

    function markdownToHTML(markdown) {
        return DOMPurify.sanitize(marked(markdown))
    }

    // Event listeners
    sendMessageButton.addEventListener('click', sendChatMessage)
    userInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            sendChatMessage()
        }
    })
})