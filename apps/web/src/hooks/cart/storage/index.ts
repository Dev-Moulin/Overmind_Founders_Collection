/**
 * Vote Cart Storage exports
 */

export {
  STORAGE_KEY_PREFIX,
  serializeCart,
  deserializeCart,
  getStorageKey,
  loadCartFromStorage,
  loadAllCartsFromStorage,
  saveCartToStorage,
  removeCartFromStorage,
  type SerializedVoteCartItem,
  type SerializedVoteCart,
} from './voteCartStorage';
