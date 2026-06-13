import { Shape } from "@/redux/slice/shapes";
import React from "react";
import { Frame } from "./frame";
import { Rectangle } from "./rectangle";
import { Ellipse } from "./ellipse";
import { Stroke } from "./stroke";
import { Arrow } from "./arrow";
import { Line } from "./line";
import { Text } from "./text";
import { Note } from "./note";
import { Connector } from "./connector";
import GeneratedUI from "./generatedui";

const ShapeRenderer = ({
  shape,
  toggleInspiration,
  toggleChat,
  generateWorkflow,
  exportDesign,
}: {
  shape: Shape;
  toggleInspiration: () => void;
  toggleChat: (generatedUIID: string) => void;
  generateWorkflow: (generatedUIID: string) => void;
  exportDesign: (generatedUIID: string, element: HTMLElement | null) => void;
}) => {
  switch (shape.type) {
    case "frame":
      return <Frame shape={shape} toggleInspiration={toggleInspiration} />;

    case "rect":
      return <Rectangle shape={shape} />;

    case "ellipse":
      return <Ellipse shape={shape} />;

    case "note":
      return <Note shape={shape} />;

    case "connector":
      return <Connector shape={shape} />;

    case "freedraw":
      return <Stroke shape={shape} />;

    case "arrow":
      return <Arrow shape={shape} />;

    case "line":
      return <Line shape={shape} />;

    case "text":
      return <Text shape={shape} />;

    case "generatedui":
      return (
        <GeneratedUI
          shape={shape}
          toggleChat={toggleChat}
          generateWorkflow={generateWorkflow}
          exportDesign={exportDesign}
        />
      );
  }
};

export default ShapeRenderer;
