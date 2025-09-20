 <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      
        <h2 className="text-center text-2xl font-bold mb-4 md:mb-0 bg-indigo-300 p-2 rounded ">
          Class {id}
        </h2>

        
        <div className="flex gap-3">
          <button
            onClick={() => setCards("Cards")}
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition ${
              cards === "Cards"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <TfiLayoutGrid2 className="text-lg" />
            Cards
          </button>

          <button 
            onClick={() => setCards("No")}
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition ${
              cards === "No"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <TfiLayoutGrid3 className="text-lg" />
            Table
          </button>

        
          <button
            onClick={() => navigate("/")}
            type="button"
            className="block md:hidden ml-14 flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition bg-green-500 text-white"
          >
            <FaHome className="text-lg" />
            Home
          </button>
        </div>
      </div>