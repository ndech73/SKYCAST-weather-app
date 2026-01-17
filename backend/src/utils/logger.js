// utils/logger.js
// Enhanced logger with ES6 exports
const logger = {
  debug: (message, meta) => {
    console.debug(`🐛 [DEBUG] ${message}`);
    if (meta) console.debug(meta);
  },
  
  info: (message, meta) => {
    console.info(`ℹ️  [INFO] ${message}`);
    if (meta) console.info(meta);
  },
  
  warn: (message, meta) => {
    console.warn(`⚠️  [WARN] ${message}`);
    if (meta) console.warn(meta);
  },
  
  error: (message, meta) => {
    console.error(`❌ [ERROR] ${message}`);
    if (meta) console.error(meta);
  },
  
  http: (message, meta) => {
    console.log(`🌐 [HTTP] ${message}`);
    if (meta) console.log(meta);
  }
};

export default logger;