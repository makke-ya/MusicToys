window.ScoreManager = (function() {
    const API_ENDPOINT = window.Config ? window.Config.API_ENDPOINT : null;

    /**
     * Post a game score to the backend.
     * @param {string} gameId - The ID of the game (e.g., '002_harmony_game').
     * @param {number} score - The user's score.
     * @param {number} level - The level reached.
     * @param {object} additionalData - Any other data (e.g., total questions, accuracy rate).
     * @returns {Promise<object>} The JSON response.
     */
    async function postScore(gameId, score, level, additionalData = {}) {
        if (!API_ENDPOINT) {
            console.warn('API_ENDPOINT is not defined in window.Config');
            return null;
        }

        const userId = window.Site ? window.Site.getUserId() : 'unknown_user';
        const timestamp = new Date().toISOString();
        
        // Retrieve user name if saved, else default
        const userName = localStorage.getItem('userName') || '名無しさん';

        const payload = {
            userId: userId,
            timestamp: timestamp,
            gameId: gameId,
            name: userName,
            score: score,
            level: level,
            ...additionalData
        };

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
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
        if (!API_ENDPOINT) return [];

        try {
            const response = await fetch(`${API_ENDPOINT}?type=leaderboard&gameId=${gameId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            return [];
        }
    }

    /**
     * Create and show a leaderboard modal.
     * @param {string} gameId 
     * @param {object|null} currentResult - Optional object { score: 10, level: 5 } to highlight
     */
    async function showLeaderboardModal(gameId, currentResult = null) {
        // Remove existing modal if any
        const existing = document.getElementById('leaderboard-modal');
        if (existing) existing.remove();

        // Fetch data
        const data = await getLeaderboard(gameId);

        // Create Modal HTML
        const modal = document.createElement('div');
        modal.id = 'leaderboard-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        const content = document.createElement('div');
        content.className = 'bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all';
        
        // Header
        const header = document.createElement('div');
        header.className = 'bg-yellow-400 p-4 text-center';
        header.innerHTML = `
            <h2 class="text-2xl font-bold text-white drop-shadow-md">🏆 ランキング 🏆</h2>
            <p class="text-yellow-100 text-sm">トップ10プレイヤー</p>
        `;
        content.appendChild(header);

        // List
        const list = document.createElement('div');
        list.className = 'p-4 max-h-[60vh] overflow-y-auto';
        
        if (data.length === 0) {
            list.innerHTML = '<p class="text-center text-gray-500 py-4">まだランキングがありません。<br>あなたが最初のランクインかも！？</p>';
        } else {
            const ul = document.createElement('ul');
            ul.className = 'space-y-2';
            
            data.forEach((item, index) => {
                const li = document.createElement('li');
                const isTop3 = index < 3;
                const rankColor = index === 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                                  index === 1 ? 'bg-gray-100 text-gray-800 border-gray-300' : 
                                  index === 2 ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-white text-gray-600 border-gray-100';
                
                const rankIcon = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                
                // Highlight if it matches current result (simple matching by score/level/name if provided)
                // Note: accurate matching requires unique ID returned from backend, but we'll just highlight score for now if unique enough
                let highlightClass = '';
                if (currentResult && item.score === currentResult.score && item.level === currentResult.level && item.name === currentResult.name) {
                    highlightClass = 'ring-2 ring-blue-500';
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
            list.appendChild(ul);
        }
        content.appendChild(list);

        // Footer (Close button)
        const footer = document.createElement('div');
        footer.className = 'p-4 bg-gray-50 text-center border-t border-gray-100';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'とじる';
        closeBtn.className = 'px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-full font-bold shadow transition-transform transform active:scale-95';
        closeBtn.onclick = () => modal.remove();
        footer.appendChild(closeBtn);
        content.appendChild(footer);

        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    return {
        postScore,
        getLeaderboard,
        showLeaderboardModal
    };
})();
