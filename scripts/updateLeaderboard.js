const fs = require('fs');
const path = require('path');

const domainsDir = path.join(__dirname, '../Domains');
const leaderboardFile = path.join(__dirname, '../DomainsLeaderboards/Overall.md');
const hallOfFameFile = path.join(__dirname, '../HallOfFame/README.md');

// Contributor data structure
let contributors = {};

// Scan all domains and count contributions
function scanContributions() {
  const domains = fs.readdirSync(domainsDir);
  
  domains.forEach(domain => {
    // Skip non-directory files
    const domainPath = path.join(domainsDir, domain);
    if (!fs.statSync(domainPath).isDirectory()) return;
    
    // Check MiniProjects folder
    const miniDir = path.join(domainPath, 'MiniProjects');
    if (fs.existsSync(miniDir)) {
      scanDirectory(miniDir, domain);
    }
    
    // Check Starter-Templates folder
    const templatesDir = path.join(domainPath, 'Starter-Templates');
    if (fs.existsSync(templatesDir)) {
      scanDirectory(templatesDir, domain);
    }
    
    // Check Programs folder (for Competitive Programming)
    const programsDir = path.join(domainPath, 'Programs');
    if (fs.existsSync(programsDir)) {
      scanDirectory(programsDir, domain);
    }
  });
}

// Recursively scan directories for contributor mentions
function scanDirectory(dir, domain) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      scanDirectory(itemPath, domain);
    } else if (stat.isFile() && (item.endsWith('.md') || item.endsWith('.txt'))) {
      // Read file and find contributors
      try {
        const content = fs.readFileSync(itemPath, 'utf8');
        const matches = content.match(/\*\*Contributor:\*\*\s*([\w\-]+)/gi);
        
        if (matches) {
          matches.forEach(match => {
            const username = match.split(':')[1].trim().replace(/\*+/g, '').trim();
            
            if (!contributors[username]) {
              contributors[username] = {
                totalPRs: 0,
                domains: {}
              };
            }
            
            contributors[username].totalPRs += 1;
            
            if (!contributors[username].domains[domain]) {
              contributors[username].domains[domain] = 0;
            }
            contributors[username].domains[domain] += 1;
          });
        }
      } catch (err) {
        console.error(`Error reading file ${itemPath}:`, err.message);
      }
    }
  });
}

// Generate leaderboard markdown
function generateLeaderboard() {
  // Sort contributors by total PRs
  const sortedContributors = Object.entries(contributors)
    .sort(([, a], [, b]) => b.totalPRs - a.totalPRs);
  
  let md = `# 🏆 ProjectHive Leaderboard

![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2025-orange?style=for-the-badge)

Welcome to the ProjectHive Leaderboard! This page automatically tracks all contributors.

---

## 🌟 Top Contributors

| Rank | Contributor | Total PRs | Domains Contributed | Last Active |
|------|-------------|-----------|---------------------|-------------|
`;

  if (sortedContributors.length === 0) {
    md += '| 🥇 | *Be the first!* | 0 | - | - |\n';
  } else {
    sortedContributors.forEach(([username, data], index) => {
      const rank = index + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
      const domainsList = Object.keys(data.domains).join(', ');
      const domainCount = Object.keys(data.domains).length;
      
      md += `| ${medal} | [@${username}](https://github.com/${username}) | ${data.totalPRs} | ${domainCount} (${domainsList}) | Recent |\n`;
    });
  }

  md += `\n---

## 📊 Domain Breakdown

`;

  // Get all unique domains
  const allDomains = new Set();
  Object.values(contributors).forEach(contributor => {
    Object.keys(contributor.domains).forEach(domain => allDomains.add(domain));
  });

  // Create tables for each domain
  allDomains.forEach(domain => {
    md += `### ${domain}\n\n`;
    md += `| Contributor | Contributions |\n`;
    md += `|-------------|---------------|\n`;
    
    const domainContributors = Object.entries(contributors)
      .filter(([, data]) => data.domains[domain])
      .sort(([, a], [, b]) => (b.domains[domain] || 0) - (a.domains[domain] || 0));
    
    if (domainContributors.length === 0) {
      md += `| *No contributions yet* | - |\n`;
    } else {
      domainContributors.forEach(([username, data]) => {
        md += `| [@${username}](https://github.com/${username}) | ${data.domains[domain]} |\n`;
      });
    }
    md += `\n`;
  });

  md += `---

## 💡 How to Join the Leaderboard

1. Fork this repository
2. Add your project with \`**Contributor:** YourGitHubUsername\`
3. Submit a Pull Request
4. Once merged, you'll appear here automatically! 🎉

---

## 🏅 Hall of Fame

Top 10 contributors are featured in our [Hall of Fame](../HallOfFame/README.md)!

---

**Last Updated:** ${new Date().toISOString().split('T')[0]}

*Leaderboard updates automatically on every merged PR via GitHub Actions*
`;

  fs.writeFileSync(leaderboardFile, md);
  console.log('✅ Leaderboard updated!');
}

// Generate Hall of Fame markdown
function generateHallOfFame() {
  // Sort contributors by total PRs
  const sortedContributors = Object.entries(contributors)
    .sort(([, a], [, b]) => b.totalPRs - a.totalPRs)
    .slice(0, 10); // Top 10 only

  let md = `<div align="center">

![Hacktoberfest Banner](../assets/Banner/HF2025-EmailHeader.png)

# 🏆 Hall of Fame

**Celebrating ProjectHive's Top Contributors**

</div>

---

## 🌟 Top Contributors

Our Hall of Fame recognizes outstanding individuals who have made significant contributions to ProjectHive through quality projects, documentation, and community engagement.

---

## 🏅 Rankings

`;

  // Generate rankings
  for (let i = 0; i < 10; i++) {
    const rank = i + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
    
    if (i < sortedContributors.length) {
      const [username, data] = sortedContributors[i];
      const domainsList = Object.keys(data.domains).join(', ');
      
      md += `### ${medal} Rank ${rank}

<div align="center">

<img src="https://github.com/${username}.png" width="100" height="100" style="border-radius: 50%;" alt="${username}"/>

**[@${username}](https://github.com/${username})**

*Contributions: ${data.totalPRs} PRs across ${Object.keys(data.domains).length} domain(s)*

*Domains: ${domainsList}*

</div>

---

`;
    } else {
      md += `### ${medal} Rank ${rank}

<div align="center">

<img src="https://github.com/github.png" width="100" height="100" style="border-radius: 50%;" alt="Pending"/>

**[Username Pending]**

*Contributions: TBD*

</div>

---

`;
    }
  }

  md += `## 📊 How Rankings Work

Rankings are based on:
- ✅ Number of merged pull requests
- ✅ Quality of contributions
- ✅ Community impact
- ✅ Consistency and engagement

---

## 🎯 Join the Hall of Fame

Want to see your name here?

1. **Contribute Quality Projects** - Add mini-projects to any domain
2. **Create Templates** - Build starter templates for others
3. **Improve Documentation** - Enhance roadmaps and guides
4. **Follow Guidelines** - Adhere to contribution standards

[Start Contributing →](../CONTRIBUTING.md)

---

## 📈 View Full Leaderboard

For detailed statistics and domain-specific rankings, check out:

📊 [Overall Leaderboard](../DomainsLeaderboards/Overall.md)

---

<div align="center">

**🌟 Every contribution counts! 🌟**

*Rankings are updated automatically with each merged contribution.*

**Last Updated:** ${new Date().toISOString().split('T')[0]}

---

Made with ❤️ by the ProjectHive Community | **Hacktoberfest 2025**

</div>`;

  fs.writeFileSync(hallOfFameFile, md);
  console.log('✅ Hall of Fame updated!');
}

// Main execution
console.log('🔄 Scanning contributions...');
scanContributions();

console.log(`📊 Found ${Object.keys(contributors).length} contributors`);

console.log('📝 Generating leaderboard...');
generateLeaderboard();

console.log('🏆 Generating Hall of Fame...');
generateHallOfFame();

console.log('✨ All updates complete!');