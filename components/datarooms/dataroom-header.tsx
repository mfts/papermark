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
    <section className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
      <div className="flex min-h-10 items-center space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {/* <p className="text-xs sm:text-sm text-muted-foreground font-mono">
          {description}
        </p> */}
      </div>
      <div className="flex items-center gap-x-1">
        {actionRows.map((row, i) => (
          <ul
            key={i.toString()}
            className="flex flex-wrap items-center justify-end gap-2 md:flex-nowrap md:gap-4"
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
