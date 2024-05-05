export const PoweredBy = ({ linkId }: { linkId: string }) => {
  return (
    <div
      className="flex flex-col absolute bottom-0 left-0 right-0"
      style={{ insetBlockEnd: "0px", insetInline: "0px" }}
    >
      <div className="flex w-full flex-col">
        <div className="flex w-full justify-start flex-row-reverse p-6">
          <div className="z-20 flex justify-end w-auto rounded-md whitespace-nowrap pointer-events-auto relative min-h-8 bg-black text-white items-center ring-1 ring-white/40 hover:ring-white/90">
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
