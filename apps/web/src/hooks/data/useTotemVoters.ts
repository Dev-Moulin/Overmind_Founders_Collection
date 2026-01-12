// import { useQuery } from '@apollo/client';
// import { formatEther } from 'viem';
// import { GET_TOTEM_VOTERS } from '../../lib/graphql/queries';
import type { TotemVoter } from '../../types/voter';

// Re-export for backward compatibility
export type { TotemVoter };

/**
 * COMMENTED OUT - NOT USED
 * Hook non utilisé dans le codebase actuel.
 *
 * ATTENTION: Ce hook utilise vault_type pour FOR/AGAINST, ce qui n'est pas fiable en V2.
 * Si réactivé, il faudra implémenter le pattern term_id/counter_term_id comme dans useVotesTimeline.ts
 *
 * Ce hook reçoit un seul termId mais pour différencier FOR/AGAINST correctement,
 * il faudrait aussi recevoir le counter_term_id associé, ou faire une requête
 * supplémentaire pour récupérer le triple complet.
 *
 * Result type for GET_TOTEM_VOTERS query
 */
// interface GetTotemVotersResult {
//   deposits: Array<{
//     id: string;
//     sender_id: string;
//     vault_type: 'triple_positive' | 'triple_negative';
//     assets_after_fees: string;
//     shares: string;
//     created_at: string;
//     transaction_hash: string;
//   }>;
// }

/**
 * COMMENTED OUT - NOT USED
 * Hook non utilisé dans le codebase actuel.
 *
 * ATTENTION: Ce hook utilise vault_type pour FOR/AGAINST, ce qui n'est pas fiable en V2.
 * Si réactivé, il faudra implémenter le pattern term_id/counter_term_id.
 *
 * Hook to fetch the last N voters for a specific totem
 *
 * Returns voters ordered by most recent first, with FOR/AGAINST info.
 *
 * @param termId - The term_id of the triple (totem)
 * @param limit - Maximum number of voters to fetch (default: 50)
 *
 * @example
 * ```tsx
 * function TotemVotersList({ termId }: { termId: string }) {
 *   const { voters, forCount, againstCount, loading } = useTotemVoters(termId, 50);
 *
 *   if (loading) return <div>Loading voters...</div>;
 *
 *   return (
 *     <div>
 *       <p>FOR: {forCount} | AGAINST: {againstCount}</p>
 *       <ul>
 *         {voters.map((voter, i) => (
 *           <li key={i}>
 *             {voter.address.slice(0, 6)}...{voter.address.slice(-4)}
 *             {voter.isFor ? ' +' : ' -'}{voter.formattedAmount} TRUST
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
// export function useTotemVoters(termId: string | undefined, limit: number = 50) {
//   const { data, loading, error, refetch } = useQuery<GetTotemVotersResult>(
//     GET_TOTEM_VOTERS,
//     {
//       variables: { termId, limit },
//       skip: !termId,
//     }
//   );
//
//   const voters: TotemVoter[] = [];
//   let totalFor = 0n;
//   let totalAgainst = 0n;
//   let forCount = 0;
//   let againstCount = 0;
//
//   if (data?.deposits) {
//     data.deposits.forEach((deposit) => {
//       const amount = BigInt(deposit.assets_after_fees);
//       const isFor = deposit.vault_type === 'triple_positive';
//
//       if (isFor) {
//         totalFor += amount;
//         forCount++;
//       } else {
//         totalAgainst += amount;
//         againstCount++;
//       }
//
//       voters.push({
//         address: deposit.sender_id,
//         amount: deposit.assets_after_fees,
//         formattedAmount: formatEther(amount),
//         isFor,
//         createdAt: deposit.created_at,
//         transactionHash: deposit.transaction_hash,
//       });
//     });
//   }
//
//   return {
//     /** List of voters (most recent first) */
//     voters,
//     /** Number of FOR voters in the result */
//     forCount,
//     /** Number of AGAINST voters in the result */
//     againstCount,
//     /** Total TRUST staked FOR in the result (wei) */
//     totalFor: totalFor.toString(),
//     /** Total TRUST staked AGAINST in the result (wei) */
//     totalAgainst: totalAgainst.toString(),
//     /** Formatted total FOR */
//     formattedTotalFor: formatEther(totalFor),
//     /** Formatted total AGAINST */
//     formattedTotalAgainst: formatEther(totalAgainst),
//     /** Loading state */
//     loading,
//     /** Error if query fails */
//     error,
//     /** Refetch function to manually refresh data */
//     refetch,
//   };
// }
