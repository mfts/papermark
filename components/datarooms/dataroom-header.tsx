export const DataroomHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode[];
}) => {
  const actionRows: React.ReactNode[][] = [];
  if (actions) {
    for (let i = 0; i < actions.length; i += 3) {
      actionRows.push(actions.slice(i, i + 3));
    }
  }

  return (
    <section className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl text-foreground font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-mono">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-x-1">
        {actionRows.map((row, i) => (
          <ul
            key={i.toString()}
            className="flex flex-wrap items-center justify-end gap-2 md:gap-4 md:flex-nowrap"
          >
            {row.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
};
