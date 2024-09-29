const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'logs', 'audit.log');

if (!fs.existsSync(path.dirname(logFilePath))) {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

class AuditLogging {
    static logEvent(event) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - ${event}\n`;

        fs.appendFile(logFilePath, logEntry, (err) => {
            if (err) {
                console.error('Failed to write audit log:', err);
            }
        });
    }

    static logRequest(req, res, next) {
        const event = `${req.method} ${req.url} - User: ${req.user ? req.user.email : 'Unknown'}`;
        this.logEvent(event);
        next();
    }

    static getLogs() {
        try {
            return fs.readFileSync(logFilePath, 'utf-8');
        } catch (err) {
            console.error('Failed to read audit log:', err);
            return null;
        }
    }
}

module.exports = AuditLogging;
