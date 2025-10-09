# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is an Obsidian plugin that rotates appointment files from a "Next" folder into a dated archive folder. The plugin renames files with the current date and creates a new template file in the source folder.

## Architecture

Single-file plugin (`main.js`) containing:
- **FilePickerModal**: FuzzySuggestModal that displays all files in the configured "Next" folder
- **RotateNextFilePlugin**: Main plugin class that registers the "Rotate File" command
- **RotateNextFileSettingTab**: Settings UI for configuring source and destination folders

### File Rotation Logic

The plugin expects files named with the pattern: `Next {Appointment Type}.md` (e.g., `Next 1-1.md`, `Next Dentist Appointment.md`)

When the rotate command runs:
1. Opens a file picker modal showing all files in the configured "Next" folder
2. User selects a file from the list
3. Extracts the appointment type from the filename (everything after "Next ")
4. Renames file to: `{Destination Folder}/{YYYY-MM-DD} {Appointment Type}.md`
5. Creates a new empty template file with the original "Next" filename in the Next folder
6. Opens the newly created template file

## URI Support

The plugin supports Obsidian URI protocol for automation:

**Open file picker modal:**
```
obsidian://rotate-next-file
```

**Automatically rotate a specific file:**
```
obsidian://rotate-next-file?file=Next%201-1
obsidian://rotate-next-file?file=Next%20Dentist%20Appointment
```

The `file` parameter accepts:
- Basename without extension: `Next 1-1`
- Basename with extension: `Next 1-1.md`
- Full path from vault root: `Next/Next 1-1.md`

## Development

This plugin has no build step - it's vanilla JavaScript that Obsidian loads directly.

**Testing**: Install the plugin in an Obsidian vault by copying files to `.obsidian/plugins/rotate-next-file/`, then enable it in Obsidian settings. The plugin is already in such a location based on the current working directory.
