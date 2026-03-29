// Safely check for process.env to avoid ReferenceError in browser
declare const process: any;
const env = typeof process !== 'undefined' ? process.env : {};

export const API_URL = 'https://api.aepapa.online/api';