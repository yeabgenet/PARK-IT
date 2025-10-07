import {Link} from 'react-router-dom'


function Dropdown() {
  return (
    <>
    <div className='flex flex-col dropDownMenu'>
        <ul className=' flex flex-col gap-4 w-100% text-xl text-white items-start'>
            <Link to='/Profile'>
            <li className='text-base '>
               . Profile
            </li>
            </Link>
            <Link to='/ParkingHisory'>
            <li className='text-base'>
              .  Parking History
            </li>
            </Link>
            <Link to='/Login'>
            <li className='text-base'>
               . Logout
            </li>
            </Link>
            <Link to='/AddSpot'>
            <li className='text-base'>
               . Add Spot
            </li>
            </Link>

        </ul>
    </div>

    </>
  )
}

export default Dropdown