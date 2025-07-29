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
    message: null,
    rantText: null
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
      case '-m':
      case '--message':
        if (i + 1 < args.length) {
          options.message = args[++i];
        }
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
  -m, --message    Custom commit message (use with -c or -p)
  -h, --help       Show this help message

${colors.yellow}Examples:${colors.reset}
  rant "This is my rant"
  rant -c "This rant will be committed"
  rant -p "This rant will be pushed to GitHub"
  rant -p -m "Add thoughts on topic X" "My detailed thoughts..."
  rant -e
  echo "My rant" | rant -p
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
function openEditor() {
  const tempFile = path.join(require('os').tmpdir(), `rant-${Date.now()}.md`);
  fs.writeFileSync(tempFile, '# Type your rant below this line\n\n');
  
  const editor = process.env.EDITOR || 'nano';
  try {
    execSync(`${editor} ${tempFile}`, { stdio: 'inherit' });
    const content = fs.readFileSync(tempFile, 'utf8');
    fs.unlinkSync(tempFile);
    
    // Remove the instruction line and clean up
    return content.split('\n').slice(2).join('\n').trim();
  } catch (error) {
    console.error(`${colors.red}Error opening editor${colors.reset}`);
    process.exit(1);
  }
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
${rantText.replace(/\n/g, '\n')}
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
${rantText.replace(/\n/g, '\n')}
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
    rantText = openEditor();
  }
  
  if (!rantText || rantText.trim() === '') {
    console.error(`${colors.red}Error: No rant text provided${colors.reset}`);
    console.log(`${colors.yellow}Use -h for help${colors.reset}`);
    process.exit(1);
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