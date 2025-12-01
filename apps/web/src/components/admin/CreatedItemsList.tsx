interface CreatedItemsListProps {
  createdItems: Map<string, { termId: string; txHash: string }>;
}

export function CreatedItemsList({ createdItems }: CreatedItemsListProps) {
  if (createdItems.size === 0) return null;

  return (
    <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
      <h2 className="text-xl font-bold text-green-400 mb-4">
        Atoms créés cette session ({createdItems.size})
      </h2>
      <div className="space-y-2">
        {Array.from(createdItems.entries()).map(([name, data]) => (
          <div key={name} className="p-3 bg-white/5 rounded flex justify-between items-center">
            <span className="text-white font-medium">{name}</span>
            <a
              href={`https://testnet.explorer.intuition.systems/tx/${data.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              Voir TX
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
