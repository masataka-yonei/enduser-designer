const express = require('express'); //import Express.js module
const app = express();
const path = require('path');
const fs = require('fs');
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
}
app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.post('/reports', (req, res) => {
    console.log("POST /reports called", req.body);
    const { fileName, content } = req.body;
    if (!fileName || !content) {
        console.log("Missing fileName or content", req.body);
        return res.status(400).json({ error: 'Missing fileName or content' });
    }
    const filePath = path.join(reportsDir, fileName);
    fs.writeFile(filePath, content, (err) => {
        if (err) {
            console.error("Failed to write file:", err);
            return res.status(500).json({ error: 'Failed to save report' });
        }
        console.log("Report saved to", filePath);
        res.json({ message: 'Report saved successfully' });
    });
});
app.get('/reports', (req, res) => {
    fs.readdir(reportsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read reports directory' });
        }
        res.json(files);
    });
});
app.get('/reports/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(reportsDir, fileName);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read file' });
        }
        res.send(data);
    });
});
app.listen(8085);