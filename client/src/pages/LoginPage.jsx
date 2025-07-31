import React from 'react'
import assets from '../assets/assets'
import { useState } from 'react'

const LoginPage = () => {
  const[currstate, setCurrstate] = React.useState('Sign up');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  //const[confirmPassword, setConfirmPassword] = useState('');
  const[bio, setBio] = useState('');
  //const[profilePicture, setProfilePicture] = useState(null);
  const[isDataSubmitted, setIsDataSubmitted] = useState(false);

  const onSubmithandler = (e) => {
    e.preventDefault();
    if(currstate === 'Sign up' && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }
  }

  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
      {/* Left  */}
      <img src={assets.logo_big} alt="" className='w-[min(30vw,250px)]' />
      {/* Right */}

      <form onSubmit={onSubmithandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'>
        <h2 className='tfont-medium text-2xl flex justify-between items-center'>
          {currstate}
          {isDataSubmitted && <img onClick={()=>setIsDataSubmitted(false)} src={assets.arrow_icon} alt=""  className='w-5 cursor-pointer'/>
          
          }
          
        </h2>

        {currstate === 'Sign up' && !isDataSubmitted && (
          <input onChange={(e)=>setFullName(e.target.value)} value={fullName}
          type="text" className='p-2 border border-gray-500 rounded-md focus:outline-none' placeholder=' Full Name' required />
        )}

        {!isDataSubmitted && (
          <>
            <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder='Email' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' />

            <input onChange={(e) => setPassword(e.target.value)} value={password} type="password" placeholder='Password' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' />
          </>
        )}
        {
          currstate === 'Sign up' && isDataSubmitted && (
            <textarea 
            onChange={(e) => setBio(e.target.value)} value={bio}
            rows={4} classname='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'placeholder='Provide a short bio....' required></textarea>
          )
        }
        <button type='submit' className='py-3 bg-gradient-to-r frpm-purple-400 to-violet-600 text-white rounded-md cursor-pointer'>
          {currstate==='Sign up'? "create Account" : "Login"}
        </button>

        <div  className='flex items-center gap-2 text-sm text-gray-500'>
          <input type="checkbox" />
          <p>Agree to the term of use & privacy policy</p>
        </div>

          <div  className='flex flex-cols gap-2'>
            {currstate === 'Sign up' ? (<p className='text-sm text-gray-600'>Already have an account? <span onClick={() => {
              setCurrstate('Login');
              setIsDataSubmitted(false);
            }}
            className='font-medium text-violet-500 cursor pointer' >Login here</span></p>
          ):(
            <p className='text-sm text-gray-600'>Create an account <span onClick={()=> setCurrstate('Sign up')} className='font-medium text-violet-500 cursor pointer'>Click here</span></p>
          )}  

          </div>

      </form>
        
    </div>
  )
}

export default LoginPage