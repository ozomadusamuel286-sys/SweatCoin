import { useState, useEffect } from 'react'
import { UserSession } from '@stacks/connect'
import { Activity, Target, TrendingUp, Award } from 'lucide-react'

interface FitnessDashboardProps {
  userSession: UserSession
}

const FitnessDashboard = ({ userSession: _userSession }: FitnessDashboardProps) => {
  const [steps, setSteps] = useState(0)
  const [balance, setBalance] = useState(0)
  const [staked, setStaked] = useState(0)

  // Mock data - in real app, this would fetch from contract
  useEffect(() => {
    // Simulate fetching user data
    setSteps(12500)
    setBalance(1250)
    setStaked(500)
  }, [])

  const dailyGoal = 10000
  const progressPercent = Math.min((steps / dailyGoal) * 100, 100)

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Fitness Stats */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Activity className="h-6 w-6 mr-2 text-blue-600" />
          Fitness Dashboard
        </h2>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Today's Steps</span>
              <span className="text-sm text-gray-500">{steps.toLocaleString()} / {dailyGoal.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card border-blue-500">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium">Mintable Tokens</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">{Math.floor(steps / 10)}</p>
            </div>

            <div className="stat-card border-green-500">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium">Weekly Goal</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {steps >= dailyGoal * 7 ? 'Achieved!' : `${Math.floor((steps / (dailyGoal * 7)) * 100)}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Stats */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <TrendingUp className="h-6 w-6 mr-2 text-yellow-600" />
          Token Overview
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="font-medium">SWEAT Balance</span>
            <span className="text-2xl font-bold text-yellow-600">{balance.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="font-medium">Staked Tokens</span>
            <span className="text-2xl font-bold text-blue-600">{staked.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="font-medium">Available to Stake</span>
            <span className="text-2xl font-bold text-green-600">{(balance - staked).toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button className="w-full btn-primary">
            Mint Tokens from Steps
          </button>
          <button className="w-full btn-secondary">
            Stake for Health Prediction
          </button>
        </div>
      </div>
    </div>
  )
}

export default FitnessDashboard
