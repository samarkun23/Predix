'use client'
import Hero from '@/components/home/Hero'
import StatsStrip from '@/components/home/StatsStrip'
import MarketsSection from '@/components/home/MarketsSection'
import TrustStrip from '@/components/home/TrustStrip'
import { markets, stats, trustPoints } from '@/lib/data'
import { useEffect , useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getProgram } from '@/lib/anchor'

export default function HomePage() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [markets , setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      if (!publicKey || !signTransaction || !signAllTransactions) {
        console.error('Wallet not connected or missing sign functions');
        setLoading(false);
        return;
      }

      try {
        const program = getProgram(publicKey, signTransaction, signAllTransactions); 

        const allMarkets = await (program.account as any).market.all();
        setMarkets(allMarkets);
      } catch (error) {
        console.error('Error fetching markets:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMarkets();
  }, [publicKey, signTransaction, signAllTransactions]);

  return (
    <>
      <Hero />
      <StatsStrip stats={stats} />
      {
        loading ? (
          <div className="flex justify-center items-center py-10">
            <p className="text-textDim">Loading markets...</p>
          </div>
        ) : (
          <MarketsSection markets={markets} />
        )
      }
      <TrustStrip points={trustPoints} />
    </>
  )
}
