let mouseStartX = 0;
let mouseStartY = 0;
let isMouseDown = false;

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
    mousePad.addEventListener('mousedown', handleMouseStart);
    mousePad.addEventListener('mousemove', handleMouseMove);
    mousePad.addEventListener('mouseup', handleMouseEnd);
    mousePad.addEventListener('mouseleave', handleMouseEnd);
    
    mousePad.addEventListener('touchstart', handleTouchStart, { passive: false });
    mousePad.addEventListener('touchmove', handleTouchMove, { passive: false });
    mousePad.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function handleMouseStart(e) {
    e.preventDefault();
    isMouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
}

function handleMouseMove(e) {
    if (!isMouseDown) return;
    e.preventDefault();
    
    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        moveMouse(dx * 2, dy * 2);
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
    }
}

function handleMouseEnd(e) {
    isMouseDown = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    isMouseDown = true;
    const touch = e.touches[0];
    mouseStartX = touch.clientX;
    mouseStartY = touch.clientY;
}

function handleTouchMove(e) {
    if (!isMouseDown) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const dx = touch.clientX - mouseStartX;
    const dy = touch.clientY - mouseStartY;
    
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        moveMouse(dx * 3, dy * 3);
        mouseStartX = touch.clientX;
        mouseStartY = touch.clientY;
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    isMouseDown = false;
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
        
        const result = await response.json();
        if (!result.success) {
            showStatus('Erreur: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('Erreur de connexion', 'error');
    }
}

async function mouseClick(type) {
    try {
        const payload = type === 'double' 
            ? { action: 'doubleclick' }
            : { action: 'click', button: type };
            
        const response = await fetch('/api/mouse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        if (result.success) {
            showStatus(`Clic ${type} envoyé`, 'success');
        } else {
            showStatus('Erreur: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('Erreur de connexion', 'error');
    }
}

async function sendText() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value;
    
    if (!text.trim()) {
        showStatus('Aucun texte à envoyer', 'warning');
        return;
    }
    
    try {
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
        
        const result = await response.json();
        if (result.success) {
            showStatus('Texte envoyé', 'success');
            textInput.value = '';
        } else {
            showStatus('Erreur: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('Erreur de connexion', 'error');
    }
}

async function sendKey(key) {
    try {
        const response = await fetch('/api/keyboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'key',
                key: key
            })
        });
        
        const result = await response.json();
        if (result.success) {
            showStatus(`Touche ${key} envoyée`, 'success');
        } else {
            showStatus('Erreur: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('Erreur de connexion', 'error');
    }
}

function confirmAction(action) {
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    const confirmButton = document.getElementById('confirmButton');
    
    const messages = {
        'shutdown': 'Voulez-vous vraiment arrêter le système ?',
        'reboot': 'Voulez-vous vraiment redémarrer le système ?'
    };
    
    message.textContent = messages[action];
    modal.style.display = 'block';
    
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
        const response = await fetch('/api/system', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action
            })
        });
        
        const result = await response.json();
        if (result.success) {
            showStatus(`${action === 'shutdown' ? 'Arrêt' : 'Redémarrage'} du système en cours...`, 'success');
        } else {
            showStatus('Erreur: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('Erreur de connexion', 'error');
    }
}

function showStatus(message, type) {
    const statusBar = document.getElementById('statusBar');
    if (statusBar) {
        statusBar.textContent = message;
        statusBar.className = 'status-bar status-' + type;
        
        setTimeout(() => {
            statusBar.textContent = '';
            statusBar.className = 'status-bar';
        }, 3000);
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('confirmModal');
    if (event.target === modal) {
        closeModal();
    }
};