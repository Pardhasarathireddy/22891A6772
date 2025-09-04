const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
// Load env from current working directory first (where the app is started)
dotenv.config();
// Also attempt to load from this middleware's own directory
dotenv.config({ path: path.join(__dirname, '.env') });
// And from the project root (one level up) if present
dotenv.config({ path: path.join(path.dirname(__dirname), '.env') });

// Configuration for the logging service
const CONFIG = {
    API_ENDPOINT: 'http://20.244.56.144/evaluation-service/logs',
    AUTH_ENDPOINT: 'http://20.244.56.144/evaluation-service/auth',
    REGISTER_ENDPOINT: 'http://20.244.56.144/evaluation-service/register',
    TIMEOUT: 5000,
    RETRY_ATTEMPTS: 3,
    LOG_FILE_PATH: path.join(__dirname, 'logs', 'application.log'),
    // Authentication credentials - REPLACE WITH YOUR ACTUAL VALUES
    CLIENT_ID: process.env.CLIENT_ID || 'd9cbb699-6a27-4a45-8d59-8b1befab16da',
    CLIENT_SECRET: process.env.CLIENT_SECRET || 'tVJaaRBSeXCReXEm',
    ACCESS_CODE: process.env.ACCESS_CODE || 'xgAsNc',
    USER_EMAIL: process.env.USER_EMAIL || 'your-email@college.edu',
    USER_NAME: process.env.USER_NAME || 'Your Name',
    ROLL_NO: process.env.ROLL_NO || 'your-roll-number',
    // Optional: preset access token and absolute expiry epoch seconds
    ACCESS_TOKEN: process.env.ACCESS_TOKEN || null,
    ACCESS_TOKEN_EXPIRES_AT: process.env.ACCESS_TOKEN_EXPIRES_AT
};

// Valid log levels and stacks
const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
const VALID_STACKS = ['backend', 'frontend'];
const VALID_PACKAGES = {
    backend: ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service', 'auth', 'config', 'middleware', 'utils'],
    frontend: ['api', 'auth', 'config', 'middleware', 'utils']
};

/**
 * Validates the log parameters
 * @param {string} stack - The application stack (backend/frontend)
 * @param {string} level - The log level (debug/info/warn/error/fatal)
 * @param {string} package - The package context
 * @param {string} message - The log message
 * @returns {boolean} - True if valid, throws error if invalid
 */
function validateLogParams(stack, level, packageName, message) {
    if (!VALID_STACKS.includes(stack)) {
        throw new Error(`Invalid stack: ${stack}. Must be one of: ${VALID_STACKS.join(', ')}`);
    }
    
    if (!VALID_LEVELS.includes(level)) {
        throw new Error(`Invalid level: ${level}. Must be one of: ${VALID_LEVELS.join(', ')}`);
    }
    
    if (!VALID_PACKAGES[stack].includes(packageName)) {
        throw new Error(`Invalid package for ${stack}: ${packageName}. Must be one of: ${VALID_PACKAGES[stack].join(', ')}`);
    }
    
    if (!message || typeof message !== 'string') {
        throw new Error('Message must be a non-empty string');
    }
    
    return true;
}

/**
 * Creates a formatted log entry with timestamp
 * @param {string} stack - The application stack
 * @param {string} level - The log level
 * @param {string} package - The package context
 * @param {string} message - The log message
 * @returns {object} - Formatted log object
 */
function createLogEntry(stack, level, packageName, message) {
    return {
        timestamp: new Date().toISOString(),
        stack,
        level: level.toUpperCase(),
        package: packageName,
        message,
        sessionId: generateSessionId()
    };
}

/**
 * Generates a unique session ID for tracking
 * @returns {string} - Unique session identifier
 */
function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * In-memory token storage (for production, use secure storage)
 */
let authToken = null;
let tokenExpiry = null; // epoch seconds

// Initialize from preset token if provided
if (CONFIG.ACCESS_TOKEN) {
    authToken = CONFIG.ACCESS_TOKEN;
    const exp = CONFIG.ACCESS_TOKEN_EXPIRES_AT ? Number(CONFIG.ACCESS_TOKEN_EXPIRES_AT) : null;
    if (exp && !Number.isNaN(exp)) {
        tokenExpiry = exp;
    }
}

function isTokenValid() {
    return !!(authToken && tokenExpiry && Date.now() < tokenExpiry * 1000);
}

/**
 * Registers user with the evaluation service
 * @returns {Promise<object>} - Registration response
 */
async function registerUser() {
    try {
        const registrationData = {
            email: CONFIG.USER_EMAIL,
            name: CONFIG.USER_NAME,
            githubUsername: process.env.GITHUB_USERNAME || 'your-github-username',
            rollNo: CONFIG.ROLL_NO,
            accessCode: CONFIG.ACCESS_CODE
        };

        const response = await axios.post(CONFIG.REGISTER_ENDPOINT, registrationData, {
            timeout: CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Campus-Hiring-Logger/1.0'
            }
        });

        if (response.status === 200) {
            console.log('✅ Registration successful:', response.data);
            return {
                success: true,
                data: response.data
            };
        }
    } catch (error) {
        console.error('❌ Registration failed:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

/**
 * Gets authentication token from the evaluation service
 * @returns {Promise<string>} - Bearer token
 */
async function getAuthToken() {
    // Prefer preset token if valid
    if (isTokenValid()) {
        return authToken;
    }

    try {
        const authData = {
            email: CONFIG.USER_EMAIL,
            name: CONFIG.USER_NAME,
            rollNo: CONFIG.ROLL_NO,
            accessCode: CONFIG.ACCESS_CODE,
            clientID: CONFIG.CLIENT_ID,
            clientSecret: CONFIG.CLIENT_SECRET
        };

        const response = await axios.post(CONFIG.AUTH_ENDPOINT, authData, {
            timeout: CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Campus-Hiring-Logger/1.0'
            }
        });

        if (response.status === 200) {
            const { access_token, expires_in, token_type } = response.data;
            
            if (token_type === 'Bearer' && access_token) {
                authToken = access_token;
                // expires_in may be a duration in seconds or an absolute epoch seconds
                if (typeof expires_in === 'number') {
                    if (expires_in > 10_000_000_000) {
                        // Looks like epoch seconds already
                        tokenExpiry = expires_in;
                    } else {
                        // Duration in seconds; convert to epoch seconds
                        tokenExpiry = Math.floor(Date.now() / 1000) + expires_in;
                    }
                } else {
                    // Fallback: set a short-lived expiry (5 minutes)
                    tokenExpiry = Math.floor(Date.now() / 1000) + 300;
                }
                
                console.log('✅ Authentication successful, token expires at:', new Date(expires_in * 1000).toISOString());
                return authToken;
            }
        }
    } catch (error) {
        console.error('❌ Authentication failed:', error.response?.data || error.message);
        
        // Reset token on failure
        authToken = null;
        tokenExpiry = null;
        
        throw new Error(`Authentication failed: ${error.response?.data?.message || error.message}`);
    }

    throw new Error('Failed to obtain valid authentication token');
}

/**
 * Sends log data to the test server API with retry mechanism
 * @param {object} logData - The log data to send
 * @returns {Promise<object>} - API response with logID
 */
async function sendToAPI(logData) {
    const payload = {
        stack: logData.stack,
        level: logData.level.toLowerCase(),
        package: logData.package,
        message: logData.message
    };
    
    let lastError;
    
    for (let attempt = 1; attempt <= CONFIG.RETRY_ATTEMPTS; attempt++) {
        try {
            // Get authentication token before making the API call
            const token = await getAuthToken();
            
            const response = await axios.post(CONFIG.API_ENDPOINT, payload, {
                timeout: CONFIG.TIMEOUT,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'Campus-Hiring-Logger/1.0'
                }
            });
            
            if (response.status === 200) {
                return {
                    success: true,
                    logID: response.data.logID || response.data.id,
                    message: response.data.message || 'Log created successfully',
                    attempt
                };
            }
        } catch (error) {
            lastError = error;
            
            // If authentication fails, reset token and retry
            if (error.response?.status === 401 || error.response?.status === 403) {
                authToken = null;
                tokenExpiry = null;
                console.warn(`Authentication error on attempt ${attempt}, resetting token`);
            }
            
            // Log the retry attempt
            console.warn(`API call attempt ${attempt} failed:`, error.response?.data || error.message);
            
            // Wait before retry (exponential backoff)
            if (attempt < CONFIG.RETRY_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
    
    throw new Error(`API call failed after ${CONFIG.RETRY_ATTEMPTS} attempts. Last error: ${lastError.response?.data || lastError.message}`);
}

/**
 * Saves log entry to local file as backup
 * @param {object} logEntry - The log entry to save
 */
async function saveToLocalFile(logEntry) {
    try {
        // Ensure logs directory exists
        const logsDir = path.dirname(CONFIG.LOG_FILE_PATH);
        await fs.mkdir(logsDir, { recursive: true });
        
        const logLine = `${logEntry.timestamp} [${logEntry.level}] [${logEntry.stack}:${logEntry.package}] ${logEntry.message}\n`;
        await fs.appendFile(CONFIG.LOG_FILE_PATH, logLine);
    } catch (error) {
        console.error('Failed to save log to file:', error.message);
    }
}

/**
 * Main logging function that handles the complete logging workflow
 * @param {string} stack - The application stack (backend/frontend)
 * @param {string} level - The log level (debug/info/warn/error/fatal)
 * @param {string} package - The package context
 * @param {string} message - The log message
 * @returns {Promise<object>} - Result object with success status and details
 */
async function Log(stack, level, packageName, message) {
    try {
        // Validate input parameters
        validateLogParams(stack, level, packageName, message);
        
        // Create formatted log entry
        const logEntry = createLogEntry(stack, level, packageName, message);
        
        // Save to local file first (backup)
        await saveToLocalFile(logEntry);
        
        // Send to API
        const apiResult = await sendToAPI(logEntry);
        
        // Console output for development
        const consoleMessage = `[${logEntry.timestamp}] [${logEntry.level}] [${stack}:${packageName}] ${message}`;
        
        switch (level.toLowerCase()) {
            case 'error':
            case 'fatal':
                console.error(consoleMessage);
                break;
            case 'warn':
                console.warn(consoleMessage);
                break;
            case 'debug':
                console.debug(consoleMessage);
                break;
            default:
                console.log(consoleMessage);
        }
        
        return {
            success: true,
            logID: apiResult.logID,
            message: apiResult.message,
            timestamp: logEntry.timestamp,
            sessionId: logEntry.sessionId,
            apiAttempts: apiResult.attempt
        };
        
    } catch (error) {
        // Handle logging errors gracefully
        const errorMessage = `Logging failed: ${error.message}`;
        console.error(errorMessage);
        
        // Try to save error to local file
        try {
            const errorEntry = createLogEntry(stack || 'unknown', 'error', packageName || 'middleware', errorMessage);
            await saveToLocalFile(errorEntry);
        } catch (saveError) {
            console.error('Failed to save error log:', saveError.message);
        }
        
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Convenience methods for different log levels
 */
const Logger = {
    debug: (stack, packageName, message) => Log(stack, 'debug', packageName, message),
    info: (stack, packageName, message) => Log(stack, 'info', packageName, message),
    warn: (stack, packageName, message) => Log(stack, 'warn', packageName, message),
    error: (stack, packageName, message) => Log(stack, 'error', packageName, message),
    fatal: (stack, packageName, message) => Log(stack, 'fatal', packageName, message)
};

/**
 * Express middleware for automatic request logging
 * @param {object} options - Configuration options
 * @returns {function} - Express middleware function
 */
function createExpressMiddleware(options = {}) {
    const config = {
        logRequests: true,
        logResponses: true,
        logErrors: true,
        packageName: 'middleware',
        ...options
    };
    
    return (req, res, next) => {
        const startTime = Date.now();
        
        // Log incoming request
        if (config.logRequests) {
            Log('backend', 'info', config.packageName, 
                `${req.method} ${req.url} - IP: ${req.ip || req.connection.remoteAddress}`);
        }
        
        // Override res.end to log response
        const originalEnd = res.end;
        res.end = function(...args) {
            const duration = Date.now() - startTime;
            
            if (config.logResponses) {
                const level = res.statusCode >= 400 ? 'error' : 'info';
                Log('backend', level, config.packageName,
                    `${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
            }
            
            originalEnd.apply(this, args);
        };
        
        next();
    };
}

// Export the logging functions
module.exports = {
    Log,
    Logger,
    createExpressMiddleware,
    registerUser,
    getAuthToken,
    CONFIG
};
