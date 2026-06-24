import os
import subprocess
import fnmatch
from datetime import datetime
from typing import Dict, Any, List, Optional

# --- Path Discovery and Safety ---
POSSIBLE_PATHS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../jdm-os")),  # relative to WIDGETS under legacy/ADA/
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../jdm-os")),     # relative to WIDGETS under ADA/
    os.path.abspath(os.path.join(os.getcwd(), "jdm-os")),                           # relative to workspace root
    os.path.abspath(os.path.join(os.getcwd(), "../jdm-os")),                        # relative to ada folder
    "D:/Projects/ada-jdm/jdm-os",                                                   # Windows workspace path
    "/home/jdm/JDM-OS"                                                              # default Linux path
]

JDM_OS_DIR = None
for path in POSSIBLE_PATHS:
    if os.path.isdir(path) and os.path.exists(os.path.join(path, "SOURCE_OF_TRUTH.md")):
        JDM_OS_DIR = os.path.realpath(path)
        break

if not JDM_OS_DIR:
    # Default fallback
    JDM_OS_DIR = os.path.realpath("D:/Projects/ada-jdm/jdm-os")

BLOCKED_PATTERNS = [
    ".env",
    ".env.*",
    "*.pem",
    "*.key",
    "id_rsa",
    "id_ed25519",
    "secrets.*",
    "credentials.*",
    "token.*",
    "*.p12",
    "*.pfx"
]

ALLOWED_EXTENSIONS = [
    ".md",
    ".txt",
    ".json",
    ".csv"
]

def is_secret_file(filename: str) -> bool:
    name_lower = filename.lower()
    for pattern in BLOCKED_PATTERNS:
        if fnmatch.fnmatch(name_lower, pattern):
            return True
    return False

def get_safe_path(note_path: str) -> str:
    """
    Resolves and validates that the note path is inside the JDM-OS directory.
    Supports symlink resolution, blocks traversal, blocks absolute outside paths,
    and checks for secret files and permitted extensions.
    """
    # 1. Basic format checks
    filename = os.path.basename(note_path)
    if not filename:
        raise ValueError("Invalid path: filename is empty.")
        
    if is_secret_file(filename):
        raise ValueError(f"Access Denied: File '{filename}' matches a blocked secret pattern.")

    if filename.startswith('.'):
        raise ValueError("Access Denied: Hidden configuration and secret files are blocked.")

    # Auto-add .md extension if none is provided
    name, ext = os.path.splitext(filename)
    if not ext:
        note_path += ".md"
        ext = ".md"
    elif ext.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Access Denied: Extension '{ext}' is not permitted. Only {', '.join(ALLOWED_EXTENSIONS)} are allowed.")

    # 2. Strict location bound checks using realpath (resolves symlinks)
    vault_root = os.path.realpath(JDM_OS_DIR)
    target_abs = os.path.realpath(os.path.join(vault_root, note_path))
    
    # Check if target resolves inside the vault root
    common_prefix = os.path.commonpath([vault_root, target_abs])
    if common_prefix != vault_root:
        raise ValueError("Access Denied: Path resolves outside the JDM-OS vault.")

    return target_abs

def get_safe_dir_path(dir_path: str) -> str:
    """Resolves and validates directory paths strictly inside JDM-OS vault."""
    vault_root = os.path.realpath(JDM_OS_DIR)
    target_abs = os.path.realpath(os.path.join(vault_root, dir_path))
    
    common_prefix = os.path.commonpath([vault_root, target_abs])
    if common_prefix != vault_root:
        raise ValueError("Access Denied: Directory path resolves outside the JDM-OS vault.")
        
    # Block listing hidden folders
    rel_path = os.path.relpath(target_abs, vault_root)
    if rel_path not in [".", ""]:
        for part in rel_path.split(os.sep):
            if part.startswith('.'):
                raise ValueError("Access Denied: Access to hidden directories is blocked.")
            
    return target_abs

# --- State flag to prevent recursive log loop ---
_logging_active = False

# --- Core Operations ---

def bridge_log(action: str, target: str = "", summary: str = "") -> dict:
    """Appends an entry to the Ada Bridge Log in 00_System/Logs/Ada_Bridge_Log.md."""
    global _logging_active
    if _logging_active:
        return {"ok": True, "operation": "bridge_log", "path": "", "data": None, "message": "Recursive log call bypassed."}

    _logging_active = True
    try:
        log_file = "00_System/Logs/Ada_Bridge_Log.md"
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Check if the log file exists, if not initialize it with headers/frontmatter
        safe_log_path = get_safe_path(log_file)
        if not os.path.exists(safe_log_path):
            os.makedirs(os.path.dirname(safe_log_path), exist_ok=True)
            initial_content = (
                "---\n"
                "type: log\n"
                "status: active\n"
                "owner: JDM\n"
                "parent: \"[[JDM-OS]]\"\n"
                "---\n\n"
                "# Ada Bridge Log\n\n"
                "Audit log of all write operations performed by the Ada assistant.\n\n"
                "---\n"
            )
            with open(safe_log_path, 'w', encoding='utf-8') as f:
                f.write(initial_content)
        
        log_entry = f"\n## {timestamp} — {action}\n\n"
        log_entry += f"- Target: `{target}`\n"
        log_entry += f"- Mode: `append`\n"
        log_entry += f"- Summary: {summary}\n"
        
        # Perform write directly
        with open(safe_log_path, 'a', encoding='utf-8') as f:
            f.write(log_entry)
            
        rel_path = os.path.relpath(safe_log_path, JDM_OS_DIR).replace('\\', '/')
        return {
            "ok": True,
            "operation": "bridge_log",
            "path": rel_path,
            "data": None,
            "message": "Successfully appended to bridge audit log."
        }
    except Exception as e:
        return {
            "ok": False,
            "operation": "bridge_log",
            "path": "00_System/Logs/Ada_Bridge_Log.md",
            "error": f"Failed to write to bridge log: {str(e)}"
        }
    finally:
        _logging_active = False

def read_note(note_path: str) -> dict:
    """Reads the content of a markdown note inside JDM-OS."""
    try:
        safe_path = get_safe_path(note_path)
        rel_path = os.path.relpath(safe_path, JDM_OS_DIR).replace('\\', '/')
        
        if not os.path.exists(safe_path):
            return {
                "ok": False,
                "operation": "read_note",
                "path": rel_path,
                "error": f"Note '{note_path}' not found."
            }
            
        with open(safe_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        return {
            "ok": True,
            "operation": "read_note",
            "path": rel_path,
            "data": content,
            "message": "Successfully read note."
        }
    except Exception as e:
        return {
            "ok": False,
            "operation": "read_note",
            "path": note_path,
            "error": str(e)
        }

def write_note(note_path: str, content: str, mode: str = "append") -> dict:
    """Writes or appends content to a note in JDM-OS."""
    try:
        safe_path = get_safe_path(note_path)
        rel_path = os.path.relpath(safe_path, JDM_OS_DIR).replace('\\', '/')
        
        # Create folders if missing (only allowed inside vault)
        os.makedirs(os.path.dirname(safe_path), exist_ok=True)
        
        open_mode = 'a' if mode.lower() == 'append' else 'w'
        
        # Handle newlines for appending
        if open_mode == 'a' and os.path.exists(safe_path) and os.path.getsize(safe_path) > 0:
            with open(safe_path, 'r', encoding='utf-8') as f:
                last_char = f.read()[-1:]
            if last_char != '\n':
                content = '\n' + content
                
        with open(safe_path, open_mode, encoding='utf-8') as f:
            f.write(content)
            
        # Log this write operation (unless we are writing the log itself)
        if rel_path != "00_System/Logs/Ada_Bridge_Log.md":
            bridge_log(action="write_note", target=rel_path, summary=f"Mode {mode} write of {len(content)} characters")
            
        return {
            "ok": True,
            "operation": "write_note",
            "path": rel_path,
            "data": None,
            "message": f"Successfully wrote to '{rel_path}' (mode: {mode})."
        }
    except Exception as e:
        return {
            "ok": False,
            "operation": "write_note",
            "path": note_path,
            "error": str(e)
        }

def list_notes(directory: str = ".") -> dict:
    """Lists files and subdirectories in a directory inside JDM-OS."""
    try:
        # Prevent absolute or empty escapes
        if not directory or directory in [".", "./"]:
            directory = ""
            
        safe_path = get_safe_dir_path(directory)
        rel_path = os.path.relpath(safe_path, JDM_OS_DIR).replace('\\', '/')
        if rel_path == ".":
            rel_path = ""
            
        if not os.path.exists(safe_path):
            return {
                "ok": False,
                "operation": "list_notes",
                "path": rel_path,
                "error": f"Directory '{directory}' not found."
            }
            
        if not os.path.isdir(safe_path):
            return {
                "ok": False,
                "operation": "list_notes",
                "path": rel_path,
                "error": f"'{directory}' is not a directory."
            }
            
        files = []
        directories = []
        for entry in os.listdir(safe_path):
            if entry.startswith('.'):
                continue
            full_entry_path = os.path.join(safe_path, entry)
            if os.path.isdir(full_entry_path):
                directories.append(entry)
            else:
                files.append(entry)
                
        return {
            "ok": True,
            "operation": "list_notes",
            "path": rel_path,
            "data": {
                "files": sorted(files),
                "directories": sorted(directories)
            },
            "message": f"Listed {len(files)} file(s) and {len(directories)} directory/directories."
        }
    except Exception as e:
        return {
            "ok": False,
            "operation": "list_notes",
            "path": directory,
            "error": str(e)
        }

def search_notes(query: str, directory: str = ".", max_results: int = 20) -> dict:
    """Searches all markdown notes in JDM-OS recursively for a text query."""
    if not query:
        return {
            "ok": False,
            "operation": "search_notes",
            "path": directory,
            "error": "Search query cannot be empty."
        }
        
    try:
        if not directory or directory in [".", "./"]:
            directory = ""
            
        safe_path = get_safe_dir_path(directory)
        rel_dir_path = os.path.relpath(safe_path, JDM_OS_DIR).replace('\\', '/')
        if rel_dir_path == ".":
            rel_dir_path = ""
            
        query_lower = query.lower()
        matches = []
        
        for root, dirs, files in os.walk(safe_path):
            # Skip hidden folders
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                if file.startswith('.'):
                    continue
                if not file.endswith('.md'):
                    continue
                    
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, JDM_OS_DIR).replace('\\', '/')
                
                # Check match in filename
                if query_lower in file.lower():
                    matches.append({
                        "file": rel_path,
                        "type": "filename",
                        "text": file
                    })
                    if len(matches) >= max_results:
                        break
                    continue
                
                # Check match in contents
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        for line_num, line in enumerate(f, 1):
                            if query_lower in line.lower():
                                clean_line = line.strip()
                                if len(clean_line) > 120:
                                    clean_line = clean_line[:120] + "..."
                                matches.append({
                                    "file": rel_path,
                                    "type": "content",
                                    "line": line_num,
                                    "text": clean_line
                                })
                                if len(matches) >= max_results:
                                    break
                except Exception:
                    pass
                    
                if len(matches) >= max_results:
                    break
            if len(matches) >= max_results:
                break
                
        return {
            "ok": True,
            "operation": "search_notes",
            "path": rel_dir_path,
            "data": matches,
            "message": f"Found {len(matches)} match(es)."
        }
    except Exception as e:
        return {
            "ok": False,
            "operation": "search_notes",
            "path": directory,
            "error": str(e)
        }

def git_status() -> dict:
    """Checks the current git status of the JDM-OS repository."""
    try:
        result = subprocess.run(
            ["git", "status", "--short"],
            cwd=JDM_OS_DIR,
            capture_output=True,
            text=True,
            check=True
        )
        output = result.stdout.strip()
        if not output:
            output = "Repository is clean (no changes)."
            
        return {
            "ok": True,
            "operation": "git_status",
            "path": ".",
            "data": output,
            "message": "Git status retrieved successfully."
        }
    except Exception as e:
        return {
            "ok": False,
            "operation": "git_status",
            "path": ".",
            "error": str(e)
        }

def daily_brief() -> dict:
    """Generates a daily brief from JDM-OS by reading operating files."""
    try:
        date_str = datetime.now().strftime("%Y-%m-%d")
        
        # Git status
        git_res = git_status()
        git_st = git_res["data"] if git_res.get("ok") else "Unknown"
        
        # Today's priorities
        today_content = ""
        today_res = read_note("01_Command_Center/Today.md")
        if today_res.get("ok"):
            today_content = today_res["data"]
            
        # Tasks list
        tasks_content = ""
        tasks_res = read_note("01_Command_Center/Tasks.md")
        if tasks_res.get("ok"):
            tasks_content = tasks_res["data"]
            
        # Open loops
        loops_content = ""
        loops_res = read_note("01_Command_Center/Open_Loops.md")
        if loops_res.get("ok"):
            loops_content = loops_res["data"]
            
        # Unchecked checklist items parsing helper
        def extract_unchecked(content):
            if not content:
                return "No items."
            items = []
            for line in content.split('\n'):
                if '- [ ]' in line:
                    items.append(line.strip())
            return "\n".join(items) if items else "No unchecked items."
            
        today_priorities = extract_unchecked(today_content)
        open_loops = extract_unchecked(loops_content)
        tasks_list = extract_unchecked(tasks_content)
        
        combined_loops_tasks = f"### Tasks:\n{tasks_list}\n\n### Open Loops:\n{open_loops}"
        
        # Try reading template file
        template_path = "01_Command_Center/Daily_Brief_Template.md"
        template_res = read_note(template_path)
        
        if template_res.get("ok"):
            template = template_res["data"]
            brief_text = template.replace("{{date}}", date_str) \
                                 .replace("{{git_status}}", git_st) \
                                 .replace("{{today_priorities}}", today_priorities) \
                                 .replace("{{open_loops_and_tasks}}", combined_loops_tasks)
        else:
            brief_text = (
                f"# Daily Brief - {date_str}\n\n"
                f"## Status of Repo\n{git_st}\n\n"
                f"## Today's Priorities\n{today_priorities}\n\n"
                f"## Open Loops and Tasks\n{combined_loops_tasks}\n"
            )
            
        return {
            "ok": True,
            "operation": "daily_brief",
            "path": "01_Command_Center",
            "data": brief_text,
            "message": f"Daily brief generated successfully for {date_str}."
        }
    except Exception as e:
        return {
            "ok": False,
            "operation": "daily_brief",
            "path": "01_Command_Center",
            "error": str(e)
        }

def add_task(task: str, target_file: Optional[str] = None) -> dict:
    """Adds a new task as a markdown checklist item in JDM-OS."""
    if not task:
        return {
            "ok": False,
            "operation": "add_task",
            "path": target_file or "",
            "error": "Task description cannot be empty."
        }
        
    if not target_file:
        target_file = "01_Command_Center/Tasks.md"
        
    try:
        date_str = datetime.now().strftime("%Y-%m-%d")
        task_entry = f"- [ ] {task} (Created: {date_str})"
        
        # Write to target note
        res = write_note(target_file, task_entry, mode="append")
        if res["ok"]:
            return {
                "ok": True,
                "operation": "add_task",
                "path": res["path"],
                "data": task_entry,
                "message": f"Successfully added task to '{res['path']}'."
            }
        return res
    except Exception as e:
        return {
            "ok": False,
            "operation": "add_task",
            "path": target_file,
            "error": str(e)
        }

def log_decision(decision: str, context: str = "") -> dict:
    """Logs a decision to the canonical decisions file."""
    if not decision:
        return {
            "ok": False,
            "operation": "log_decision",
            "path": "",
            "error": "Decision cannot be empty."
        }
        
    target_file = "01_Command_Center/Decisions.md"
    try:
        # Check if Decisions.md exists, if not fall back to Decision_Log.md
        safe_path = get_safe_path(target_file)
        if not os.path.exists(safe_path):
            target_file = "01_Command_Center/Decision_Log.md"
            
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        decision_entry = f"### {timestamp} — Decision\n\n"
        decision_entry += f"- **Decision**: {decision}\n"
        if context:
            decision_entry += f"- **Context**: {context}\n"
        decision_entry += "\n"
        
        res = write_note(target_file, decision_entry, mode="append")
        if res["ok"]:
            return {
                "ok": True,
                "operation": "log_decision",
                "path": res["path"],
                "data": decision_entry,
                "message": f"Successfully logged decision to '{res['path']}'."
            }
        return res
    except Exception as e:
        return {
            "ok": False,
            "operation": "log_decision",
            "path": target_file,
            "error": str(e)
        }
