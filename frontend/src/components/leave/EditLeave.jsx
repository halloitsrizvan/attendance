import React from 'react'

function EditLeave() {
  return (
    <div>
      <button
  className="relative w-48 h-12 bg-white text-[#568fa6] overflow-hidden text-sm font-medium tracking-wider uppercase transition-all duration-300 ease-in-out cursor-pointer border-0 flex items-center justify-center rounded-sm"
  onClick={() => {
    if (leaveType === "leave") {
      setLeaveType('short-leave')
    } else {
      setLeaveType('leave')
    }
  }}
>
  <span className="absolute left-0 top-0 w-full h-full z-[1]"></span>
  <p 
    className="absolute w-full h-full p-0 m-0 transition-all duration-400 ease-[cubic-bezier(0.35,0.1,0.25,1)]"
    data-title={leaveType === "leave" ? "Class Excused Pass" : "Leave"}
    data-text={leaveType === "leave" ? "Class Excused Pass" : "Leave"}
  ></p>
  <style jsx>{`
    button:before, button:after {
      content: "";
      position: absolute;
      width: 0;
      height: 2px;
      background-color: #44d8a4;
      transition: all 0.3s cubic-bezier(0.35, 0.1, 0.25, 1);
    }

    button:before {
      right: 0;
      top: 0;
      transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
    }

    button:after {
      left: 0;
      bottom: 0;
    }

    button span:before, button span:after {
      content: "";
      position: absolute;
      width: 2px;
      height: 0;
      background-color: #44d8a4;
      transition: all 0.3s cubic-bezier(0.35, 0.1, 0.25, 1);
    }

    button span:before {
      right: 0;
      top: 0;
      transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
    }

    button span:after {
      left: 0;
      bottom: 0;
    }

    button p:before, button p:after {
      position: absolute;
      width: 100%;
      transition: all 0.4s cubic-bezier(0.35, 0.1, 0.25, 1);
      z-index: 1;
      left: 0;
    }

    button p:before {
      content: attr(data-title);
      top: 50%;
      transform: translateY(-50%);
    }

    button p:after {
      content: attr(data-text);
      top: 150%;
      color: #44d8a4;
    }

    button:hover:before, button:hover:after {
      width: 100%;
    }

    button:hover span {
      z-index: 1;
    }

    button:hover span:before, button:hover span:after {
      height: 100%;
    }

    button:hover p:before {
      top: -50%;
      transform: translateY(-50%) rotate(5deg);
    }

    button:hover p:after {
      top: 50%;
      transform: translateY(-50%);
    }

    button:active {
      outline: none;
      border: none;
    }

    button:focus {
      outline: 0;
    }
  `}</style>
</button>
    </div>
  )
}

export default EditLeave