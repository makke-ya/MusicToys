window.ScoreManager = (function() {
    const DEFAULT_API_ENDPOINT = 'https://skht6osyhe.execute-api.ap-northeast-1.amazonaws.com/result';

    function getApiEndpoint() {
        return (window.Config && window.Config.API_ENDPOINT) ? window.Config.API_ENDPOINT : DEFAULT_API_ENDPOINT;
    }

    function getUserId() {
        if (window.Site && typeof window.Site.getUserId === 'function') {
            return window.Site.getUserId();
        }
        let id = localStorage.getItem('userId');
        if (!id) {
            id = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
            localStorage.setItem('userId', id);
        }
        return id;
    }

    function getStoredUserName() {
        return localStorage.getItem('userName') || localStorage.getItem('username') || '';
    }

    function setStoredUserName(name) {
        localStorage.setItem('userName', name);
        localStorage.setItem('username', name);
    }

    /**
     * Post a game score to the backend.
     * @param {string} gameId - The ID of the game (e.g., '002_harmony_game').
     * @param {number} score - The user's score.
     * @param {number} level - The level reached.
     * @param {object} additionalData - Any other data (e.g., total questions, accuracy rate).
     * @returns {Promise<object>} The JSON response.
     */
    async function postScore(gameId, score, level, additionalData = {}) {
        const apiEndpoint = getApiEndpoint();
        if (!apiEndpoint) {
            console.warn('API_ENDPOINT is not defined in window.Config');
            return null;
        }

        const userId = getUserId();
        const timestamp = new Date().toISOString();
        
        // Retrieve user name if saved, else default
        const userName = getStoredUserName() || '名無しさん';

        const payload = {
            userId: userId,
            timestamp: timestamp,
            gameId: gameId,
            name: userName,
            score: Number(score) || 0,
            level: Number(level) || 1,
            ...additionalData
        };

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to post score:', error);
            throw error;
        }
    }

    /**
     * Get the leaderboard for a specific game.
     * @param {string} gameId 
     * @returns {Promise<Array>} List of top scores.
     */
    async function getLeaderboard(gameId) {
        const apiEndpoint = getApiEndpoint();
        if (!apiEndpoint) return [];

        try {
            // Add timestamp to prevent caching
            const response = await fetch(`${apiEndpoint}?type=leaderboard&gameId=${encodeURIComponent(gameId)}&_t=${Date.now()}`);
            if (!response.ok) {
                throw new Error(`Network response was not ok (HTTP ${response.status})`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            return [];
        }
    }

    /**
     * Create and show a leaderboard modal.
     * @param {string} initialGameId 
     * @param {object|null} currentResult - Optional object { score: 10, level: 5 } to highlight
     * @param {Array} actions - Optional array of buttons [{ label: 'Text', onClick: fn, primary: boolean }]
     * @param {Array} tabs - Optional array of tabs [{ label: 'Easy', gameId: '...' }]
     */
    async function showLeaderboardModal(initialGameId, currentResult = null, actions = [], tabs = []) {
        let currentGameId = initialGameId;

        // Remove existing modal if any
        const existing = document.getElementById('leaderboard-modal');
        if (existing) existing.remove();

        // Create Modal HTML
        const modal = document.createElement('div');
        modal.id = 'leaderboard-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        const content = document.createElement('div');
        content.className = 'bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all flex flex-col max-h-[90vh]';
        
        // Header
        const header = document.createElement('div');
        header.className = 'bg-yellow-400 p-4 text-center shrink-0';
        header.innerHTML = `
            <h2 class="text-2xl font-bold text-white drop-shadow-md">🏆 ランキング 🏆</h2>
        `;
        content.appendChild(header);

        // Tab Bar
        let tabBar = null;
        if (tabs && tabs.length > 0) {
            tabBar = document.createElement('div');
            tabBar.className = 'flex bg-yellow-500 p-1 gap-1 shrink-0';
            
            tabs.forEach(tab => {
                const tabBtn = document.createElement('button');
                tabBtn.textContent = tab.label;
                tabBtn.className = `flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${tab.gameId === currentGameId ? 'bg-white text-yellow-600' : 'text-white hover:bg-yellow-400'}`;
                tabBtn.onclick = () => {
                    if (tab.gameId === currentGameId) return;
                    currentGameId = tab.gameId;
                    // Update tab styles
                    Array.from(tabBar.children).forEach(child => {
                        child.className = 'flex-1 py-2 text-xs font-bold rounded-lg transition-colors text-white hover:bg-yellow-400';
                    });
                    tabBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg transition-colors bg-white text-yellow-600';
                    renderList();
                };
                tabBar.appendChild(tabBtn);
            });
            content.appendChild(tabBar);
        }

        // List Container
        const listContainer = document.createElement('div');
        listContainer.className = 'p-4 overflow-y-auto grow min-h-[300px]';
        content.appendChild(listContainer);

        async function renderList() {
            listContainer.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">よみこみちゅう...</div>';
            
            const data = await getLeaderboard(currentGameId);
            listContainer.innerHTML = '';

            if (data.length === 0) {
                listContainer.innerHTML = '<p class="text-center text-gray-500 py-8 italic">まだランキングがありません。<br>あなたが最初のランクインかも！？</p>';
            } else {
                const ul = document.createElement('ul');
                ul.className = 'space-y-2';
                
                data.forEach((item, index) => {
                    const li = document.createElement('li');
                    const rankColor = index === 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                                      index === 1 ? 'bg-gray-100 text-gray-800 border-gray-300' : 
                                      index === 2 ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-white text-gray-600 border-gray-100';
                    
                    const rankIcon = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                    
                    let highlightClass = '';
                    if (currentResult && item.score === currentResult.score && item.level === currentResult.level && item.name === currentResult.name) {
                        highlightClass = 'ring-2 ring-blue-500 shadow-lg';
                    }

                    li.className = `flex justify-between items-center p-3 rounded-lg border ${rankColor} ${highlightClass}`;
                    const date = new Date(item.timestamp).toLocaleDateString();
                    
                    li.innerHTML = `
                        <div class="flex items-center gap-3">
                            <span class="font-bold text-lg w-8 text-center">${rankIcon}</span>
                            <div>
                                <div class="font-bold text-sm truncate max-w-[120px]">${item.name || '名無し'}</div>
                                <div class="text-xs opacity-75">${date}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-xl">${item.score} <span class="text-xs font-normal">pts</span></div>
                            <div class="text-xs">Lv.${item.level}</div>
                        </div>
                    `;
                    ul.appendChild(li);
                });
                listContainer.appendChild(ul);
            }
        }

        renderList();

        // Footer (Actions)
        const footer = document.createElement('div');
        footer.className = 'p-4 bg-gray-50 text-center border-t border-gray-100 shrink-0 flex flex-col gap-2';
        
        if (actions && actions.length > 0) {
            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.textContent = action.label;
                btn.onclick = () => {
                    modal.remove();
                    if (action.onClick) action.onClick();
                };
                
                if (action.primary) {
                    btn.className = 'w-full px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow transition-transform transform active:scale-95 text-lg';
                } else {
                    btn.className = 'w-full px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-xl font-bold transition-colors';
                }
                footer.appendChild(btn);
            });
        } else {
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'とじる';
            closeBtn.className = 'px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-xl font-bold shadow transition-transform transform active:scale-95 w-full';
            closeBtn.onclick = () => modal.remove();
            footer.appendChild(closeBtn);
        }
        
        content.appendChild(footer);
        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    /**
     * Show a modal to input user name.
     * @returns {Promise<string>} The entered name.
     */
    function showNameInputModal() {
        return new Promise((resolve) => {
            const existing = document.getElementById('name-input-modal');
            if (existing) existing.remove();

            const storedName = getStoredUserName();

            const modal = document.createElement('div');
            modal.id = 'name-input-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4';
            
            const content = document.createElement('div');
            content.className = 'bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all p-6 text-center border-4 border-indigo-400';
            
            content.innerHTML = `
                <h3 class="text-2xl font-black text-indigo-600 mb-4">おなまえをおしえてね</h3>
                <p class="text-gray-500 mb-6 text-sm">ランキングにのるよ！</p>
                <input type="text" id="score-username-input" value="${storedName}" placeholder="おなまえ" class="w-full text-2xl font-bold text-center p-3 border-2 border-gray-300 rounded-xl mb-6 focus:border-indigo-500 focus:outline-none" maxlength="10">
                <button id="score-username-submit" class="w-full bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-600 transition-transform active:scale-95 text-xl">
                    OK
                </button>
            `;
            
            modal.appendChild(content);
            document.body.appendChild(modal);

            const input = document.getElementById('score-username-input');
            const btn = document.getElementById('score-username-submit');

            // Focus input
            setTimeout(() => input.focus(), 100);

            const submit = () => {
                const name = input.value.trim() || '名無しさん';
                setStoredUserName(name);
                modal.remove();
                resolve(name);
            };

            btn.onclick = submit;
            input.onkeydown = (e) => {
                if (e.key === 'Enter') submit();
            };
        });
    }

    return {
        postScore,
        getLeaderboard,
        showLeaderboardModal,
        showNameInputModal
    };
})();
