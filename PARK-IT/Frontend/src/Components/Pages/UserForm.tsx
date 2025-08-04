import React, { useState } from 'react';

type RoleValue = 'Driver' | 'Service Provider' | '';

function UserForm() {
  const [selectedRole, setSelectedRole] = useState<RoleValue>('');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>(''); // State for the error message
  const totalSteps = 4;

  const handleSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value as RoleValue);
    // Clear the error message once a role is selected
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const clearSelection = () => {
    setSelectedRole('');
  };

  const nextStep = () => {
    // Validation: Do not proceed if on the first step and no role is selected.
    if (currentStep === 1 && !selectedRole) {
      // Set the error message to be displayed on the screen
      setErrorMessage('Please select a role to continue.');
      return;
    }
    // Clear any previous error messages before proceeding
    setErrorMessage('');
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    // Also clear error messages when going back
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };


  // Pagination Dots component for mobile view
  const PaginationDots = () => (
    <div className="flex justify-center items-center space-x-2 my-4 md:hidden">
      {[...Array(totalSteps)].map((_, index) => (
        <div
          key={index + 1}
          className={`w-3 h-3 rounded-full ${
            currentStep === index + 1 ? 'bg-black' : 'bg-gray-300'
          }`}
        ></div>
      ))}
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-center mt-6 mb-6 px-4">
        <div className="p-6 w-full max-w-md md:max-w-3xl bg-white rounded-lg">
          <h1 className="text-center text-3xl font-bold mb-4">ParkIt</h1>
          <hr />
        </div>
      </div>

      <div className="flex items-center justify-center px-4">
        <div className="p-6 w-full max-w-md md:max-w-3xl bg-white rounded-lg shadow-md">
          <PaginationDots />

          {/* On-Screen Error Message Display */}
          {errorMessage && (
            <div className="text-red-600 bg-red-100 p-3 rounded-md text-center mb-4">
              {errorMessage}
            </div>
          )}

          <form className="space-y-4">
            {/* Step 1: Role Selection */}
            <div className={currentStep === 1 ? 'block' : 'hidden md:block'}>
              <label htmlFor="role" className="block text-base font-medium text-neutral-900 mb-1">
                Role <span className="text-neutral-600">*</span>
              </label>
              <select
                id="role"
                name="role"
                className="w-full border border-gray-300 rounded-md px-4 py-2"
                value={selectedRole}
                onChange={handleSelectionChange}
                required
              >
                <option value="" onClick={clearSelection}>Select Your Role ...</option>
                <option value="Driver">Driver</option>
                <option value="Service Provider">Service Provider</option>
              </select>
            </div>

            {/* Step 2: Common Fields */}
            <div className={currentStep === 2 ? 'block space-y-4' : 'hidden md:block md:space-y-4'}>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">First Name *</label>
                <input type="text" required className="w-full border border-gray-300 rounded-md px-4 py-2" />
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">Last Name *</label>
                <input type="text" required className="w-full border border-gray-300 rounded-md px-4 py-2" />
              </div>

              <div>
                    <label className="block text-base font-medium text-neutral-900 mb-1"> Profile Picture * </label>
                    <input type="file" required className="w-1/2 border border-gray-300 rounded-md px-4 py-10" />
                </div>

              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">Phone Number *</label>
                <input type="tel" required className="w-full border border-gray-300 rounded-md px-4 py-2" />
              </div>
            </div>

            {/* Step 3: Additional Personal Info */}
            <div className={currentStep === 3 ? 'block space-y-4' : 'hidden md:block md:space-y-4'}>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">Email *</label>
                <input type="email" required className="w-full border border-gray-300 rounded-md px-4 py-2" />
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">Age <span className="text-neutral-600">*</span></label>
                <input type="number" className="w-1/5 border border-gray-300 rounded-md px-4 py-2" />
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">Gender <span className="text-neutral-600">*</span></label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="gender" value="Male" required />
                    <span>Male</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="gender" value="Female" required />
                    <span>Female</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Step 4: Role-Specific Fields */}
            <div className={currentStep === 4 ? 'block space-y-4' : 'hidden md:block md:space-y-4'}>
              {selectedRole === 'Driver' && (
                <>
                  <div>
                    <label className="block text-base font-medium text-neutral-900 mb-1">Plate Number *</label>
                    <input type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-neutral-900 mb-1">Address *</label>
                    <input type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" />
                  </div>
                 
                </>
              )}

              {selectedRole === 'Service Provider' && (
                <>
                  <div>
                    <label className="block text-base font-medium text-neutral-900 mb-1">Parking Terminal Name *</label>
                    <input type="text" className="w-full required: border border-gray-300 rounded-md px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-neutral-900 mb-1">Address *</label>
                    <input type="text" className="w-full required: border border-gray-300 rounded-md px-4 py-2" />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-neutral-900 mb-1">Capacity <span className="text-neutral-600">*</span></label>
                    <input type="number" className="w-1/5 border border-gray-300 rounded-md px-4 py-2" />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-neutral-900 mb-1">  Terminal Profile Picutre * </label>
                    <input type="file" required className="w-full border border-gray-300 rounded-md px-4 py-20" />
                  </div>
                </>
              )}
            </div>

            {/* Mobile Navigation Buttons */}
            <div className="flex justify-between mt-6 md:hidden">
              {currentStep > 1 ? (
                <button type="button" onClick={prevStep} className="bg-gray-300 px-4 py-2 rounded-md">
                  Back
                </button>
              ) : <div />}

              {currentStep < totalSteps ? (
                <button type="button" onClick={nextStep} className="bg-black hover:bg-slate-700 text-white px-4 py-2 rounded-md">
                  Next
                </button>
              ) : (
                <button type="submit" className="bg-black hover:bg-slate-700 text-white px-4 py-2 rounded-md">
                  Submit
                </button>
              )}
            </div>

            {/* Desktop Submit Button */}
            <div className="hidden md:flex justify-end mt-6">
              <button type="submit" className="bg-black text-white px-4 py-2 rounded-md">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default UserForm;