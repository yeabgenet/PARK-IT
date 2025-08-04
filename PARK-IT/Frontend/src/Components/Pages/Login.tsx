import { Link } from 'react-router-dom';

function Login()
{
  return (
    <div className="min-h-screen  flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md p-6 sm:p-10 md:p-16 lg:pt-20 lg:pb-20 lg:pl-24 lg:pr-24 rounded-3xl border border-gray-300 shadow-xl bg-white relative">
        
        <div className="flex items-center mb-4 relative">
          <img src="./images/logo.png" alt="logo" className="h-20 sm:h-24 absolute left-0" />
          <h1 className="text-2xl font-extrabold ml-24 z-10">PARK IT</h1>
        </div>

        <form>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="username">
              Username
            </label>
            <input
              className="w-full border rounded py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
              id="username"
              type="text"
              placeholder="Username"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="password">
              Password
            </label>
            <input
              className="w-full border rounded py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
              id="password"
              type="password"
              placeholder="Password"
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              className=" bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-full transition duration-300"
              type="submit">
              Log in
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <ul className="space-y-2 text-sm text-neutral-900">
            <li>
              <Link to="/UserForm" className="hover:underline">
                Create account
              </Link>
            </li>
            <li>
              <Link to="" className="hover:underline">
                Forgot Password?
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
