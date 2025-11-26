import { useState  } from 'react';
import {Link} from 'react-router-dom'
import Dropdown from '../Dropdown/Dropdown';


function Nav() {

    const [isScrolled ]=useState(false);
    const [isOpen , setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>

        <nav className={`navbar bg-white px-[8%] h-[100px] w-full fixed top-5 left-0 lg:left-10 rounded-2xl lg:w-[95%] flex justify-between items-center 
        z-[9999] transition-all duration-300 
        ${isScrolled ? 'bg-[#111111] shadow-md' : 'bg-transparent'}`}>

<div>
  <Link to='/' className='flex items-center relative '>
    <img src="./images/logo.png" alt="logo" className='logo h-[40px] lg:h-[60px] m-0 p-0 ' />
    <h5 className=" logotext  text-lg font-semibold w-[100%] relative">PARK IT</h5>
  </Link>
</div>

        <ul
          className={`menu flex-col lg:flex-row lg:flex absolute lg:static top-full left-0 w-full lg:w-auto bg-white md:pl-5 md:py-4 lg:bg-transparent z-50 transition-all duration-300 ease-in-out overflow-hidden 
            ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} 
            lg:max-h-full lg:opacity-100 gap-6 lg:gap-4 text-sm font-medium`}
            >
          <li>
            <Link to='/Terminal' className='text-base opacity-70 hover:opacity-100 md:opacity-100 transition px-4 py-2'>
              .Terminals
            </Link>
          </li>
          <li>
            <Link to='/driver/find-parking' className='text-base opacity-70 hover:opacity-100 md:opacity-100 transition px-4 py-2'>
              .Find Parking
            </Link>
          </li>
          <li>
            <Link to='/driver/reservations' className='text-base opacity-70 hover:opacity-100 md:opacity-100 transition px-4 py-2'>
              .Reservations
            </Link>
          </li>
          <li>
            <Link to='/About' className='text-base opacity-70 hover:opacity-100 md:opacity-100 transition px-4 py-2'>
              .About
            </Link>
          </li>
          <li>
            <Link to='/Favourites' className='text-base opacity-70 hover:opacity-100 md:opacity-100 transition px-4 py-2'>
              .Favourite
            </Link>
          </li>

          <li>
            <Link to='/Profile' className='text-base lg:hidden opacity-70 hover:opacity-100 md:opacity-100 transition px-4 py-2'>
              .Profile
            </Link>
          </li>

          <li>
            <Link to='/ParkingHistory' className='text-base lg:hidden opacity-70 hover:opacity-100 md:opacity-100 transition px-4 py-2'>
              .Parking History
            </Link>
          </li>

          <li>
            <Link to='/Login' className='text-base lg:hidden opacity-70 hover:opacity-100 md:opacity-100 transition px-4 py-2'>
              .Logout
            </Link>
          </li>

          <li>
            
          </li>

        </ul>

     

        <div className='lg:hidden block'>
            <button onClick={() => setIsOpen(!isOpen)}>
              <i className={`ri-menu-line text-2xl transition ${isOpen ? 'hidden' : 'block'}`}></i>
              <i className={`ri-close-line text-2xl transition ${isOpen ? 'block' : 'hidden'}`}></i>
            </button>
          </div>
        
          
  
    <div className='lg:block hidden '>
      <button
        onClick={() => setIsModalOpen(!isModalOpen)}
        className='rounded-full w-[50px] h-[50px] text-black text-xl font-bold  transition duration-300 flex items-center justify-center'
        aria-label='Close modal' >
        <i className={`ri-menu-line text-2xl transition ${isModalOpen ? 'hidden' : 'block'}`}></i>
        <i className={`ri-close-line text-2xl transition ${isModalOpen? 'block' : 'hidden'}`}>
            <Dropdown></Dropdown>
          </i>
      </button>
           
    </div>


        </nav>

    </>
  )
}

export default Nav