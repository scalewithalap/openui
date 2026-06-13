import React from "react";
import HistoryPill from "./history";
import ZoomBar from "./zoom";
import ToolBarShapes from "./shapes";

const Toolbar = () => {
  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-between items-center z-50 p-5 pointer-events-none">
      <div className="pointer-events-auto">
        <HistoryPill />
      </div>
      <div className="pointer-events-auto">
        <ToolBarShapes />
      </div>
      <div className="pointer-events-auto">
        <ZoomBar />
      </div>
    </div>
  );
};

export default Toolbar;
