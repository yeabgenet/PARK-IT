import React from 'react'

function Footer() {
  return (
    <>
<footer className='bg-black text-white px-8 py-12'>
  <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-10'>

    {/*
      LEFT SIDE: All of your main content is now grouped in this single div.
    */}
    <div>
      <h4 className='text-xl font-bold'>PARK IT</h4>
      <p className='mt-4 text-gray-300 max-w-md'>
        Helping you find the perfect parking spot - anytime, anywhere. <br />
        <a href="#" className='hover:underline'>Smart Search</a> | <a href="#" className='hover:underline'>Location-Based Matching</a> | <a href="#" className='hover:underline'>Custom Preferences</a>
      </p>

      {/* A flex container for the links and social sections */}
      <div className="flex flex-col md:flex-row gap-10 mt-8">
        <div>
          <p className='font-semibold'>Quick Links</p>
          <ul className='mt-2 space-y-1 text-gray-300'>
            <li><a href="#" className='hover:underline'>About Us</a></li>
            <li><a href="#" className='hover:underline'>How It Works</a></li>
            <li><a href="#" className='hover:underline'>FAQ</a></li>
            <li><a href="#" className='hover:underline'>Contact Support</a></li>
            <li><a href="#" className='hover:underline'>Terms of Service</a></li>
            <li><a href="#" className='hover:underline'>Privacy Policy</a></li>
          </ul>
        </div>

        <div>
          <p className='font-semibold'>Connect with us</p>
          <div className="flex gap-4 mt-2">
            <a href="#" aria-label="Facebook">[Facebook]</a>
            <a href="#" aria-label="Twitter">[Twitter/X]</a>
            <a href="#" aria-label="Instagram">[Instagram]</a>
            <a href="#" aria-label="LinkedIn">[LinkedIn]</a>
          </div>
          <p className="mt-4 text-gray-400 text-sm">
            Making parking stress-free, one spot at a time.
          </p>
        </div>
      </div>
    </div>

    {/*
      RIGHT SIDE: The copyright text.
      - This is now a direct child of the main flex container.
      - `text-left` on mobile, but `md:text-right` aligns it to the right on larger screens.
      - `self-start` on mobile and `md:self-end` ensures it aligns nicely at the bottom right on desktop.
    */}
    <div className='w-full md:w-auto text-left md:text-right self-start md:self-end'>
      <p className='text-gray-400'>
        © 2025 Park It. All rights reserved.
      </p>
    </div>

  </div>
</footer>

    
    </>
  )
}

export default Footer