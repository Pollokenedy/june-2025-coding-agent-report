const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const ideasFilePath = path.join(dataDir, 'ideas.json');

function loadIdeas() {
  try {
    if (!fs.existsSync(ideasFilePath)) {
      return [];
    }
    const data = fs.readFileSync(ideasFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading ideas file:', err);
    return [];
  }
}

function saveIdeas(ideas) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const data = JSON.stringify(ideas, null, 2);
    fs.writeFileSync(ideasFilePath, data, 'utf8');
  } catch (err) {
    console.error('Error saving ideas file:', err);
  }
}

module.exports = {
  loadIdeas,
  saveIdeas,
};
