let mouseStartX = 0;
let mouseStartY = 0;
let isMouseDown = false;
let lastMoveTime = 0;

document.addEventListener('DOMContentLoaded', function() {
    const mousePad = document.getElementById('mousePad');
    if (mousePad) {
        setupMouseControls(mousePad);
    }
    
    const textInput = document.getElementById('textInput');
    if (textInput) {
        textInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                sendText();
            }
        });
    }
});

function setupMouseControls(mousePad) {
    // Événements souris
    mousePad.addEventListener('mousedown', handleMouseStart);
    mousePad.addEventListener('mousemove', handleMouseMove);
    mousePad.addEventListener('mouseup', handleMouseEnd);
    mousePad.addEventListener('mouseleave', handleMouseEnd);
    
    // Événements tactiles avec passive: false pour pouvoir preventDefault
    mousePad.addEventListener('touchstart', handleTouchStart, { passive: false });
    mousePad.addEventListener('touchmove', handleTouchMove, { passive: false });
    mousePad.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Désactiver le menu contextuel sur le trackpad
    mousePad.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
}

function handleMouseStart(e) {
    e.preventDefault();
    isMouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    lastMoveTime = Date.now();
    showStatus('Trackpad activé', 'info');
}

function handleMouseMove(e) {
    if (!isMouseDown) return;
    e.preventDefault();
    
    const now = Date.now();
    // Limiter la fréquence des mouvements pour éviter le spam
    if (now - lastMoveTime < 16) return; // ~60 FPS max
    
    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    
    // Seuil minimum pour éviter les micro-mouvements
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        // Sensibilité ajustable selon les préférences
        const sensitivity = 2.5;
        moveMouse(dx * sensitivity, dy * sensitivity);
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
        lastMoveTime = now;
    }
}

function handleMouseEnd(e) {
    if (isMouseDown) {
        isMouseDown = false;
        showStatus('Prêt', 'info');
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    isMouseDown = true;
    const touch = e.touches[0];
    mouseStartX = touch.clientX;
    mouseStartY = touch.clientY;
    lastMoveTime = Date.now();
    showStatus('Contrôle tactile activé', 'info');
}

function handleTouchMove(e) {
    if (!isMouseDown) return;
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastMoveTime < 16) return; // Limitation de fréquence
    
    const touch = e.touches[0];
    const dx = touch.clientX - mouseStartX;
    const dy = touch.clientY - mouseStartY;
    
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        // Sensibilité plus élevée pour le tactile
        const touchSensitivity = 3.5;
        moveMouse(dx * touchSensitivity, dy * touchSensitivity);
        mouseStartX = touch.clientX;
        mouseStartY = touch.clientY;
        lastMoveTime = now;
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (isMouseDown) {
        isMouseDown = false;
        showStatus('Prêt', 'info');
    }
}

async function moveMouse(dx, dy) {
    try {
        const response = await fetch('/api/mouse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'move',
                dx: Math.round(dx),
                dy: Math.round(dy)
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            showStatus('Erreur mouvement: ' + (result.error || 'Inconnue'), 'error');
        }
    } catch (error) {
        console.error('Erreur mouvement souris:', error);
        showStatus('Erreur de connexion', 'error');
    }
}

async function mouseClick(type) {
    try {
        let payload;
        let statusMessage;
        
        // Gestion des différents types de clics
        switch(type) {
            case 'left':
                payload = { action: 'click', button: 'left' };
                statusMessage = 'Clic gauche';
                break;
            case 'right':
                payload = { action: 'click', button: 'right' };
                statusMessage = 'Clic droit';
                break;
            case 'middle':
                payload = { action: 'click', button: 'middle' };
                statusMessage = 'Clic molette';
                break;
            case 'double':
                // Maintenir la compatibilité si jamais utilisé ailleurs
                payload = { action: 'doubleclick' };
                statusMessage = 'Double-clic';
                break;
            default:
                payload = { action: 'click', button: type };
                statusMessage = `Clic ${type}`;
        }
        
        const response = await fetch('/api/mouse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            showStatus(`${statusMessage} envoyé`, 'success');
            
            // Effet visuel sur le bouton cliqué
            const button = event.target;
            if (button) {
                button.style.transform = 'translateY(2px)';
                setTimeout(() => {
                    button.style.transform = '';
                }, 150);
            }
        } else {
            showStatus('Erreur clic: ' + (result.error || 'Inconnue'), 'error');
        }
    } catch (error) {
        console.error('Erreur clic souris:', error);
        showStatus('Erreur de connexion', 'error');
    }
}

async function sendText() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();
    
    if (!text) {
        showStatus('Aucun texte à envoyer', 'warning');
        textInput.focus();
        return;
    }
    
    try {
        showStatus('Envoi du texte...', 'info');
        
        const response = await fetch('/api/keyboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'type',
                text: text
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            showStatus(`Texte envoyé: "${text.length > 20 ? text.substring(0, 20) + '...' : text}"`, 'success');
            textInput.value = '';
        } else {
            showStatus('Erreur envoi texte: ' + (result.error || 'Inconnue'), 'error');
        }
    } catch (error) {
        console.error('Erreur envoi texte:', error);
        showStatus('Erreur de connexion', 'error');
    }
}

async function sendKey(key) {
    try {
        // Mapping des touches spéciales si nécessaire
        const keyMap = {
            'escape': 'esc',
            'backspace': 'backspace',
            'enter': 'return',
            'tab': 'tab'
        };
        
        const mappedKey = keyMap[key] || key;
        
        const response = await fetch('/api/keyboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'key',
                key: mappedKey
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            showStatus(`Touche ${key.toUpperCase()} envoyée`, 'success');
            
            // Effet visuel sur le bouton
            const button = event.target;
            if (button) {
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = '';
                }, 100);
            }
        } else {
            showStatus('Erreur touche: ' + (result.error || 'Inconnue'), 'error');
        }
    } catch (error) {
        console.error('Erreur envoi touche:', error);
        showStatus('Erreur de connexion', 'error');
    }
}

function confirmAction(action) {
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    const confirmButton = document.getElementById('confirmButton');
    
    const messages = {
        'shutdown': 'Voulez-vous vraiment arrêter le système ?',
        'reboot': 'Voulez-vous vraiment redémarrer le système ?',
        'sleep': 'Voulez-vous mettre le système en veille ?',
        'logout': 'Voulez-vous vous déconnecter ?'
    };
    
    message.textContent = messages[action] || `Voulez-vous exécuter l'action "${action}" ?`;
    modal.style.display = 'block';
    
    // Focus sur le bouton d'annulation par défaut pour la sécurité
    setTimeout(() => {
        const cancelButton = modal.querySelector('.btn-secondary');
        if (cancelButton) cancelButton.focus();
    }, 100);
    
    confirmButton.onclick = function() {
        executeSystemAction(action);
        closeModal();
    };
}

function closeModal() {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'none';
}

async function executeSystemAction(action) {
    try {
        const actionMessages = {
            'shutdown': 'Arrêt du système en cours...',
            'reboot': 'Redémarrage du système en cours...',
            'sleep': 'Mise en veille...',
            'logout': 'Déconnexion en cours...'
        };
        
        showStatus(actionMessages[action] || `Exécution de ${action}...`, 'warning');
        
        const response = await fetch('/api/system', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            showStatus(actionMessages[action] || `${action} exécuté`, 'success');
        } else {
            showStatus('Erreur système: ' + (result.error || 'Inconnue'), 'error');
        }
    } catch (error) {
        console.error('Erreur action système:', error);
        showStatus('Erreur de connexion', 'error');
    }
}

function showStatus(message, type = 'info') {
    const statusBar = document.getElementById('statusBar');
    if (!statusBar) return;
    
    // Classes CSS pour différents types de statut
    const statusClasses = {
        'info': 'status-info',
        'success': 'status-success',
        'warning': 'status-warning',
        'error': 'status-error'
    };
    
    statusBar.textContent = message;
    statusBar.className = 'status-bar ' + (statusClasses[type] || 'status-info');
    
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Auto-clear après 3 secondes, sauf pour les erreurs (5 secondes)
    const clearTime = type === 'error' ? 5000 : 3000;
    
    setTimeout(() => {
        if (statusBar.textContent === message) {
            statusBar.textContent = 'Prêt';
            statusBar.className = 'status-bar';
        }
    }, clearTime);
}

// Gestion des raccourcis clavier globaux
document.addEventListener('keydown', function(e) {
    // Ctrl + Enter pour envoyer le texte depuis n'importe où
    if (e.ctrlKey && e.key === 'Enter') {
        const textInput = document.getElementById('textInput');
        if (textInput && textInput.value.trim()) {
            sendText();
        }
    }
    
    // Échapper pour fermer les modales
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Fermer la modal en cliquant à l'extérieur
window.onclick = function(event) {
    const modal = document.getElementById('confirmModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Gestion des erreurs de connexion globales
window.addEventListener('online', function() {
    showStatus('Connexion rétablie', 'success');
});

window.addEventListener('offline', function() {
    showStatus('Connexion perdue', 'error');
});

// Fonction utilitaire pour déboguer
function debugMode(enabled = true) {
    if (enabled) {
        console.log('Mode debug activé');
        window.debugControls = {
            moveMouse: moveMouse,
            mouseClick: mouseClick,
            sendText: sendText,
            sendKey: sendKey,
            showStatus: showStatus
        };
    } else {
        console.log('Mode debug désactivé');
        delete window.debugControls;
    }
}