const express = require('express');
const fs = require('fs');
const { exec, execSync } = require('child_process');
var textEncoding = require('text-encoding');

const app = express();

function verifyJSON(json) {
    if (!Array.isArray(json)) {
        return false;
    }

    for (let i = 0; i < json.length; i++) {
        const obj = json[i];
        if (
            typeof obj.Ip !== "string" ||
            typeof obj.Port !== "string"
        ) {
            return false;
        }
    }

    return true;
}

function verifyJSON2(json) {
    if (!Array.isArray(json)) {
        return false;
    }

    for (let i = 0; i < json.length; i++) {
        const obj = json[i];
        if (
            typeof obj.ip !== "string" ||
            typeof obj.port !== "number" ||
            typeof obj.banner !== "string" ||
            typeof obj.status !== "string"
        ) {
            return false;
        }
    }

    return true;
}

app.get('/sshserver', (req, res) => {
    // Read the scan results from the JSON file
    try {
        const scanResults = JSON.parse(fs.readFileSync('scan-results.json'));
        res.status(200).json(scanResults);
    } catch (error) {
        res.status(500).send(error);
    }    
});

app.post('/raeume', (req, res) => {
    // Update the scan areas in the JSON file
    const scanAreas = req.body;
    if (!verifyJSON(scanAreas))
    {
        res.status(500).send('Ungültiges Format.');
    } else {
        fs.writeFileSync('raeume.json', JSON.stringify(scanAreas));
        res.status(200).send('Sucheräume geändert.');
    }    
});

app.listen(3001, () => {
    console.log('Server is running on port 3001');

    scanNetworkArea();
});

const scanNetworkArea = async () => {
    try {
        const raeume = JSON.parse(fs.readFileSync('./raeume.json', 'utf8'));

        raeume.forEach((raum) => {
            let call = 'evilscan ' + raum.Ip + ' --port ' + raum.Port + ' --banner --json';
            var stdout = execSync(call);
            console.log(`stdout: ${stdout}`);

            var output_string = new TextDecoder().decode(stdout);

            output_string = output_string.replaceAll('"}\n', '"},\n');
            output_string = output_string.substring(0, output_string.length - 2);

            var json = JSON.parse('[' + output_string + ']');
            
            if (verifyJSON2(json)) fs.writeFileSync('scan-results.json', '[' + output_string + ']');
        });

    } catch (error) {
        console.error('Error occurred during scanning:', error);
    }
};

setInterval(scanNetworkArea, 10 * 60 * 1000); // Run every 10 minutes

