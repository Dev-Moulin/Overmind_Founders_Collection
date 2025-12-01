interface AccessDeniedProps {
  adminWallet: string;
  userAddress?: string;
}

export function AccessDenied({ adminWallet, userAddress }: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-red-400">Accès Refusé</h1>
        <p className="text-white/70">Cette page est réservée à l'administrateur du projet.</p>
        <p className="text-white/50 mt-2">Wallet admin : {adminWallet}</p>
        <p className="text-white/50">Votre wallet : {userAddress || 'Non connecté'}</p>
      </div>
    </div>
  );
}
