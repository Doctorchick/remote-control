from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, make_response
import threading, secrets, string, socket, queue, time, atexit
from functools import wraps
from controls import shutdown_system, reboot_system
import pyautogui
import os

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

PASSWORD = None
action_queue = queue.Queue()
mouse_queue = queue.Queue(maxsize=10)
client_connected = False
gui_root = None
gui_should_close = False 

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0

def generate_password():
    return ''.join(secrets.choice(string.ascii_uppercase) for _ in range(10))

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def close_gui_safely():
    """Ferme la GUI de manière thread-safe"""
    global gui_root, gui_should_close
    if gui_root:
        gui_should_close = True
        try:
            gui_root.quit()
        except:
            pass

def mouse_worker():
    """Worker dédié pour les mouvements de souris avec limitation de fréquence"""
    last_move_time = 0
    min_interval = 0.01
    
    while True:
        try:
            action = mouse_queue.get(timeout=0.05)
            current_time = time.time()
            

            if current_time - last_move_time < min_interval:
                continue
                
            if action['action'] == 'move':
                x = action.get('x')
                y = action.get('y')
                if x is not None and y is not None:
                    pyautogui.moveTo(x, y, duration=0)
                else:
                    dx = action.get('dx', 0)
                    dy = action.get('dy', 0)
                    if dx != 0 or dy != 0:
                        pyautogui.moveRel(dx, dy, duration=0)
                        
            elif action['action'] == 'click':
                pyautogui.click(duration=0)
            elif action['action'] == 'doubleclick':
                pyautogui.doubleClick()
                
            last_move_time = current_time
            mouse_queue.task_done()
            
        except queue.Empty:
            continue
        except Exception as e:
            print(f"Erreur mouse_worker: {e}")

def general_worker():
    """Worker pour les autres actions (clavier, système)"""
    while True:
        try:
            action = action_queue.get()
            if action['type'] == 'keyboard':
                if action['action'] == 'type':
                    pyautogui.write(action.get('text', ''))
                elif action['action'] == 'key':
                    pyautogui.press(action.get('key', ''))
            action_queue.task_done()
        except Exception as e:
            print(f"Erreur general_worker: {e}")

threading.Thread(target=mouse_worker, daemon=True).start()
threading.Thread(target=general_worker, daemon=True).start()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('authenticated'):
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET','POST'])
def login():
    global client_connected, gui_root
    if request.method == 'POST':
        password = request.form.get('password', '')
        if PASSWORD is not None and password.upper() == PASSWORD.upper():
            if client_connected:
                flash('Un utilisateur est déjà connecté. Veuillez réessayer plus tard.')
                return render_template('login.html')
            session['authenticated'] = True
            client_connected = True
            close_gui_safely()
            return redirect(url_for('dashboard'))
        else:
            flash('Mot de passe incorrect')
    return render_template('login.html')

@app.route('/logout')
def logout():
    global client_connected
    session.clear()
    client_connected = False
    return redirect(url_for('login'))

@app.route('/auto/<token>')
def autologin(token):
    global client_connected, gui_root
    if token.upper() == PASSWORD.upper():
        if client_connected:
            flash('Un utilisateur est déjà connecté. Veuillez réessayer plus tard.')
            return redirect(url_for('login'))
        session['authenticated'] = True
        client_connected = True
        close_gui_safely()
        return redirect(url_for('dashboard'))
    else:
        flash('Token d\'authentification invalide')
    return redirect(url_for('login'))

@app.route('/<token>')
def autologin_generic(token):
    global client_connected, gui_root
    
    if len(token) == 10 and token.isupper() and token.isalpha():
        if PASSWORD is not None and token.upper() == PASSWORD.upper():
            if client_connected:
                flash('Un utilisateur est déjà connecté. Veuillez réessayer plus tard.')
                return redirect(url_for('login'))
            session['authenticated'] = True
            client_connected = True
            close_gui_safely()
            return redirect(url_for('dashboard'))
    
    return "Page non trouvée", 404

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/mouse', methods=['POST'])
@login_required
def api_mouse():
    data = request.get_json(silent=True) or {}
    data['type'] = 'mouse'
    
    if data.get('action') == 'move':
        try:
            while mouse_queue.full():
                try:
                    mouse_queue.get_nowait()
                    mouse_queue.task_done()
                except queue.Empty:
                    break
            mouse_queue.put_nowait(data)
        except queue.Full:
            pass 
    else:
        try:
            mouse_queue.put_nowait(data)
        except queue.Full:
            mouse_queue.put(data)
    
    return {'success': True}

@app.route('/api/keyboard', methods=['POST'])
@login_required
def api_keyboard():
    data = request.get_json(silent=True) or {}
    data['type'] = 'keyboard'
    action_queue.put(data)
    return {'success': True}

@app.route('/api/system', methods=['POST'])
@login_required
def api_system():
    data = request.get_json(silent=True) or {}
    action = data.get('action')
    if action == 'shutdown':
        return shutdown_system()
    elif action == 'reboot':
        return reboot_system()
    return {'success': False, 'error': 'Action inconnue'}

@app.route('/static/<path:filename>')
def static_files(filename):
    response = make_response(send_from_directory('static', filename))
    response.headers['Cache-Control'] = 'public, max-age=31536000'
    return response

def run_gui():
    global gui_root, gui_should_close
    try:
        from gui import start_gui
        gui_root = start_gui(local_ip, port, PASSWORD)
        if gui_root:
            while not gui_should_close:
                try:
                    gui_root.update()
                    time.sleep(0.01)
                except:
                    break
            
            if gui_root:
                try:
                    gui_root.destroy()
                except:
                    pass
                gui_root = None
        print("Interface GUI fermée")
    except Exception as e:
        print(f"Erreur GUI: {e}")
        gui_root = None

def cleanup():
    global gui_should_close, gui_root
    gui_should_close = True
    if gui_root:
        try:
            gui_root.quit()
        except:
            pass

atexit.register(cleanup)

if __name__ == '__main__':
    PASSWORD = generate_password()
    local_ip = get_local_ip()
    port = 8080

    print("="*50)
    print("SERVEUR DE CONTRÔLE DISTANT DÉMARRÉ")
    print("="*50)
    print(f"Mot de passe: {PASSWORD}")
    print(f"URL: http://{local_ip}:{port}")
    print("⚠️  N'EXPOSEZ PAS ce service sur Internet ⚠️")
    print("="*50)

    gui_thread = threading.Thread(target=run_gui)
    gui_thread.daemon = True
    gui_thread.start()

    try:
        app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
    except KeyboardInterrupt:
        print("\nArrêt du serveur...")
    finally:
        cleanup()