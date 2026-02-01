# Features
 - Simple Authentication [ Login/Register (no email), with cookies & jwt for session management ]
 - Notes features
   - immediate saving no need to click buttons or the like
   - has favorite feature and color change for the card.
   - Markdown support for the editor (the note taking area)
   - Has a docker at the bottom with shortcut buttons
     - appears at the bottom when editor is not in focus and disappears when in focus
     - appears when the mouse/cursor is placed at the bottom-center of the editor/screen
     - *Went with this behavior because I wanted to remove distractions once user is note-taking*
 - Sidebar, shows navigation & profile features but still lacks implementation for most buttons. Notes does work though and shows lists of notes
 - Notebook, made by grouping a bunch of notes. Always appears on top. Also has favorite and color change (only on the side) feat.

---

# To implement
 - Notifications (maybe)
 - Settings Page
    - Light/Dark mode
    - Themes
        - Uploading picture as background (maybe)
        - Customizable section area things 
    - Account Management
        - Change name
        - Change pass
        - Add/Change email (maybe)
 - Forgot Password feature
 - Tasks
    - To-do list
        - 2 or 3 Layer nesting of tasks (subtasks)
        - Parent of nested tasks/subtask can compress or not via dropdown
    - Timer feature
        - for study sessions, pomodoro like
            - Focus session (timer)
            - Short Break (timer)
            - Long Break (timer)
            - Timer duration is adjustable
 - Mods
    - TBD

 - Advanced
    - Social features:
        - Adding friends. List of Friends
        - Real-time editing similar to Docs with other people

---

# NEED FIX
 - Link, needs changing, should be a small popup window thing like a floating one similar to selecting a text
 - Code block, there should be a way to exit out of it (if the code block is the last line in the editor, currently if the last line of the note is the code block the only way to exit out of the code block (to start another line) is to remove the code block then add another line then on the previous line add the code block and then to exit the said code block just move the cursor to the line below (WHICH IS EXTRA HASSLE))

# FIXED FOR NOW
 - Checklist not working well; renders properly once first pressed but after leaving the note and then visiting back, it is displayed like this " [ ] " or " [x] " instead of the checkbox look in markdown. In other words, render issue
 - The editor doesn't respect the gap. Line 1 then add 2 blank lines then on line 4 add a word or letter, leave the note and come back and then you can see the 2 blank lines (lines 2 and 3) are gone, simply put it kinda removes whitespaces lines.
