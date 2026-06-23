import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import data from "../data.json";
import "./Station.css";
import InstructionCard from "./InstructionCard";

export default function Station() {
  const composite = data[0];
  const [index, setIndex] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const operator = location.state?.operator;

  const nextInstruction = () => {
    if (index + 1 < composite.instructions.length) {
      setIndex((prev) => prev + 1);
    } else {
      navigate("/operator");
    }
  };

  const prevInstruction = () => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        switchLanguage();
      }

      if (event.key === "Enter" || event.key === "ArrowRight") {
        event.preventDefault();
        nextInstruction();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prevInstruction();
      }
    };
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [index]);

  return (
    <div className="layout">
      <div className="head">
        <div className="headLeft">
          <h1>{composite.composite}</h1>
          <div className="meta">Line: {composite.line}</div>
          <div className="meta">Station: {composite.station}</div>
        </div>

        <div className="headRight">
          <div className="operatorBadge">
            operator badge: {operator?.badge || "UNKNOWN"}
          </div>
        </div>
      </div>

      <InstructionCard
        instruction={composite.instructions[index]}
        module={composite.instructions[index].module}
      />

      <div className="buttonContainer">
        <div className="navigationButtons">
          <button
            className="prevBtn"
            onClick={prevInstruction}
            disabled={index === 0}
          >
            Prev
          </button>

          <button className="nextBtn" onClick={nextInstruction}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}