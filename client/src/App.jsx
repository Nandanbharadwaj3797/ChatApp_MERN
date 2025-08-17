import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Homepage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import {Toaster} from 'react-hot-toast'
import { useContext } from 'react'
import { AuthContext } from './context/AuthContext.jsx'

const App = () => {
  console.log('App component rendering...');
  
  try {
    const {authUser} = useContext(AuthContext);
    console.log('Auth user:', authUser);
    
    // Show loading state while checking auth
    if (authUser === undefined) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-[url('./assets/bgImage.svg')] bg-contain">
        <Toaster/>
        <Routes >
          <Route path="/" element={authUser ? <Homepage />: <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    )
  } catch (error) {
    console.error('Error in App component:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">App Error</h1>
          <p className="text-red-500 mb-2">Something went wrong:</p>
          <pre className="text-sm text-red-400 bg-red-50 p-2 rounded">
            {error.message}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default App