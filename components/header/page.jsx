// components/header/page.js
"use client";

function Header() {
  return (
    <header className="bg-gray-900 text-white shadow-lg">  
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">  
        <div className="flex items-center">
           
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">  
            Movie Explorer 
          </h1>
        </div>

      </div>
    </header>
  );
}

export default Header;