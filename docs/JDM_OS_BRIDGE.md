# JDM-OS Bridge v1.1 Operational Layer

This documentation outlines the design, safety features, operations, and usage instructions for the Ada ↔ JDM-OS Bridge.

---

## Purpose

The JDM-OS Bridge allows the Ada assistant to serve as an interactive voice, text, and command-line interface layer for Jeffrey Del Mundo's personal operating system vault (JDM-OS). JDM-OS remains the canonical source of truth, while Ada provides a secure, streamlined access layer.

---

## Architecture

The bridge is designed around three main architectural blocks:

1. **JDM-OS Bridge Widget (`legacy/ADA/WIDGETS/jdm_os.py`)**: Executes all filesystem and git repository interactions locally in a production-safe manner. Returns structured dictionaries for all operations.
2. **Gemini Live API Connectors (`legacy/ADA/ADA_Online.py` and `legacy/ADA/ADA_Online_NoElevenlabs.py`)**: Exposes schemas, registers functions, and handles real-time WebSockets communication with Google Gemini 2.0 Flash Live API models.
3. **Local Assistant Entry Point (`legacy/ADA/ADA_Local.py`)**: Documents and executes bridge methods inside the local Ollama-based chat loop.

```
+---------------+      Voice / Text      +-----------------+
|     User      | <--------------------> |  Ada Assistant  |
+---------------+                        +--------+--------+
                                                  |
                                                  | Tool Calls
                                                  v
+---------------+                        +--------+--------+
|    JDM-OS     | <--------------------> |  jdm_os Widget  |
|  (Obsidian)   |   Filesystem / Git     +-----------------+
+---------------+
```

---

## Core Functions

Every function in the bridge returns a predictable structured response:

- **Success Shape**:
  ```python
  {
      "ok": True,
      "operation": "...",
      "path": "...",
      "data": ...,
      "message": "..."
  }
  ```
- **Error Shape**:
  ```python
  {
      "ok": False,
      "operation": "...",
      "path": "...",
      "error": "..."
  }
  ```

### Available API Methods

- `read_note(note_path: str) -> dict`: Reads note contents safely.
- `write_note(note_path: str, content: str, mode: str = "append") -> dict`: Appends (default) or overwrites (requires explicit `mode="overwrite"`) content.
- `list_notes(directory: str = ".") -> dict`: Lists directories and files.
- `search_notes(query: str, directory: str = ".", max_results: int = 20) -> dict`: Recursively searches markdown filenames or file contents.
- `git_status() -> dict`: Checks current uncommitted vault changes.
- `daily_brief() -> dict`: Pulls and parses data from `Today.md`, `Tasks.md`, and `Open_Loops.md` to compile a daily briefing using a markdown template.
- `add_task(task: str, target_file: Optional[str] = None) -> dict`: Appends a markdown checkbox task.
- `log_decision(decision: str, context: str = "") -> dict`: Logs a timestamped decision to `Decisions.md` (or fallbacks).
- `bridge_log(action: str, target: str = "", summary: str = "") -> dict`: Appends operation metadata to the audit log.

---

## Safety & Security Rules

The bridge enforces strict safety constraints:

1. **Path Safety**: Resolves absolute paths and symlinks using `os.path.realpath`. Any file operation resolving outside the JDM-OS vault root folder will raise a `ValueError` (Access Denied).
2. **Blocked Secrets**: Direct or wildcard matches for sensitive files are strictly blocked (e.g. `.env`, `.env.*`, `*.pem`, `*.key`, `id_rsa`, `id_ed25519`, `secrets.*`, `credentials.*`, `token.*`, `*.p12`, `*.pfx`).
3. **No Hidden Files**: File or folder names starting with a dot (e.g. `.obsidian/`) are blocked.
4. **Allowed Extensions**: File writes and reads are restricted to `.md`, `.txt`, `.json`, and `.csv`. Simple filenames without extensions default to `.md`.
5. **No Infinite Recursion**: Bridge audit logging is protected by a thread/state flag to prevent logging from invoking itself.

---

## Command Presets

Ada is configured to handle the following user instructions:

| User Voice/Text Command | Triggered Bridge Method | Target File / Description |
| :--- | :--- | :--- |
| *Ada, brief me.* | `jdm_os_daily_brief` | Summarizes loops, tasks, priorities, and git status. |
| *Ada, what are my priorities today?* | `jdm_os_read_note` | Reads `01_Command_Center/Today.md` |
| *Ada, show open loops.* | `jdm_os_read_note` | Reads `01_Command_Center/Open_Loops.md` |
| *Ada, add this task: [task]* | `jdm_os_add_task` | Appends `- [ ] [task]` to `01_Command_Center/Tasks.md` |
| *Ada, log this decision: [decision]* | `jdm_os_log_decision` | Appends log block to `01_Command_Center/Decisions.md` |
| *Ada, search JDM-OS for [query]* | `jdm_os_search_notes` | Recursively searches vault for matching text. |
| *Ada, show repo status.* | `jdm_os_git_status` | Checks repository git status. |

---

## Testing Instructions

You can run automated tests using the pytest suite in the `ada` repository:

```powershell
cd D:\Projects\ada-jdm\ada
pytest tests/test_jdm_os_bridge.py -v
```

This verifies folder detection, safe read/write, list/search, traversal blocks, secret file blocks, daily briefing layout generation, and task/decision logging.

---

## Troubleshooting

- **ModuleNotFoundError: No module named 'websockets'**: Ensure you are running python inside your active python environment where dependencies are installed.
- **Access Denied: Path resolves outside the JDM-OS vault**: Check if you are passing relative paths that escape the vault using `../`. If you use absolute paths, ensure they start inside the JDM-OS directory path.

---

## Known Limitations

- **Obsidian Canvas Support**: The bridge does not parse or manipulate `.canvas` files. They are treated as read-only.
- **Binary Files**: Safe path checks restrict writes to plain-text extensions (.md, .txt, .json, .csv) only. Arbitrary binary files cannot be copied or created.
