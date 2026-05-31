/**
 * Local storage utility for Bubblespace private keys.
 */

export const storePrivateKey = async (key: string) => {
    // In a production app, this should be stored more securely (e.g., indexedDB with encryption).
    localStorage.setItem('bubblespace_private_key', key);
};

export const getPrivateKey = () => {
    return localStorage.getItem('bubblespace_private_key');
};
