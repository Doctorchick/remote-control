import tkinter as tk
from tkinter import ttk, messagebox, Menu
import qrcode
from PIL import Image, ImageTk
import subprocess
import sys
import os
import winreg
import ctypes
from typing import Optional

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def run_as_admin():
    if is_admin():
        messagebox.showinfo("Info", "Déjà en mode administrateur")
        return
    
    try:
        if getattr(sys, 'frozen', False):
            executable = sys.executable
        else:
            executable = f'"{sys.executable}" "{os.path.abspath(__file__)}"'
        
        ctypes.windll.shell32.ShellExecuteW(
            None, "runas", sys.executable, 
            f'"{os.path.abspath(__file__)}"', None, 1
        )
        sys.exit(0)
    except Exception as e:
        messagebox.showerror("Erreur", f"Impossible de redémarrer en admin: {e}")

def add_to_startup():
    try:
        key_path = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
        app_name = "RemoteControl"
        
        if getattr(sys, 'frozen', False):
            app_path = sys.executable
        else:
            app_path = f'"{sys.executable}" "{os.path.abspath(__file__)}"'
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, app_name, 0, winreg.REG_SZ, app_path)
        winreg.CloseKey(key)
        
        messagebox.showinfo("Succès", "Application ajoutée au démarrage automatique")
    except Exception as e:
        messagebox.showerror("Erreur", f"Impossible d'ajouter au démarrage: {e}")

def remove_from_startup():
    try:
        key_path = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
        app_name = "RemoteControl"
        
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
        try:
            winreg.DeleteValue(key, app_name)
            messagebox.showinfo("Succès", "Application retirée du démarrage automatique")
        except FileNotFoundError:
            messagebox.showinfo("Info", "L'application n'était pas dans le démarrage automatique")
        winreg.CloseKey(key)
    except Exception as e:
        messagebox.showerror("Erreur", f"Impossible de retirer du démarrage: {e}")

def is_in_startup():
    try:
        key_path = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
        app_name = "RemoteControl"
        
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_READ)
        try:
            winreg.QueryValueEx(key, app_name)
            winreg.CloseKey(key)
            return True
        except FileNotFoundError:
            winreg.CloseKey(key)
            return False
    except:
        return False

class RemoteControlGUI:
    def __init__(self, local_ip, port, password):
        self.local_ip = local_ip
        self.port = port
        self.password = password
        self.url = f"http://{local_ip}:{port}"
        self.root = tk.Tk()
        self.root.title("Remote Control")
        self.root.wm_attributes("-topmost", True)
        self.root.overrideredirect(True)
        window_width = 350
        window_height = 450
        self.root.geometry(f"{window_width}x{window_height}")
        self.center_window(window_width, window_height)
        self.root.configure(bg='#1a1a1a')
        self.create_interface()
        self.qr_photo: Optional[ImageTk.PhotoImage] = None
        self.root.after(100, self.generate_qr_code)
        self.setup_window_drag()
        self.maintain_on_top()
    
    def maintain_on_top(self):
        self.root.lift()
        self.root.focus_force()
        
        self.root.after(1000, self.maintain_on_top)
    
    def center_window(self, width, height):
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        x = (screen_width // 2) - (width // 2)
        y = (screen_height // 2) - (height // 2)
        self.root.geometry(f"{width}x{height}+{x}+{y}")
    
    def setup_window_drag(self):
        def start_move(event):
            self.root.x = event.x
            self.root.y = event.y

        def stop_move(event):
            self.root.x = None
            self.root.y = None

        def do_move(event):
            deltax = event.x - self.root.x
            deltay = event.y - self.root.y
            x = self.root.winfo_x() + deltax
            y = self.root.winfo_y() + deltay
            self.root.geometry(f"+{x}+{y}")

        self.title_bar.bind("<ButtonPress-1>", start_move)
        self.title_bar.bind("<ButtonRelease-1>", stop_move)
        self.title_bar.bind("<B1-Motion>", do_move)
    
    def create_interface(self):
        self.title_bar = tk.Frame(self.root, bg='#2d2d2d', height=30)
        self.title_bar.pack(fill=tk.X)
        self.title_bar.pack_propagate(False)
        title_label = tk.Label(self.title_bar, 
                              text="🎮 Remote Control", 
                              bg='#2d2d2d', 
                              fg='white',
                              font=("Arial", 10, "bold"))
        title_label.pack(side=tk.LEFT, padx=10, pady=5)
        self.topmost_btn = tk.Button(self.title_bar, 
                                    text="📌", 
                                    bg='#2d2d2d', 
                                    fg='#00ff88',
                                    bd=0,
                                    font=("Arial", 12),
                                    command=self.toggle_topmost)
        self.topmost_btn.pack(side=tk.RIGHT, padx=2, pady=5)
        options_btn = tk.Button(self.title_bar, 
                               text="⚙️", 
                               bg='#2d2d2d', 
                               fg='white',
                               bd=0,
                               font=("Arial", 12),
                               command=self.show_options_menu)
        options_btn.pack(side=tk.RIGHT, padx=2, pady=5)
        close_btn = tk.Button(self.title_bar, 
                             text="✕", 
                             bg='#2d2d2d', 
                             fg='#ff6b6b',
                             bd=0,
                             font=("Arial", 12, "bold"),
                             command=self.on_closing)
        close_btn.pack(side=tk.RIGHT, padx=5, pady=5)
        main_frame = tk.Frame(self.root, bg='#1a1a1a', padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        info_label = tk.Label(main_frame, 
                             text=f"URL: {self.url}\nMot de passe: {self.password}",
                             bg='#1a1a1a',
                             fg='#00ff88',
                             font=("Courier", 11, "bold"),
                             justify="center")
        info_label.pack(pady=(0, 20))
        self.qr_label = tk.Label(main_frame, 
                                text="Génération du QR code...", 
                                bg='#1a1a1a',
                                fg='#888888',
                                font=("Arial", 12))
        self.qr_label.pack(expand=True, pady=20)
        instructions = tk.Label(main_frame,
                               text="Scannez le QR code avec votre téléphone",
                               bg='#1a1a1a',
                               fg='#888888',
                               font=("Arial", 10),
                               justify="center")
        instructions.pack(pady=(10, 0))
        self.status_label = tk.Label(main_frame, 
                                    text="🟢 Serveur actif - Toujours au premier plan",
                                    bg='#1a1a1a',
                                    fg='#00ff88',
                                    font=("Arial", 10))
        self.status_label.pack(pady=(10, 0))
        self.is_topmost = True
    
    def toggle_topmost(self):
        self.is_topmost = not self.is_topmost
        self.root.wm_attributes("-topmost", self.is_topmost)
        
        if self.is_topmost:
            self.topmost_btn.config(fg='#00ff88')
            self.status_label.config(text="🟢 Serveur actif - Toujours au premier plan")
        else:
            self.topmost_btn.config(fg='#888888')
            self.status_label.config(text="🟢 Serveur actif - Mode normal")
    
    def show_options_menu(self):
        menu = tk.Menu(self.root, tearoff=0, bg='#2d2d2d', fg='white')
        
        menu.add_command(label="Redémarrer en Admin", command=run_as_admin)
        menu.add_separator()
        
        if is_in_startup():
            menu.add_command(label="Retirer du démarrage auto", command=remove_from_startup)
        else:
            menu.add_command(label="Ajouter au démarrage auto", command=add_to_startup)
        try:
            menu.tk_popup(self.root.winfo_pointerx(), self.root.winfo_pointery())
        finally:
            menu.grab_release()
    
    def generate_qr_code(self):
        try:
            qr_data = f"{self.url}/{self.password}"
            qr = qrcode.QRCode(version=1, box_size=10, border=2)
            qr.add_data(qr_data)
            qr.make(fit=True)
            qr_image = qr.make_image(fill_color="white", back_color="black")
            qr_image = qr_image.resize((280, 280), Image.Resampling.NEAREST)
            self.qr_photo = ImageTk.PhotoImage(qr_image)
            self.qr_label.config(image=self.qr_photo, text="", bg='#1a1a1a')
            
        except Exception as e:
            self.qr_label.config(text=f"Erreur QR code: {e}", image="", fg='#ff6b6b')
    
    def on_closing(self):
        if messagebox.askokcancel("Quitter", "Voulez-vous vraiment fermer le serveur ?"):
            self.root.quit()
            os._exit(0)

def start_gui(local_ip, port, password):
    try:
        gui = RemoteControlGUI(local_ip, port, password)
        return gui.root
    except Exception as e:
        print(f"Erreur lors du démarrage du GUI: {e}")
        return None

if __name__ == "__main__":
    gui = RemoteControlGUI("192.168.1.100", 8080, "TESTPASS123")
    gui.root.mainloop()