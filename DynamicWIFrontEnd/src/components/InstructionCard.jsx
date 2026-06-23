export default function InstructionCard({ instruction, module }) {
  const [left, right] = instruction.connectors;

  const renderWire = () => {
    return instruction.colors.map((color, i) => (
      <div
        key={i}
        className="wire-segment"
        style={{ backgroundColor: color }}
      />
    ));
  };

  return (
    <div className="instructionCard">
      <div className="moduleTitle">
        Module: {module}
      </div>
      <div className="connectorsRow">
        <div className="connectorBox">
          <div className="connectorLabel">{left.node}</div>
          <img
            src={left.image}
            alt={left.node}
            className={left.disabled ? "disabledImg" : ""}
          />
          <div className="connectorBottomInfo">
            <div className="connectorEpn">{left.epn}</div>
            <div className="connectorLocation">{left.location}</div>
          </div>
        </div>
        <div className="wireSection">
          <div className="wireTopInfo">
            <span>{instruction.wire}</span>
            <span>{instruction.core}</span>
          </div>

          <div className="wire">{renderWire()}</div>

          <div className="wireInfo">
            <span>CSA: {instruction.csa}</span>
            <span>Length: {instruction.length}</span>
          </div>
        </div>
        <div className="connectorBox">
          <div className="connectorLabel">{right.node}</div>

          <img
            src={right.image}
            alt={right.node}
            className={right.disabled ? "disabledImg" : ""}
          />

          <div className="connectorBottomInfo">
            <div className="connectorEpn">{right.epn}</div>
            <div className="connectorLocation">{right.location}</div>
          </div>
        </div>
      </div>
    </div>
  );
}