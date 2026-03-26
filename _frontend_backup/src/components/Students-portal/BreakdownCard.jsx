export default function BreakdownCard({ time, present, absent, total, type }) {
  return (
    <div className="flex flex-col items-center p-4 rounded-xl shadow-md bg-white text-gray-800 transition-all duration-200 hover:shadow-xl">
     {type =="present" &&
      <div className="text-4xl font-extrabold">
      <span className="text-green-600">{present}</span>/
      <span className="text-gray-400">{total}</span>
    </div>}
      {type =="absent" && 
      <div className="text-4xl font-extrabold">
      <span className="text-green-600">{absent}</span>/
      <span className="text-gray-400">{total}</span>
    </div>}

     <div className="text-sm font-medium mt-2">{time}</div>
    </div>
  );
}
