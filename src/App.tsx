import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Timeline from "./components/Timeline";

interface Event {
  ChangeType: string;
  Date: string;
  ID: string;
  Path: string;
  ResourceType: string;
  Seq: number;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Timeline />
    </div>
  );
}