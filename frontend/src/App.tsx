import { useState, useEffect } from 'react'
import { AppConfig, UserSession, showConnect, UserData } from '@stacks/connect'
import { Activity, Coins, Trophy } from 'lucide-react'
import Header from './components/Header'
import WalletConnect from './components/WalletConnect'
import FitnessDashboard from './components/FitnessDashboard'
import TokenDashboard from './components/TokenDashboard'

function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(null)
  const [_userData, setUserData] = useState<UserData | null>(null)

  const appConfig = new AppConfig(['store_write', 'publish_data'])
  const session = new UserSession({ appConfig })

  useEffect(() => {
    if (session.isSignInPending()) {
      session.handlePendingSignIn().then((userData) => {
        setUserSession(session)
        setUserData(userData)
      })
    } else if (session.isUserSignedIn()) {
      setUserSession(session)
      setUserData(session.loadUserData())
    }
  }, [])

  const connectWallet = () => {
    showConnect({
      appDetails: {
        name: 'SweatCoin',
        icon: window.location.origin + '/vite.svg',
      },
      redirectTo: '/',
      onFinish: () => {
        window.location.reload()
      },
      userSession: session,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {!userSession ? (
          <div className="text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                SweatCoin
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Earn tokens through physical activity. Stake for health predictions.
                Redeem for gym memberships and health services.
              </p>
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <Activity className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Track Activity</h3>
                  <p className="text-gray-600">Monitor your steps and physical activity with our integrated fitness tracking.</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <Coins className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Earn Tokens</h3>
                  <p className="text-gray-600">Convert your physical activity into SWEAT tokens on the Stacks blockchain.</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <Trophy className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Stake & Predict</h3>
                  <p className="text-gray-600">Stake tokens for health predictions and compete in prediction markets.</p>
                </div>
              </div>
              <WalletConnect onConnect={connectWallet} />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to SweatCoin</h1>
              <p className="text-gray-600">Your fitness journey starts here</p>
            </div>
            <FitnessDashboard userSession={userSession} />
            <TokenDashboard userSession={userSession} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
