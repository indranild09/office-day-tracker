export default function DayModal({ date, onSelect, onClose }) {
  if (!date) return null;

  const options = ["WFO", "WFH", "LEAVE", "HOLIDAY", "CLEAR"];

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{date.toDateString()}</h3>

        {options.map((opt) => (
          <button
            key={opt}
            className="modal-btn"
            onClick={() => onSelect(opt)}
          >
            {opt}
          </button>
        ))}

        <button className="modal-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
