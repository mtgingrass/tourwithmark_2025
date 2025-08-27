#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const RANTS_FILE = path.join(__dirname, 'rants.qmd');
const PROJECT_DIR = __dirname;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    commit: false,
    push: false,
    editor: false,
    guiEditor: false,
    message: null,
    rantText: null,
    aiFormat: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-c':
      case '--commit':
        options.commit = true;
        break;
      case '-p':
      case '--push':
        options.push = true;
        options.commit = true; // Push implies commit
        break;
      case '-e':
      case '--editor':
        options.editor = true;
        break;
      case '--gui':
        options.guiEditor = true;
        options.editor = true; // GUI implies editor mode
        break;
      case '-m':
      case '--message':
        if (i + 1 < args.length) {
          options.message = args[++i];
        }
        break;
      case '-f':
      case '--format':
        options.aiFormat = true;
        break;
      case '-h':
      case '--help':
        showHelp();
        process.exit(0);
      default:
        if (!args[i].startsWith('-')) {
          // Join all non-flag arguments as the rant text
          options.rantText = args.slice(i).join(' ');
          i = args.length; // Exit loop
        }
    }
  }

  return options;
}

// Show help message
function showHelp() {
  console.log(`
${colors.cyan}Rant Script - Easily add rants to your blog${colors.reset}

${colors.yellow}Usage:${colors.reset}
  rant [options] "Your rant text here"

${colors.yellow}Options:${colors.reset}
  -c, --commit     Add and commit the changes
  -p, --push       Add, commit, and push to GitHub
  -e, --editor     Open editor for composing rant
  --gui            Open GUI editor (VS Code, TextEdit, etc.)
  -f, --format     Format text with AI (fix grammar, add structure)
  -m, --message    Custom commit message (use with -c or -p)
  -h, --help       Show this help message

${colors.yellow}Examples:${colors.reset}
  rant "This is my rant"
  rant -c "This rant will be committed"
  rant -p "This rant will be pushed to GitHub"
  rant -f -p "unformatted text gets cleaned up then pushed"
  rant -p -m "Add thoughts on topic X" "My detailed thoughts..."
  rant -e
  rant --gui -p
  echo "My rant" | rant -f -p
`);
}

// Get current date and time formatted
function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[now.getMonth()];
  
  return {
    date: `${year}-${month}-${day}`,
    displayDate: `${monthName} ${day}, ${year}`,
    time: `${displayHours}:${minutes} ${period}`,
    timestamp: now.toISOString()
  };
}

// Read rant text from stdin if piped
async function readFromStdin() {
  if (process.stdin.isTTY) {
    return null;
  }
  
  let data = '';
  process.stdin.setEncoding('utf8');
  
  return new Promise((resolve) => {
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

// Open editor for composing rant
function openEditor(useGui = false) {
  const tempFile = path.join(require('os').tmpdir(), `rant-${Date.now()}.md`);
  fs.writeFileSync(tempFile, '# Type your rant below this line\n\n');
  
  let editor;
  if (useGui) {
    // Try to find a GUI editor
    const guiEditors = [
      'code --wait',           // VS Code
      'subl --wait',          // Sublime Text
      'atom --wait',          // Atom
      'open -W -a TextEdit',  // Mac TextEdit
      'gedit',                // Linux Gedit
      'notepad'               // Windows Notepad
    ];
    
    editor = guiEditors.find(ed => {
      try {
        execSync(`which ${ed.split(' ')[0]}`, { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    });
    
    if (!editor) {
      console.log(`${colors.yellow}No GUI editor found. Install VS Code, Sublime Text, or set EDITOR environment variable.${colors.reset}`);
      console.log(`${colors.yellow}Falling back to terminal editor...${colors.reset}`);
      editor = process.env.EDITOR || 'nano';
    }
  } else {
    editor = process.env.EDITOR || 'nano';
  }
  
  try {
    console.log(`${colors.blue}Opening editor: ${editor}${colors.reset}`);
    execSync(`${editor} "${tempFile}"`, { stdio: 'inherit' });
    const content = fs.readFileSync(tempFile, 'utf8');
    fs.unlinkSync(tempFile);
    
    // Remove the instruction line and clean up
    return content.split('\n').slice(2).join('\n').trim();
  } catch (error) {
    console.error(`${colors.red}Error opening editor: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Format text using AI (via Claude CLI)
async function formatWithAI(text) {
  console.log(`${colors.blue}Formatting with AI...${colors.reset}`);
  
  const prompt = `Please format and improve the following text for a blog rant/post. 
Make it more readable by:
- Adding proper paragraph breaks where needed
- Converting lists into bullet points or numbered lists where appropriate
- Fixing any obvious grammar or spelling errors
- Improving sentence structure for clarity
- Adding emphasis (bold/italic) where it would help
- Ensuring proper capitalization and punctuation

Keep the original tone and meaning intact. Do not add conclusions, summaries, or additional content. 
Only format and structure what's already there.

Here's the text to format:

${text}

Please output ONLY the formatted text, nothing else.`;

  try {
    // Create a temporary file with the prompt
    const tempPromptFile = path.join(require('os').tmpdir(), `rant-prompt-${Date.now()}.txt`);
    fs.writeFileSync(tempPromptFile, prompt);
    
    // Call Claude CLI - using stdin to avoid shell escaping issues
    const result = execSync(`cat "${tempPromptFile}" | claude`, { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    // Clean up temp file
    fs.unlinkSync(tempPromptFile);
    
    // Return the formatted text
    const formattedText = result.trim();
    console.log(`${colors.green}✓ AI formatting complete${colors.reset}`);
    return formattedText;
  } catch (error) {
    console.error(`${colors.yellow}Warning: AI formatting failed, using original text${colors.reset}`);
    console.error(`${colors.yellow}Error: ${error.message}${colors.reset}`);
    return text; // Return original text if AI formatting fails
  }
}

// Convert URLs to clickable links
function autoLinkUrls(text) {
  // More comprehensive regex for URLs
  const urlRegex = /(https?:\/\/(?:[-\w.])+(?::\d+)?(?:\/(?:[\w._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*(?:\?(?:[\w._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?(?:#(?:[\w._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?|www\.(?:[-\w.])+(?::\d+)?(?:\/(?:[\w._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*(?:\?(?:[\w._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?(?:#(?:[\w._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d+)?(?:\/(?:[\w._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*(?:\?(?:[\w._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?(?:#(?:[\w._~!$&'()*+,;=:@/?]|%[0-9A-Fa-f]{2})*)?)/g;
  
  return text.replace(urlRegex, (match) => {
    // Clean up any trailing punctuation that shouldn't be part of the URL
    const cleanMatch = match.replace(/[.,;:!?]+$/, '');
    const trailingPunctuation = match.substring(cleanMatch.length);
    
    let url = cleanMatch;
    
    // Add https:// if it's missing and it's not already a full URL
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('ftp://')) {
      url = 'https://' + url;
    }
    
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${cleanMatch}</a>${trailingPunctuation}`;
  });
}

// Insert rant into the file
function insertRant(rantText) {
  const { date, displayDate, time } = getCurrentDateTime();
  
  // Read current content
  let content = fs.readFileSync(RANTS_FILE, 'utf8');
  
  // Find the rants-timeline div
  const timelineMatch = content.match(/<div class="rants-timeline">/);
  if (!timelineMatch) {
    console.error(`${colors.red}Error: Could not find rants-timeline div${colors.reset}`);
    process.exit(1);
  }
  
  const timelineStart = timelineMatch.index + timelineMatch[0].length;
  
  // Look for existing date section
  const datePattern = new RegExp(`<div class="rant-day" data-date="${date}">`, 'g');
  const existingDateMatch = content.match(datePattern);
  
  let insertPosition;
  let newRantHTML;
  
  if (existingDateMatch) {
    // Date exists, find where to insert within this date section
    const dateHeaderPattern = new RegExp(`<div class="rant-day" data-date="${date}">\\s*<div class="date-header">\\s*<span class="date">[^<]+</span>\\s*</div>`);
    const dateHeaderMatch = content.match(dateHeaderPattern);
    
    if (dateHeaderMatch) {
      insertPosition = dateHeaderMatch.index + dateHeaderMatch[0].length;
      // Just add the new rant entry
      newRantHTML = `

<div class="rant-entry">
<div class="time-stamp">${time}</div>
<div class="rant-content">
${autoLinkUrls(rantText).replace(/\n/g, '\n')}
</div>
</div>`;
    }
  } else {
    // New date, create entire date section
    // Find first date section after timeline start
    const firstDateMatch = content.substring(timelineStart).match(/<div class="rant-day" data-date="/);
    
    if (firstDateMatch) {
      insertPosition = timelineStart + firstDateMatch.index;
    } else {
      // No dates exist, insert after timeline opening
      insertPosition = timelineStart;
    }
    
    newRantHTML = `

<!-- ${date} -->
<div class="rant-day" data-date="${date}">
<div class="date-header">
<span class="date">${displayDate}</span>
</div>

<div class="rant-entry">
<div class="time-stamp">${time}</div>
<div class="rant-content">
${autoLinkUrls(rantText).replace(/\n/g, '\n')}
</div>
</div>

</div>`;
  }
  
  // Insert the new content
  content = content.slice(0, insertPosition) + newRantHTML + content.slice(insertPosition);
  
  // Write back to file
  fs.writeFileSync(RANTS_FILE, content);
  
  return { date: displayDate, time, preview: rantText.substring(0, 50) + (rantText.length > 50 ? '...' : '') };
}

// Execute git commands
function gitOperations(commit, push, message) {
  try {
    // Change to project directory
    process.chdir(PROJECT_DIR);
    
    // Check git status
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!status.includes('rants.qmd')) {
      console.log(`${colors.yellow}No changes to rants.qmd detected${colors.reset}`);
      return;
    }
    
    // Add the file
    execSync('git add rants.qmd');
    console.log(`${colors.green}✓ Added rants.qmd to git${colors.reset}`);
    
    if (commit) {
      // Commit
      const commitMessage = message || `Add rant: ${new Date().toLocaleString()}`;
      execSync(`git commit -m "${commitMessage}"`);
      console.log(`${colors.green}✓ Committed changes${colors.reset}`);
      
      if (push) {
        // Push
        console.log(`${colors.blue}Pushing to GitHub...${colors.reset}`);
        execSync('git push origin main');
        console.log(`${colors.green}✓ Pushed to GitHub${colors.reset}`);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Git operation failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Main function
async function main() {
  const options = parseArgs();
  
  // Get rant text from various sources
  let rantText = options.rantText;
  
  if (!rantText && !options.editor) {
    rantText = await readFromStdin();
  }
  
  if (!rantText && options.editor) {
    rantText = openEditor(options.guiEditor);
  }
  
  if (!rantText || rantText.trim() === '') {
    console.error(`${colors.red}Error: No rant text provided${colors.reset}`);
    console.log(`${colors.yellow}Use -h for help${colors.reset}`);
    process.exit(1);
  }
  
  // Apply AI formatting if requested
  if (options.aiFormat) {
    rantText = await formatWithAI(rantText.trim());
  }
  
  // Pull latest changes first if we're going to push
  if (options.push) {
    try {
      process.chdir(PROJECT_DIR);
      console.log(`${colors.blue}Pulling latest changes...${colors.reset}`);
      execSync('git pull --no-rebase origin main', { encoding: 'utf8' });
      console.log(`${colors.green}✓ Updated to latest version${colors.reset}`);
    } catch (pullError) {
      console.error(`${colors.yellow}Warning: Could not pull latest changes${colors.reset}`);
      console.error(`${colors.yellow}You may need to manually sync before pushing${colors.reset}`);
      process.exit(1);
    }
  }
  
  // Insert the rant
  console.log(`${colors.blue}Adding rant...${colors.reset}`);
  const result = insertRant(rantText.trim());
  console.log(`${colors.green}✓ Rant added successfully!${colors.reset}`);
  console.log(`${colors.cyan}Date: ${result.date}, Time: ${result.time}${colors.reset}`);
  
  // Handle git operations if requested
  if (options.commit || options.push) {
    gitOperations(options.commit, options.push, options.message);
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});