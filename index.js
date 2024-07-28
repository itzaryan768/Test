const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.static('public'));

app.get('/videoInfo', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('Invalid URL');
    }

    try {
        const command = `youtube-dl --dump-json ${url}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error fetching video info:', error);
                return res.status(500).send('Failed to retrieve video info.');
            }

            const info = JSON.parse(stdout);
            const audioFormat = info.formats.find(format => format.acodec !== 'none');

            res.json({
                videoTitle: info.title,
                videoThumbnail: info.thumbnail,
                audioFormat: {
                    url: audioFormat.url,
                    ext: audioFormat.ext
                }
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Failed to retrieve video info.');
    }
});

app.get('/download', (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send('Invalid URL');
    }

    const filePath = path.resolve(__dirname, 'public', 'audio.mp3');
    const command = `youtube-dl -x --audio-format mp3 --output ${filePath} ${url}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error in downloading and converting:', error);
            return res.status(500).send('Error during conversion');
        }

        res.download(filePath, 'audio.mp3', (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }

            // Delete the file after sending
            fs.unlink(filePath, (unlinkError) => {
                if (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                }
            });
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
