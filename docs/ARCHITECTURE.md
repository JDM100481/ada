# ADA Architecture

## Role
Base voice assistant platform for JDM systems.

## Purpose
Serve as the core runtime layer for voice-based assistant workflows across office and home Ubuntu environments.

## Operating model
- origin: JDM100481/ada
- upstream: nlouis38/ada
- home Ubuntu and office Ubuntu both sync through GitHub

## Structure
- app/: entry points
- core/: shared orchestration logic
- voice/: STT/TTS/audio stack
- runtimes/: runtime variants
- tests/: test scripts
- legacy/: preserved upstream files
- docs/: technical notes
- config/: environment templates
- scripts/: install/bootstrap helpers

## Immediate priorities
1. Preserve working upstream behavior
2. Add clean local runtime wrapper
3. Standardize config for home and office
4. Prepare MyGENE-specific extensions
