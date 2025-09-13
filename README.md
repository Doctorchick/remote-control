# Remote Control Server

A Flask-based remote control server that allows you to control your computer remotely through a mobile-friendly web interface.

## 🚨 CRITICAL SECURITY WARNING

**THIS SOFTWARE IS DESIGNED FOR LOCAL NETWORK USE ONLY. NEVER EXPOSE THIS SERVICE TO THE INTERNET.**

This application provides complete control over the host machine including mouse/keyboard control and system shutdown capabilities. Use only on trusted local networks.

## ✨ Features

### Core Functionality
- **Mouse Control**: Relative mouse movement with touch-friendly trackpad interface
- **Click Operations**: Left click and double-click support
- **Keyboard Input**: Text typing and special key commands (Enter, Escape, Tab, Backspace)
- **System Control**: Remote shutdown and restart capabilities
- **Cross-Platform**: Windows, Linux, and macOS support

### Security & Interface
- **Random Password Authentication**: 10-character alphanumeric password generated on each startup
- **Session-Based Authentication**: Secure login with session management
- **Mobile-Responsive Interface**: Optimized for smartphones and tablets
- **Native GUI Window**: Tkinter interface showing local IP and password
- **Security Warnings**: Console and UI warnings about local-only usage

### Technical Details
- **Modular Architecture**: Separated backend (Python/Flask) and frontend (HTML/CSS/JS)
- **Protected Endpoints**: All control endpoints secured with `login_required` decorator
- **Error Handling**: Graceful handling of missing dependencies (pyautogui)
- **Multi-file Structure**: Organized codebase with separation of concerns

## 📋 Requirements

### System Requirements
- **Python**: 3.7 or higher
- **Administrator Rights**: Required for system shutdown/restart operations
- **Local Network**: WiFi or Ethernet connection for remote access

### Python Dependencies
- `Flask==2.3.3` - Web framework
- `pyautogui==0.9.54` - Mouse and keyboard automation

### Platform-Specific Notes
- **Linux**: Requires `sudo` privileges for shutdown/restart commands
- **macOS**: May require accessibility permissions for pyautogui
- **Windows**: No additional permissions required

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/remote-control.git
cd remote-control

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Running the Application

```bash
python app.py
```

The server will display:
- **Generated Password**: Random 10-character password for this session
- **Access URL**: Complete URL (http://LOCAL_IP:5500)
- **Security Warning**: Reminder about local network usage only

### Accessing the Interface

1. **Connect**: Open the displayed URL on any device connected to the same network
2. **Login**: Enter the password shown in the console
3. **Control**: Use the web interface to control your computer

## 🏗️ Project Structure

```
remote-control/
├── app.py                 # Main Flask application
├── auth.py               # Authentication decorator
├── controls.py           # Mouse/keyboard/system controls
├── gui.py                # Native Tkinter interface
├── requirements.txt      # Python dependencies
├── README.md            # This documentation
├── LICENSE              # MIT License
├── SECURITY.md          # Security guidelines
├── .gitignore           # Git ignore rules
├── templates/           # HTML templates
│   ├── base.html        # Base template
│   ├── login.html       # Login page
│   └── dashboard.html   # Main control interface
└── static/              # Static assets
    ├── css/
    │   └── style.css    # Stylesheet
    ├── js/
    │   └── controls.js  # Frontend JavaScript
    └── favicon.ico      # Site icon
```

## 📦 Building Executables

### Why Build on Target OS

Python executables contain platform-specific interpreters and system libraries. Cross-compilation is unreliable because native dependencies (like pyautogui) require correct system libraries. You must build on Windows for Windows, Linux for Linux, etc.

### Windows Build

```bash
# Install PyInstaller
pip install pyinstaller

# Create standalone executable
pyinstaller --onefile --add-data "templates;templates" --add-data "static;static" --noconsole app.py

# Output: dist/app.exe
```

**Windows-specific notes:**
- Uses semicolon (`;`) separator in `--add-data`
- `--noconsole` hides console window (optional)
- Administrator rights may be required for system operations

### Linux Build

```bash
# Install PyInstaller
pip install pyinstaller

# Create standalone executable
pyinstaller --onefile --add-data "templates:templates" --add-data "static:static" app.py

# Output: dist/app
```

**Linux-specific options:**

#### Option 1: systemd Service
```bash
# Create service file
sudo tee /etc/systemd/system/remote-control.service > /dev/null <<EOF
[Unit]
Description=Remote Control Server
After=network.target

[Service]
Type=simple
User=your-username
ExecStart=/path/to/your/executable
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable remote-control.service
sudo systemctl start remote-control.service
```

#### Option 2: Debian Package
```bash
# Create package structure
mkdir -p remote-control-deb/DEBIAN
mkdir -p remote-control-deb/usr/local/bin

# Copy executable
cp dist/app remote-control-deb/usr/local/bin/remote-control

# Create control file
cat > remote-control-deb/DEBIAN/control << EOF
Package: remote-control
Version: 1.0
Architecture: amd64
Maintainer: Your Name <email@example.com>
Description: Remote control server for local network
Depends: sudo
EOF

# Build package
dpkg-deb --build remote-control-deb remote-control_1.0_amd64.deb

# Install package
sudo dpkg -i remote-control_1.0_amd64.deb
```

### macOS Build

```bash
# Install PyInstaller
pip install pyinstaller

# Create standalone executable
pyinstaller --onefile --add-data "templates:templates" --add-data "static:static" --windowed app.py

# Output: dist/app
```

**macOS-specific options:**

#### Option 1: py2app (Alternative)
```bash
# Install py2app
pip install py2app

# Create setup.py
cat > setup.py << 'EOF'
from setuptools import setup

APP = ['app.py']
DATA_FILES = [
    ('templates', ['templates/login.html', 'templates/dashboard.html', 'templates/base.html']),
    ('static/css', ['static/css/style.css']),
    ('static/js', ['static/js/controls.js']),
    ('static', ['static/favicon.ico'])
]
OPTIONS = {'argv_emulation': True}

setup(
    app=APP,
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
)
EOF

# Build application
python setup.py py2app

# Output: dist/app.app
```

#### Code Signing (Important)
```bash
# Sign the application (requires Apple Developer account)
codesign --force --sign "Developer ID Application: Your Name" dist/app.app

# Verify signature
codesign --verify --verbose dist/app.app
```

**Note**: Unsigned applications will trigger macOS Gatekeeper warnings. Users can bypass by right-clicking and selecting "Open" or adjusting security settings.

## ✅ Post-Build Testing Checklist

After creating executables, verify these critical functions:

### 1. Startup Verification
- [ ] Executable displays random password in console
- [ ] Shows correct local IP address and port (5500)
- [ ] Displays security warning message
- [ ] Native GUI window opens with connection details

### 2. Network Access
- [ ] Web interface accessible from mobile device on same network
- [ ] Login page loads correctly
- [ ] Password authentication works
- [ ] Dashboard interface is responsive on mobile

### 3. Control Functions
- [ ] Mouse trackpad responds to touch/mouse movements
- [ ] Left click and double-click commands work
- [ ] Text input and special keys (Enter, Escape, Tab, Backspace) function
- [ ] System shutdown/restart commands execute (test carefully!)

### 4. Platform-Specific Tests
- **Linux**: Verify `sudo shutdown` commands work without password prompt
- **Windows**: Test administrator elevation for system commands
- **macOS**: Confirm accessibility permissions for pyautogui

### 5. Security Verification
- [ ] Session timeout works correctly
- [ ] Logout functionality clears session
- [ ] Direct API access blocked without authentication

## 🔒 Security Considerations

### Network Security
- **Local Network Only**: Never expose port 5500 to the Internet
- **Firewall Rules**: Consider blocking external access at router level
- **Temporary Use**: Stop server when not needed
- **Password Rotation**: New password generated each startup

### System Security
- **Administrator Rights**: Required for shutdown/restart functions
- **Process Monitoring**: Monitor running processes for suspicious activity
- **Access Logging**: Monitor web server logs for unauthorized access attempts

### Risk Assessment
| Risk Level | Description | Mitigation |
|------------|-------------|------------|
| **HIGH** | Complete system control | Local network only |
| **MEDIUM** | Unencrypted communication | Use VPN for additional security |
| **MEDIUM** | Basic authentication | Random password per session |
| **LOW** | Session hijacking | Session timeout and proper logout |

## 🌍 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/yourusername/remote-control.git

# Create feature branch
git checkout -b feature/your-improvement

# Make your changes
# Test thoroughly on your target platform

# Commit with clear message
git commit -am "Add feature: description of changes"

# Push to your fork
git push origin feature/your-improvement

# Create Pull Request on GitHub
```

### Code Standards
- **No Comments in Code Files**: Keep code clean, use meaningful variable names
- **Modular Architecture**: Separate concerns across different files
- **Error Handling**: Graceful handling of missing dependencies and failures
- **Mobile-First**: Ensure all UI changes work well on mobile devices
- **Security-Conscious**: Never compromise security for convenience

### Testing Requirements
- Test on all target platforms (Windows, Linux, macOS)
- Verify mobile responsiveness
- Test with and without pyautogui installed
- Validate security features (authentication, session management)

## 📋 Publishing to GitHub

### Repository Setup
```bash
# Initialize Git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Remote Control Server v1.0"

# Create remote repository (using GitHub CLI)
gh repo create remote-control --public --description "Flask-based remote control server for local networks"

# Or add remote manually
git remote add origin https://github.com/yourusername/remote-control.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Release Management
```bash
# Create version tag
git tag -a v1.0.0 -m "Version 1.0.0 - Initial release"
git push origin v1.0.0

# Create GitHub release with binaries
gh release create v1.0.0 \
  --title "Remote Control Server v1.0.0" \
  --notes "Initial release with Windows, Linux, and macOS support" \
  dist/app.exe \
  dist/app \
  dist/app.app
```

### Repository Structure for Open Source
- **Clear README**: Comprehensive documentation (this file)
- **License**: MIT License for maximum compatibility
- **Security Policy**: Responsible disclosure guidelines
- **Contributing Guidelines**: Clear contribution process
- **Issue Templates**: Structured bug reports and feature requests
- **Automated Testing**: CI/CD pipeline for quality assurance

## 🆘 Support & Troubleshooting

### Common Issues

#### pyautogui ImportError
```
Error: pyautogui not available
Solution: pip install pyautogui
```

#### Permission Denied (Linux/macOS)
```
Error: Shutdown command failed
Solution: Configure sudoers for passwordless shutdown
```

#### Gatekeeper Warning (macOS)
```
Error: "App can't be opened because it is from an unidentified developer"
Solution: Right-click app, select "Open", then "Open" in dialog
```

#### Network Access Issues
```
Error: Can't connect from mobile device
Solution: Check firewall settings, ensure same network
```

### Getting Help
1. **Check Documentation**: Review this README thoroughly
2. **Search Issues**: Look for existing GitHub issues
3. **Create Issue**: Provide detailed information including:
   - Operating system and version
   - Python version
   - Error messages and logs
   - Steps to reproduce

### Security Issues
For security vulnerabilities, please see `SECURITY.md` for responsible disclosure procedures.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Flask**: Web framework powering the backend
- **pyautogui**: Cross-platform mouse and keyboard automation
- **Contributors**: Thanks to all who help improve this project

## 📊 Project Stats

- **Languages**: Python, HTML, CSS, JavaScript
- **Framework**: Flask
- **Architecture**: Modular, separation of concerns
- **Platforms**: Windows, Linux, macOS
- **License**: MIT (Open Source)
- **Security**: Local network only, session-based auth

---

**Remember**: This tool provides complete system control. Use responsibly and only on networks you trust.