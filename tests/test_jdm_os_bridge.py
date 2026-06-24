import os
import sys

# Ensure the paths are in sys.path
sys.path.insert(0, "D:/Projects/ada-jdm/ada")
sys.path.insert(0, "D:/Projects/ada-jdm/ada/legacy")

from ADA.WIDGETS import jdm_os

def test_vault_root_detection():
    assert jdm_os.JDM_OS_DIR is not None
    assert os.path.isdir(jdm_os.JDM_OS_DIR)
    assert os.path.exists(os.path.join(jdm_os.JDM_OS_DIR, "SOURCE_OF_TRUTH.md"))

def test_safe_read_existing():
    res = jdm_os.read_note("SOURCE_OF_TRUTH.md")
    assert res["ok"] is True
    assert "JDM-OS Source of Truth" in res["data"]
    assert res["operation"] == "read_note"

def test_safe_read_missing():
    res = jdm_os.read_note("00_System/Scratch/non_existent_note_xyz_123.md")
    assert res["ok"] is False
    assert "not found" in res["error"]

def test_safe_write_and_append():
    test_note = "00_System/Scratch/Test_Ada_Bridge.md"
    
    # 1. Safe Overwrite (requires explicit overwrite mode)
    write_res = jdm_os.write_note(test_note, "# Temp Test Note\nOriginal text.", mode="overwrite")
    assert write_res["ok"] is True
    
    read_res = jdm_os.read_note(test_note)
    assert read_res["ok"] is True
    assert "Original text." in read_res["data"]
    
    # 2. Safe Append (default mode is append)
    append_res = jdm_os.write_note(test_note, "Appended text.")
    assert append_res["ok"] is True
    
    read_res2 = jdm_os.read_note(test_note)
    assert "Original text." in read_res2["data"]
    assert "Appended text." in read_res2["data"]
    
    # Clean up test note
    safe_path = jdm_os.get_safe_path(test_note)
    if os.path.exists(safe_path):
        os.remove(safe_path)

def test_list_notes():
    res = jdm_os.list_notes("01_Command_Center")
    assert res["ok"] is True
    assert "Today.md" in res["data"]["files"]
    assert "agents" in res["data"]["directories"]

def test_search_notes():
    res = jdm_os.search_notes("SOURCE_OF_TRUTH")
    assert res["ok"] is True
    assert len(res["data"]) > 0

def test_git_status():
    res = jdm_os.git_status()
    assert res["ok"] is True
    assert res["data"] is not None

def test_path_safety_direct_traversal():
    try:
        jdm_os.get_safe_path("../../../outside_vault.md")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Access Denied" in str(e) or "resolves outside" in str(e)

def test_path_safety_nested_traversal():
    try:
        jdm_os.get_safe_path("01_Command_Center/../../outside_vault.md")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Access Denied" in str(e) or "resolves outside" in str(e)

def test_path_safety_absolute_outside():
    try:
        jdm_os.get_safe_path("D:/Projects/ada-jdm/some_outside_file.md")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Access Denied" in str(e) or "resolves outside" in str(e)

def test_path_safety_secret_patterns():
    # Secrets block (.env)
    try:
        jdm_os.get_safe_path("01_Command_Center/.env")
        assert False, "Should have blocked .env"
    except ValueError as e:
        assert "secret pattern" in str(e) or "blocked" in str(e)
    # Keys block (*.pem)
    try:
        jdm_os.get_safe_path("01_Command_Center/mykey.pem")
        assert False, "Should have blocked mykey.pem"
    except ValueError as e:
        assert "secret pattern" in str(e) or "blocked" in str(e)
    # Hidden files block
    try:
        jdm_os.get_safe_path("01_Command_Center/.hidden_note.md")
        assert False, "Should have blocked hidden file"
    except ValueError as e:
        assert "Hidden" in str(e) or "blocked" in str(e)

def test_bridge_audit_log():
    test_note = "00_System/Scratch/Test_Audit_Logging.md"
    # Write to trigger logging
    write_res = jdm_os.write_note(test_note, "Testing audit logs", mode="overwrite")
    assert write_res["ok"] is True
    
    # Read the bridge log file
    log_res = jdm_os.read_note("00_System/Logs/Ada_Bridge_Log.md")
    assert log_res["ok"] is True
    assert "write_note" in log_res["data"]
    assert "Test_Audit_Logging" in log_res["data"]
    
    # Clean up test note
    safe_path = jdm_os.get_safe_path(test_note)
    if os.path.exists(safe_path):
        os.remove(safe_path)

def test_daily_brief():
    res = jdm_os.daily_brief()
    assert res["ok"] is True
    assert "# Daily Brief" in res["data"] or "Daily Brief Template" in res["data"]
    assert "Status of Repo" in res["data"]

def test_add_task():
    test_tasks_file = "00_System/Scratch/Test_Tasks.md"
    
    # Initialize file
    jdm_os.write_note(test_tasks_file, "# Test Tasks\n", mode="overwrite")
    
    # Add task
    add_res = jdm_os.add_task("Verify task creation", target_file=test_tasks_file)
    assert add_res["ok"] is True
    assert "Verify task creation" in add_res["data"]
    
    # Read and confirm
    read_res = jdm_os.read_note(test_tasks_file)
    assert "- [ ] Verify task creation" in read_res["data"]
    
    # Clean up
    safe_path = jdm_os.get_safe_path(test_tasks_file)
    if os.path.exists(safe_path):
        os.remove(safe_path)

def test_log_decision():
    res = jdm_os.log_decision("Test Decision Detail", context="Test Context Detail")
    assert res["ok"] is True
    
    # Check that it appended to Decisions.md (which exists) or Decision_Log.md
    read_res = jdm_os.read_note(res["path"])
    assert "Test Decision Detail" in read_res["data"]
    assert "Test Context Detail" in read_res["data"]

if __name__ == "__main__":
    tests = [
        test_vault_root_detection,
        test_safe_read_existing,
        test_safe_read_missing,
        test_safe_write_and_append,
        test_list_notes,
        test_search_notes,
        test_git_status,
        test_path_safety_direct_traversal,
        test_path_safety_nested_traversal,
        test_path_safety_absolute_outside,
        test_path_safety_secret_patterns,
        test_bridge_audit_log,
        test_daily_brief,
        test_add_task,
        test_log_decision
    ]
    
    print("--- Running bridge validation tests ---")
    failed = 0
    for test in tests:
        try:
            test()
            print(f"[PASS] {test.__name__}")
        except AssertionError as e:
            print(f"[FAIL] {test.__name__}: Assertion failed")
            failed += 1
        except Exception as e:
            print(f"[FAIL] {test.__name__}: {str(e)}")
            failed += 1
            
    print(f"\nResult: {len(tests) - failed}/{len(tests)} passed.")
    if failed > 0:
        sys.exit(1)
