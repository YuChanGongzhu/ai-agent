import React, { useState } from 'react';
import ChargeNav from './components/chargeNav';
import ChargeChoose from './components/chargeChoose';
import TokenConsume from './components/tokenComsume';

interface ChargePageProps {}

const ChargePage: React.FC<ChargePageProps> = () => {
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [selectedTokens, setSelectedTokens] = useState<number>(0);
  
  // Current user stats (these would typically come from an API)
  const userStats = {
    version: 'AIR',
    currentFunctionCount: 1,
    maxFunctionCount: 1,
    currentAPICount: 0,
    maxAPICount: 0,
    tokenBalance: 0
  };
  
  const handleChargeSelect = (amount: number, tokens: number) => {
    setSelectedAmount(amount);
    setSelectedTokens(tokens);
    // In a real implementation, you would call an API to process the payment here
  };
  
  const handleUpgrade = () => {
    // Handle upgrade logic
    console.log('Upgrade requested');
  };
  
  const handleAddNew = () => {
    // Handle add new account/function logic
    console.log('Add new requested');
  };
  
  return (
    <div className="container mx-auto py-6 px-4 mt-6 md:mt-0">
      {/* Current stats overview */}
      <ChargeNav 
        version={userStats.version}
        currentFunctionCount={userStats.currentFunctionCount}
        maxFunctionCount={userStats.maxFunctionCount}
        currentAPICount={userStats.currentAPICount}
        maxAPICount={userStats.maxAPICount}
        tokenBalance={userStats.tokenBalance}
        onUpgrade={handleUpgrade}
        onAddNew={handleAddNew}
      />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment selection */}
        <div>
          <ChargeChoose onSelect={handleChargeSelect} />
          
          {/* Payment buttons */}
          <div className="mt-6 flex justify-center">
            <button 
              className="px-8 py-3 rounded-lg text-white font-medium" 
              style={{ backgroundColor: 'rgba(108, 93, 211, 1)' }}
              onClick={() => console.log(`Processing payment: $${selectedAmount} for ${selectedTokens} tokens`)}
              disabled={!selectedAmount}
            >
              确认充值
            </button>
          </div>
        </div>
        
        {/* Token consumption logic */}
        <div>
          <TokenConsume />
        </div>
      </div>
    </div>
  );
};

export default ChargePage;