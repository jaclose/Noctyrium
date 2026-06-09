# Medical School Hub User Manual

## Purpose

This system turns the Medical School folder into a semi-autonomous academic command center.

It sorts loose files from Downloads, tags important material, opens the Medical School hub, and generates a review report.

## Main Commands

### Open Medical School folder

```zsh
med
cat > "$HOME/Medical School/09 Admin/Scripts/Run Medical School Hub.command" <<'EOF'
#!/bin/zsh
"$HOME/Medical School/09 Admin/Scripts/run_medical_hub.sh"
