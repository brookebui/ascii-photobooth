# ascii-photobooth
# ascii-photobooth

## Setup & Running
Modern browsers restrict camera access when opening HTML files directly from the file system (`file://`). To use the camera, you must run a local server.

### Quick Start (Mac/Linux)
1. Open Terminal in this folder.
2. Run the start script:
   ```bash
   sh run.sh
   ```
3. Open your browser to `http://localhost:8000`.

### Manual (Python)
If you prefer, run manually:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.
