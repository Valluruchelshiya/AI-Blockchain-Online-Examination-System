export default function QuestionNavigator({ questions, answers, currentIndex, onSelect }) {
  return (
    <div className="question-nav">
      <h4>Questions</h4>
      <div className="question-nav-grid">
        {questions.map((q, idx) => {
          const answered = answers[q.id] !== undefined;
          return (
            <button
              key={q.id}
              className={
                "question-nav-item" +
                (idx === currentIndex ? " current" : "") +
                (answered ? " answered" : "")
              }
              onClick={() => onSelect(idx)}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
