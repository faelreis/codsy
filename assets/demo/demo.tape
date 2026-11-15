# VHS tape for the Codsy README demo GIF.
# Render with: vhs assets/demo/demo.tape
# Requires vhs (https://github.com/charmbracelet/vhs) and codsy installed globally.

Output assets/demo/demo.gif

Set Shell "bash"
Set FontSize 16
Set Width 1200
Set Height 650
Set Padding 20
Set TypingSpeed 60ms

Type "codsy init demo-sales --template sales"
Enter
Wait
Sleep 1500ms

Type "cd demo-sales"
Enter
Wait
Sleep 500ms

Type "codsy check"
Enter
Wait
Sleep 2500ms

Type "codsy explain CODSY030"
Enter
Wait
Sleep 2500ms
