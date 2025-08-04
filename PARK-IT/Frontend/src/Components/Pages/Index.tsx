import React from 'react';
import Filter from '../Filter/Filter';
import Footer from '../Footer/Footer';

function Index() {
  return (
    <>

<div className="w-full px-4 pt-36 flex justify-center ">
  <div className=" w-[25rem]  items-center">
    <form action="" className="relative items-center w-full max-w-lg">
      
  
      <input 
        type="text" 
        className="border w-full h-[3rem] sm:ml-8 lg:ml-12 pl-5 pr-12 rounded-full" 
        placeholder="Search for parking spot..." 
      />
      
      <i className="ri-search-line absolute top-1/2 lg:-right-7 right-7 transform -translate-y-1/2 text-gray-400"></i>

    </form>
  </div>
</div>

<div className="w-full lg:w-[95%] mx-auto px-[8%]">

  <div>
   
    <div className='mt-9 flex flex-col md:flex-row md:justify-between md:items-center gap-8'>
      
      <div className='welcoming'>
       
        <div className='flex gap-2 text-lg md:text-xl font-medium text-gray-600'>
          <h3>Selam</h3>
          <h3>Yeabsira!</h3>
        </div>
        <div>
         
          <h1 className='text-3xl lg:text-4xl font-bold text-gray-800 mt-1'>
            Where to park?
          </h1>
        </div>
      </div>

     
      <div>
        <Filter />
      </div>

    </div>

   
    <div className='mt-8'>
      <hr className='border-gray-200' />
    </div>


  </div>

</div>

    <div className='bg-white mt-96'>

    </div>


<div className='footer'>
    <Footer/>

</div>



    
    </>
  )
}

export default Index