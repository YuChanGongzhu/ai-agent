import React, { useState } from 'react';
import alipayIcon from '../../img/alipay.svg';
import wxIcon from '../../img/wx.svg';

interface ChargeOption {
  amount: number;
  tokens: number;
  selected: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  selected: boolean;
  icon?: string;
}

interface ChargeChooseProps {
  onSelect?: (amount: number, tokens: number) => void;
}

const ChargeChoose: React.FC<ChargeChooseProps> = ({ onSelect }) => {
  const [options, setOptions] = useState<ChargeOption[]>([
    { amount: 20, tokens: 1000000, selected: true },
    { amount: 90, tokens: 5000000, selected: false },
    { amount: 160, tokens: 10000000, selected: false },
  ]);
  
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customSelected, setCustomSelected] = useState<boolean>(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 'online', name: '在线支付', selected: true, icon: '💳' },
    { id: 'transfer', name: '对公转账', selected: false },
  ]);
  
  const handleOptionSelect = (index: number) => {
    const newOptions = options.map((option, i) => ({
      ...option,
      selected: i === index,
    }));
    
    setOptions(newOptions);
    setCustomSelected(false);
    
    if (onSelect) {
      onSelect(newOptions[index].amount, newOptions[index].tokens);
    }
  };

  const handlePaymentMethodSelect = (id: string) => {
    const newPaymentMethods = paymentMethods.map(method => ({
      ...method,
      selected: method.id === id,
    }));
    
    setPaymentMethods(newPaymentMethods);
  };
  
  const handleCustomSelect = () => {
    setOptions(options.map(option => ({ ...option, selected: false })));
    setCustomSelected(true);
    
    if (onSelect && customAmount) {
      // Assuming some conversion rate for custom amounts
      // This would need to be adjusted based on your actual conversion logic
      const tokens = Math.floor(parseFloat(customAmount) * 50000);
      onSelect(parseFloat(customAmount), tokens);
    }
  };
  
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setCustomAmount(value);
      
      if (customSelected && onSelect && value) {
        const tokens = Math.floor(parseFloat(value) * 50000);
        onSelect(parseFloat(value), tokens);
      }
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-medium px-3 py-2" style={{ color: 'rgba(108, 93, 211, 1)' }}>充值选择</h2>
      
      <div className="space-y-3 mt-2">
        {options.map((option, index) => (
          <div 
            key={index}
            className={`flex items-center p-3 border rounded-lg ${option.selected ? 'border-purple-500' : 'border-gray-200'}`}
            style={option.selected ? { backgroundColor: 'rgba(108, 93, 211, 0.1)' } : {}}
            onClick={() => handleOptionSelect(index)}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${option.selected ? '' : 'border-gray-300'}`}
                style={option.selected ? { borderColor: 'rgba(108, 93, 211, 1)' } : {}}>
                {option.selected && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(108, 93, 211, 1)' }}></div>}
              </div>
            </div>
            
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                <span className="text-2xl font-bold" style={{ color: 'rgba(108, 93, 211, 1)' }}>${option.amount}</span>
                <span className="ml-2 text-sm text-gray-400">(已包含纳税费用)</span>
              </div>
              <div className="text-sm text-gray-500">
                可使用<span className="font-medium" style={{ color: 'rgba(108, 93, 211, 1)' }}>{option.tokens.toLocaleString()}</span>tokens
              </div>
            </div>
          </div>
        ))}
        
        {/* Custom amount option */}
        <div 
          className={`flex items-center p-3 border rounded-lg ${customSelected ? 'border-purple-500' : 'border-gray-200'}`}
          style={customSelected ? { backgroundColor: 'rgba(108, 93, 211, 0.1)' } : {}}
          onClick={handleCustomSelect}
        >
          <div className="flex items-center">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${customSelected ? '' : 'border-gray-300'}`}
              style={customSelected ? { borderColor: 'rgba(108, 93, 211, 1)' } : {}}>
              {customSelected && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(108, 93, 211, 1)' }}></div>}
            </div>
          </div>
          
          <div className="ml-3 flex-1">
            <div className="flex items-center">
              <span className="text-lg font-medium" style={{ color: 'rgba(108, 93, 211, 1)' }}>自定义金额</span>
              <div className="ml-2 flex items-center bg-white border border-gray-200 rounded">
                <span className="px-2 text-gray-500">$</span>
                <input
                  type="text"
                  className="w-24 py-1 px-2 outline-none bg-transparent"
                  placeholder="请输入金额"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              可使用<span className="font-medium" style={{ color: 'rgba(108, 93, 211, 1)' }}>{customSelected && customAmount ? Math.floor(parseFloat(customAmount) * 50000).toLocaleString() : 0}</span>tokens
            </div>
          </div>
        </div>

        {/* Payment method selection */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-3" style={{ color: 'rgba(108, 93, 211, 1)' }}>
            充值方式
          </h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div 
                key={method.id}
                className={`flex items-center p-3 border rounded-lg ${method.selected ? 'border-purple-500' : 'border-gray-200'}`}
                style={method.selected ? { backgroundColor: 'rgba(108, 93, 211, 0.1)' } : {}}
                onClick={() => handlePaymentMethodSelect(method.id)}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${method.selected ? '' : 'border-gray-300'}`}
                    style={method.selected ? { borderColor: 'rgba(108, 93, 211, 1)' } : {}}
                  >
                    {method.selected && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(108, 93, 211, 1)' }}></div>}
                  </div>
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <span className="font-medium" style={{ color: method.selected ? 'rgba(108, 93, 211, 1)' : 'inherit' }}>
                      {method.name}
                    </span>
                    {method.id === 'online' && (
                      <div className="ml-2 flex space-x-1">
                          <img src={wxIcon} alt="WeChat Pay" width="18" height="18" />
                          <img src={alipayIcon} alt="Alipay" width="18" height="18" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargeChoose;