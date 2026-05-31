/**
 * Crypto utilities for Bubblespace end-to-end encryption.
 */

export const generateKeyPair = () => {
    // In a real app, this would use SubtleCrypto to generate RSA or Ed25519 keys.
    // For now, we simulate key generation as requested by the backend logic.
    const publicKey = 'pk_' + Math.random().toString(36).substring(2, 15);
    const secretKey = 'sk_' + Math.random().toString(36).substring(2, 15);

    return { publicKey, secretKey };
};
