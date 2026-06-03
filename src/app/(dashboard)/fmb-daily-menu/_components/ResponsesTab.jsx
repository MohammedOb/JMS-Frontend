import ResponseCard from './ResponseCard';

export default function ResponsesTab({ responses, filledFields, menuRow }) {
  if (responses.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-10">No responses yet.</p>;
  }

  return (
    <div className="space-y-4">
      {responses.map((r, i) => (
        <ResponseCard key={i} response={r} filledFields={filledFields} menuRow={menuRow} />
      ))}
    </div>
  );
}
