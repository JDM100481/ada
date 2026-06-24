import os
import subprocess

# --- Path Discovery and Safety ---
POSSIBLE_PATHS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../jdm-os")),  # relative to WIDGETS
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../jdm-os")),     # relative to ADA
    os.path.abspath(os.path.join(os.getcwd(), "jdm-os")),                         # relative to workspace root
    os.path.abspath(os.path.join(os.getcwd(), "../jdm-os")),                      # relative to ada folder
    "d:/Projects/ada-jdm/jdm-os",                                                 # Windows workspace path
    "/home/jdm/JDM-OS"                                                            # default Linux path
]

JDM_OS_DIR = None
for path in POSSIBLE_PATHS:
    if os.path.isdir(path) and os.path.exists(os.path.join(path, "SOURCE_OF_TRUTH.md")):
        JDM_OS_DIR = path
        break

if not JDM_OS_DIR:
    # Default fallback
    JDM_OS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../jdm-os"))

def get_safe_path(note_path: str) -> str:
    """Resolves and validates that the note path is inside the JDM-OS directory."""
    # Ensure note gets .md extension if it is a simple note name without extensions
    if not note_path.endswith('.md') and not '.' in os.path.basename(note_path):
        note_path += '.md'
    
    # Resolve absolute path
    resolved_path = os.path.abspath(os.path.join(JDM_OS_DIR, note_path))
    vault_path = os.path.abspath(JDM_OS_DIR)
    
    # Check if resolved path is within the JDM-OS vault directory
    if not resolved_path.startswith(vault_path):
        raise ValueError("Access Denied: Path traversal detected. Access is restricted to the JDM-OS vault.")
        
    return resolved_path

# --- Core Operations ---

def read_note(note_path: str) -> str:
    """Reads the content of a markdown note inside JDM-OS."""
    try:
        safe_path = get_safe_path(note_path)
        if not os.path.exists(safe_path):
            return f"Error: Note '{note_path}' not found."
            
        with open(safe_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Error reading note: {str(e)}"

def write_note(note_path: str, content: str, mode: str = "overwrite") -> str:
    """Writes or appends content to a note in JDM-OS."""
    try:
        safe_path = get_safe_path(note_path)
        
        # Create directories if they do not exist
        os.makedirs(os.path.dirname(safe_path), exist_ok=True)
        
        open_mode = 'a' if mode.lower() == 'append' else 'w'
        
        # Format appending content with a leading newline if needed
        if open_mode == 'a' and os.path.exists(safe_path) and os.path.getsize(safe_path) > 0:
            with open(safe_path, 'r', encoding='utf-8') as f:
                last_char = f.read()[-1:]
            if last_char != '\n':
                content = '\n' + content
                
        with open(safe_path, open_mode, encoding='utf-8') as f:
            f.write(content)
            
        return f"Successfully wrote to '{note_path}' (mode: {mode})."
    except Exception as e:
        return f"Error writing to note: {str(e)}"

def list_notes(directory: str = "") -> str:
    """Lists files and subdirectories in a directory inside JDM-OS."""
    try:
        # Standardize empty directory or dots to prevent directory traversal in list
        if not directory or directory in [".", "./"]:
            directory = ""
            
        # Resolve path
        safe_path = os.path.abspath(os.path.join(JDM_OS_DIR, directory))
        vault_path = os.path.abspath(JDM_OS_DIR)
        
        if not safe_path.startswith(vault_path):
            return "Error: Access Denied. Access is restricted to the JDM-OS vault."
            
        if not os.path.exists(safe_path):
            return f"Error: Directory '{directory}' not found."
            
        if not os.path.isdir(safe_path):
            return f"Error: '{directory}' is not a directory."
            
        entries = []
        for entry in os.listdir(safe_path):
            # Skip hidden files/folders (e.g. .git, .obsidian)
            if entry.startswith('.'):
                continue
            full_entry_path = os.path.join(safe_path, entry)
            if os.path.isdir(full_entry_path):
                entries.append(f"[Dir]  {entry}/")
            else:
                entries.append(f"[File] {entry}")
                
        if not entries:
            return f"Directory '{directory}' is empty."
            
        return "\n".join(sorted(entries))
    except Exception as e:
        return f"Error listing directory: {str(e)}"

def search_notes(query: str) -> str:
    """Searches all markdown notes in JDM-OS recursively for a text query."""
    if not query:
        return "Error: Search query cannot be empty."
        
    query_lower = query.lower()
    matches = []
    
    try:
        for root, dirs, files in os.walk(JDM_OS_DIR):
            # Skip hidden directories like .git, .obsidian
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                if file.startswith('.'):
                    continue
                if not file.endswith('.md'):
                    continue
                    
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, JDM_OS_DIR).replace('\\', '/')
                
                # Check for query in filename
                if query_lower in file.lower():
                    matches.append(f"Filename match: [[{rel_path}]]")
                    continue
                    
                # Check for query in file contents
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        for line_num, line in enumerate(f, 1):
                            if query_lower in line.lower():
                                clean_line = line.strip()
                                # Truncate very long matching lines
                                if len(clean_line) > 100:
                                    clean_line = clean_line[:100] + "..."
                                matches.append(f"[[{rel_path}]]:L{line_num}: {clean_line}")
                                # Cap to prevent output bloat
                                if len(matches) >= 50:
                                    break
                except Exception:
                    pass
                    
                if len(matches) >= 50:
                    break
            if len(matches) >= 50:
                break
                
        if not matches:
            return f"No matches found for '{query}'."
            
        return f"Found {len(matches)} match(es):\n" + "\n".join(matches)
    except Exception as e:
        return f"Error searching notes: {str(e)}"

def git_status() -> str:
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
            return "Repository is clean (no changes)."
        return output
    except Exception as e:
        return f"Error running git status: {str(e)}"
