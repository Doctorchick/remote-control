import platform
import os
import pyautogui

def control_mouse(action, **kwargs):
    if action == 'move':
        dx = kwargs.get('dx', 0)
        dy = kwargs.get('dy', 0)
        pyautogui.moveRel(dx, dy)
    elif action == 'click':
        button = kwargs.get('button', 'left')
        pyautogui.click(button=button)
    elif action == 'doubleclick':
        pyautogui.doubleClick()
    return {'success': True}

def control_keyboard(action, **kwargs):
    if action == 'type':
        text = kwargs.get('text', '')
        pyautogui.write(text)
    elif action == 'key':
        key = kwargs.get('key', '')
        pyautogui.press(key)
    return {'success': True}

def shutdown_system():
    system = platform.system()
    try:
        if system == 'Windows':
            os.system("shutdown /s /t 1")
        elif system == 'Linux' or system == 'Darwin':
            os.system("sudo shutdown -h now")
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def reboot_system():
    system = platform.system()
    try:
        if system == 'Windows':
            os.system("shutdown /r /t 1")
        elif system == 'Linux' or system == 'Darwin':
            os.system("sudo shutdown -r now")
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}
