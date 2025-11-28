/**
 * Application constants
 * Centralized configuration values used across components and hooks
 */

/**
 * Admin wallet address for moderation features
 * Loaded from environment variable VITE_ADMIN_WALLET_ADDRESS
 */
export const ADMIN_WALLET = import.meta.env.VITE_ADMIN_WALLET_ADDRESS || '';

/**
 * NFT contract address on Base Mainnet for holder verification
 * Overmind Founders Collection NFT
 */
export const NFT_CONTRACT = '0x98e240326966e86ad6ec27e13409ffb748788f8c' as const;

/**
 * Prefix for OFC category atoms on INTUITION
 * Used in GraphQL queries for category filtering
 */
export const OFC_PREFIX = 'OFC:';
