interface VocabularyCollocationsBoxProps {
  collocations: string[];
}

export default function VocabularyCollocationsBox({
  collocations,
}: VocabularyCollocationsBoxProps) {
  if (collocations.length === 0) return null;
  return (
    <div className="rounded-lg bg-surface-container-lowest p-3 shadow-sm">
      <span className="mb-2 block text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
       Collocations
      </span>
      <div className="flex flex-wrap gap-1.5">
        {collocations.map((phrase) => (
          <span
            key={phrase}
            className="rounded-md bg-surface-container px-2.5 py-1 text-label-sm font-medium text-on-surface"
          >
            {phrase}
          </span>
        ))}
      </div>
    </div>
  );
}
