const { Log, Logger, createExpressMiddleware, registerUser, getAuthToken, CONFIG } = require('./loggingMiddleware');

// Export all logging functionality
module.exports = {
    // Main logging function
    Log,
    
    // Convenience logger methods
    Logger,
    
    // Express middleware for automatic logging
    createExpressMiddleware,
    
    // Authentication functions
    registerUser,
    getAuthToken,
    
    // Configuration object
    CONFIG,
    
    // Utility functions for direct usage
    logDebug: (stack, packageName, message) => Log(stack, 'debug', packageName, message),
    logInfo: (stack, packageName, message) => Log(stack, 'info', packageName, message),
    logWarn: (stack, packageName, message) => Log(stack, 'warn', packageName, message),
    logError: (stack, packageName, message) => Log(stack, 'error', packageName, message),
    logFatal: (stack, packageName, message) => Log(stack, 'fatal', packageName, message),
    
    // Version information
    version: '1.0.0',
    
    // Package information
    name: 'url-shortener-logger'
};
