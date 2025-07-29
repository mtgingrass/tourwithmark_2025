# Rant Script Setup Instructions

## Quick Setup

1. **Add this function to your shell configuration file** (`~/.zshrc` or `~/.bashrc`):

```bash
rant() {
  node /Users/markgingrass/Developer/tourwithmark_2025/add-rant.js "$@"
}
```

2. **Reload your shell configuration**:
```bash
source ~/.zshrc
# or
source ~/.bashrc
```

## Usage Examples

### Basic Usage (just add a rant):
```bash
rant "This is my rant about something"
```

### Add and Commit:
```bash
rant -c "This rant will be committed to git"
```

### Add, Commit, and Push to GitHub:
```bash
rant -p "This rant will be pushed to GitHub"
```

### Multi-line Rants:
```bash
rant "First paragraph of my rant.

Second paragraph with more details."
```

### Open Editor for Longer Rants:
```bash
rant -e
```

### Custom Commit Message:
```bash
rant -p -m "Add thoughts on RTO policy" "My detailed thoughts about the return to office mandate..."
```

### Pipe from Another Command:
```bash
echo "Quick thought" | rant -p
```

### Get Help:
```bash
rant -h
```

## How It Works

- The script automatically adds the current date and time to your rant
- It inserts new rants at the top of the appropriate date section
- Creates a new date header if needed
- Preserves all existing content
- Handles git operations safely with status checks

## Troubleshooting

If you get "command not found", make sure:
1. The function is added to your shell config file
2. You've reloaded the shell config (`source ~/.zshrc`)
3. The path in the function matches your actual project location