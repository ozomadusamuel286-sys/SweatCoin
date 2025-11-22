import { useState } from 'react'
import { UserSession } from '@stacks/connect'
import { Target, Award } from 'lucide-react'

interface TokenDashboardProps {
  userSession: UserSession
}

const TokenDashboard = ({ userSession: _userSession }: TokenDashboardProps) => {
  const [prediction, setPrediction] = useState('')
  const [stakeAmount, setStakeAmount] = useState('')

  const handleStake = () => {
    // TODO: Implement staking logic with Stacks.js
    console.log('Staking', stakeAmount, 'tokens for prediction:', prediction)
  }

  const handleRedeem = () => {
    // TODO: Implement redemption logic with Stacks.js
    console.log('Redeeming tokens for gym services')
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Staking Section */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Target className="h-6 w-6 mr-2 text-blue-600" />
          Health Prediction Staking
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight Loss Goal (lbs)
            </label>
            <input
              type="number"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              placeholder="Enter your weight loss prediction"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stake Amount (SWEAT)
            </label>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Amount to stake"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleStake}
            disabled={!prediction || !stakeAmount}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stake & Predict
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How Staking Works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Stake SWEAT tokens on your health predictions</li>
            <li>• Earn rewards if your prediction comes true</li>
            <li>• Compete in prediction markets with other users</li>
            <li>• Minimum stake: 100 SWEAT tokens</li>
          </ul>
        </div>
      </div>

      {/* Redemption Section */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Award className="h-6 w-6 mr-2 text-green-600" />
          Token Redemption
        </h2>

        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Available Rewards</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Gym Membership (1 month)</span>
                <span className="font-semibold">500 SWEAT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Personal Trainer Session</span>
                <span className="font-semibold">200 SWEAT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Nutrition Consultation</span>
                <span className="font-semibold">150 SWEAT</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRedeem}
            className="w-full btn-primary"
          >
            Redeem Tokens
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Redemption Process</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Exchange SWEAT tokens for health services</li>
            <li>• Partner with certified gyms and health providers</li>
            <li>• Instant redemption through blockchain</li>
            <li>• Minimum redemption: 100 SWEAT tokens</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TokenDashboard
