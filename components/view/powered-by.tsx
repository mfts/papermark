export const PoweredBy = ({ linkId }: { linkId: string }) => {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex flex-col"
      style={{ insetBlockEnd: "0px", insetInline: "0px" }}
    >
      <div className="flex w-full flex-col">
        <div className="flex w-full flex-row-reverse justify-start p-6">
          <div className="pointer-events-auto relative z-20 flex min-h-8 w-auto items-center justify-end whitespace-nowrap rounded-md bg-black text-white ring-1 ring-white/40 hover:ring-white/90">
            <a
              href={`https://www.papermark.io?utm_campaign=poweredby&utm_medium=poweredby&utm_source=papermark-${linkId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm text-sm "
              style={{ paddingInlineStart: "12px", paddingInlineEnd: "12px" }}
            >
              Share docs via{" "}
              <span className="font-semibold tracking-tighter">Papermark</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
