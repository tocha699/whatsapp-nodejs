const logger = require('../src/logger');

console.log('log,info');
console.trace('trace');
console.debug('debug');
console.log('log');
console.info('info');
console.warn('warn');
console.error('error');
console.fatal('fatal');

// const e = new Error('failed');
// console.error(e, e.message, e.stack);

const childLogger = logger.child({ reqId: '1' }, false);

childLogger.info('hi', 'a');
