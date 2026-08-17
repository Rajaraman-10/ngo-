export default function FlowDiagram({ steps }) {
  return (
    <div className="flow-diagram">
      {steps.map((step, i) => (
        <div className="flow-step-wrap" key={step}>
          <div className="flow-step">{step}</div>
          {i < steps.length - 1 && <div className="flow-arrow" aria-hidden="true">→</div>}
        </div>
      ))}
    </div>
  );
}
